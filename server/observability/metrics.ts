const counters = new Map<string, number>();

export function incr(name: string, by = 1): void {
  counters.set(name, (counters.get(name) ?? 0) + by);
}

export function getCounter(name: string): number {
  return counters.get(name) ?? 0;
}

export function snapshotMetrics(): Record<string, number> {
  return Object.fromEntries(counters.entries());
}

/** Test helper */
export function resetMetrics(): void {
  counters.clear();
}

export const MetricNames = {
  httpRequests: "http_requests_total",
  httpErrors: "http_errors_total",
  outboxEnqueued: "outbox_enqueued_total",
  outboxProcessed: "outbox_processed_total",
  outboxFailed: "outbox_failed_total",
  aitCredits: "ait_credits_total",
  aitDebits: "ait_debits_total",
  aitJournalEntries: "ait_journal_entries_total",
  paymentWebhooks: "payment_webhooks_total",
  aiProposals: "ai_proposals_total",
} as const;
