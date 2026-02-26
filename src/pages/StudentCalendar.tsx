import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Session {
  id: string;
  title: string;
  content_category?: string;
  module_name?: string;
  topics_covered?: string;
  status: string;
  session_date: string;
  session_time: string;
  facilitator_name?: string;
  meeting_link?: string;
  class_batch?: string;
}

interface CalendarDay {
  date: Date;
  sessions: Session[];
  isCurrentMonth: boolean;
}

export default function StudentCalendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [expandedDateKey, setExpandedDateKey] = useState<string | null>(null);
  const [studentClass, setStudentClass] = useState<string>('');

  useEffect(() => {
    if (user?.id) {
      loadStudentClassAndSessions();
    }
  }, [user?.id]);

  useEffect(() => {
    generateCalendar();
  }, [currentDate, sessions]);

  const loadStudentClassAndSessions = async () => {
    try {
      setLoading(true);

      // Get student's class from user_profiles
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('class_id')
        .eq('id', user?.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading student class:', profileError);
      }

      if (profileData?.class_id) {
        // Get class name
        const { data: classData } = await supabase
          .from('classes')
          .select('name')
          .eq('id', profileData.class_id)
          .single();

        if (classData?.name) {
          setStudentClass(classData.name);
        }

        // Fetch sessions for this class only
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select(`
            id,
            title,
            content_category,
            module_name,
            topics_covered,
            status,
            session_date,
            session_time,
            facilitator_name,
            meeting_link,
            class_batch,
            coordinator_id,
            centre_id,
            centre_time_slot_id,
            coordinators:coordinator_id(name),
            centres:centre_id(name, location),
            centre_time_slots:centre_time_slot_id(day, start_time, end_time)
          `)
          .eq('class_batch', classData?.name)
          .order('session_date', { ascending: true });

        if (sessionsError) throw sessionsError;

        // Transform data to flatten relationships
        const transformedData = (sessionsData || []).map((session: any) => ({
          ...session,
          coordinator_name: session.coordinators?.name || null,
          centre_name: session.centres?.name || null,
          centre_location: session.centres?.location || null,
          slot_day: session.centre_time_slots?.day || null,
          slot_start_time: session.centre_time_slots?.start_time || null,
          slot_end_time: session.centre_time_slots?.end_time || null,
        }));

        setSessions(transformedData || []);
      }
    } catch (error) {
      console.error('Error loading student calendar:', error);
      toast.error('Failed to load your calendar');
    } finally {
      setLoading(false);
    }
  };

  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: CalendarDay[] = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        sessions: [],
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const daySessions = sessions.filter(s => s.session_date === dateStr);

      days.push({
        date,
        sessions: daySessions,
        isCurrentMonth: true,
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        sessions: [],
        isCurrentMonth: false,
      });
    }

    setCalendarDays(days);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'available':
        return 'bg-blue-100 text-blue-800';
      case 'committed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Class Calendar</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            {studentClass ? `Class: ${studentClass}` : 'Loading your class...'}
          </p>
        </div>

        {/* Calendar */}
        <div className="bg-card border border-border rounded-lg p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">{monthName}</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, idx) => {
              const todayFlag = isToday(day.date);
              return (
                <div
                  key={idx}
                  className={`min-h-24 p-2 border rounded-lg transition-colors ${
                    todayFlag
                      ? 'bg-primary/10 border-primary border-2 hover:bg-primary/20'
                      : day.isCurrentMonth
                      ? 'bg-background border-border hover:bg-accent hover:border-primary'
                      : 'bg-muted border-muted-foreground/20'
                  }`}
                >
                  <div className={`text-sm font-semibold mb-1 ${
                    todayFlag
                      ? 'text-primary'
                      : day.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {day.date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {(() => {
                      const year = day.date.getFullYear();
                      const month = day.date.getMonth();
                      const date = day.date.getDate();
                      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
                      const isExpanded = expandedDateKey === dateKey;
                      const sessionsToShow = isExpanded ? day.sessions : day.sessions.slice(0, 2);

                      return (
                        <>
                          {sessionsToShow.map((session, i) => (
                            <button
                              key={i}
                              onClick={() => setSelectedSession(session)}
                              className={`text-xs px-2 py-1 rounded truncate w-full text-left hover:opacity-80 ${getStatusColor(session.status)}`}
                              title={session.title}
                            >
                              {session.session_time} - {session.title}
                            </button>
                          ))}
                          {day.sessions.length > 2 && (
                            <button
                              onClick={() => setExpandedDateKey(isExpanded ? null : dateKey)}
                              className="text-xs text-primary hover:text-primary/80 px-2 font-medium cursor-pointer transition-colors"
                            >
                              {isExpanded ? '−' : '+'}{day.sessions.length - 2} more
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Session Details Modal */}
        <Dialog open={!!selectedSession} onOpenChange={(open) => !open && setSelectedSession(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Session Details</DialogTitle>
              <DialogClose />
            </DialogHeader>

            {selectedSession && (
              <div className="space-y-6">
                <div className="space-y-3">
                  {selectedSession.content_category && (
                    <div>
                      <p className="text-xs text-muted-foreground">Category</p>
                      <p className="font-medium">{selectedSession.content_category}</p>
                    </div>
                  )}
                  {selectedSession.module_name && (
                    <div>
                      <p className="text-xs text-muted-foreground">Module</p>
                      <p className="font-medium">{selectedSession.module_name}</p>
                    </div>
                  )}
                  {selectedSession.topics_covered && (
                    <div>
                      <p className="text-xs text-muted-foreground">Topic</p>
                      <p className="font-medium">{selectedSession.topics_covered}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Title</p>
                    <p className="font-medium">{selectedSession.title}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date & Time</p>
                    <p className="font-medium">
                      {new Date(selectedSession.session_date).toLocaleDateString()} at {selectedSession.session_time}
                    </p>
                  </div>
                  {selectedSession.facilitator_name && (
                    <div>
                      <p className="text-xs text-muted-foreground">Facilitator</p>
                      <p className="font-medium">{selectedSession.facilitator_name}</p>
                    </div>
                  )}
                </div>

                {/* Meeting Link */}
                {selectedSession.meeting_link ? (
                  <div className="border-t border-border pt-4">
                    <h4 className="font-semibold text-sm mb-3">Join Session</h4>
                    <a
                      href={selectedSession.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        if (!selectedSession.meeting_link || selectedSession.meeting_link.trim() === '') {
                          e.preventDefault();
                          toast.error('Meeting link is not available');
                        }
                      }}
                      className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                    >
                      Join Google Meet
                    </a>
                  </div>
                ) : (
                  <div className="border-t border-border pt-4">
                    <h4 className="font-semibold text-sm mb-3">Join Session</h4>
                    <p className="text-sm text-muted-foreground">Meeting link will be available soon</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
