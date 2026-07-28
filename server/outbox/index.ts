import { sql } from "drizzle-orm";
import { getDb } from "../db";
import { isEnabled } from "../flags";
import { incr, MetricNames } from "../observability/metrics";
import { log } from "../observability/logger";

export type OutboxPayload = Record<string, unknown>;

export type OutboxMessage = {
  id: string;
  type: string;
  payload: OutboxPayload;
  createdAt: Date;
  availableAt: Date;
  processedAt: Date | null;
  attempts: number;
  idempotencyKey: string | null;
};

type TxLike = {
  execute: (query: ReturnType<typeof sql>) => Promise<unknown>;
};

const memOutbox: OutboxMessage[] = [];
const memProcessedKeys = new Set<string>();

type Handler = (payload: OutboxPayload) => Promise<void>;
const handlers = new Map<string, Handler>();

export function registerOutboxHandler(type: string, handler: Handler): void {
  handlers.set(type, handler);
}

function genId(): string {
  return `obx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Enqueue inside an existing transaction when `tx` is provided. */
export async function enqueueOutbox(
  type: string,
  payload: OutboxPayload,
  opts?: { idempotencyKey?: string | null; availableAt?: Date; tx?: TxLike },
): Promise<string> {
  const id = genId();
  const availableAt = opts?.availableAt ?? new Date();
  const idempotencyKey = opts?.idempotencyKey ?? null;
  const db = getDb();
  const executor = opts?.tx ?? db;

  if (!executor) {
    if (idempotencyKey && memProcessedKeys.has(`enq:${idempotencyKey}`)) {
      return idempotencyKey;
    }
    if (idempotencyKey) memProcessedKeys.add(`enq:${idempotencyKey}`);
    memOutbox.push({
      id,
      type,
      payload,
      createdAt: new Date(),
      availableAt,
      processedAt: null,
      attempts: 0,
      idempotencyKey,
    });
    incr(MetricNames.outboxEnqueued);
    return id;
  }

  try {
    if (idempotencyKey) {
      await executor.execute(sql`
        INSERT INTO outbox_messages (id, type, payload, available_at, idempotency_key)
        VALUES (
          ${id},
          ${type},
          ${JSON.stringify(payload)}::jsonb,
          ${availableAt.toISOString()}::timestamptz,
          ${idempotencyKey}
        )
        ON CONFLICT (idempotency_key) WHERE (idempotency_key IS NOT NULL) DO NOTHING
      `);
    } else {
      await executor.execute(sql`
        INSERT INTO outbox_messages (id, type, payload, available_at, idempotency_key)
        VALUES (
          ${id},
          ${type},
          ${JSON.stringify(payload)}::jsonb,
          ${availableAt.toISOString()}::timestamptz,
          NULL
        )
      `);
    }
    incr(MetricNames.outboxEnqueued);
  } catch (err) {
    // Fall back to in-memory when migration not applied yet
    log.warn("outbox.enqueue_db_fallback", { type, err: String(err) });
    if (idempotencyKey && memProcessedKeys.has(`enq:${idempotencyKey}`)) {
      return idempotencyKey;
    }
    if (idempotencyKey) memProcessedKeys.add(`enq:${idempotencyKey}`);
    memOutbox.push({
      id,
      type,
      payload,
      createdAt: new Date(),
      availableAt,
      processedAt: null,
      attempts: 0,
      idempotencyKey,
    });
    incr(MetricNames.outboxEnqueued);
  }
  return id;
}

async function markProcessed(id: string): Promise<void> {
  const msg = memOutbox.find((m) => m.id === id);
  if (msg) msg.processedAt = new Date();
  const db = getDb();
  if (!db) return;
  try {
    await db.execute(sql`
      UPDATE outbox_messages SET processed_at = now() WHERE id = ${id}
    `);
  } catch {
    // mem already updated when present
  }
}

async function bumpAttempts(id: string): Promise<void> {
  const msg = memOutbox.find((m) => m.id === id);
  if (msg) msg.attempts += 1;
  const db = getDb();
  if (!db) return;
  try {
    await db.execute(sql`
      UPDATE outbox_messages SET attempts = attempts + 1 WHERE id = ${id}
    `);
  } catch {
    // mem already updated when present
  }
}

export async function drainOutbox(limit = 20): Promise<{ processed: number; failed: number }> {
  if (!(await isEnabled("outbox_dispatch"))) {
    return { processed: 0, failed: 0 };
  }

  const db = getDb();
  let pending: OutboxMessage[] = [];

  if (db) {
    try {
      const res = await db.execute(sql`
      SELECT id, type, payload, created_at, available_at, processed_at, attempts, idempotency_key
      FROM outbox_messages
      WHERE processed_at IS NULL AND available_at <= now()
      ORDER BY created_at ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    `);
      const rows = (res as unknown as { rows?: Record<string, unknown>[] }).rows ?? [];
      pending = rows.map((r) => ({
        id: String(r.id),
        type: String(r.type),
        payload: (typeof r.payload === "string"
          ? JSON.parse(r.payload)
          : r.payload) as OutboxPayload,
        createdAt: new Date(String(r.created_at)),
        availableAt: new Date(String(r.available_at)),
        processedAt: r.processed_at ? new Date(String(r.processed_at)) : null,
        attempts: Number(r.attempts ?? 0),
        idempotencyKey: r.idempotency_key ? String(r.idempotency_key) : null,
      }));
    } catch {
      pending = memOutbox
        .filter((m) => !m.processedAt && m.availableAt <= new Date())
        .slice(0, limit);
    }
  } else {
    pending = memOutbox
      .filter((m) => !m.processedAt && m.availableAt <= new Date())
      .slice(0, limit);
  }

  let processed = 0;
  let failed = 0;

  for (const msg of pending) {
    const handler = handlers.get(msg.type);
    if (!handler) {
      log.warn("outbox.no_handler", { type: msg.type, id: msg.id });
      await bumpAttempts(msg.id);
      failed += 1;
      incr(MetricNames.outboxFailed);
      continue;
    }
    try {
      await handler(msg.payload);
      await markProcessed(msg.id);
      processed += 1;
      incr(MetricNames.outboxProcessed);
    } catch (err) {
      log.error("outbox.handler_failed", { type: msg.type, id: msg.id, err: String(err) });
      await bumpAttempts(msg.id);
      failed += 1;
      incr(MetricNames.outboxFailed);
    }
  }

  return { processed, failed };
}

let intervalHandle: ReturnType<typeof setInterval> | null = null;

export function startOutboxDispatcher(intervalMs = 5_000): void {
  if (intervalHandle || process.env.VERCEL) return;
  intervalHandle = setInterval(() => {
    void drainOutbox().catch((err) => log.error("outbox.drain_error", { err: String(err) }));
  }, intervalMs);
  if (typeof intervalHandle.unref === "function") intervalHandle.unref();
}

export function stopOutboxDispatcher(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

/** Test helper */
export function resetOutboxForTests(): void {
  memOutbox.length = 0;
  memProcessedKeys.clear();
  stopOutboxDispatcher();
}
