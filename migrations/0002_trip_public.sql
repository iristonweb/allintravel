ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS trip_invites (
  token varchar(32) PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  referrer_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_code varchar(12),
  use_count integer NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS post_bookmarks (
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES travel_posts(id) ON DELETE CASCADE,
  created_at timestamp DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);
