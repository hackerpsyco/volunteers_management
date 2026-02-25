import { Home, Users, LogOut, CalendarDays, BookOpen, Menu, X, Users2, MapPin, FileText, GraduationCap, Shield } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import wesLogo from '@/assets/wes-logo.jpg';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const navItems = [
  { title: 'Student Dashboard', url: '/student-dashboard', icon: Home, requiredRole: null, studentVisible: true },
  { title: 'Dashboard', url: '/dashboard', icon: Home, requiredRole: null, studentVisible: false },
  { title: 'Calendar', url: '/calendar', icon: CalendarDays, requiredRole: null, studentVisible: false },
  { title: 'Session', url: '/sessions', icon: BookOpen, requiredRole: null, studentVisible: false },
  { title: 'Feedback & Record', url: '/feedback', icon: FileText, requiredRole: null, studentVisible: false },
  { title: 'Curriculum', url: '/curriculum', icon: BookOpen, requiredRole: null, studentVisible: false },
  { title: 'Facilitator', url: '/facilitators', icon: Users2, requiredRole: null, studentVisible: false },
  { title: 'Coordinators', url: '/coordinators', icon: Users2, requiredRole: null, studentVisible: false },
  { title: 'Centres & Slots', url: '/centres', icon: MapPin, requiredRole: null, studentVisible: false },
  { title: 'Classes & students', url: '/classes', icon: GraduationCap, requiredRole: null, studentVisible: false },
  { title: 'Volunteer', url: '/volunteers', icon: Users, requiredRole: null, studentVisible: false },
  { title: 'Admin Panel', url: '/admin', icon: Shield, requiredRole: 1, studentVisible: false }, // 1 = Admin
];

export function AppSidebar() {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState<number | null>(null);
  const roleLoadedRef = useRef(false);

  useEffect(() => {
    // Only load role once per user session
    if (user?.id && !roleLoadedRef.current) {
      loadUserRole();
    }
  }, [user?.id]);

  const loadUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role_id')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user role:', error);
      }

      if (data?.role_id) {
        setUserRole(data.role_id);
        roleLoadedRef.current = true;
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border hover:bg-accent"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:static w-64 min-h-screen bg-card border-r border-border flex flex-col transition-transform duration-300 z-40",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Logo Section */}
        <div className="p-4 md:p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <img 
              src={wesLogo} 
              alt="WES Foundation Logo" 
              className="h-10 md:h-12 w-10 md:w-12 object-contain"
            />
            <div className="min-w-0">
              <h1 className="font-bold text-foreground text-base md:text-lg truncate">WES Foundation</h1>
              <p className="text-xs text-muted-foreground truncate">Volunteer Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 md:p-4 space-y-1 md:space-y-2">
          {navItems.map((item) => {
            // For students (role_id = 5), only show items marked as studentVisible
            if (userRole === 5) {
              if (!item.studentVisible) {
                return null;
              }
            } else {
              // For non-students (admin, facilitator, etc.), only show items marked as NOT studentVisible
              if (item.studentVisible) {
                return null;
              }
            }

            // Check if user has required role for this item
            if (item.requiredRole !== null && userRole !== item.requiredRole) {
              return null; // Don't show this item
            }

            const isActive = location.pathname === item.url;
            return (
              <NavLink
                key={item.title}
                to={item.url}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-colors',
                  'text-sm md:text-base font-medium',
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.title}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sign Out Button */}
        <div className="p-3 md:p-4 border-t border-border">
          <button
            onClick={handleSignOut}
            className={cn(
              'flex items-center gap-3 w-full px-3 md:px-4 py-2 md:py-3 rounded-lg transition-colors',
              'text-sm md:text-base font-medium',
              'text-destructive hover:bg-destructive/10'
            )}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
