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
  const sql = `
    CREATE TABLE IF NOT EXISTS public.activity_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_email TEXT NOT NULL,
      user_name TEXT,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      details TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );
  `;
  
  const rpcs = ['exec_sql', 'run_sql', 'execute_sql', 'sql'];
  for (const rpc of rpcs) {
    console.log(`Trying RPC "${rpc}"...`);
    const { data, error } = await supabase.rpc(rpc, { sql_query: sql, query: sql, sql: sql });
    if (!error) {
      console.log(`RPC "${rpc}" executed successfully! Result:`, data);
      return;
    } else {
      console.log(`RPC "${rpc}" failed:`, error.message);
    }
  }
}

run();
