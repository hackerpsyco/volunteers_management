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
  console.log('\n📊 DIAGNOSING TASK SUBMISSION STATUS\n');

  try {
    // 1. Check student_task_feedback table structure
    console.log('1️⃣  Checking student_task_feedback table...');
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('student_task_feedback')
      .select('*')
      .limit(1);

    if (feedbackError) {
      console.log(`❌ Error: ${feedbackError.message}`);
    } else {
      console.log(`✅ Table exists`);
      if (feedbackData.length > 0) {
        console.log(`   Columns: ${Object.keys(feedbackData[0]).join(', ')}`);
      }
    }

    // 2. Check curriculum table
    console.log('\n2️⃣  Checking curriculum table...');
    const { data: curriculumData, error: curriculumError } = await supabase
      .from('curriculum')
      .select('*')
      .limit(1);

    if (curriculumError) {
      console.log(`❌ Error: ${curriculumError.message}`);
    } else {
      console.log(`✅ Table exists`);
      if (curriculumData.length > 0) {
        console.log(`   Columns: ${Object.keys(curriculumData[0]).join(', ')}`);
      }
    }

    // 3. Check task submissions for each student
    console.log('\n3️⃣  Checking task submissions for each student...');
    
    for (const studentName of WES_FELLOWS) {
      // Get student profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, email')
        .eq('full_name', studentName)
        .single();

      if (profileError) {
        console.log(`   ❌ ${studentName}: Profile not found`);
        continue;
      }

      // Get task submissions (without task_id since it doesn't exist)
      const { data: submissions, error: submissionError } = await supabase
        .from('student_task_feedback')
        .select('id, status, task_name, created_at')
        .eq('student_id', profile.id);

      if (submissionError) {
        console.log(`   ⚠️  ${studentName}: ${submissionError.message}`);
      } else {
        const completed = submissions.filter(s => s.status === 'completed').length;
        const pending = submissions.filter(s => s.status === 'pending').length;
        const total = submissions.length;
        
        console.log(`   ${studentName}:`);
        console.log(`      Total submissions: ${total}`);
        console.log(`      Completed: ${completed}`);
        console.log(`      Pending: ${pending}`);
        
        if (total === 0) {
          console.log(`      ⚠️  No submissions found`);
        } else {
          submissions.slice(0, 2).forEach(s => {
            console.log(`      - ${s.task_name} (${s.status})`);
          });
        }
      }
    }

    // 4. Check curriculum assignments
    console.log('\n4️⃣  Checking curriculum assignments...');
    const { data: curriculumAssignments, error: currError } = await supabase
      .from('curriculum')
      .select('id, module_name, class_id, created_at')
      .limit(5);

    if (currError) {
      console.log(`❌ Error: ${currError.message}`);
    } else {
      console.log(`✅ Found ${curriculumAssignments.length} curriculum items`);
      curriculumAssignments.forEach(c => {
        console.log(`   - ${c.module_name} (Class: ${c.class_id})`);
      });
    }

    // 5. Check WES Fellow class
    console.log('\n5️⃣  Checking WES Fellow class...');
    const { data: wesFellowClass, error: classError } = await supabase
      .from('classes')
      .select('id, name')
      .eq('name', 'WES Fellow')
      .single();

    if (classError) {
      console.log(`❌ Error: ${classError.message}`);
    } else {
      console.log(`✅ Class ID: ${wesFellowClass.id}`);
      
      // Check curriculum for this class
      const { data: classCurriculum, error: classCurrError } = await supabase
        .from('curriculum')
        .select('id, module_name')
        .eq('class_id', wesFellowClass.id);

      if (classCurrError) {
        console.log(`   ⚠️  Error fetching curriculum: ${classCurrError.message}`);
      } else {
        console.log(`   Curriculum items: ${classCurriculum.length}`);
        classCurriculum.slice(0, 3).forEach(c => {
          console.log(`      - ${c.module_name}`);
        });
      }
    }

    // 6. Check data connections
    console.log('\n6️⃣  Checking data connections...');
    
    // Check if student profiles are linked to class
    const { data: profilesWithClass, error: profileClassError } = await supabase
      .from('user_profiles')
      .select('id, full_name, class_id')
      .in('full_name', WES_FELLOWS)
      .not('class_id', 'is', null);

    if (profileClassError) {
      console.log(`❌ Error: ${profileClassError.message}`);
    } else {
      console.log(`✅ Students with class assignment: ${profilesWithClass.length}/${WES_FELLOWS.length}`);
      
      const withoutClass = WES_FELLOWS.length - profilesWithClass.length;
      if (withoutClass > 0) {
        console.log(`   ⚠️  ${withoutClass} students missing class assignment`);
      }
    }

    console.log('\n✅ Diagnosis Complete\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

diagnose();
