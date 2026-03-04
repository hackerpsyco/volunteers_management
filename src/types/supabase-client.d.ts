// Override the auto-generated supabase client types to allow any table name
// This is needed because the external database has tables not in the auto-generated types
declare module '@/integrations/supabase/client' {
  export const supabase: {
    from(relation: string): any;
    auth: any;
    storage: any;
    channel(name: string): any;
    functions: any;
    rpc(fn: string, args?: any): any;
    removeChannel(channel: any): any;
  };
}
