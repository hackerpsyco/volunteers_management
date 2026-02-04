import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from './AppSidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userEmail, setUserEmail] = useState<string>('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setUserEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      loadProfileImage();
    }
  }, [user?.id]);

  const loadProfileImage = async () => {
    try {
      setLoadingProfile(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('profile_image_url')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile image:', error);
      }

      if (data?.profile_image_url) {
        setProfileImage(data.profile_image_url);
      }
    } catch (error) {
      console.error('Error loading profile image:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    // Only redirect if we've finished loading and there's no user
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const handleEditProfile = () => {
    navigate('/profile/edit');
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not loading and no user, don't render anything (redirect will happen)
  if (!user) {
    return null;
  }

  // User is authenticated, render the dashboard
  return (
    <div className="min-h-screen bg-muted/30 flex w-full">
      <AppSidebar />
      <main className="flex-1 flex flex-col">
        {/* Top Header with Profile */}
        <div className="bg-card border-b border-border px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex-1" />
          
          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-10 w-10 bg-primary/10 hover:bg-primary/20 p-0 overflow-hidden"
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-primary" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* User Info */}
              <div className="px-2 py-1.5">
                <p className="text-sm font-semibold text-foreground">Logged In</p>
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              </div>
              
              <DropdownMenuSeparator />
              
              {/* Edit Profile Option */}
              <DropdownMenuItem onClick={handleEditProfile} className="cursor-pointer">
                <Edit className="h-4 w-4 mr-2" />
                <span>Edit Profile</span>
              </DropdownMenuItem>
              
              {/* Settings Option */}
              <DropdownMenuItem onClick={handleSettings} className="cursor-pointer">
                <Settings className="h-4 w-4 mr-2" />
                <span>Settings</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Sign Out Option */}
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-8 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
