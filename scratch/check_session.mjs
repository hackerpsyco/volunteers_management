import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('support_requests')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching support_requests:', error);
  } else {
    console.log('--- support_requests sample record ---', data[0]);
    console.log('--- support_requests columns ---', Object.keys(data[0] || {}));
  }
}

run();
