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

const SAMPLE_TASKS = [
  {
    task_name: 'Module 1: Overview of AI - Part A',
    feedback_type: 'assignment',
    task_description: 'Complete the overview of AI module',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    status: 'pending'
  },
  {
    task_name: 'Module 1: Quiz',
    feedback_type: 'quiz',
    task_description: 'Complete the module 1 quiz',
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
    status: 'pending'
  },
  {
    task_name: 'Project: AI Application',
    feedback_type: 'project',
    task_description: 'Build a simple AI application',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    status: 'pending'
  }
];

async function createStudentTasks() {
  console.log('\n📝 CREATING STUDENT TASKS\n');

  try {
    let tasksCreated = 0;
    let tasksFailed = 0;

    for (const studentName of WES_FELLOWS) {
      // Get student from students table (not user_profiles)
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('name', studentName)
        .single();

      if (studentError) {
        console.log(`❌ ${studentName}: Student record not found`);
        tasksFailed++;
        continue;
      }

      process.stdout.write(`Creating tasks for ${studentName}... `);

      // Create tasks for this student
      for (const task of SAMPLE_TASKS) {
        const { error: taskError } = await supabase
          .from('student_task_feedback')
          .insert({
            student_id: student.id,
            task_name: task.task_name,
            feedback_type: task.feedback_type,
            task_description: task.task_description,
            deadline: task.deadline,
            status: task.status
          });

        if (taskError) {
          console.log(`❌ Error creating task: ${taskError.message}`);
          tasksFailed++;
        } else {
          tasksCreated++;
        }
      }

      console.log(`✅ (${SAMPLE_TASKS.length} tasks)`);
    }

    console.log(`\n✅ Task Creation Complete`);
    console.log(`   Total tasks created: ${tasksCreated}`);
    console.log(`   Failed: ${tasksFailed}\n`);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

createStudentTasks();
