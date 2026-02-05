/**
 * SciFanor - Auto Seeding Script (Node.js)
 * Script ini otomatis MEMBUAT 39 AKUN SISWA di Supabase Auth & Profiles
 * 
 * ⚠️ PREREQUISITE:
 * 1. Install Node.js
 * 2. Buka terminal di folder project
 * 3. Run: npm install @supabase/supabase-js dotenv
 * 4. Buat file .env di root project dan isi:
 *    SUPABASE_URL=https://your-project.supabase.co
 *    SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Ambil di Project Settings > API)
 * 
 * 🚀 CARA JALANKAN:
 * node js/seed-users.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Config check
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: Environment variables belum diset!');
  console.error('Buat file .env berisi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY (Service Role, bukan Anon Key)');
  process.exit(1);
}

// Admin Client (Bypass RLS, Full Access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Daftar 39 nama siswa
const students = [
  "Adrian Harry Putra Pardede", "Al kautsar nasution", "Alfiansyah prasetia", "Alya Yulia Rahma", "Annisa Febriyana Harahap",
  "Ardiansyah", "Arimbhi", "Arini Tasya Nasution", "Bella Putri Tarisyah", "Delia Putri Candra",
  "Dina Zahara Syahfitri", "Dimas Aulia", "Elpa Azzahra", "Fattan Nijima Wibowo", "Firza Ramadhan",
  "Hariani", "Haris Ahmad Pahlevi", "Icha Cyntia Sari", "Ikhyar Rangga Pratama", "Keysya Fadhillah'lmi",
  "Khairullah Rizqi Zumhana", "KillaChayara", "Maliki Khairi Akbar", "Mentari BR. Situmorang", "Muhammad Azzam",
  "Muhammad Rizky Fauzi", "Natasya Aulia", "Nurul Qolbi", "Prasta Aditya", "Raihan Maulana Bahari",
  "Revi Meiriska BR Nasution", "Riva Satria Biandra", "Safa Inayah Pranoto", "Serli Saputri", "Silvi Anggraini",
  "Siti Mulia", "Talita Zahra Nabila", "Tiara Salsabila", "Zaskia Nazahira"
];

// Helper: Generate Email
function generateEmail(fullName) {
  const parts = fullName.toLowerCase().trim().replace(/[^a-z\s]/g, '').split(/\s+/);
  const cleanParts = parts.filter(p => p.length > 2 && p !== 'br');

  if (cleanParts.length >= 2) {
    const firstName = cleanParts[0];
    const lastName = cleanParts[cleanParts.length - 1];
    return `${firstName}.${lastName}@scifanor.local`;
  } else {
    return `${cleanParts[0]}01@scifanor.local`;
  }
}

// Helper: Generate Initial Badge Color
function getAvatarColor(initial) {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#FAD7A0',
    '#AED6F1', '#D7BDE2', '#A9DFBF', '#F9E79F', '#FADBD8', '#D5DBDB', '#85929E', '#5DADE2', '#48C9B0', '#F4D03F',
    '#EB984E', '#DC7633', '#A569BD', '#5499C7', '#52BE80', '#F8C471'
  ];
  return colors[initial.charCodeAt(0) % colors.length];
}

async function main() {
  console.log('🚀 Starting Bulk User Creation for SciFanor...');
  console.log('Target: 39 Siswa + Profiles\n');

  let successCount = 0;
  let failCount = 0;
  let credentials = 'No,Nama,Email,Password\n';

  for (let i = 0; i < students.length; i++) {
    const name = students[i];
    const email = generateEmail(name);
    const password = 'SciFanor2026!'; // Default password

    process.stdout.write(`[${i + 1}/39] Creating ${name} (${email})... `);

    try {
      // 1. Create Auth User
      // Note: Admin API tidak perlu confirm email
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true // Auto confirm
      });

      if (authError) throw authError;

      const userId = authData.user.id;

      // 2. Create/Update Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: name,
          is_admin: false,
          avatar_url: null
        });

      if (profileError) throw profileError;

      console.log('✅ OK');
      successCount++;
      credentials += `${i + 1},"${name}",${email},"${password}"\n`;

    } catch (error) {
      console.log('❌ FAIL');
      console.error(`   Error: ${error.message}`);
      failCount++;
    }
  }

  // Save CSV
  const fs = require('fs');
  fs.writeFileSync('siswa_credentials.csv', credentials);

  console.log('\n=======================================');
  console.log(`🎉 Finished! Success: ${successCount}, Failed: ${failCount}`);
  console.log('📂 Credentials saved to: siswa_credentials.csv');
  console.log('=======================================');
}

main();
