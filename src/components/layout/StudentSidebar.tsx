import { Home, LogOut, CalendarDays } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import wesLogo from '@/assets/wes-logo.jpg';
import { useState } from 'react';

const studentNavItems = [
  { title: 'My Dashboard', url: '/student-dashboard', icon: Home },
  { title: 'My Calendar', url: '/student-calendar', icon: CalendarDays },

];

export function StudentSidebar() {
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
        {isOpen ? (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
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
              <p className="text-xs text-muted-foreground truncate">Student Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 md:p-4 space-y-1 md:space-y-2">
          {studentNavItems.map((item) => {
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
