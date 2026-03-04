// Extend Supabase types to allow any table name for the external database
// This is needed because the auto-generated types.ts only knows about
// 'sessions' and 'volunteers', but the external database has many more tables.

import type { SupabaseClient } from '@supabase/supabase-js';

declare module '@supabase/supabase-js' {
  interface SupabaseClient {
    from(relation: string): any;
  }
}
