-- ============================================
-- SciFanor Database Migration #001
-- Multi-User Collaboration System
-- ============================================

-- Step 1: Create profiles table
-- Stores user profile information (nama, foto, instagram)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  instagram_url TEXT,
  bio TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create plant_collaborators table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS plant_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_by UUID REFERENCES auth.users(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plant_id, user_id)
);

-- Step 3: Create activity_logs table (audit trail)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'add_collaborator', 'remove_collaborator'
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Add created_by column to plants table
ALTER TABLE plants 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_plant_collaborators_plant ON plant_collaborators(plant_id);
CREATE INDEX IF NOT EXISTS idx_plant_collaborators_user ON plant_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_plant ON activity_logs(plant_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plants_created_by ON plants(created_by);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES TABLE POLICIES
-- ============================================

-- Anyone authenticated can view all profiles
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Admin can update any profile
CREATE POLICY "Admin can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================
-- PLANT_COLLABORATORS TABLE POLICIES
-- ============================================

-- All authenticated users can view collaborators
CREATE POLICY "Collaborators are viewable by authenticated users"
  ON plant_collaborators FOR SELECT
  TO authenticated
  USING (true);

-- Creator or existing collaborators can add new collaborators
CREATE POLICY "Creator or collaborators can add new collaborators"
  ON plant_collaborators FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Check if user is the creator
    EXISTS (
      SELECT 1 FROM plants
      WHERE id = plant_id
      AND created_by = auth.uid()
    )
    OR
    -- Check if user is already a collaborator
    EXISTS (
      SELECT 1 FROM plant_collaborators pc
      WHERE pc.plant_id = plant_collaborators.plant_id
      AND pc.user_id = auth.uid()
    )
    OR
    -- Check if user is admin
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Only creator or admin can remove collaborators
CREATE POLICY "Only creator or admin can remove collaborators"
  ON plant_collaborators FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM plants
      WHERE id = plant_id
      AND created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================
-- ACTIVITY_LOGS TABLE POLICIES
-- ============================================

-- All authenticated users can view activity logs
CREATE POLICY "Activity logs are viewable by authenticated users"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert their own logs
CREATE POLICY "Users can insert activity logs"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- PLANTS TABLE POLICIES (Updated)
-- ============================================

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Plants are viewable by anyone" ON plants;
DROP POLICY IF EXISTS "Plants are viewable by authenticated users" ON plants;

-- All authenticated users can view all plants
CREATE POLICY "Plants are viewable by authenticated users"
  ON plants FOR SELECT
  TO authenticated
  USING (true);

-- All authenticated users can create plants
CREATE POLICY "Authenticated users can insert plants"
  ON plants FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Creator, collaborators, or admin can update plants
CREATE POLICY "Creator, collaborators, or admin can update plants"
  ON plants FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM plant_collaborators
      WHERE plant_id = id
      AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Only creator or admin can delete plants
CREATE POLICY "Only creator or admin can delete plants"
  ON plants FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION QUERIES (Comment out before running)
-- ============================================

-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'plant_collaborators';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'activity_logs';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'plants';
