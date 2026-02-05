-- ============================================
-- SciFanor - Manual User Creation SQL
-- Create 39 Student Accounts + 1 Admin (You)
-- ============================================

-- IMPORTANT: 
-- 1. Create users via Supabase Dashboard → Authentication → Users → "Add user"
-- 2. Use email from list below
-- 3. Password for all: SciFanor2026!
-- 4. After creating auth users, run the INSERT statements below

-- ============================================
-- EMAIL LIST (39 Students)
-- ============================================
-- 1.  adrian.pardede@scifanor.local
-- 2.  al.nasution@scifanor.local
-- 3.  alfiansyah.prasetia@scifanor.local
-- 4.  alya.rahma@scifanor.local
-- 5.  annisa.harahap@scifanor.local
-- 6.  ardiansyah@scifanor.local
-- 7.  arimbhi@scifanor.local
-- 8.  arini.nasution@scifanor.local
-- 9.  bella.tarisyah@scifanor.local
-- 10. delia.candra@scifanor.local
-- 11. dina.syahfitri@scifanor.local
-- 12. dimas.aulia@scifanor.local
-- 13. elpa.azzahra@scifanor.local
-- 14. fattan.wibowo@scifanor.local
-- 15. firza.ramadhan@scifanor.local
-- 16. hariani@scifanor.local
-- 17. haris.pahlevi@scifanor.local
-- 18. icha.sari@scifanor.local
-- 19. ikhyar.pratama@scifanor.local
-- 20. keysya.fadhillah'lmi@scifanor.local
-- 21. khairullah.zumhana@scifanor.local
-- 22. killachayara@scifanor.local
-- 23. maliki.akbar@scifanor.local
-- 24. mentari.situmorang@scifanor.local
-- 25. muhammad.azzam@scifanor.local
-- 26. muhammad.fauzi@scifanor.local
-- 27. natasya.aulia@scifanor.local
-- 28. nurul.qolbi@scifanor.local
-- 29. prasta.aditya@scifanor.local
-- 30. raihan.bahari@scifanor.local
-- 31. revi.nasution@scifanor.local
-- 32. riva.biandra@scifanor.local
-- 33. safa.pranoto@scifanor.local
-- 34. serli.saputri@scifanor.local
-- 35. silvi.anggraini@scifanor.local
-- 36. siti.mulia@scifanor.local
-- 37. talita.nabila@scifanor.local
-- 38. tiara.salsabila@scifanor.local
-- 39. zaskia.nazahira@scifanor.local

-- ============================================
-- INSERT PROFILES (Run AFTER creating auth users)
-- ============================================

-- NOTE: Ganti '<YOUR_EMAIL>' di bagian admin dengan email kamu yang sudah ada

-- 1. Set YOUR account as admin
UPDATE profiles 
SET is_admin = true 
WHERE id = (SELECT id FROM auth.users WHERE email = '<YOUR_EMAIL>');

-- 2. Insert profiles for 39 students
-- Replace user_id with actual auth.users.id after creating the accounts

-- Method 1: If you know the user IDs (recommended)
-- Get user IDs first by running:
-- SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 39;

