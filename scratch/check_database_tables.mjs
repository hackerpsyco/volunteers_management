import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envLocalPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envLocalPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
    env[match[1]] = val;
  }
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('Testing query on information_schema...');
  
  // Try to query schema tables via RPC or direct select if exposed
  const { data: d1, error: e1 } = await supabase
    .from('activity_logs')
    .select('*')
    .limit(1);
    
  console.log('activity_logs query test:', { hasData: !!d1, error: e1?.message });
  
  // Try to query pg_tables
  const { data: d2, error: e2 } = await supabase
    .from('pg_tables')
    .select('*');
  console.log('pg_tables query test:', { success: !e2, error: e2?.message });
}

run();
