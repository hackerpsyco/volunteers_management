#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY // Use anon key to simulate unauthenticated access
);

async function testLogin() {
  console.log('\n🧪 TESTING STUDENT LOGIN VALIDATION\n');

  try {
    // Test 1: Check if we can query as anon user
    console.log('Test 1: Querying as anon user...');
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, class_id')
      .eq('email', 'nargish.ccc2526@gmail.com')
      .eq('role_id', 5)
      .not('class_id', 'is', null)
      .single();

    if (error) {
      console.log(`❌ Query failed: ${error.message}`);
      console.log(`   Code: ${error.code}`);
    } else {
      console.log(`✅ Query succeeded!`);
      console.log(`   Email: ${data.email}`);
      console.log(`   Name: ${data.full_name}`);
      console.log(`   Class ID: ${data.class_id}`);
    }

    // Test 2: Try to login
    console.log('\nTest 2: Attempting login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'nargish.ccc2526@gmail.com',
      password: 'Narghis+123',
    });

    if (authError) {
      console.log(`❌ Login failed: ${authError.message}`);
    } else {
      console.log(`✅ Login succeeded!`);
      console.log(`   User ID: ${authData.user.id}`);
      console.log(`   Email: ${authData.user.email}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLogin();
