#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const WES_FELLOWS = [
  'Narghis Khan', 'Mohammad Ittehad', 'Mahak Khan', 'Anjali Morya',
  'Akash Verma', 'Paras Barman', 'Nasreen Bano', 'Sonali Malaiya',
  'Harsita Panika', 'Anchal Singh Gond', 'Saroj Panika', 'Shivam Dahiya',
  'Aarzoo Khanam', 'Vaishnavi Varman', 'Aasifa Begam', 'Minakshi Barman',
  'Alkama Bee', 'Warisun'
];

async function diagnose() {
  console.log('\n🔍 DIAGNOSING STUDENT LOGIN ISSUES\n');

  try {
    // 1. Check auth users
    console.log('1️⃣  Checking Auth Users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.log(`❌ Error listing auth users: ${authError.message}`);
    } else {
      const wesAuthUsers = authUsers.users.filter(u => 
        WES_FELLOWS.includes(u.user_metadata?.full_name)
      );
      console.log(`   Total auth users: ${authUsers.users.length}`);
      console.log(`   WES Fellow auth users: ${wesAuthUsers.length}`);
      wesAuthUsers.forEach(u => {
        console.log(`   - ${u.email} (${u.user_metadata?.full_name}) - Confirmed: ${u.email_confirmed_at ? '✅' : '❌'}`);
      });
    }

    // 2. Check user_profiles
    console.log('\n2️⃣  Checking User Profiles...');
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, role_id, class_id, is_active')
      .in('full_name', WES_FELLOWS);
    
    if (profileError) {
      console.log(`❌ Error fetching profiles: ${profileError.message}`);
    } else {
      console.log(`   Total WES Fellow profiles: ${profiles.length}`);
      profiles.forEach(p => {
        console.log(`   - ${p.email} (${p.full_name}) - Active: ${p.is_active ? '✅' : '❌'}`);
      });
    }

    // 3. Check students table
    console.log('\n3️⃣  Checking Students Table...');
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('id, name, email, class_id')
      .in('name', WES_FELLOWS);
    
    if (studentError) {
      console.log(`❌ Error fetching students: ${studentError.message}`);
    } else {
      console.log(`   Total WES Fellow students: ${students.length}`);
      students.forEach(s => {
        console.log(`   - ${s.name} (${s.email}) - Class ID: ${s.class_id}`);
      });
    }

    // 4. Check WES Fellow class
    console.log('\n4️⃣  Checking WES Fellow Class...');
    const { data: wesFellowClass, error: classError } = await supabase
      .from('classes')
      .select('id, name, email')
      .eq('name', 'WES Fellow')
      .single();
    
    if (classError) {
      console.log(`❌ Error fetching WES Fellow class: ${classError.message}`);
    } else {
      console.log(`   Class ID: ${wesFellowClass.id}`);
      console.log(`   Class Email: ${wesFellowClass.email || 'NOT SET'}`);
    }

    // 5. Check for mismatches
    console.log('\n5️⃣  Checking for Data Mismatches...');
    
    if (authUsers && profiles) {
      const authEmails = new Set(authUsers.users.map(u => u.email));
      const profileEmails = new Set(profiles.map(p => p.email));
      
      const inAuthNotProfile = [...authEmails].filter(e => !profileEmails.has(e));
      const inProfileNotAuth = [...profileEmails].filter(e => !authEmails.has(e));
      
      if (inAuthNotProfile.length > 0) {
        console.log(`   ⚠️  Auth users WITHOUT profiles: ${inAuthNotProfile.length}`);
        inAuthNotProfile.forEach(e => console.log(`      - ${e}`));
      } else {
        console.log(`   ✅ All auth users have profiles`);
      }
      
      if (inProfileNotAuth.length > 0) {
        console.log(`   ⚠️  Profiles WITHOUT auth users: ${inProfileNotAuth.length}`);
        inProfileNotAuth.forEach(e => console.log(`      - ${e}`));
      } else {
        console.log(`   ✅ All profiles have auth users`);
      }
    }

    // 6. Check Student role
    console.log('\n6️⃣  Checking Student Role...');
    const { data: studentRole, error: roleError } = await supabase
      .from('roles')
      .select('id, name')
      .eq('name', 'Student')
      .single();
    
    if (roleError) {
      console.log(`❌ Error fetching Student role: ${roleError.message}`);
    } else {
      console.log(`   Student Role ID: ${studentRole.id}`);
      
      // Check if profiles have correct role
      if (profiles) {
        const withCorrectRole = profiles.filter(p => p.role_id === studentRole.id).length;
        console.log(`   Profiles with Student role: ${withCorrectRole}/${profiles.length}`);
      }
    }

    console.log('\n✅ Diagnosis Complete\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

diagnose();
