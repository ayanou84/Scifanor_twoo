// Supabase Client Configuration
// Make sure to replace these with your actual Supabase credentials

const SUPABASE_URL = typeof process !== 'undefined' && process.env.SUPABASE_URL
    ? process.env.SUPABASE_URL
    : 'YOUR_SUPABASE_URL_HERE';

const SUPABASE_ANON_KEY = typeof process !== 'undefined' && process.env.SUPABASE_ANON_KEY
    ? process.env.SUPABASE_ANON_KEY
    : 'YOUR_SUPABASE_ANON_KEY_HERE';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase client initialized');

// Export for use in other modules
window.supabaseClient = supabase;
