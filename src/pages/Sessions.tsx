import { useState, useEffect } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AddSessionDialog } from '@/components/sessions/AddSessionDialog';
import { UnifiedImportDialog } from '@/components/sessions/UnifiedImportDialog';

interface Session {
  session_id: string;
  category_id: string;
  content_category: string;
  module_id: string;
  module_code: string;
  module_title: string;
  topic_id: string;
  topic_code: string;
  topic_title: string;
  duration_min: number;
  duration_max: number;
  status: string;
  mentor_name: string;
  mentor_email: string;
  session_date: string;
  session_time: string;
  video_english: string;
  video_hindi: string;
  worksheet_english: string;
  worksheet_hindi: string;
  practical_activity_english: string;
  practical_activity_hindi: string;
  quiz_content_ppt: string;
  final_content_ppt: string;
  revision_status: string;
  revision_mentor_name: string;
  revision_mentor_email: string;
  revision_date: string;
  created_at: string;
  updated_at: string;
}

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase
        .from('curriculum_by_status' as any)
        .select('*')
        .order('content_category', { ascending: true })
        .order('module_code', { ascending: true })
        .order('topic_code', { ascending: true })
        .order('status', { ascending: true }) as any);

      if (error) throw error;
      setSessions((data || []) as Session[]);
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
      const { error } = await (supabase
        .from('session_meta' as any)
        .delete()
        .eq('id', id) as any);

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
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button
              onClick={handleAddSession}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New Session
            </Button>
            <Button
              onClick={() => setIsImportOpen(true)}
              variant="outline"
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Import Data
            </Button>
          </div>
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
              <div key={session.session_id} className="bg-card border border-border rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Category</p>
                        <h3 className="text-sm font-semibold text-foreground">{session.content_category}</h3>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Module {session.module_code}</p>
                        <h4 className="text-base font-semibold text-foreground break-words">{session.module_title}</h4>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Topic {session.topic_code}</p>
                        <h4 className="text-base font-semibold text-foreground break-words">{session.topic_title}</h4>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="mt-3 flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                        session.status === 'completed' ? 'bg-green-100 text-green-800' :
                        session.status === 'available' ? 'bg-blue-100 text-blue-800' :
                        session.status === 'committed' ? 'bg-purple-100 text-purple-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {session.status}
                      </span>
                    </div>

                    {/* Session Info */}
                    <div className="flex flex-wrap gap-2 md:gap-4 mt-3 text-xs md:text-sm text-muted-foreground">
                      {session.session_date && <span className="whitespace-nowrap">📅 {new Date(session.session_date).toLocaleDateString()}</span>}
                      {session.session_time && <span className="whitespace-nowrap">🕐 {session.session_time}</span>}
                      {session.status && <span className="capitalize whitespace-nowrap">✓ {session.status}</span>}
                    </div>

                    {/* Mentor Info */}
                    {session.mentor_name && (
                      <div className="mt-3 text-xs md:text-sm">
                        <span className="text-muted-foreground">👤 Mentor: </span>
                        <span className="font-medium">{session.mentor_name}</span>
                        {session.mentor_email && <span className="text-muted-foreground"> ({session.mentor_email})</span>}
                      </div>
                    )}

                    {/* Resources */}
                    <div className="mt-4 space-y-2 text-xs md:text-sm">
                      {session.video_english && (
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">🎥 Video (EN):</span>
                          <a 
                            href={session.video_english} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline break-all pl-4"
                          >
                            {session.video_english.length > 60 ? session.video_english.substring(0, 60) + '...' : session.video_english}
                          </a>
                        </div>
                      )}
                      {session.video_hindi && (
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">🎥 Video (HI):</span>
                          <a 
                            href={session.video_hindi} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline break-all pl-4"
                          >
                            {session.video_hindi.length > 60 ? session.video_hindi.substring(0, 60) + '...' : session.video_hindi}
                          </a>
                        </div>
                      )}
                      {session.worksheet_english && (
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">📄 Worksheets (EN):</span>
                          <a 
                            href={session.worksheet_english} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline break-all pl-4"
                          >
                            {session.worksheet_english.length > 60 ? session.worksheet_english.substring(0, 60) + '...' : session.worksheet_english}
                          </a>
                        </div>
                      )}
                      {session.worksheet_hindi && (
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">📄 Worksheets (HI):</span>
                          <a 
                            href={session.worksheet_hindi} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline break-all pl-4"
                          >
                            {session.worksheet_hindi.length > 60 ? session.worksheet_hindi.substring(0, 60) + '...' : session.worksheet_hindi}
                          </a>
                        </div>
                      )}
                      {session.practical_activity_english && (
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">🛠️ Practical (EN):</span>
                          <a 
                            href={session.practical_activity_english} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline break-all pl-4"
                          >
                            {session.practical_activity_english.length > 60 ? session.practical_activity_english.substring(0, 60) + '...' : session.practical_activity_english}
                          </a>
                        </div>
                      )}
                      {session.practical_activity_hindi && (
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">🛠️ Practical (HI):</span>
                          <a 
                            href={session.practical_activity_hindi} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline break-all pl-4"
                          >
                            {session.practical_activity_hindi.length > 60 ? session.practical_activity_hindi.substring(0, 60) + '...' : session.practical_activity_hindi}
                          </a>
                        </div>
                      )}
                      {session.quiz_content_ppt && (
                        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                          <span className="text-muted-foreground flex-shrink-0">📊 Quiz/Content:</span>
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
                          <span className="text-muted-foreground flex-shrink-0">📄 Final Content:</span>
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

                    {/* Revision Info */}
                    {session.revision_status && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Revision</p>
                        <div className="space-y-1 text-xs">
                          <div><span className="text-muted-foreground">Status: </span><span className="font-medium">{session.revision_status}</span></div>
                          {session.revision_mentor_name && <div><span className="text-muted-foreground">Mentor: </span><span className="font-medium">{session.revision_mentor_name}</span></div>}
                          {session.revision_date && <div><span className="text-muted-foreground">Date: </span><span className="font-medium">{new Date(session.revision_date).toLocaleDateString()}</span></div>}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 w-full md:w-auto md:flex-col">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(session.session_id)}
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

      {/* Unified Import Dialog */}
      <UnifiedImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={fetchSessions}
      />
    </DashboardLayout>
  );
}
