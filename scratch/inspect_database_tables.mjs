import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env local variables
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
  console.log('Querying Supabase system tables to find log-related tables...');
  
  // List all tables in public schema
  const { data, error } = await supabase.rpc('get_tables');
  if (error) {
    // If RPC doesn't exist, query standard PG tables via a query on pg_tables
    console.log('RPC get_tables not found, running query on information_schema...');
    // We can run a direct SQL query by selecting from information_schema if we have access,
    // or try fetching from common names to see if they exist.
  }
  
  // Let's try to query some standard potential tables:
  const commonTables = ['activity_logs', 'activity_log', 'audit_logs', 'audit_log', 'logs', 'user_actions', 'action_logs'];
  for (const table of commonTables) {
    const { data, error } = await supabase.from(table).select('count', { count: 'exact', head: true });
    if (!error) {
      console.log(`Table "${table}" EXISTS!`);
    } else {
      console.log(`Table "${table}" does not exist (Error: ${error.message})`);
    }
  }
}

run();
