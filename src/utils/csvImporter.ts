import { supabase } from '@/integrations/supabase/client';

// Type-safe wrapper for new tables
const db = {
  contentCategories: () => supabase.from('content_categories' as any),
  modules: () => supabase.from('modules' as any),
  topics: () => supabase.from('topics' as any),
  topicSessions: () => supabase.from('topic_sessions' as any),
};

interface ParsedRow {
  contentCategory: string;
  moduleCode: string;
  moduleTitle: string;
  topicCode: string;
  topicTitle: string;
  duration: string;
  videosEnglish: string;
  videosHindi: string;
  worksheets: string;
  practicalActivity: string;
  quizContentPpt: string;
  finalContentPpt: string;
  status: string;
  mentorName: string;
  mentorEmail: string;
  sessionDate: string;
  revisionStatus: string;
  revisionMentorName: string;
  revisionMentorEmail: string;
  revisionDate: string;
}

// Parse CSV text into rows
export function parseCSV(text: string): string[][] {
  const lines = text.trim().split('\n');
  return lines.map(line => {
    // Handle quoted fields
    const result = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
}

// Find header row and skip noise
export function findHeaderRow(rows: string[][]): { headerIndex: number; headers: string[] } {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    // Check if this looks like a header row
    if (row.includes('Content Category') || row.includes('S No.') || row.includes('Modules')) {
      return { headerIndex: i, headers: row };
    }
  }
  return { headerIndex: -1, headers: [] };
}

// Parse duration string like "10 to 15 mins"
export function parseDuration(durationStr: string): { min: number; max: number } {
  const match = durationStr.match(/(\d+)\s*to\s*(\d+)/);
  if (match) {
    return { min: parseInt(match[1]), max: parseInt(match[2]) };
  }
  return { min: 0, max: 0 };
}

// Parse date string (handles multiple formats)
export function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    console.warn('Could not parse date:', dateStr);
  }
  return null;
}

// Extract topic code from title (e.g., "1.1 Introduction of AI" -> "1.1")
export function extractTopicCode(title: string): string {
  const match = title.match(/^(\d+\.\d+)/);
  return match ? match[1] : '';
}

// Map CSV row to parsed structure - IMPROVED to handle multiple columns with same name
export function mapRowToData(row: string[], headers: string[]): ParsedRow | null {
  const getColumn = (name: string, occurrence: number = 1): string => {
    let count = 0;
    for (let i = 0; i < headers.length; i++) {
      if (headers[i] === name) {
        count++;
        if (count === occurrence) {
          return (row[i] || '').trim();
        }
      }
    }
    return '';
  };

  const contentCategory = getColumn('Content Category');
  const moduleCode = getColumn('S No.');
  const moduleTitle = getColumn('Modules');
  const topicTitle = getColumn('Topics Covered');
  const topicCode = extractTopicCode(topicTitle);

  // Skip rows without essential data
  if (!contentCategory || !topicTitle) {
    return null;
  }

  // Get Videos - first occurrence is English, second is Hindi
  const videosEnglish = getColumn('Videos', 1) || '';
  const videosHindi = getColumn('Videos', 2) || '';
  
  // Get Work Sheets - first occurrence is English, second is Hindi
  const worksheetsEnglish = getColumn('Work Sheets', 1) || '';
  const worksheetsHindi = getColumn('Work Sheets', 2) || '';
  
  // Get Practical Activity - first occurrence is English, second is Hindi
  const practicalActivityEnglish = getColumn('Practical Activity', 1) || '';
  const practicalActivityHindi = getColumn('Practical Activity', 2) || '';

  // Get Session By - first occurrence is main, second is revision
  const sessionBy = getColumn('Session By', 1) || '';
  const revisionSessionBy = getColumn('Session By', 2) || '';
  
  // Get Session on - first occurrence is main, second is revision
  const sessionOn = getColumn('Session on', 1) || '';
  const revisionSessionOn = getColumn('Session on', 2) || '';

  return {
    contentCategory,
    moduleCode,
    moduleTitle,
    topicCode,
    topicTitle,
    duration: getColumn('Duration of the videos (Including the translated videos)'),
    videosEnglish,
    videosHindi,
    worksheets: worksheetsEnglish, // Use English worksheets as primary
    practicalActivity: practicalActivityEnglish, // Use English practical as primary
    quizContentPpt: getColumn('QUIZ/CONTENT PPT') || '',
    finalContentPpt: getColumn('Final Content PPT') || '',
    status: getColumn('Session Status') || 'pending', // Default to pending if empty
    mentorName: sessionBy || '',
    mentorEmail: sessionBy || '', // May contain email
    sessionDate: sessionOn || '',
    revisionStatus: getColumn('Revision Session Status') || '',
    revisionMentorName: revisionSessionBy || '',
    revisionMentorEmail: revisionSessionBy || '',
    revisionDate: revisionSessionOn || '',
  };
}

