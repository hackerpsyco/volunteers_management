import { supabase } from '@/integrations/supabase/client';

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
  videoEnglish: string;
  videoHindi: string;
  worksheetEnglish: string;
  worksheetHindi: string;
  practicalEnglish: string;
  practicalHindi: string;
  quizPpt: string;
  finalPpt: string;
  status: string;
  mentorName: string;
  mentorEmail: string;
  sessionDate: string;
}

// Detect format (CSV or HTML)
function detectFormat(text: string): 'csv' | 'html' {
  return text.includes('<table') || text.includes('<tr') ? 'html' : 'csv';
}

// Parse CSV - improved to handle complex headers
function parseCSV(text: string): string[][] {
  const lines = text.trim().split('\n');
  return lines.map(line => {
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

// Parse HTML table
function parseHTML(html: string): string[][] {
  const rows: string[][] = [];
  const trRegex = /<tr[^>]*>(.*?)<\/tr>/gs;
  const tdRegex = /<td[^>]*>(.*?)<\/td>/gs;
  
  let trMatch;
  while ((trMatch = trRegex.exec(html)) !== null) {
    const rowHtml = trMatch[1];
    const cells: string[] = [];
    
    let tdMatch;
    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      let cellContent = tdMatch[1]
        .replace(/<[^>]*>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
      
      cells.push(cellContent);
    }
    
    if (cells.length > 0) {
      rows.push(cells);
    }
  }
  
  return rows;
}

// Find header row - look for the row with "Content Category"
function findHeaderRow(rows: string[][]): { index: number; headers: string[] } {
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i];
    // Look for the row that contains "Content Category" as first meaningful column
    if (row.length > 0 && row[0].trim().toLowerCase() === 'content category') {
      console.log(`Found header row at index ${i}:`, row);
      return { index: i, headers: row };
    }
  }
  console.log('Header row not found. First 10 rows:');
  rows.slice(0, 10).forEach((row, idx) => {
    console.log(`Row ${idx}:`, row.slice(0, 5));
  });
  return { index: -1, headers: [] };
}

// Get column value (handles multiple columns with same name)
function getColumn(row: string[], headers: string[], name: string, occurrence: number = 1): string {
  let count = 0;
  for (let i = 0; i < headers.length; i++) {
    if (headers[i].trim() === name.trim()) {
      count++;
      if (count === occurrence) {
        return (row[i] || '').trim();
      }
    }
  }
  return '';
}

// Extract topic code
function extractTopicCode(title: string): string {
  const match = title.match(/^(\d+(?:\.\d+)*)/);
  return match ? match[1] : '';
}

// Parse date
function parseDate(dateStr: string): string | null {
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

// Map status
function mapStatus(status: string): string {
  const normalized = status.toLowerCase().trim();
  if (['pending', 'available', 'completed', 'committed'].includes(normalized)) {
    return normalized;
  }
  if (normalized.includes('complet')) return 'completed';
  if (normalized.includes('avail')) return 'available';
  if (normalized.includes('commit')) return 'committed';
  return 'pending';
}

// Map row to parsed data
function mapRowToData(row: string[], headers: string[]): ParsedRow | null {
  const contentCategory = getColumn(row, headers, 'Content Category');
  const topicTitle = getColumn(row, headers, 'Topics Covered');
  
  console.log(`Mapping row - Category: "${contentCategory}", Topic: "${topicTitle}"`);
  
  // Skip rows with empty category or topic
  if (!contentCategory.trim() || !topicTitle.trim()) {
    console.log('Skipping row - missing category or topic');
    return null;
  }

  const topicCode = extractTopicCode(topicTitle);
  if (!topicCode) {
    console.log(`Skipping row - could not extract topic code from "${topicTitle}"`);
    return null;
  }

  // Module code can be empty for sub-topics
  const moduleCode = getColumn(row, headers, 'S No.') || '0';

  return {
    contentCategory: contentCategory.trim(),
    moduleCode: moduleCode.trim(),
    moduleTitle: getColumn(row, headers, 'Modules').trim(),
    topicCode,
    topicTitle: topicTitle.trim(),
    duration: getColumn(row, headers, 'Duration of the videos (Including the translated videos)').trim(),
    videoEnglish: getColumn(row, headers, 'Videos', 1).trim(),
    videoHindi: getColumn(row, headers, 'Videos', 2).trim(),
    worksheetEnglish: getColumn(row, headers, 'Work Sheets', 1).trim(),
    worksheetHindi: getColumn(row, headers, 'Work Sheets', 2).trim(),
    practicalEnglish: getColumn(row, headers, 'Practical Activity', 1).trim(),
    practicalHindi: getColumn(row, headers, 'Practical Activity', 2).trim(),
    quizPpt: getColumn(row, headers, 'QUIZ/CONTENT PPT').trim(),
    finalPpt: getColumn(row, headers, 'Final Content PPT').trim(),
    status: mapStatus(getColumn(row, headers, 'Session Status')),
    mentorName: getColumn(row, headers, 'Session By', 1).trim(),
    mentorEmail: getColumn(row, headers, 'Session By', 1).trim(),
    sessionDate: getColumn(row, headers, 'Session on', 1).trim(),
  };
}

// Main unified import function
export async function importCurriculum(fileText: string): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let success = 0;
  let failed = 0;

  try {
    console.time('Import Duration');
    
    const format = detectFormat(fileText);
    const rows = format === 'html' ? parseHTML(fileText) : parseCSV(fileText);
    const { index: headerIndex, headers } = findHeaderRow(rows);

    console.log(`Format: ${format}, Rows: ${rows.length}, Header at: ${headerIndex}, Headers:`, headers);

    if (headerIndex === -1) {
      console.error('Header row not found');
      return { success: 0, failed: 0, errors: ['Header row not found'] };
    }

    const dataRows = rows.slice(headerIndex + 1);
    console.log(`Processing ${dataRows.length} data rows`);
    
    const categoryMap = new Map<string, string>();
    const moduleMap = new Map<string, string>();
    const topicMap = new Map<string, string>();
    const sessionsToInsert: any[] = [];

    // Phase 1: Create categories and modules
    console.log('Phase 1: Creating categories and modules...');
    for (const row of dataRows) {
      const parsed = mapRowToData(row, headers);
      if (!parsed) {
        console.log('Row skipped - could not parse');
        continue;
      }

      const { contentCategory } = parsed;
      
      if (!categoryMap.has(contentCategory)) {
        console.log(`Creating category: ${contentCategory}`);
        const { data: cat, error: catErr } = await db.contentCategories()
          .upsert({ name: contentCategory }, { onConflict: 'name' })
          .select('id').single() as any;
        
        if (catErr) {
          console.error(`Category error: ${catErr.message}`);
          throw new Error(`Category: ${catErr.message}`);
        }
        if (cat?.id) {
          categoryMap.set(contentCategory, cat.id);
          console.log(`Category created with ID: ${cat.id}`);
        }
      }

      // Only create module if module code is not empty/0
      if (parsed.moduleCode && parsed.moduleCode !== '0' && categoryMap.has(contentCategory)) {
        const moduleKey = `${contentCategory}:${parsed.moduleCode}`;
        if (!moduleMap.has(moduleKey)) {
          console.log(`Creating module: ${moduleKey}`);
          const { data: mod, error: modErr } = await db.modules()
            .upsert({
              category_id: categoryMap.get(contentCategory),
              module_code: parsed.moduleCode,
              title: parsed.moduleTitle || `Module ${parsed.moduleCode}`,
            }, { onConflict: 'category_id,module_code' })
            .select('id').single() as any;
          
          if (modErr) {
            console.error(`Module error: ${modErr.message}`);
            throw new Error(`Module: ${modErr.message}`);
          }
          if (mod?.id) {
            moduleMap.set(moduleKey, mod.id);
            console.log(`Module created with ID: ${mod.id}`);
          }
        }
      }
    }

    // Phase 2: Create topics and collect sessions
    console.log('Phase 2: Creating topics and collecting sessions...');
    for (const row of dataRows) {
      try {
        const parsed = mapRowToData(row, headers);
        if (!parsed) continue;

        // Determine module ID - use existing module or create a default one
        let moduleId: string | undefined;
        
        if (parsed.moduleCode && parsed.moduleCode !== '0') {
          const moduleKey = `${parsed.contentCategory}:${parsed.moduleCode}`;
          moduleId = moduleMap.get(moduleKey);
        } else {
          // For sub-topics without module code, use a default module
          const defaultModuleKey = `${parsed.contentCategory}:DEFAULT`;
          if (!moduleMap.has(defaultModuleKey) && categoryMap.has(parsed.contentCategory)) {
            const { data: mod, error: modErr } = await db.modules()
              .upsert({
                category_id: categoryMap.get(parsed.contentCategory),
                module_code: 'DEFAULT',
                title: 'Default Module',
              }, { onConflict: 'category_id,module_code' })
              .select('id').single() as any;
            
            if (mod?.id) {
              moduleMap.set(defaultModuleKey, mod.id);
            }
          }
          moduleId = moduleMap.get(defaultModuleKey);
        }

        if (!moduleId) {
          console.log(`Module not found for row with category: ${parsed.contentCategory}, code: ${parsed.moduleCode}`);
          continue;
        }

        const topicKey = `${moduleId}:${parsed.topicCode}`;
        if (!topicMap.has(topicKey)) {
          console.log(`Creating topic: ${topicKey}`);
          const { data: topic, error: topErr } = await db.topics()
            .upsert({
              module_id: moduleId,
              topic_code: parsed.topicCode,
              title: parsed.topicTitle,
              duration_min: 10,
              duration_max: 15,
            }, { onConflict: 'module_id,topic_code' })
            .select('id').single() as any;
          
          if (topErr) {
            console.error(`Topic error: ${topErr.message}`);
            throw new Error(`Topic: ${topErr.message}`);
          }
          if (topic?.id) {
            topicMap.set(topicKey, topic.id);
            console.log(`Topic created with ID: ${topic.id}`);
          }
        }

        const topicId = topicMap.get(topicKey);
        if (topicId) {
          const sessionData = {
            topic_id: topicId,
            status: parsed.status,
            mentor_name: parsed.mentorName || null,
            mentor_email: parsed.mentorEmail || null,
            session_date: parseDate(parsed.sessionDate),
            session_time: '09:00',
            video_english: parsed.videoEnglish || null,
            worksheet_english: parsed.worksheetEnglish || null,
            practical_activity_english: parsed.practicalEnglish || null,
            video_hindi: parsed.videoHindi || null,
            worksheet_hindi: parsed.worksheetHindi || null,
            practical_activity_hindi: parsed.practicalHindi || null,
            quiz_content_ppt: parsed.quizPpt || null,
            final_content_ppt: parsed.finalPpt || null,
          };
          console.log('Adding session to insert queue:', sessionData);
          sessionsToInsert.push(sessionData);
        }
      } catch (error) {
        failed++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`Row error: ${errorMsg}`);
        errors.push(`Row: ${errorMsg}`);
      }
    }

    // Phase 3: Batch insert sessions
    console.log(`Phase 3: Inserting ${sessionsToInsert.length} sessions...`);
    if (sessionsToInsert.length > 0) {
      console.log('Sessions to insert:', sessionsToInsert);
      const { error: sessErr } = await db.topicSessions().insert(sessionsToInsert) as any;
      if (sessErr) {
        console.error(`Sessions insert error: ${sessErr.message}`);
        throw new Error(`Sessions: ${sessErr.message}`);
      }
      success = sessionsToInsert.length;
      console.log(`Successfully inserted ${success} sessions`);
    }

    console.timeEnd('Import Duration');
    console.log(`Complete: ${success} success, ${failed} failed`);
    return { success, failed, errors };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Import function error:', errorMsg);
    return {
      success: 0,
      failed: 0,
      errors: [errorMsg],
    };
  }
}
