import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
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
  facilitator_email?: string;
  volunteer_name?: string;
  volunteer_email?: string;
  coordinator_name?: string;
  coordinator_email?: string;
  videos?: string;
  quiz_content_ppt?: string;
  final_content_ppt?: string;
  meeting_link?: string;
  centre_id?: string;
  centre_time_slot_id?: string;
  centre_name?: string;
  centre_location?: string;
  centre_email?: string;
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
  const { user } = useAuth();
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
  const [userRole, setUserRole] = useState<number | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadUserRoleAndClass();
      fetchVolunteers();
      fetchClasses();
      fetchSessions();
    }
  }, [user?.id]);

  const loadUserRoleAndClass = async () => {
    try {
      // Get user role and class info
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('role_id, class_id')
        .eq('id', user?.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading user role:', profileError);
      }

      if (profileData?.role_id) {
        setUserRole(profileData.role_id);

        // If student (role_id = 5) and has class_id, fetch and set their class
        if (profileData.role_id === 5) {
          if (profileData.class_id) {
            const { data: classData } = await supabase
              .from('classes')
              .select('name')
              .eq('id', profileData.class_id)
              .single();
            
            if (classData?.name) {
              setSelectedClass(classData.name);
            }
          } else {
            console.warn('Student has no class_id assigned');
          }
        }
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

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
          coordinators:coordinator_id(name, email),
          centres:centre_id(name, location),
          centre_time_slots:centre_time_slot_id(day, start_time, end_time)
        `)
        .order('session_date', { ascending: true });

      if (error) throw error;
      
      // Transform data and fetch facilitator/volunteer emails
      const transformedData = await Promise.all((data || []).map(async (session: any) => {
        let facilitator_email = null;
        let volunteer_email = null;

        // Fetch facilitator email
        if (session.facilitator_name) {
          try {
            const { data: facData, error: facError } = await supabase
              .from('facilitators')
              .select('email')
              .eq('name', session.facilitator_name)
              .single();
            
            if (!facError && facData) {
              facilitator_email = facData.email || null;
            }
          } catch (err) {
            console.warn(`Could not fetch facilitator email for ${session.facilitator_name}:`, err);
          }
        }

        // Fetch volunteer email (try personal_email first, then work_email)
        if (session.volunteer_name) {
          try {
            const { data: volData, error: volError } = await supabase
              .from('volunteers')
              .select('personal_email, work_email')
              .eq('name', session.volunteer_name)
              .single();
            
            if (!volError && volData) {
              volunteer_email = volData.personal_email || volData.work_email || null;
            }
          } catch (err) {
            console.warn(`Could not fetch volunteer email for ${session.volunteer_name}:`, err);
          }
        }

        return {
          ...session,
          facilitator_email,
          volunteer_email,
          coordinator_name: session.coordinators?.name || null,
          coordinator_email: session.coordinators?.email || null,
          centre_name: session.centres?.name || null,
          centre_location: session.centres?.location || null,
          centre_email: null,
          slot_day: session.centre_time_slots?.day || null,
          slot_start_time: session.centre_time_slots?.start_time || null,
          slot_end_time: session.centre_time_slots?.end_time || null,
        };
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

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to permanently delete this session? This will remove it from Google Calendar and send cancellation emails to all participants.')) {
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

      // Actually delete the session from database
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      toast.success('Session deleted successfully');
      setSelectedSession(null);
      fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
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
          {userRole !== 5 && (
            <Button
              onClick={() => setIsSessionTypeOpen(true)}
              className="w-full sm:w-auto gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Session</span>
              <span className="sm:hidden">Add</span>
            </Button>
          )}
        </div>

        {/* Volunteer and Class Filters - Only show for non-students */}
        {userRole !== 5 && (
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
        )}

        {/* Student Class Display */}
        {userRole === 5 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Your Class:</strong> {selectedClass !== 'all' ? selectedClass : 'Loading...'}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Showing sessions for your class only
            </p>
          </div>
        )}

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
                                {session.session_time.split(':').slice(0, 2).join(':')} - {session.title}
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
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {selectedSession && (
              <div className="border-t border-border pt-4 mt-4 space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                  ℹ️ Calendar invitations have been sent to the volunteer and facilitator. They will receive email notifications from Google Calendar.
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleCancelSession(selectedSession.id)}
                    className="flex-1 min-w-[120px] px-4 py-2 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded hover:bg-yellow-100 transition-colors text-sm font-medium"
                  >
                    Cancel Session
                  </button>
                  <button
                    onClick={() => handleDeleteSession(selectedSession.id)}
                    className="flex-1 min-w-[120px] px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded hover:bg-red-100 transition-colors text-sm font-medium"
                  >
                    Delete Session
                  </button>
                  <button
                    onClick={() => handleModifySession(selectedSession)}
                    className="flex-1 min-w-[120px] px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded hover:bg-blue-100 transition-colors text-sm font-medium"
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
