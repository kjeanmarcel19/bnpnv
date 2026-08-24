import { createClient } from '@supabase/supabase-js';
import { DEFAULT_USERS } from '../src/defaultUsers.js';

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont obligatoires.');
}

const supabase = createClient(url, serviceRoleKey);

const rows = DEFAULT_USERS.map((client) => {
  const { codeSecret, ...safeClient } = client;
  return {
    user_id: client.id,
    payload: safeClient,
    updated_at: new Date().toISOString()
  };
});

const { error } = await supabase
  .from('user_data')
  .upsert(rows, { onConflict: 'user_id' });

if (error) {
  console.error('Import Supabase impossible :', error.message);
  process.exit(1);
}

console.log(`${rows.length} clients importés dans user_data.`);
