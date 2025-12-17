// scripts/cleanupDummyUsers.js
// Run with: node scripts/cleanupDummyUsers.js

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('Loading test users from profiles...');

  // 1) Get all test users (we marked them earlier with is_test_user = true)
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('is_test_user', true);

  if (error) {
    console.error('Error loading test users:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No test users found with is_test_user = true.');
    return;
  }

  console.log(`Found ${data.length} test users to delete.\n`);

  // 2) Delete from auth.users (cascade will remove profiles, likes, etc.)
  for (const row of data) {
    console.log(`Deleting auth user ${row.email} (${row.id})...`);
    const { error: delError } = await supabase.auth.admin.deleteUser(row.id);
    if (delError) {
      console.error(`  ❌ Error deleting ${row.email}:`, delError.message);
    } else {
      console.log(`  ✅ Deleted ${row.email}`);
    }
  }

  console.log('\nCleanup complete.');
}

main().catch((err) => {
  console.error('Unexpected error in cleanup script:', err);
  process.exit(1);
});
