import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

interface Volunteer {
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
  const [selectedVolunteer, setSelectedVolunteer] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  useEffect(() => {
    fetchVolunteers();
    fetchSessions();
  }, []);

  useEffect(() => {
    generateCalendar();
  }, [currentDate, sessions, selectedVolunteer]);

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

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          coordinators:coordinator_id(name)
        `)
        .order('session_date', { ascending: true });

      if (error) throw error;
      
      // Transform data to flatten coordinator name
      const transformedData = (data || []).map((session: any) => ({
        ...session,
        coordinator_name: session.coordinators?.name || null,
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

    // Filter sessions based on selected volunteer
    const filteredSessions = selectedVolunteer === 'all' 
      ? sessions 
      : sessions.filter(s => s.facilitator_name === selectedVolunteer);

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
      const dateStr = date.toISOString().split('T')[0];
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
          <h1 className="text-3xl font-bold text-foreground">Session Calendar</h1>
          <p className="text-muted-foreground mt-1">Plan and track session progress</p>
        </div>

        {/* Volunteer Filter */}
        <div className="bg-card border border-border rounded-lg p-4">
          <label className="text-sm font-medium text-foreground block mb-2">
            Filter by Volunters
          </label>
          <Select value={selectedVolunteer} onValueChange={setSelectedVolunteer}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Select a Volunters" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Volunters</SelectItem>
              {volunteers.map((volunteer) => (
                <SelectItem key={volunteer.id} value={volunteer.name}>
                  {volunteer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              {calendarDays.map((day, idx) => (
                <div
                  key={idx}
                  className={`min-h-24 p-2 border rounded-lg ${
                    day.isCurrentMonth
                      ? 'bg-background border-border'
                      : 'bg-muted border-muted-foreground/20'
                  }`}
                >
                  <div className={`text-sm font-semibold mb-1 ${
                    day.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {day.date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {day.sessions.slice(0, 2).map((session, i) => (
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
                      <div className="text-xs text-muted-foreground px-2">
                        +{day.sessions.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              ))}
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
                    <p className="font-medium">{selectedSession.session_time}</p>
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
              <div className="border-t border-border pt-4 mt-4 space-y-2">
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                  ℹ️ Calendar invitations have been sent to the volunteer and facilitator. They will receive email notifications from Google Calendar.
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
