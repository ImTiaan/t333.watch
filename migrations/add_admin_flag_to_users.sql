-- Add admin flag to users table for admin dashboard access
-- This migration adds an admin_flag column to enable admin role functionality

ALTER TABLE users ADD COLUMN admin_flag BOOLEAN DEFAULT FALSE;

-- Add index for efficient admin queries
CREATE INDEX idx_users_admin_flag ON users(admin_flag) WHERE admin_flag = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN users.admin_flag IS 'Flag indicating if user has admin privileges for accessing admin dashboard and analytics';

-- Optional: Set specific users as admin (replace with actual user IDs)
-- UPDATE users SET admin_flag = TRUE WHERE twitch_id IN ('your_twitch_id_here');

COMMIT;