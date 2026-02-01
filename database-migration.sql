-- SciFanor Database Migration
-- Add new columns to support enhanced plant detail features

-- Step 1: Add images column (JSONB) to store multiple plant images
ALTER TABLE plants 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '{
  "full_plant": null,
  "root": null,
  "stem": null,
  "leaf": null,
  "fruit": null
}'::jsonb;

-- Step 2: Add taxonomy_descriptions column (JSONB) to store descriptions for each taxonomic level
ALTER TABLE plants 
ADD COLUMN IF NOT EXISTS taxonomy_descriptions JSONB DEFAULT '{
  "kingdom": "",
  "division": "",
  "class": "",
  "order": "",
  "family": "",
  "genus": "",
  "species": ""
}'::jsonb;

-- Step 3: Add youtube_url column for educational videos
ALTER TABLE plants 
ADD COLUMN IF NOT EXISTS youtube_url TEXT;

-- Step 4: Migrate existing image_url to new images structure
-- This ensures backward compatibility with existing data
UPDATE plants 
SET images = jsonb_set(
  COALESCE(images, '{}'::jsonb), 
  '{full_plant}', 
  to_jsonb(image_url)
)
WHERE image_url IS NOT NULL 
  AND (images->>'full_plant' IS NULL OR images IS NULL);

-- Step 5: Create index for better performance on JSONB queries
CREATE INDEX IF NOT EXISTS idx_plants_images ON plants USING GIN (images);
CREATE INDEX IF NOT EXISTS idx_plants_taxonomy_desc ON plants USING GIN (taxonomy_descriptions);

-- Verification queries:
-- SELECT id, nama_indonesia, images, taxonomy_descriptions, youtube_url FROM plants LIMIT 5;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'plants';
