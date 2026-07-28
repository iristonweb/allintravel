/** Well-known platform feature flags (Wave 0+). */
export const FLAG_KEYS = [
  "runtime_ddl",
  "outbox_dispatch",
  "ait_double_entry",
  "payments_webhooks",
  "ai_tool_proposals",
] as const;

export type FlagKey = (typeof FLAG_KEYS)[number];

/** Defaults preserve current behavior until explicitly flipped. */
export const FLAG_DEFAULTS: Record<FlagKey, boolean> = {
  runtime_ddl: true,
  outbox_dispatch: false,
  ait_double_entry: false,
  payments_webhooks: false,
  ai_tool_proposals: false,
};
