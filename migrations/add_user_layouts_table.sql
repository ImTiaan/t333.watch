-- Add user_layouts table for premium layout persistence
CREATE TABLE user_layouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  layout_config JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_user_layouts_user_id ON user_layouts(user_id);
CREATE INDEX idx_user_layouts_user_id_default ON user_layouts(user_id, is_default);

-- Ensure only one default layout per user
CREATE UNIQUE INDEX idx_user_layouts_unique_default 
  ON user_layouts(user_id) 
  WHERE is_default = TRUE;

-- Add comments for documentation
COMMENT ON TABLE user_layouts IS 'Stores custom grid layouts for premium users';
COMMENT ON COLUMN user_layouts.layout_config IS 'JSON configuration containing grid settings, stream positions, and layout preferences';
COMMENT ON COLUMN user_layouts.is_default IS 'Whether this layout should be used as the default for the user';