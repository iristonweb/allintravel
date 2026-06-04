import type { AitGrantResult } from "@shared/ait";

export type AitGrantPayload = AitGrantResult;

export const AIT_GRANT_EVENT = "ait-grant";

export function normalizeAitGrant(raw: unknown): AitGrantPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const g = raw as AitGrantPayload;
  if (!g.granted || !g.amount) return null;
  return g;
}

export function emitAitGrant(grant: AitGrantPayload | null): void {
  if (!grant?.granted || grant.amount <= 0) return;
  window.dispatchEvent(new CustomEvent(AIT_GRANT_EVENT, { detail: grant }));
}

export function extractAitGrantFromBody(body: unknown): AitGrantPayload | null {
  if (!body || typeof body !== "object") return null;
  const o = body as { aitGrant?: unknown; lastGrant?: unknown; pulseGrants?: unknown };
  const pulse = o.pulseGrants;
  if (Array.isArray(pulse)) {
    for (const g of pulse) {
      const n = normalizeAitGrant(g);
      if (n) emitAitGrant(n);
    }
  }
  return normalizeAitGrant(o.aitGrant) ?? normalizeAitGrant(o.lastGrant);
}

export function formatAitToast(grant: AitGrantPayload): string {
  const sign = grant.amount > 0 ? "+" : "";
  const wallet = grant.wallet === "creator" ? "Creator " : "";
  return `${sign}${grant.amount} ${wallet}AIT`;
}