-- Method 2: Auto-insert based on email (use this if emails are created)
INSERT INTO profiles (id, full_name, is_admin) VALUES
  ((SELECT id FROM auth.users WHERE email = 'adrian.pardede@scifanor.local'), 'Adrian Harry Putra Pardede', false),
  ((SELECT id FROM auth.users WHERE email = 'al.nasution@scifanor.local'), 'Al kautsar nasution', false),
  ((SELECT id FROM auth.users WHERE email = 'alfiansyah.prasetia@scifanor.local'), 'Alfiansyah prasetia', false),
  ((SELECT id FROM auth.users WHERE email = 'alya.rahma@scifanor.local'), 'Alya Yulia Rahma', false),
  ((SELECT id FROM auth.users WHERE email = 'annisa.harahap@scifanor.local'), 'Annisa Febriyana Harahap', false),
  ((SELECT id FROM auth.users WHERE email = 'ardiansyah@scifanor.local'), 'Ardiansyah', false),
  ((SELECT id FROM auth.users WHERE email = 'arimbhi@scifanor.local'), 'Arimbhi', false),
  ((SELECT id FROM auth.users WHERE email = 'arini.nasution@scifanor.local'), 'Arini Tasya Nasution', false),
  ((SELECT id FROM auth.users WHERE email = 'bella.tarisyah@scifanor.local'), 'Bella Putri Tarisyah', false),
  ((SELECT id FROM auth.users WHERE email = 'delia.candra@scifanor.local'), 'Delia Putri Candra', false),
  ((SELECT id FROM auth.users WHERE email = 'dina.syahfitri@scifanor.local'), 'Dina Zahara Syahfitri', false),
  ((SELECT id FROM auth.users WHERE email = 'dimas.aulia@scifanor.local'), 'Dimas Aulia', false),
  ((SELECT id FROM auth.users WHERE email = 'elpa.azzahra@scifanor.local'), 'Elpa Azzahra', false),
  ((SELECT id FROM auth.users WHERE email = 'fattan.wibowo@scifanor.local'), 'Fattan Nijima Wibowo', false),
  ((SELECT id FROM auth.users WHERE email = 'firza.ramadhan@scifanor.local'), 'Firza Ramadhan', false),
  ((SELECT id FROM auth.users WHERE email = 'hariani@scifanor.local'), 'Hariani', false),
  ((SELECT id FROM auth.users WHERE email = 'haris.pahlevi@scifanor.local'), 'Haris Ahmad Pahlevi', false),
  ((SELECT id FROM auth.users WHERE email = 'icha.sari@scifanor.local'), 'Icha Cyntia Sari', false),
  ((SELECT id FROM auth.users WHERE email = 'ikhyar.pratama@scifanor.local'), 'Ikhyar Rangga Pratama', false),
  ((SELECT id FROM auth.users WHERE email = 'keysya.fadhillah@scifanor.local'), 'Keysya Fadhillah''lmi', false),
  ((SELECT id FROM auth.users WHERE email = 'khairullah.zumhana@scifanor.local'), 'Khairullah Rizqi Zumhana', false),
  ((SELECT id FROM auth.users WHERE email = 'killachayara@scifanor.local'), 'KillaChayara', false),
  ((SELECT id FROM auth.users WHERE email = 'maliki.akbar@scifanor.local'), 'Maliki Khairi Akbar', false),
  ((SELECT id FROM auth.users WHERE email = 'mentari.situmorang@scifanor.local'), 'Mentari BR. Situmorang', false),
  ((SELECT id FROM auth.users WHERE email = 'muhammad.azzam@scifanor.local'), 'Muhammad Azzam', false),
  ((SELECT id FROM auth.users WHERE email = 'muhammad.fauzi@scifanor.local'), 'Muhammad Rizky Fauzi', false),
  ((SELECT id FROM auth.users WHERE email = 'natasya.aulia@scifanor.local'), 'Natasya Aulia', false),
  ((SELECT id FROM auth.users WHERE email = 'nurul.qolbi@scifanor.local'), 'Nurul Qolbi', false),
  ((SELECT id FROM auth.users WHERE email = 'prasta.aditya@scifanor.local'), 'Prasta Aditya', false),
  ((SELECT id FROM auth.users WHERE email = 'raihan.bahari@scifanor.local'), 'Raihan Maulana Bahari', false),
  ((SELECT id FROM auth.users WHERE email = 'revi.nasution@scifanor.local'), 'Revi Meiriska BR Nasution', false),
  ((SELECT id FROM auth.users WHERE email = 'riva.biandra@scifanor.local'), 'Riva Satria Biandra', false),
  ((SELECT id FROM auth.users WHERE email = 'safa.pranoto@scifanor.local'), 'Safa Inayah Pranoto', false),
  ((SELECT id FROM auth.users WHERE email = 'serli.saputri@scifanor.local'), 'Serli Saputri', false),
  ((SELECT id FROM auth.users WHERE email = 'silvi.anggraini@scifanor.local'), 'Silvi Anggraini', false),
  ((SELECT id FROM auth.users WHERE email = 'siti.mulia@scifanor.local'), 'Siti Mulia', false),
  ((SELECT id FROM auth.users WHERE email = 'talita.nabila@scifanor.local'), 'Talita Zahra Nabila', false),
  ((SELECT id FROM auth.users WHERE email = 'tiara.salsabila@scifanor.local'), 'Tiara Salsabila', false),
  ((SELECT id FROM auth.users WHERE email = 'zaskia.nazahira@scifanor.local'), 'Zaskia Nazahira', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check if all profiles created
SELECT COUNT(*) as total_profiles FROM profiles;

-- Check admin status
SELECT full_name, email, is_admin 
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE is_admin = true;

-- List all students
SELECT full_name, email, is_admin 
FROM profiles p
JOIN auth.users u ON p.id = u.id
ORDER BY full_name;
