import fs from 'fs';
const SUPABASE_URL = "https://bkafweywaswykowzrhmx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrYWZ3ZXl3YXN3eWtvd3pyaG14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI3NDczNCwiZXhwIjoyMDg0ODUwNzM0fQ.fTluY0mP6RwFpTuZ_yXq6nXH3nQ0PSIssEldYMuT-RU";

async function checkNames() {
  const usersRes = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?select=email,full_name,role_id`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const users = await usersRes.json();
  
  const sessionsRes = await fetch(`${SUPABASE_URL}/rest/v1/sessions?select=id,title,facilitator_name,status&status=eq.committed`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const sessions = await sessionsRes.json();
  
  const output = { users, sessions };
  fs.writeFileSync('db_check.json', JSON.stringify(output, null, 2), 'utf8');
}

checkNames();
