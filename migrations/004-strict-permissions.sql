-- Migration: 004-strict-permissions.sql
-- Goal: 
-- 1. Public Read Access (Profiles, Collaborators)
-- 2. Strict Write Access (Creator vs Collaborator)

-- =======================================================
-- 1. PROFILES TABLE (Allow Public Read)
-- =======================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existng policies to start fresh
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- View: Everyone (Anon + Authenticated)
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- Insert/Update: Self only
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- =======================================================
-- 2. PLANTS TABLE (Creator = Owner, Collaborator = Editor)
-- =======================================================
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Plants are viewable by everyone" ON plants;
DROP POLICY IF EXISTS "Authenticated users can create plants" ON plants;
DROP POLICY IF EXISTS "Users can update own plants" ON plants;
DROP POLICY IF EXISTS "Users can delete own plants" ON plants;
DROP POLICY IF EXISTS "Collaborators can update plants" ON plants;

-- View: Everyone
CREATE POLICY "Plants are viewable by everyone"
ON plants FOR SELECT
USING (true);

-- Insert: Authenticated users
CREATE POLICY "Authenticated users can create plants"
ON plants FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Update: Creator OR Collaborator
-- Note: 'using' clause checks existing row. 
CREATE POLICY "Owners and collaborators can update plants"
ON plants FOR UPDATE
USING (
  auth.uid() = created_by OR 
  EXISTS (
    SELECT 1 FROM plant_collaborators 
    WHERE plant_id = id AND user_id = auth.uid()
  )
);

-- Delete: Creator ONLY
CREATE POLICY "Only owners can delete plants"
ON plants FOR DELETE
USING (auth.uid() = created_by);

-- =======================================================
-- 3. PLANT_COLLABORATORS TABLE (Manage Team)
-- =======================================================
ALTER TABLE plant_collaborators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view collaborators" ON plant_collaborators;
DROP POLICY IF EXISTS "Authenticated users can add collaborators" ON plant_collaborators;
DROP POLICY IF EXISTS "Users can remove collaborators" ON plant_collaborators;

-- View: Everyone (So visitors can see avatars)
CREATE POLICY "Anyone can view collaborators"
ON plant_collaborators FOR SELECT
USING (true);

-- Insert: Creator ONLY
-- Only the plant creator can add a collaborator
CREATE POLICY "Only plant creator can add collaborators"
ON plant_collaborators FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM plants 
    WHERE id = plant_id AND created_by = auth.uid()
  )
);

-- Delete: Creator ONLY 
-- Only the plant creator can remove a collaborator
-- (Optional: Users could remove themselves, but for now strict owner control)
CREATE POLICY "Only plant creator can remove collaborators"
ON plant_collaborators FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM plants 
    WHERE id = plant_id AND created_by = auth.uid()
  ) 
  OR 
  -- Allow user to leave collaboration (remove themselves)
  user_id = auth.uid()
);
