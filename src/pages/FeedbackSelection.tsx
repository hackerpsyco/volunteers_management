import { useState, useEffect } from 'react';
import { FileText, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Session {
  id: string;
  title: string;
  session_date: string;
  session_time: string;
  facilitator_name: string;
  volunteer_name: string;
  status: string;
}

export default function FeedbackSelection() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sessions')
        .select('id, title, session_date, session_time, facilitator_name, volunteer_name, status')
        .order('session_date', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Feedback & Record Session
          </h1>
          <p className="text-muted-foreground mt-2">
            Select a session to record feedback and student performance
          </p>
        </div>

        {/* Sessions List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : sessions.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <p className="text-muted-foreground mb-4">No sessions found</p>
              <Button onClick={() => navigate('/sessions')} variant="outline">
                Go to Sessions
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <Card
                key={session.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/sessions/${session.id}/recording`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground truncate">{session.title}</h3>
                        <Badge variant="outline" className="capitalize text-xs">
                          {session.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Date</span>
                          <p className="font-medium">{new Date(session.session_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Time</span>
                          <p className="font-medium">{session.session_time}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Facilitator</span>
                          <p className="font-medium truncate">{session.facilitator_name || '-'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Volunteer</span>
                          <p className="font-medium truncate">{session.volunteer_name || '-'}</p>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/sessions/${session.id}/recording`);
                      }}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
