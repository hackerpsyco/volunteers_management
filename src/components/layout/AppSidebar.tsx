import { Home, UserPlus, Users, LogOut, CalendarDays } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import wesLogo from '@/assets/wes-logo.jpg';

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Home },
  { title: 'Calendar', url: '/calendar', icon: CalendarDays },
  { title: 'Add Volunteer', url: '/volunteers/add', icon: UserPlus },
  { title: 'Volunteer List', url: '/volunteers', icon: Users },
];

export function AppSidebar() {
  const { signOut } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <img 
            src={wesLogo} 
            alt="WES Foundation Logo" 
            className="h-12 w-12 object-contain"
          />
          <div>
            <h1 className="font-bold text-foreground text-lg">WES Foundation</h1>
            <p className="text-xs text-muted-foreground">Volunteer Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <NavLink
              key={item.title}
              to={item.url}
              className={cn(
                'sidebar-link',
                isActive && 'sidebar-link-active'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.title}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Sign Out Button */}
      <div className="p-4 border-t border-border">
        <button
          onClick={handleSignOut}
          className="sidebar-link w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
