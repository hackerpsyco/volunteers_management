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
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'students' });
  
  if (error) {
    // If RPC doesn't exist, we can run a query via information_schema if we can, or just inspect a single student select keys
    console.log('RPC get_table_columns failed, attempting custom query...');
    const { data: cols, error: colsError } = await supabase
      .from('students')
      .select()
      .limit(1);
      
    if (colsError) {
      console.error('Error fetching students:', colsError);
      return;
    }
    
    if (cols && cols.length > 0) {
      console.log('Columns on students table:', Object.keys(cols[0]));
    } else {
      console.log('No rows returned, could not determine columns.');
    }
  } else {
    console.log('Columns:', data);
  }
}

run();
