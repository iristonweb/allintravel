-- Platform expansion: passport, trust, marketplace, AI, GTM

ALTER TABLE trips ADD COLUMN IF NOT EXISTS forked_from_trip_id uuid REFERENCES trips(id) ON DELETE SET NULL;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS price_cents integer;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_for_sale boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS user_passport_stamps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  country_code varchar(2),
  country_name varchar(128) NOT NULL,
  city_name varchar(128),
  trip_id uuid REFERENCES trips(id) ON DELETE SET NULL,
  visited_at timestamp DEFAULT now(),
  source varchar(20) DEFAULT 'trip'
);
CREATE INDEX IF NOT EXISTS idx_passport_stamps_user ON user_passport_stamps (user_id);

CREATE TABLE IF NOT EXISTS user_trust_scores (
  user_id varchar PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 50,
  trip_count integer NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  vouch_count integer NOT NULL DEFAULT 0,
  is_verified boolean DEFAULT false,
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_vouches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message varchar(280),
  created_at timestamp DEFAULT now(),
  UNIQUE (from_user_id, to_user_id)
);
CREATE INDEX IF NOT EXISTS idx_vouches_to ON user_vouches (to_user_id);

CREATE TABLE IF NOT EXISTS ai_copilot_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamp DEFAULT now(),
  created_at timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_copilot_user_trip ON ai_copilot_sessions (user_id, trip_id);

CREATE TABLE IF NOT EXISTS stripe_connect_accounts (
  user_id varchar PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  stripe_account_id varchar NOT NULL,
  charges_enabled boolean DEFAULT false,
  payouts_enabled boolean DEFAULT false,
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS creator_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar REFERENCES users(id) ON DELETE SET NULL,
  email varchar NOT NULL,
  niche varchar(120),
  message text,
  status varchar(20) DEFAULT 'pending',
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS launch_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar NOT NULL UNIQUE,
  locale varchar(5) DEFAULT 'en',
  created_at timestamp DEFAULT now()
);

-- AIT core tables (formalized in Drizzle schema)
CREATE TABLE IF NOT EXISTS ait_balances (
  user_id varchar PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  spend_balance integer NOT NULL DEFAULT 0,
  creator_balance integer NOT NULL DEFAULT 0,
  lifetime_spend_earned integer NOT NULL DEFAULT 0,
  lifetime_creator_earned integer NOT NULL DEFAULT 0,
  streak_days integer NOT NULL DEFAULT 0,
  last_active_date date,
  profile_bonus_claimed boolean NOT NULL DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ait_transactions (
  id varchar PRIMARY KEY,
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet varchar(10) NOT NULL,
  delta integer NOT NULL,
  reason_code varchar(40) NOT NULL,
  title varchar(120) NOT NULL,
  entity_type varchar(40),
  entity_id varchar(100),
  created_at timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ait_tx_user ON ait_transactions (user_id, created_at DESC);
