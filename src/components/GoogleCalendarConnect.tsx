import { Button } from '@/components/ui/button';
import { googleOAuthService } from '@/utils/googleOAuth';
import { Calendar } from 'lucide-react';

interface GoogleCalendarConnectProps {
  userType: 'volunteer' | 'facilitator';
  isConnected?: boolean;
}

export function GoogleCalendarConnect({ userType, isConnected }: GoogleCalendarConnectProps) {
  const handleConnect = () => {
    const authUrl = googleOAuthService.getAuthUrl(userType);
    window.location.href = authUrl;
  };

  return (
    <Button
      onClick={handleConnect}
      variant={isConnected ? 'outline' : 'default'}
      className="gap-2"
    >
      <Calendar className="h-4 w-4" />
      {isConnected ? 'Google Calendar Connected' : 'Connect Google Calendar'}
    </Button>
  );
}