// Main import function
export async function importCurriculumFromCSV(csvText: string): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let success = 0;
  let failed = 0;

  try {
    // Parse CSV
    const rows = parseCSV(csvText);
    const { headerIndex, headers } = findHeaderRow(rows);

    if (headerIndex === -1) {
      return { success: 0, failed: 0, errors: ['Could not find header row in CSV'] };
    }

    // Get data rows (skip header and noise)
    const dataRows = rows.slice(headerIndex + 1);
    const categoryMap = new Map<string, string>(); // name -> id
    const moduleMap = new Map<string, string>(); // "category:code" -> id
    const topicMap = new Map<string, string>(); // "module:code" -> id

    // Process each row
    for (let i = 0; i < dataRows.length; i++) {
      try {
        const parsedData = mapRowToData(dataRows[i], headers);
        if (!parsedData) continue;

        // 1. Create or find ContentCategory
        let categoryId = categoryMap.get(parsedData.contentCategory);
        if (!categoryId) {
          const { data: category, error: catError } = await db
            .contentCategories()
            .upsert(
              { name: parsedData.contentCategory },
              { onConflict: 'name' }
            )
            .select('id')
            .single() as any;

          if (catError) throw new Error(`Category error: ${catError.message}`);
          categoryId = category?.id;
          if (categoryId) categoryMap.set(parsedData.contentCategory, categoryId);
        }

        // 2. Create or find Module
        const moduleKey = `${parsedData.contentCategory}:${parsedData.moduleCode}`;
        let moduleId = moduleMap.get(moduleKey);
        if (!moduleId && parsedData.moduleCode && categoryId) {
          const { data: module, error: modError } = await db
            .modules()
            .upsert(
              {
                category_id: categoryId,
                module_code: parsedData.moduleCode,
                title: parsedData.moduleTitle,
              },
              { onConflict: 'category_id,module_code' }
            )
            .select('id')
            .single() as any;

          if (modError) throw new Error(`Module error: ${modError.message}`);
          moduleId = module?.id;
          if (moduleId) moduleMap.set(moduleKey, moduleId);
        }

        // 3. Create Topic
        if (moduleId && parsedData.topicCode) {
          const topicKey = `${moduleId}:${parsedData.topicCode}`;
          let topicId = topicMap.get(topicKey);

          if (!topicId) {
            const { min, max } = parseDuration(parsedData.duration);
            const { data: topic, error: topError } = await db
              .topics()
              .upsert(
                {
                  module_id: moduleId,
                  topic_code: parsedData.topicCode,
                  title: parsedData.topicTitle,
                  duration_min: min,
                  duration_max: max,
                },
                { onConflict: 'module_id,topic_code' }
              )
              .select('id')
              .single() as any;

            if (topError) throw new Error(`Topic error: ${topError.message}`);
            topicId = topic?.id;
            if (topicId) topicMap.set(topicKey, topicId);
          }

          // 4. Create Topic Session with Status
          if (topicId) {
            const { error: sessionError } = await db
              .topicSessions()
              .insert({
                topic_id: topicId,
                status: (parsedData.status || 'pending').toLowerCase(),
                mentor_name: parsedData.mentorName,
                mentor_email: parsedData.mentorEmail,
                session_date: parseDate(parsedData.sessionDate),
                session_time: '09:00',
                video_english: parsedData.videosEnglish,
                worksheet_english: parsedData.worksheets,
                practical_activity_english: parsedData.practicalActivity,
                video_hindi: parsedData.videosHindi,
                quiz_content_ppt: parsedData.quizContentPpt,
                final_content_ppt: parsedData.finalContentPpt,
                revision_status: parsedData.revisionStatus ? (parsedData.revisionStatus).toLowerCase() : null,
                revision_mentor_name: parsedData.revisionMentorName,
                revision_mentor_email: parsedData.revisionMentorEmail,
                revision_date: parseDate(parsedData.revisionDate),
              }) as any;

            if (sessionError) throw new Error(`Session error: ${sessionError.message}`);
            success++;
          }
        }
      } catch (error) {
        failed++;
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return { success, failed, errors };
  } catch (error) {
    return {
      success: 0,
      failed: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}
