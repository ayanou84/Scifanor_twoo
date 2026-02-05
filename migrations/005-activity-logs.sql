-- Migration: 005-activity-logs.sql
-- Goal: Create activity log table to track all changes

-- =======================================================
-- 1. Create plant_activity_logs Table
-- =======================================================
CREATE TABLE IF NOT EXISTS plant_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id), -- Tracks who made the change
    action_type TEXT NOT NULL, -- 'create', 'update', 'image_add', 'collab_add', 'collab_remove'
    details TEXT, -- "Mengubah Genus", "Menambahkan Foto Akar"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================================================
-- 2. Security (RLS)
-- =======================================================
ALTER TABLE plant_activity_logs ENABLE ROW LEVEL SECURITY;

-- Reading: Public (Visitors track history)
CREATE POLICY "Everyone can view activity logs"
ON plant_activity_logs FOR SELECT
USING (true);

-- Insert: Authenticated users (System will insert on their behalf)
CREATE POLICY "Authenticated users can insert logs"
ON plant_activity_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- No Update/Delete (History is immutable)
-- (Admin could delete if needed, but for now strict immutable)
