-- Migration: 006-super-admin.sql
-- Goal: 
-- 1. Ensure is_admin column exists in profiles
-- 2. Update RLS to allow Admins to Edit/Delete ANY plant
-- 3. Update RLS to allow Admins to Manage Collaborators
-- 4. Set specific user as Admin

-- 1. Ensure is_admin column exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. Update RLS for PLANTS (Allow Admin Override)

-- Update Policy: Creator OR Collaborator OR Admin
DROP POLICY IF EXISTS "Owners and collaborators can update plants" ON plants;
CREATE POLICY "Owners, collaborators, and admins can update plants"
ON plants FOR UPDATE
USING (
  auth.uid() = created_by OR 
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) OR
  EXISTS (
    SELECT 1 FROM plant_collaborators 
    WHERE plant_id = id AND user_id = auth.uid()
  )
);

-- Delete Policy: Creator OR Admin
DROP POLICY IF EXISTS "Only owners can delete plants" ON plants;
CREATE POLICY "Owners and admins can delete plants"
ON plants FOR DELETE
USING (
  auth.uid() = created_by OR 
  (SELECT is_admin FROM profiles WHERE id = auth.uid())
);

-- 3. Update RLS for PLANT_COLLABORATORS (Manage Team)

-- Insert Policy: Creator OR Admin
DROP POLICY IF EXISTS "Only plant creator can add collaborators" ON plant_collaborators;
CREATE POLICY "Creators and admins can add collaborators"
ON plant_collaborators FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM plants 
    WHERE id = plant_id AND (created_by = auth.uid() OR (SELECT is_admin FROM profiles WHERE id = auth.uid()))
  )
);

-- Delete Policy: Creator OR Admin OR Self (Leave)
DROP POLICY IF EXISTS "Only plant creator can remove collaborators" ON plant_collaborators;
CREATE POLICY "Creators and admins can remove collaborators"
ON plant_collaborators FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM plants 
    WHERE id = plant_id AND (created_by = auth.uid() OR (SELECT is_admin FROM profiles WHERE id = auth.uid()))
  ) 
  OR 
  user_id = auth.uid() -- Allow self-removal
);

-- 4. Set Specific User as Admin
-- Need to find user by email. Since profiles table usually doesn't store email (it's in auth.users),
-- we might need to rely on the user manually setting it via SQL editor if we can't join auth.users here easily.
-- However, if profiles has an email column (it does usually), we can use it.
-- Assuming profiles has 'email' or we need to join auth.users. 
-- In this project, profiles table definition is not fully visible but previous conversations imply profiles table might NOT have email, 
-- or it might be synced. 
-- BUT, I can try to update based on a known ID if available, or try to match email if profiles has it.
-- Let's try to update based on email if the column exists in profiles, otherwise the user needs to run a script in Supabase dashboard.
-- Safest bet: Try update if email column exists.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
    UPDATE profiles SET is_admin = TRUE WHERE email = 'brivasatria@gmail.com';
  END IF;
END $$;

-- Also try to update based on 'username' or similar if email is not there? 
-- Actually, the best way for the user is to run this in SQL Editor:
-- UPDATE profiles SET is_admin = TRUE WHERE id = (SELECT id FROM auth.users WHERE email = 'brivasatria@gmail.com');
-- Since I can't guarantee I can execute cross-schema joins in RLS policy creation script without permissions issues sometimes,
-- I will include the direct update command assuming I have permissions.

UPDATE profiles 
SET is_admin = TRUE 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'brivasatria@gmail.com'
);
