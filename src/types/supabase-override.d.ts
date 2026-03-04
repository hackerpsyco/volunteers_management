// Global type augmentation for external Supabase tables not in auto-generated types
// This allows supabase.from('any_table') to work without type errors

export {}; // Make this a module

declare module '@supabase/supabase-js' {
  export interface SupabaseClient<
    Database = any,
    SchemaName extends string & keyof Database = 'public' extends keyof Database
      ? 'public'
      : string & keyof Database,
    Schema extends Record<string, unknown> = Database[SchemaName] extends Record<string, unknown>
      ? Database[SchemaName]
      : never
  > {
    from<TableName extends string>(
      relation: TableName
    ): any;
  }
}
