import { Home, Users, LogOut, CalendarDays, BookOpen, Menu, X, Users2, MapPin, FileText } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import wesLogo from '@/assets/wes-logo.jpg';
import { useState } from 'react';

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Home },
  { title: 'Calendar', url: '/calendar', icon: CalendarDays },
  { title: 'Session', url: '/sessions', icon: BookOpen },
  { title: 'Feedback & Record', url: '/feedback', icon: FileText },
  { title: 'Curriculum', url: '/curriculum', icon: BookOpen },
  { title: 'Facilitator', url: '/facilitators', icon: Users2 },
  { title: 'Coordinators', url: '/coordinators', icon: Users2 },
  { title: 'Centres & Slots', url: '/centres', icon: MapPin },
  { title: 'Volunteer', url: '/volunteers', icon: Users },
];

export function AppSidebar() {
  const { signOut } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

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
