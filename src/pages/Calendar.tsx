import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { AddSessionDialog } from '@/components/sessions/AddSessionDialog';

interface Session {
  id: string;
  title: string;
  session_date: string;
  session_time: string;
  session_type: string;
  status: string;
  volunteer_id: string | null;
}

export default function Calendar() {
  const [searchParams] = useSearchParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { user } = useAuth();

  // Check if we should open add dialog from sidebar
  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setSelectedDate(new Date());
      setIsDialogOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchSessions();
  }, [currentDate]);

  async function fetchSessions() {
    setLoading(true);
    const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .gte('session_date', startDate)
      .lte('session_date', endDate)
      .order('session_date', { ascending: true });

    if (error) {
      console.error('Error fetching sessions:', error);
    } else {
      setSessions(data || []);
    }
    setLoading(false);
  }

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setIsDialogOpen(true);
  };

  const getSessionsForDay = (day: Date) => {
    return sessions.filter((session) => isSameDay(new Date(session.session_date), day));
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'special_virtual':
        return 'bg-purple-500';
      case 'gts_english':
      case 'guest_teacher':
        return 'bg-green-500';
      case 'guest_speaker':
        return 'bg-amber-500';
      default:
        return 'bg-primary';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
            <p className="text-muted-foreground">
              Logged in as: <span className="font-medium text-primary">{user?.email}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold min-w-[180px] text-center">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          {/* Week days header */}
          <div className="grid grid-cols-7 bg-muted/50">
            {weekDays.map((day) => (
              <div
                key={day}
                className="py-3 text-center text-sm font-semibold text-muted-foreground border-b border-border"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const daySessions = getSessionsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={index}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    'min-h-[120px] p-2 border-b border-r border-border cursor-pointer transition-colors hover:bg-accent/50',
                    !isCurrentMonth && 'bg-muted/30 text-muted-foreground',
                    index % 7 === 6 && 'border-r-0'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        'text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full',
                        isToday && 'bg-primary text-primary-foreground'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    {isCurrentMonth && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDayClick(day);
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {daySessions.slice(0, 3).map((session) => (
                      <div
                        key={session.id}
                        className={cn(
                          'text-xs px-2 py-1 rounded text-white truncate',
                          getSessionTypeColor(session.session_type)
                        )}
                        title={`${session.title} - ${session.session_time}`}
                      >
                        <span className="font-medium">{session.session_time}</span> {session.title}
                      </div>
                    ))}
                    {daySessions.length > 3 && (
                      <div className="text-xs text-muted-foreground px-2">
                        +{daySessions.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary"></div>
            <span className="text-muted-foreground">Regular Session</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-500"></div>
            <span className="text-muted-foreground">Special Virtual Class</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-muted-foreground">Guest Teacher</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-500"></div>
            <span className="text-muted-foreground">Guest Speaker</span>
          </div>
        </div>
      </div>

      {/* Add Session Dialog */}
      <AddSessionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedDate={selectedDate}
        onSuccess={fetchSessions}
      />
    </DashboardLayout>
  );
}
