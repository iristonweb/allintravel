/**
 * Optional Redis pub/sub via Upstash REST API for cross-instance realtime.
 * Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable.
 */

const CHANNEL = "allintravel:realtime";

function redisConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() && process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

async function redisCommand(command: string[]): Promise<unknown> {
  const url = process.env.UPSTASH_REDIS_REST_URL!.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!.trim();
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error(`Redis command failed: ${res.status}`);
  const data = (await res.json()) as { result?: unknown };
  return data.result;
}

export function isRedisPubSubEnabled(): boolean {
  return redisConfigured();
}

export async function publishUserEvent(
  userId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  if (!redisConfigured()) return;
  const message = JSON.stringify({ userId, payload, ts: Date.now() });
  await redisCommand(["PUBLISH", CHANNEL, message]);
}

/** Poll Redis pub/sub via Upstash — used when dedicated WS worker is not running. */
export async function subscribeUserEvents(
  onMessage: (userId: string, payload: Record<string, unknown>) => void,
): Promise<() => void> {
  if (!redisConfigured()) return () => undefined;

  let active = true;
  const poll = async () => {
    while (active) {
      try {
        const result = (await redisCommand(["SUBSCRIBE", CHANNEL])) as unknown;
        void result;
      } catch {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  };

  const interval = setInterval(async () => {
    try {
      const raw = (await redisCommand(["LPOP", `${CHANNEL}:queue`])) as string | null;
      if (!raw) return;
      const parsed = JSON.parse(raw) as { userId: string; payload: Record<string, unknown> };
      onMessage(parsed.userId, parsed.payload);
    } catch {
      /* ignore poll errors */
    }
  }, 500);

  void poll();

  return () => {
    active = false;
    clearInterval(interval);
  };
}

/** Push to local queue consumed by WS worker or polling fallback. */
export async function enqueueUserEvent(
  userId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  if (!redisConfigured()) return;
  const message = JSON.stringify({ userId, payload, ts: Date.now() });
  await redisCommand(["RPUSH", `${CHANNEL}:queue`, message]);
  await redisCommand(["LTRIM", `${CHANNEL}:queue`, "-1000", "-1"]);
}
