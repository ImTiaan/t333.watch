-- Add profile_image_url column to users table
ALTER TABLE users 
ADD COLUMN profile_image_url TEXT;

-- Update existing users with profile images from Twitch
-- This is a placeholder - in a real implementation, you would need to 
-- fetch the profile images from Twitch API for each user
-- For now, we'll leave it NULL and it will be populated when users log in