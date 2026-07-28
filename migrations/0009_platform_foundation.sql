-- Wave 0: feature flags + transactional outbox + immutable audit log
CREATE TABLE IF NOT EXISTS feature_flags (
  key varchar(64) PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS outbox_messages (
  id varchar(64) PRIMARY KEY,
  type varchar(80) NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  available_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  idempotency_key varchar(200)
);

CREATE UNIQUE INDEX IF NOT EXISTS outbox_messages_idempotency_uidx
  ON outbox_messages (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS outbox_messages_pending_idx
  ON outbox_messages (available_at)
  WHERE processed_at IS NULL;

CREATE TABLE IF NOT EXISTS audit_log (
  id varchar(64) PRIMARY KEY,
  actor_user_id varchar REFERENCES users(id) ON DELETE SET NULL,
  action varchar(80) NOT NULL,
  resource_type varchar(80) NOT NULL,
  resource_id varchar(120),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_created_idx ON audit_log (created_at DESC);

-- Wave 1: AIT double-entry journal (additive; balances table remains source of wallet UX)
CREATE TABLE IF NOT EXISTS ait_ledger_accounts (
  id varchar(64) PRIMARY KEY,
  code varchar(64) NOT NULL UNIQUE,
  name varchar(120) NOT NULL,
  kind varchar(20) NOT NULL,
  user_id varchar REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ait_journal_entries (
  id varchar(64) PRIMARY KEY,
  tx_id varchar(64) NOT NULL,
  reason_code varchar(40) NOT NULL,
  title varchar(120) NOT NULL,
  idempotency_key varchar(200),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ait_journal_entries_idempotency_uidx
  ON ait_journal_entries (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS ait_journal_entries_tx_idx ON ait_journal_entries (tx_id);

CREATE TABLE IF NOT EXISTS ait_journal_lines (
  id varchar(64) PRIMARY KEY,
  entry_id varchar(64) NOT NULL REFERENCES ait_journal_entries(id) ON DELETE CASCADE,
  account_id varchar(64) NOT NULL REFERENCES ait_ledger_accounts(id),
  debit integer NOT NULL DEFAULT 0,
  credit integer NOT NULL DEFAULT 0,
  CHECK (debit >= 0 AND credit >= 0),
  CHECK (NOT (debit > 0 AND credit > 0))
);

CREATE INDEX IF NOT EXISTS ait_journal_lines_entry_idx ON ait_journal_lines (entry_id);

-- Wave 2: payment webhook event store
CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id varchar(128) PRIMARY KEY,
  provider varchar(32) NOT NULL,
  event_type varchar(80) NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_webhook_events_provider_idx
  ON payment_webhook_events (provider, created_at DESC);

-- Wave 3: AI structured proposals awaiting human approval
CREATE TABLE IF NOT EXISTS ai_proposals (
  id varchar(64) PRIMARY KEY,
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  tool_name varchar(80) NOT NULL,
  proposal jsonb NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);

CREATE INDEX IF NOT EXISTS ai_proposals_user_idx ON ai_proposals (user_id, created_at DESC);

-- Marketplace licensed fork attribution snapshot
ALTER TABLE trips ADD COLUMN IF NOT EXISTS marketplace_snapshot jsonb;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS attribution_user_id varchar REFERENCES users(id) ON DELETE SET NULL;
