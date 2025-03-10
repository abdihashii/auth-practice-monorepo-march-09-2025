-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  hashed_password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  refresh_token TEXT,
  refresh_token_expires_at TIMESTAMPTZ,
  last_token_invalidation TIMESTAMPTZ,
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  verification_token_expiry TIMESTAMPTZ,
  reset_token TEXT,
  reset_token_expires_at TIMESTAMPTZ,
  last_password_change TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{"theme": "system", "language": "en", "timezone": "UTC"}',
  notification_preferences JSONB DEFAULT '{"email": {"enabled": true, "digest": "daily", "marketing": false}, "push": {"enabled": true, "alerts": true}}',
  last_activity_at TIMESTAMPTZ,
  last_successful_login TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0
);

-- Seed data for users table
INSERT INTO users (
  email,
  hashed_password,
  name,
  created_at,
  updated_at,
  email_verified,
  is_active,
  settings,
  notification_preferences,
  login_count
) VALUES
  (
    'test+1@example.com',
    '$argon2id$v=19$m=65536,t=3,p=4$SOME_SALT$SOME_HASH', -- This would be 'Test=123' hashed with Argon2
    'Test User',
    NOW(),
    NOW(),
    TRUE,
    TRUE,
    '{"theme": "system", "language": "en", "timezone": "UTC"}',
    '{"email": {"enabled": true, "digest": "daily", "marketing": false}, "push": {"enabled": true, "alerts": true}}',
    0
  );

-- Note: The password hash above is just an example and should be replaced with a proper Argon2 hash of 'Test=123'
-- You can generate proper Argon2 hashes in your authentication service before seeding the database.
