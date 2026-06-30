-- Optional one-time AIT hard reset (run manually when migrating to v2 economy)
-- npm run db:migrate applies this only once via Drizzle journal.

CREATE TABLE IF NOT EXISTS ait_v2_reset_marker (applied_at timestamp PRIMARY KEY DEFAULT now());

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ait_v2_reset_marker LIMIT 1) THEN
    INSERT INTO ait_transactions_archive
    SELECT * FROM ait_transactions
    WHERE NOT EXISTS (
      SELECT 1 FROM ait_transactions_archive a WHERE a.id = ait_transactions.id
    );

    TRUNCATE ait_transactions;

    UPDATE ait_balances SET
      spend_balance = 0,
      creator_balance = 0,
      lifetime_spend_earned = 0,
      lifetime_creator_earned = 0,
      streak_days = 0,
      last_active_date = NULL,
      profile_bonus_claimed = false,
      updated_at = now();

    INSERT INTO ait_v2_reset_marker DEFAULT VALUES;
  END IF;
END $$;
