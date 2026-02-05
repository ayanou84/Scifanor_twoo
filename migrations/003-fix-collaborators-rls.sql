-- Fix Row Level Security for plant_collaborators table
-- This allows authenticated users to add collaborators

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to add collaborators" ON plant_collaborators;
DROP POLICY IF EXISTS "Allow users to view collaborators" ON plant_collaborators;
DROP POLICY IF EXISTS "Allow users to remove collaborators" ON plant_collaborators;

-- Allow anyone (authenticated) to view collaborators
CREATE POLICY "Anyone can view collaborators"
ON plant_collaborators FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to add collaborators
CREATE POLICY "Authenticated users can add collaborators"
ON plant_collaborators FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to remove collaborators (optional: only if they added them)
CREATE POLICY "Users can remove collaborators"
ON plant_collaborators FOR DELETE
TO authenticated
USING (true);

-- Verify policies
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'plant_collaborators';
