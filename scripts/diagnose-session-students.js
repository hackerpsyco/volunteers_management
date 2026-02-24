#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnose() {
  console.log('\n🔍 DIAGNOSING SESSION STUDENTS LOADING\n');

  try {
    // 1. Check sessions with class_batch
    console.log('1️⃣  Checking sessions...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, title, class_batch')
      .limit(5);

    if (sessionsError) {
      console.log(`❌ Error: ${sessionsError.message}`);
    } else {
      console.log(`✅ Found ${sessions.length} sessions`);
      sessions.forEach(s => {
        console.log(`   - ${s.title}: class_batch="${s.class_batch}"`);
      });
    }

    // 2. Check classes
    console.log('\n2️⃣  Checking classes...');
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id, name')
      .limit(10);

    if (classesError) {
      console.log(`❌ Error: ${classesError.message}`);
    } else {
      console.log(`✅ Found ${classes.length} classes`);
      classes.forEach(c => {
        console.log(`   - ${c.name}`);
      });
    }

    // 3. Check students in WES Fellow class
    console.log('\n3️⃣  Checking students in WES Fellow class...');
    const { data: wesFellowClass, error: classError } = await supabase
      .from('classes')
      .select('id, name')
      .eq('name', 'WES Fellow')
      .single();

    if (classError) {
      console.log(`❌ Error: ${classError.message}`);
    } else {
      console.log(`✅ Found WES Fellow class: ${wesFellowClass.id}`);
      
      const { data: classStudents, error: studentsError } = await supabase
        .from('students')
        .select('id, name, student_id, class_id')
        .eq('class_id', wesFellowClass.id)
        .limit(5);

      if (studentsError) {
        console.log(`❌ Error: ${studentsError.message}`);
      } else {
        console.log(`   Students: ${classStudents.length}`);
        classStudents.forEach(s => {
          console.log(`   - ${s.name} (${s.student_id})`);
        });
      }
    }

    // 4. Test class matching logic
    console.log('\n4️⃣  Testing class matching logic...');
    if (sessions.length > 0 && sessions[0].class_batch) {
      const testBatch = sessions[0].class_batch;
      console.log(`   Testing with class_batch: "${testBatch}"`);
      
      const { data: matchedClass, error: matchError } = await supabase
        .from('classes')
        .select('id, name')
        .ilike('name', `%${testBatch}%`)
        .single();

      if (matchError) {
        console.log(`   ❌ No match found: ${matchError.message}`);
      } else {
        console.log(`   ✅ Matched class: ${matchedClass.name}`);
      }
    }

    console.log('\n✅ Diagnosis Complete\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

diagnose();
