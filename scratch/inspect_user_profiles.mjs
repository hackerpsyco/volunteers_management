import fs from 'fs';

const SUPABASE_URL = "https://bkafweywaswykowzrhmx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrYWZ3ZXl3YXN3eWtvd3pyaG14Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI3NDczNCwiZXhwIjoyMDg0ODUwNzM0fQ.fTluY0mP6RwFpTuZ_yXq6nXH3nQ0PSIssEldYMuT-RU";

async function inspectUserProfiles() {
  console.log("Checking user_profiles table...");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?select=*`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const profiles = await res.json();
  
  const anshProfiles = profiles.filter(p => 
    (p.email && p.email.toLowerCase().includes('ansh')) || 
    (p.full_name && p.full_name.toLowerCase().includes('ansh'))
  );
  
  console.log("Found matching profiles in user_profiles:", anshProfiles);
}

inspectUserProfiles().catch(console.error);
