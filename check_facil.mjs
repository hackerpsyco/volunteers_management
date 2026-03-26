import fs from 'fs';
const SUPABASE_URL = "https://bkafweywaswykowzrhmx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrYWZ3ZXl3YXN3eWtvd3pyaG14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI3NDczNCwiZXhwIjoyMDg0ODUwNzM0fQ.fTluY0mP6RwFpTuZ_yXq6nXH3nQ0PSIssEldYMuT-RU";

async function checkFacil() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/facilitators?select=*`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const data = await res.json();
  fs.writeFileSync('facil_check.json', JSON.stringify(data, null, 2), 'utf8');
}

checkFacil();
