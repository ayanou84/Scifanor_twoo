// Supabase Client Configuration
// Make sure to replace these with your actual Supabase credentials

const SUPABASE_URL = typeof process !== 'undefined' && process.env.SUPABASE_URL
    ? process.env.SUPABASE_URL
    : 'https://zmedveuacpslxumlmdui.supabase.co';

const SUPABASE_ANON_KEY = typeof process !== 'undefined' && process.env.SUPABASE_ANON_KEY
    ? process.env.SUPABASE_ANON_KEY
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptZWR2ZXVhY3BzbHh1bWxtZHVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MzE3NTgsImV4cCI6MjA4NTQwNzc1OH0.tDaNdrwPza4ucANa68iu4sAIQwYVAc9WzTLogjII4ig';

// Initialize Supabase client
const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase client initialized');

// Export for use in other modules
window.supabaseClient = sbClient;
