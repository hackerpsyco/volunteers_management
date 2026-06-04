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
  session_date: string;
  session_time: string;
  session_type: string;
  status: string;
  content_category: string | null;
  module_name: string | null;
  topics_covered: string | null;
  videos: string | null;
  quiz_content_ppt: string | null;
  facilitator_name: string | null;
  volunteer_name: string | null;
  coordinator_name: string | null;
  meeting_link: string | null;
  centre_id: string | null;
  centre_time_slot_id: string | null;
  class_batch: string | null;
  centre_name?: string | null;
  centre_location?: string | null;
  slot_day?: string | null;
  slot_start_time?: string | null;
  slot_end_time?: string | null;
  recording_url?: string | null;
  recording_status?: string | null;
  recording_duration?: number | null;
  recording_size?: string | null;
  recording_created_at?: string | null;
  google_event_id?: string | null;
  subject_id?: string | null;
  subject_name?: string | null;
  created_at: string;
  updated_at: string;
  facilitator_email?: string | null;
  volunteer_email?: string | null;
  coordinator_email?: string | null;
  centre_email?: string | null;
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
            *,
            coordinators:coordinator_id(name, email),
            centres:centre_id(name, location),
            centre_time_slots:centre_time_slot_id(day, start_time, end_time),
            subjects(name)
          `)
          .eq('class_batch', classData?.name)
          .order('session_date', { ascending: true });

        if (sessionsError) throw sessionsError;

        // Transform data to flatten relationships
        const transformedData = (sessionsData || []).map((session: any) => ({
          ...session,
          facilitator_email: null,
          volunteer_email: null,
          coordinator_name: session.coordinators?.name || null,
          coordinator_email: session.coordinators?.email || null,
          centre_name: session.centres?.name || null,
          centre_location: session.centres?.location || null,
          centre_email: null,
          slot_day: session.centre_time_slots?.day || null,
          slot_start_time: session.centre_time_slots?.start_time || null,
          slot_end_time: session.centre_time_slots?.end_time || null,
          subject_name: session.subjects?.name || null,
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

  const getSessionTypeLabel = (sessionType?: string) => {
    switch (sessionType) {
      case 'guest_teacher': return 'GT';
      case 'guest_speaker': return 'GS';
      case 'local_teacher': return 'LT';
      default: return '';
    }
  };

  const getSessionDisplayTitle = (session: Session) => {
    const typeLabel = getSessionTypeLabel(session.session_type);
    const parts: string[] = [];
    parts.push(`WES ${typeLabel} Session`);
    if (session.class_batch) parts.push(session.class_batch);
    if (session.volunteer_name) {
      parts.push(`by ${session.volunteer_name}`);
    }
    if (session.module_name) parts.push(session.module_name);
    if (session.topics_covered) parts.push(session.topics_covered);
    return parts.join(' - ');
  };

  const getSessionTypeColor = (sessionType?: string) => {
    switch (sessionType) {
      case 'guest_teacher': return 'bg-cyan-50 border-l-2 border-l-cyan-500 text-cyan-900';
      case 'guest_speaker': return 'bg-violet-50 border-l-2 border-l-violet-500 text-violet-900';
      case 'local_teacher': return 'bg-pink-50 border-l-2 border-l-pink-500 text-pink-900';
      default: return 'bg-blue-50 border-l-2 border-l-blue-500 text-blue-900';
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
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSession(session);
                              }}
                              className={`text-xs px-2 py-1 rounded w-full text-left hover:opacity-80 whitespace-normal break-words ${getSessionTypeColor(session.session_type)}`}
                              title={getSessionDisplayTitle(session)}
                            >
                              <div className="text-[11px] line-clamp-2 font-medium">{getSessionDisplayTitle(session)}</div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Topic & Basic Info */}
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
                  {selectedSession.class_batch && (
                    <div>
                      <p className="text-xs text-muted-foreground">Class</p>
                      <p className="font-medium">{selectedSession.class_batch}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Title</p>
                    <p className="font-medium">{getSessionDisplayTitle(selectedSession)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-medium">{new Date(selectedSession.session_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="font-medium">{selectedSession.session_time.split(':').slice(0, 2).join(':')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                      selectedSession.status === 'completed' ? 'bg-green-100 text-green-800' :
                      selectedSession.status === 'available' ? 'bg-blue-100 text-blue-800' :
                      selectedSession.status === 'committed' ? 'bg-purple-100 text-purple-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedSession.status}
                    </span>
                  </div>
                  {selectedSession.session_type && (
                    <div>
                      <p className="text-xs text-muted-foreground">Session Type</p>
                      <p className="font-medium capitalize">
                        {selectedSession.session_type === 'guest_teacher' ? 'Guest Teacher' :
                         selectedSession.session_type === 'guest_speaker' ? 'Guest Speaker' :
                         selectedSession.session_type === 'local_teacher' ? 'Local Teacher' :
                         selectedSession.session_type}
                      </p>
                    </div>
                  )}
                </div>

                {/* Participants & Details */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Participants & Meeting Invites</h4>
                  
                  {selectedSession.facilitator_name && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-xs text-muted-foreground">👤 Facilitator</p>
                      <p className="font-medium text-sm">{selectedSession.facilitator_name}</p>
                      {selectedSession.facilitator_email && (
                        <p className="text-xs text-blue-600 mt-1">📧 {selectedSession.facilitator_email}</p>
                      )}
                    </div>
                  )}
                  
                  {selectedSession.volunteer_name && (
                    <div className="bg-purple-50 border border-purple-200 rounded p-3">
                      <p className="text-xs text-muted-foreground">👥 Volunteer</p>
                      <p className="font-medium text-sm">{selectedSession.volunteer_name}</p>
                      {selectedSession.volunteer_email && (
                        <p className="text-xs text-purple-600 mt-1">📧 {selectedSession.volunteer_email}</p>
                      )}
                    </div>
                  )}
                  
                  {selectedSession.coordinator_name && (
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <p className="text-xs text-muted-foreground">📋 Coordinator</p>
                      <p className="font-medium text-sm">{selectedSession.coordinator_name}</p>
                      {selectedSession.coordinator_email && (
                        <p className="text-xs text-green-600 mt-1">📧 {selectedSession.coordinator_email}</p>
                      )}
                    </div>
                  )}

                  {selectedSession.centre_name && (
                    <div className="bg-orange-50 border border-orange-200 rounded p-3">
                      <p className="text-xs text-muted-foreground">📍 Centre</p>
                      <p className="font-medium text-sm">{selectedSession.centre_name}</p>
                      {selectedSession.centre_location && (
                        <p className="text-xs text-muted-foreground">{selectedSession.centre_location}</p>
                      )}
                      {selectedSession.centre_email && (
                        <p className="text-xs text-orange-600 mt-1">📧 {selectedSession.centre_email}</p>
                      )}
                    </div>
                  )}

                  {selectedSession.slot_start_time && selectedSession.slot_end_time && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded p-3">
                      <p className="text-xs text-muted-foreground">⏰ Time Slot</p>
                      <p className="font-medium text-sm">{selectedSession.slot_start_time.split(':').slice(0, 2).join(':')} - {selectedSession.slot_end_time.split(':').slice(0, 2).join(':')}</p>
                    </div>
                  )}

                  {selectedSession.meeting_link && (
                    <div className="bg-cyan-50 border border-cyan-200 rounded p-3">
                      <p className="text-xs text-muted-foreground">🔗 Meeting Link</p>
                      {(() => {
                        let url = selectedSession.meeting_link;
                        // Fix malformed Google Meet URLs
                        if (url && url.includes('_meet/whoops')) {
                          // Extract meeting code if embedded, or show raw link
                          url = url.replace('/_meet/whoops', '');
                        }
                        // Ensure URL has protocol
                        if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
                          url = `https://${url}`;
                        }
                        return (
                          <>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-600 hover:text-cyan-800 hover:underline text-sm font-medium break-all"
                            >
                              Join Meeting
                            </a>
                            <p className="text-xs text-muted-foreground mt-1 break-all">{url}</p>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
