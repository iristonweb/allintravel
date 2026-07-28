-- Platform Premium VIP flag on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_until timestamptz;
