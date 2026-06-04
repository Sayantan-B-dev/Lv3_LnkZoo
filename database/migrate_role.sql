-- Add role column, migrate existing is_admin data, drop is_admin column
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';

-- Migrate existing admin users
UPDATE users SET role = 'admin' WHERE is_admin = true;

-- Drop the old boolean column
ALTER TABLE users DROP COLUMN IF EXISTS is_admin;
