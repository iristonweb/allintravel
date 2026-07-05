CREATE TABLE IF NOT EXISTS ait_daily_caps (
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason_code varchar(40) NOT NULL,
  cap_date date NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, reason_code, cap_date)
);

CREATE TABLE IF NOT EXISTS ait_entitlements (
  id varchar PRIMARY KEY,
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sku varchar(64) NOT NULL,
  expires_at timestamp,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ait_ring_daily (
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ring_date date NOT NULL,
  voice_count integer NOT NULL DEFAULT 0,
  story_count integer NOT NULL DEFAULT 0,
  echo_count integer NOT NULL DEFAULT 0,
  pulse_count integer NOT NULL DEFAULT 0,
  rings_bonus_claimed boolean NOT NULL DEFAULT false,
  PRIMARY KEY (user_id, ring_date)
);

CREATE TABLE IF NOT EXISTS ait_fund_cycles (
  month_key varchar(7) PRIMARY KEY,
  pool_total integer NOT NULL,
  distributed_at timestamp,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ait_fund_payouts (
  id varchar PRIMARY KEY,
  month_key varchar(7) NOT NULL,
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  score integer NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ait_fund_payout_user_month
  ON ait_fund_payouts (month_key, user_id);

CREATE TABLE IF NOT EXISTS ait_post_boosts (
  post_id varchar PRIMARY KEY,
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS ait_fund_payout_seen (
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month_key varchar(7) NOT NULL,
  seen_at timestamp DEFAULT now(),
  PRIMARY KEY (user_id, month_key)
);

CREATE TABLE IF NOT EXISTS ait_quest_claims (
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id varchar(40) NOT NULL,
  week_key varchar(12) NOT NULL,
  claimed_at timestamp DEFAULT now(),
  PRIMARY KEY (user_id, quest_id, week_key)
);

CREATE TABLE IF NOT EXISTS ait_fraud_rate (
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason_code varchar(40) NOT NULL,
  bucket_minute timestamptz NOT NULL,
  action_count integer NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, reason_code, bucket_minute)
);

CREATE TABLE IF NOT EXISTS ait_referral_codes (
  user_id varchar PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  code varchar(12) NOT NULL UNIQUE,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ait_referrals (
  referred_id varchar PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  referrer_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rewarded boolean NOT NULL DEFAULT false,
  created_at timestamp DEFAULT now()
);
