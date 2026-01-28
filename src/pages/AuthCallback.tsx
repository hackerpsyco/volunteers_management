import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { googleOAuthService } from '@/utils/googleOAuth';
import { toast } from 'sonner';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (!code) {
          throw new Error('No authorization code received');
        }

        // Exchange code for token
        const token = await googleOAuthService.exchangeCodeForToken(code);

        if (!user) {
          throw new Error('User not authenticated');
        }

        // Store token based on user type
        if (state === 'volunteer') {
          await googleOAuthService.storeVolunteerToken(user.id, token);
          toast.success('Google Calendar connected for volunteer');
        } else if (state === 'facilitator') {
          await googleOAuthService.storeFacilitatorToken(user.id, token);
          toast.success('Google Calendar connected for facilitator');
        }

        // Redirect back to previous page or dashboard
        navigate('/');
      } catch (error) {
        console.error('OAuth callback error:', error);
        toast.error('Failed to connect Google Calendar');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, user, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Connecting Google Calendar...</p>
          </>
        ) : (
          <p className="text-muted-foreground">Redirecting...</p>
        )}
      </div>
    </div>
  );
}
