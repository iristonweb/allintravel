import { sql } from "drizzle-orm";
import { getDb } from "./db";

/** Ensures platform expansion tables/columns exist (passport, trust, marketplace, AI). */
export async function ensurePlatformSchema(): Promise<void> {
  const db = getDb();
  if (!db) return;

  await db.execute(sql`
    ALTER TABLE trips ADD COLUMN IF NOT EXISTS forked_from_trip_id uuid REFERENCES trips(id) ON DELETE SET NULL
  `);
  await db.execute(sql`ALTER TABLE trips ADD COLUMN IF NOT EXISTS price_cents integer`);
  await db.execute(
    sql`ALTER TABLE trips ADD COLUMN IF NOT EXISTS is_for_sale boolean DEFAULT false`,
  );

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS user_passport_stamps (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      country_code varchar(2),
      country_name varchar(128) NOT NULL,
      city_name varchar(128),
      trip_id uuid REFERENCES trips(id) ON DELETE SET NULL,
      visited_at timestamp DEFAULT now(),
      source varchar(20) DEFAULT 'trip'
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_passport_stamps_user ON user_passport_stamps (user_id)
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS user_trust_scores (
      user_id varchar PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      score integer NOT NULL DEFAULT 50,
      trip_count integer NOT NULL DEFAULT 0,
      review_count integer NOT NULL DEFAULT 0,
      vouch_count integer NOT NULL DEFAULT 0,
      is_verified boolean DEFAULT false,
      updated_at timestamp DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS user_vouches (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      from_user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      to_user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message varchar(280),
      created_at timestamp DEFAULT now(),
      UNIQUE (from_user_id, to_user_id)
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_vouches_to ON user_vouches (to_user_id)
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ai_copilot_sessions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
      messages jsonb NOT NULL DEFAULT '[]'::jsonb,
      updated_at timestamp DEFAULT now(),
      created_at timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_copilot_user_trip ON ai_copilot_sessions (user_id, trip_id)
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS stripe_connect_accounts (
      user_id varchar PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      stripe_account_id varchar NOT NULL,
      charges_enabled boolean DEFAULT false,
      payouts_enabled boolean DEFAULT false,
      updated_at timestamp DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS creator_applications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id varchar REFERENCES users(id) ON DELETE SET NULL,
      email varchar NOT NULL,
      niche varchar(120),
      message text,
      status varchar(20) DEFAULT 'pending',
      created_at timestamp DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS launch_waitlist (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email varchar NOT NULL UNIQUE,
      locale varchar(5) DEFAULT 'en',
      created_at timestamp DEFAULT now()
    )
  `);
}
