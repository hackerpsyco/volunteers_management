import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AddSessionDialog } from '@/components/sessions/AddSessionDialog';

interface Session {
  id: string;
  title: string;
  session_date: string;
  session_time: string;
  session_type: string;
  status: string;
  guest_speaker?: string;
  teacher?: string;
  content_category?: string;
  s_no?: number;
  modules?: string;
  topics_covered?: string;
  videos?: string;
  quiz_content_ppt?: string;
  final_content_ppt?: string;
  session_status?: string;
  created_at: string;
}

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('session_date', { ascending: true });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Session deleted successfully');
      fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  };

  const handleAddSession = () => {
    setSelectedDate(new Date());
    setIsDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Sessions</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Manage volunteer sessions and events
            </p>
          </div>
          <Button
            onClick={handleAddSession}
            className="gap-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Session</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* Sessions List */}
        <div className="space-y-3 md:space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <p className="text-sm md:text-base text-muted-foreground">No sessions yet. Create one to get started!</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="bg-card border border-border rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-semibold text-foreground break-words">{session.title}</h3>
                    
                    {/* Basic Info */}
                    <div className="flex flex-wrap gap-2 md:gap-4 mt-3 text-xs md:text-sm text-muted-foreground">
                      <span className="whitespace-nowrap">📅 {new Date(session.session_date).toLocaleDateString()}</span>
                      <span className="whitespace-nowrap">🕐 {session.session_time}</span>
                      <span className="capitalize whitespace-nowrap">📌 {session.session_type.replace('_', ' ')}</span>
                      {session.status && <span className="capitalize whitespace-nowrap">✓ {session.status}</span>}
                    </div>

                    {/* Guest Speaker / Teacher */}
                    {(session.guest_speaker || session.teacher) && (
                      <div className="flex flex-wrap gap-2 mt-3 text-xs md:text-sm">
                        {session.guest_speaker && (
                          <span className="bg-purple-100 text-purple-800 px-2 md:px-3 py-1 rounded-full whitespace-nowrap">
                            🎤 Guest: {session.guest_speaker}
                          </span>
                        )}
                        {session.teacher && (
                          <span className="bg-green-100 text-green-800 px-2 md:px-3 py-1 rounded-full whitespace-nowrap">
                            👨‍🏫 Teacher: {session.teacher}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Content Details */}
                    {session.content_category && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4 text-xs md:text-sm">
                        <div className="min-w-0">
                          <span className="text-muted-foreground">Category: </span>
                          <span className="font-medium break-words">{session.content_category}</span>
                        </div>
                        {session.s_no && (
                          <div>
                            <span className="text-muted-foreground">S.No: </span>
                            <span className="font-medium">{session.s_no}</span>
                          </div>
                        )}
                        {session.modules && (
                          <div className="min-w-0">
                            <span className="text-muted-foreground">Modules: </span>
                            <span className="font-medium break-words">{session.modules}</span>
                          </div>
                        )}
                        {session.session_status && (
                          <div>
                            <span className="text-muted-foreground">Session Status: </span>
                            <span className="font-medium capitalize">{session.session_status}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Topics */}
                    {session.topics_covered && (
                      <div className="mt-3 text-xs md:text-sm">
                        <span className="text-muted-foreground">Topics: </span>
                        <span className="font-medium break-words">{session.topics_covered}</span>
                      </div>
                    )}

                    {/* Media Links */}
                    <div className="mt-4 space-y-2 text-xs md:text-sm">
                      {session.videos && (
                        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                          <span className="text-muted-foreground flex-shrink-0">🎥 Videos:</span>
                          <a 
                            href={session.videos} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline break-all"
                          >
                            {session.videos.length > 50 ? session.videos.substring(0, 50) + '...' : session.videos}
                          </a>
                        </div>
                      )}
                      {session.quiz_content_ppt && (
                        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                          <span className="text-muted-foreground flex-shrink-0">📊 Quiz/Content PPT:</span>
                          <a 
                            href={session.quiz_content_ppt} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline break-all"
                          >
                            {session.quiz_content_ppt.length > 50 ? session.quiz_content_ppt.substring(0, 50) + '...' : session.quiz_content_ppt}
                          </a>
                        </div>
                      )}
                      {session.final_content_ppt && (
                        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                          <span className="text-muted-foreground flex-shrink-0">📄 Final Content PPT:</span>
                          <a 
                            href={session.final_content_ppt} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline break-all"
                          >
                            {session.final_content_ppt.length > 50 ? session.final_content_ppt.substring(0, 50) + '...' : session.final_content_ppt}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto md:flex-col">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(session.id)}
                      className="gap-1 flex-1 md:flex-none"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
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
