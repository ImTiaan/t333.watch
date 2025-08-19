-- Add login column to users table for premium verification
ALTER TABLE users ADD COLUMN login VARCHAR(255);

-- Create index on login for faster lookups
CREATE INDEX idx_users_login ON users(login);

-- Update existing users with their Twitch login (this will need to be done manually or via a script)
-- For now, we'll set it to the same as display_name as a placeholder
UPDATE users SET login = LOWER(display_name) WHERE login IS NULL;

-- Make login column NOT NULL after updating existing records
ALTER TABLE users ALTER COLUMN login SET NOT NULL;

-- Add unique constraint on login
ALTER TABLE users ADD CONSTRAINT unique_users_login UNIQUE (login);