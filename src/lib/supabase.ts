// This file provides an untyped supabase client for tables that exist in the
// external database but are NOT in the auto-generated types.ts file.
// Use `db` instead of `supabase` when querying tables like classes, students,
// coordinators, facilitators, curriculum, subjects, centres, etc.

import { supabase } from '@/integrations/supabase/client';

/**
 * Untyped Supabase client – use for tables not in the auto-generated schema.
 * Example: `db.from('classes').select('*')`
 */
export const db = supabase as any;
