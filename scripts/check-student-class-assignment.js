#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log('\n🔍 CHECKING STUDENT CLASS ASSIGNMENT\n');

  try {
    // Check a specific student
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, role_id, class_id, is_active')
      .eq('email', 'nargish.ccc2526@gmail.com')
      .single();

    if (error) {
      console.log(`❌ Error: ${error.message}`);
    } else {
      console.log('✅ Found profile:');
      console.log(JSON.stringify(data, null, 2));
    }

    // Check all WES Fellow profiles
    console.log('\n📋 All WES Fellow Profiles:');
    const { data: allProfiles, error: allError } = await supabase
      .from('user_profiles')
      .select('email, full_name, role_id, class_id')
      .eq('role_id', 5)
      .limit(5);

    if (allError) {
      console.log(`❌ Error: ${allError.message}`);
    } else {
      allProfiles.forEach(p => {
        console.log(`- ${p.email}: class_id=${p.class_id}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

check();
