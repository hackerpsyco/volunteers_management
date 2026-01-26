import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Topic {
  id: string;
  topic_code: string;
  title: string;
  module_title: string;
  content_category: string;
}

interface Session {
  id: string;
  topic_id: string;
  status: string;
  session_date: string;
  session_time: string;
  mentor_name: string;
  video_english?: string;
  video_hindi?: string;
  worksheet_english?: string;
  worksheet_hindi?: string;
  practical_activity_english?: string;
  practical_activity_hindi?: string;
  quiz_content_ppt?: string;
  final_content_ppt?: string;
}

interface CalendarDay {
  date: Date;
  sessions: Session[];
  isCurrentMonth: boolean;
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [topics, setTopics] = useState<Topic[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('09:00');
  const [loading, setLoading] = useState(true);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  useEffect(() => {
    fetchTopics();
    fetchSessions();
  }, []);

  useEffect(() => {
    generateCalendar();
  }, [currentDate, sessions]);

  const fetchTopics = async () => {
    try {
      // Fetch topics with their module and category info
      const { data: topicsData, error: topicsError } = await (supabase
        .from('topics' as any)
        .select(`
          id,
          topic_code,
          title,
          module_id,
          modules(
            module_code,
            title,
            category_id,
            content_categories(name)
          )
        `)
        .order('topic_code') as any);

      if (topicsError) throw topicsError;

      // Transform the data
      const transformedTopics = (topicsData || []).map((t: any) => ({
        id: t.id,
        topic_code: t.topic_code,
        title: t.title,
        module_title: t.modules?.title || '',
        content_category: t.modules?.content_categories?.name || '',
      }));

      setTopics(transformedTopics);
    } catch (error) {
      console.error('Error fetching topics:', error);
      toast.error('Failed to load topics');
    }
  };

  const fetchSessions = async () => {
    try {
      const { data, error } = await (supabase
        .from('topic_sessions' as any)
        .select(`
          id,
          topic_id,
          status,
          session_date,
          session_time,
          mentor_name,
          video_english,
          video_hindi,
          worksheet_english,
          worksheet_hindi,
          practical_activity_english,
          practical_activity_hindi,
          quiz_content_ppt,
          final_content_ppt
        `)
        .order('session_date', { ascending: true }) as any);

      if (error) throw error;
      setSessions(data || []);
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

  const handleAddSession = async () => {
    if (!selectedTopic || !selectedDate) {
      toast.error('Please select topic and date');
      return;
    }

    try {
      const { error } = await (supabase
        .from('topic_sessions' as any)
        .insert({
          topic_id: selectedTopic,
          status: selectedStatus,
          session_date: selectedDate,
          session_time: selectedTime,
        }) as any);

      if (error) throw error;
      
      toast.success('Session added successfully');
      setSelectedTopic('');
      setSelectedDate('');
      setSelectedStatus('pending');
      setSelectedTime('09:00');
      fetchSessions();
    } catch (error) {
      console.error('Error adding session:', error);
      toast.error('Failed to add session');
    }
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3 bg-card border border-border rounded-lg p-6">
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
                      >
                        {session.session_time}
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

          {/* Add Session Panel */}
          <div className="bg-card border border-border rounded-lg p-6 h-fit">
            <h3 className="text-lg font-semibold mb-4">Add Session</h3>
            
            <div className="space-y-4">
              {/* Topic Selection */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Select Topic
                </label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                >
                  <option value="">Choose topic...</option>
                  {topics.map(topic => (
                    <option key={topic.id} value={topic.id}>
                      {topic.topic_code} - {topic.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Selection */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="available">Available</option>
                  <option value="completed">Completed</option>
                  <option value="committed">Committed</option>
                </select>
              </div>

              {/* Date Selection */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                />
              </div>

              {/* Time Selection */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                />
              </div>

              {/* Add Button */}
              <Button
                onClick={handleAddSession}
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Session
              </Button>
            </div>

            {/* Status Legend */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm font-medium text-foreground mb-3">Status Legend</p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-yellow-100"></div>
                  <span>Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-100"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-100"></div>
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-purple-100"></div>
                  <span>Committed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Session Details Panel */}
        {selectedSession && (
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Session Details</h3>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-3">
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
                {selectedSession.mentor_name && (
                  <div>
                    <p className="text-xs text-muted-foreground">Mentor</p>
                    <p className="font-medium">{selectedSession.mentor_name}</p>
                  </div>
                )}
              </div>

              {/* Resources */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Resources</h4>
                
                {selectedSession.video_english && (
                  <div>
                    <p className="text-xs text-muted-foreground">🎥 Video (English)</p>
                    <a
                      href={selectedSession.video_english}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm break-all"
                    >
                      {selectedSession.video_english.substring(0, 50)}...
                    </a>
                  </div>
                )}

                {selectedSession.video_hindi && (
                  <div>
                    <p className="text-xs text-muted-foreground">🎥 Video (Hindi)</p>
                    <a
                      href={selectedSession.video_hindi}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm break-all"
                    >
                      {selectedSession.video_hindi.substring(0, 50)}...
                    </a>
                  </div>
                )}

                {selectedSession.worksheet_english && (
                  <div>
                    <p className="text-xs text-muted-foreground">📄 Worksheet (English)</p>
                    <a
                      href={selectedSession.worksheet_english}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm break-all"
                    >
                      {selectedSession.worksheet_english.substring(0, 50)}...
                    </a>
                  </div>
                )}

                {selectedSession.worksheet_hindi && (
                  <div>
                    <p className="text-xs text-muted-foreground">📄 Worksheet (Hindi)</p>
                    <a
                      href={selectedSession.worksheet_hindi}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm break-all"
                    >
                      {selectedSession.worksheet_hindi.substring(0, 50)}...
                    </a>
                  </div>
                )}

                {selectedSession.practical_activity_english && (
                  <div>
                    <p className="text-xs text-muted-foreground">🛠️ Practical Activity (English)</p>
                    <a
                      href={selectedSession.practical_activity_english}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm break-all"
                    >
                      {selectedSession.practical_activity_english.substring(0, 50)}...
                    </a>
                  </div>
                )}

                {selectedSession.practical_activity_hindi && (
                  <div>
                    <p className="text-xs text-muted-foreground">🛠️ Practical Activity (Hindi)</p>
                    <a
                      href={selectedSession.practical_activity_hindi}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm break-all"
                    >
                      {selectedSession.practical_activity_hindi.substring(0, 50)}...
                    </a>
                  </div>
                )}

                {selectedSession.quiz_content_ppt && (
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
                )}

                {selectedSession.final_content_ppt && (
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
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
