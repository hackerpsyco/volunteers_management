import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AddSessionDialog } from '@/components/sessions/AddSessionDialog';
import { EditSessionDialog } from '@/components/sessions/EditSessionDialog';
import { SessionTypeDialog } from '@/components/sessions/SessionTypeDialog';

interface Volunteer {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
}

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
  volunteer_name?: string;
  coordinator_name?: string;
  videos?: string;
  quiz_content_ppt?: string;
  final_content_ppt?: string;
  meeting_link?: string;
  centre_id?: string;
  centre_time_slot_id?: string;
  centre_name?: string;
  centre_location?: string;
  slot_day?: string;
  slot_start_time?: string;
  slot_end_time?: string;
  class_batch?: string;
}

interface CalendarDay {
  date: Date;
  sessions: Session[];
  isCurrentMonth: boolean;
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isSessionTypeOpen, setIsSessionTypeOpen] = useState(false);
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  const [isEditSessionOpen, setIsEditSessionOpen] = useState(false);
  const [selectedSessionType, setSelectedSessionType] = useState<'guest_teacher' | 'guest_speaker' | null>(null);
  const [selectedDateForNewSession, setSelectedDateForNewSession] = useState<Date | null>(null);
  const [expandedDateKey, setExpandedDateKey] = useState<string | null>(null);

  useEffect(() => {
    fetchVolunteers();
    fetchClasses();
    fetchSessions();
  }, []);

  useEffect(() => {
    generateCalendar();
  }, [currentDate, sessions, selectedVolunteer, selectedClass]);

  const fetchVolunteers = async () => {
    try {
      const { data, error } = await supabase
        .from('volunteers')
        .select('id, name')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setVolunteers(data || []);
    } catch (error) {
      console.error('Error fetching volunteers:', error);
      toast.error('Failed to load volunteers');
    }
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
    }
  };

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          coordinators:coordinator_id(name),
          centres:centre_id(name, location),
          centre_time_slots:centre_time_slot_id(day, start_time, end_time)
        `)
        .order('session_date', { ascending: true });

      if (error) throw error;
      
      // Transform data to flatten relationships
      const transformedData = (data || []).map((session: any) => ({
        ...session,
        coordinator_name: session.coordinators?.name || null,
        centre_name: session.centres?.name || null,
        centre_location: session.centres?.location || null,
        slot_day: session.centre_time_slots?.day || null,
        slot_start_time: session.centre_time_slots?.start_time || null,
        slot_end_time: session.centre_time_slots?.end_time || null,
      }));
      
      setSessions(transformedData || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
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

    // Filter sessions based on selected volunteer and class
    let filteredSessions = sessions;
    
    if (selectedVolunteer !== 'all') {
      filteredSessions = filteredSessions.filter(s => s.facilitator_name === selectedVolunteer);
    }
    
    if (selectedClass !== 'all') {
      filteredSessions = filteredSessions.filter(s => s.class_batch === selectedClass);
    }

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
      // Format date as YYYY-MM-DD without timezone conversion
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const daySessions = filteredSessions.filter(s => s.session_date === dateStr);
      
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

  const handleCancelSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to cancel this session? The status will be changed to pending.')) {
      return;
    }

    try {
      // Try to remove from Google Calendar first
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        const response = await fetch(`${supabaseUrl}/functions/v1/sync-google-calendar`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
          console.warn('Could not remove from Google Calendar:', await response.text());
        }
      } catch (calendarError) {
        console.warn('Could not remove from Google Calendar:', calendarError);
      }

      // Update status to pending instead of deleting
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'pending' })
        .eq('id', sessionId);

      if (error) throw error;

      toast.success('Session status changed to pending');
      setSelectedSession(null);
      fetchSessions();
    } catch (error) {
      console.error('Error cancelling session:', error);
      toast.error('Failed to cancel session');
    }
  };

  const handleModifySession = (session: Session) => {
    // Open the edit dialog
    setSelectedSession(session);
    setIsEditSessionOpen(true);
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

  const handleDateClick = (date: Date) => {
    setSelectedDateForNewSession(date);
    setIsAddSessionOpen(true);
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Session Calendar</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">Plan and track session progress</p>
          </div>
          <Button
            onClick={() => setIsSessionTypeOpen(true)}
            className="w-full sm:w-auto gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Session</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* Volunteer and Class Filters */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Volunteer Filter */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Filter by Volunteer
              </label>
              <Select value={selectedVolunteer} onValueChange={setSelectedVolunteer}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a Volunteer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Volunteers</SelectItem>
                  {volunteers.map((volunteer) => (
                    <SelectItem key={volunteer.id} value={volunteer.name}>
                      {volunteer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Class Filter */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Filter by Class
              </label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.name}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
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
                    onClick={() => day.isCurrentMonth && handleDateClick(day.date)}
                    className={`min-h-24 p-2 border rounded-lg cursor-pointer transition-colors ${
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
                        // Format date as YYYY-MM-DD without timezone conversion
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
                                className={`text-xs px-2 py-1 rounded truncate w-full text-left hover:opacity-80 ${getStatusColor(session.status)}`}
                                title={session.title}
                              >
                                {session.session_time} - {session.title}
                              </button>
                            ))}
                            {day.sessions.length > 2 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedDateKey(isExpanded ? null : dateKey);
                                }}
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
                    <p className="font-medium">{selectedSession.title}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-medium">{new Date(selectedSession.session_date).toLocaleDateString()}</p>
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
                  {selectedSession.facilitator_name && (
                    <div>
                      <p className="text-xs text-muted-foreground">Facilitator</p>
                      <p className="font-medium">{selectedSession.facilitator_name}</p>
                    </div>
                  )}
                  {selectedSession.volunteer_name && (
                    <div>
                      <p className="text-xs text-muted-foreground">Volunteer</p>
                      <p className="font-medium">{selectedSession.volunteer_name}</p>
                    </div>
                  )}
                  {selectedSession.coordinator_name && (
                    <div>
                      <p className="text-xs text-muted-foreground">Coordinator</p>
                      <p className="font-medium">{selectedSession.coordinator_name}</p>
                    </div>
                  )}
                  {selectedSession.centre_name && (
                    <div>
                      <p className="text-xs text-muted-foreground">Centre</p>
                      <p className="font-medium">{selectedSession.centre_name}</p>
                    </div>
                  )}
                  {selectedSession.slot_start_time && selectedSession.slot_end_time && (
                    <div>
                      <p className="text-xs text-muted-foreground">Time Slot</p>
                      <p className="font-medium">{selectedSession.slot_start_time} - {selectedSession.slot_end_time}</p>
                    </div>
                  )}
                </div>

                {/* Resources */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Resources & Meeting</h4>
                  
                  {selectedSession.meeting_link ? (
                    <div>
                      <p className="text-xs text-muted-foreground">🎥 Google Meet Link</p>
                      <a
                        href={selectedSession.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm break-all font-medium"
                      >
                        Join Meeting
                      </a>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">🎥 Google Meet Link - Not available</div>
                  )}

                  {selectedSession.videos ? (
                    <div>
                      <p className="text-xs text-muted-foreground">📹 Videos</p>
                      <a
                        href={selectedSession.videos}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm break-all"
                      >
                        {selectedSession.videos.substring(0, 50)}...
                      </a>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">📹 Videos - Not available</div>
                  )}

                  {selectedSession.quiz_content_ppt ? (
                    <div>
                      <p className="text-xs text-muted-foreground">📊 Quiz/Content PPT</p>
                      <a
                        href={selectedSession.quiz_content_ppt}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm break-all"
                      >
                        {selectedSession.quiz_content_ppt.substring(0, 50)}...
                      </a>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">📊 Quiz/Content PPT - Not available</div>
                  )}

                  {selectedSession.final_content_ppt ? (
                    <div>
                      <p className="text-xs text-muted-foreground">📄 Final Content PPT</p>
                      <a
                        href={selectedSession.final_content_ppt}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm break-all"
                      >
                        {selectedSession.final_content_ppt.substring(0, 50)}...
                      </a>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">📄 Final Content PPT - Not available</div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {selectedSession && (
              <div className="border-t border-border pt-4 mt-4 space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                  ℹ️ Calendar invitations have been sent to the volunteer and facilitator. They will receive email notifications from Google Calendar.
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCancelSession(selectedSession.id)}
                    className="flex-1 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded hover:bg-red-100 transition-colors text-sm font-medium"
                  >
                    Cancel Session
                  </button>
                  <button
                    onClick={() => handleModifySession(selectedSession)}
                    className="flex-1 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    Modify Session
                  </button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Session Dialog */}
        <AddSessionDialog
          open={isAddSessionOpen}
          onOpenChange={setIsAddSessionOpen}
          selectedDate={selectedDateForNewSession}
          sessionType={selectedSessionType || 'guest_teacher'}
          onSuccess={() => {
            fetchSessions();
            setSelectedDateForNewSession(null);
          }}
        />

        {/* Edit Session Dialog */}
        <EditSessionDialog
          open={isEditSessionOpen}
          onOpenChange={setIsEditSessionOpen}
          session={selectedSession}
          onSuccess={() => {
            fetchSessions();
            setSelectedSession(null);
          }}
        />

        {/* Session Type Dialog */}
        <SessionTypeDialog
          open={isSessionTypeOpen}
          onOpenChange={setIsSessionTypeOpen}
          onSelectType={(type) => {
            setSelectedSessionType(type);
            setIsSessionTypeOpen(false);
            setIsAddSessionOpen(true);
          }}
        />
      </div>
    </DashboardLayout>
  );
}
