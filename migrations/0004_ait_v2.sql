-- AIT v2: supply control, burns, idempotency, boost campaigns, referral milestones

CREATE TABLE IF NOT EXISTS ait_supply_daily (
  cap_date date PRIMARY KEY,
  minted_total integer NOT NULL DEFAULT 0,
  emission_cap integer NOT NULL,
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ait_burns (
  id varchar PRIMARY KEY,
  amount integer NOT NULL,
  source varchar(40) NOT NULL,
  user_id varchar REFERENCES users(id) ON DELETE SET NULL,
  entity_type varchar(40),
  entity_id varchar(100),
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ait_burns_created ON ait_burns (created_at DESC);

CREATE TABLE IF NOT EXISTS ait_idempotency_keys (
  idempotency_key varchar PRIMARY KEY,
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operation varchar(40) NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ait_transactions_archive (
  LIKE ait_transactions INCLUDING ALL
);

CREATE TABLE IF NOT EXISTS ait_referral_milestones (
  referred_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  milestone varchar(32) NOT NULL,
  referrer_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rewarded_at timestamp DEFAULT now(),
  PRIMARY KEY (referred_id, milestone)
);

CREATE TABLE IF NOT EXISTS ait_fraud_flags (
  user_id varchar PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  level integer NOT NULL DEFAULT 1,
  reason varchar(200) NOT NULL,
  expires_at timestamp,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ait_boost_campaigns (
  id varchar PRIMARY KEY,
  post_id varchar NOT NULL,
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  budget_ait integer NOT NULL,
  spent_ait integer NOT NULL DEFAULT 0,
  qs_at_launch integer NOT NULL DEFAULT 60,
  verified_experience boolean NOT NULL DEFAULT false,
  target_scopes jsonb DEFAULT '[]'::jsonb,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'active',
  expires_at timestamp NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ait_boost_campaigns_active
  ON ait_boost_campaigns (status, expires_at DESC);

CREATE TABLE IF NOT EXISTS ait_streak_freeze_usage (
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month_key varchar(7) NOT NULL,
  used_count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, month_key)
);

CREATE TABLE IF NOT EXISTS ait_fog_shares (
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_key varchar(12) NOT NULL,
  shared_at timestamp DEFAULT now(),
  PRIMARY KEY (user_id, week_key)
);

CREATE TABLE IF NOT EXISTS ait_fraud_rate (
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason_code varchar(40) NOT NULL,
  bucket_minute timestamptz NOT NULL,
  action_count integer NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, reason_code, bucket_minute)
);
