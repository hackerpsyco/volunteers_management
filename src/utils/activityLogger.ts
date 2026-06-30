import { supabase } from '@/integrations/supabase/client';

export const logActivity = async (
  action: string,
  module: string,
  details: string
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch user profile to get the full name
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    const userName = profile?.full_name || user.email || 'System User';

    const { error } = await supabase
      .from('activity_logs')
      .insert({
        user_email: user.email,
        user_name: userName,
        action,
        module,
        details
      });

    if (error) {
      console.error('Error inserting activity log:', error);
    }
  } catch (err) {
    console.error('Error in logActivity:', err);
  }
};
