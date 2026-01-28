// Google OAuth Service
import { supabase } from '@/integrations/supabase/client';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = `${window.location.origin}/auth/callback`;

export const googleOAuthService = {
  /**
   * Get Google OAuth authorization URL
   */
  getAuthUrl(userType: 'volunteer' | 'facilitator'): string {
    const scope = 'https://www.googleapis.com/auth/calendar';
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope,
      access_type: 'offline',
      prompt: 'consent',
      state: userType,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<string> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          redirect_uri: REDIRECT_URI,
          code,
          grant_type: 'authorization_code',
        }).toString(),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  },

  /**
   * Store Google Calendar token for volunteer
   */
  async storeVolunteerToken(volunteerId: string, token: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('volunteers')
        .update({ google_calendar_token: token })
        .eq('id', volunteerId);

      if (error) throw error;
    } catch (error) {
      console.error('Error storing volunteer token:', error);
      throw error;
    }
  },

  /**
   * Store Google Calendar token for facilitator
   */
  async storeFacilitatorToken(facilitatorId: string, token: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('facilitators')
        .update({ google_calendar_token: token })
        .eq('id', facilitatorId);

      if (error) throw error;
    } catch (error) {
      console.error('Error storing facilitator token:', error);
      throw error;
    }
  },

  /**
   * Get Google Calendar token for volunteer
   */
  async getVolunteerToken(volunteerId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('volunteers')
        .select('google_calendar_token')
        .eq('id', volunteerId)
        .single();

      if (error) throw error;
      return data?.google_calendar_token || null;
    } catch (error) {
      console.error('Error getting volunteer token:', error);
      return null;
    }
  },

  /**
   * Get Google Calendar token for facilitator
   */
  async getFacilitatorToken(facilitatorId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('facilitators')
        .select('google_calendar_token')
        .eq('id', facilitatorId)
        .single();

      if (error) throw error;
      return data?.google_calendar_token || null;
    } catch (error) {
      console.error('Error getting facilitator token:', error);
      return null;
    }
  },
};
