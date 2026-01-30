import { useState, useEffect } from 'react';
import { FileText, MoreVertical, Eye, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FeedbackSession {
  id: string;
  title: string;
  session_date: string;
  session_time: string;
  facilitator_name: string;
  volunteer_name: string;
  coordinator_name: string | null;
  status: string;
  topics_covered: string | null;
  content_category: string | null;
  session_objective: string | null;
  practical_activities: string | null;
  session_highlights: string | null;
  learning_outcomes: string | null;
  facilitator_reflection: string | null;
  best_performer: string | null;
  guest_teacher_feedback: string | null;
  incharge_reviewer_feedback: string | null;
  mic_sound_rating: number | null;
  seating_view_rating: number | null;
  session_strength: number | null;
  class_batch: string | null;
  recorded_at: string | null;
}

export default function FeedbackSelection() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [feedbackSessions, setFeedbackSessions] = useState<FeedbackSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<FeedbackSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [isAddFeedbackDialogOpen, setIsAddFeedbackDialogOpen] = useState(false);
  const [committedSessions, setCommittedSessions] = useState<FeedbackSession[]>([]);
  const [loadingCommitted, setLoadingCommitted] = useState(false);

  useEffect(() => {
    fetchFeedbackSessions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [feedbackSessions, selectedSession, selectedDate]);

  const fetchFeedbackSessions = async () => {
    try {
      setLoading(true);
      
      // Fetch all sessions with recorded feedback (recorded_at is not null)
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          *,
          coordinators:coordinator_id(name)
        `)
        .not('recorded_at', 'is', null)
        .order('session_date', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Transform sessions data
      const transformedSessions = (sessionsData || []).map((session: any) => ({
        ...session,
        coordinator_name: session.coordinators?.name || null,
      }));

      setFeedbackSessions(transformedSessions as FeedbackSession[]);
    } catch (error) {
      console.error('Error fetching feedback sessions:', error);
      toast.error('Failed to load feedback sessions');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...feedbackSessions];

    // Filter by session
    if (selectedSession !== 'all') {
      filtered = filtered.filter(s => s.id === selectedSession);
    }

    // Filter by date
    if (selectedDate !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.session_date);
        sessionDate.setHours(0, 0, 0, 0);

        if (selectedDate === 'today') {
          return sessionDate.getTime() === today.getTime();
        } else if (selectedDate === 'past') {
          return sessionDate.getTime() < today.getTime();
        }
        return true;
      });
    }

    setFilteredSessions(filtered);
  };

  const handleViewDetails = (sessionId: string) => {
    navigate(`/sessions/${sessionId}/feedback-details`);
  };

  const handleAddFeedback = (sessionId: string) => {
    navigate(`/sessions/${sessionId}/recording`);
  };

  const handleOpenAddFeedbackDialog = async () => {
    try {
      setLoadingCommitted(true);
      
      // Fetch all committed/created sessions without feedback
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          *,
          coordinators:coordinator_id(name)
        `)
        .in('status', ['committed', 'created'])
        .is('recorded_at', null)
        .order('session_date', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Transform sessions data
      const transformedSessions = (sessionsData || []).map((session: any) => ({
        ...session,
        coordinator_name: session.coordinators?.name || null,
      }));

      setCommittedSessions(transformedSessions as FeedbackSession[]);
      setIsAddFeedbackDialogOpen(true);
    } catch (error) {
      console.error('Error fetching committed sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoadingCommitted(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              Feedback Results
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              View recorded feedback and session results
            </p>
          </div>
        </div>

        {/* Filters and Add Button */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Recorded Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Filter by Session
                </label>
                <Select value={selectedSession} onValueChange={setSelectedSession}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sessions</SelectItem>
                    {feedbackSessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.topics_covered || session.title || 'Untitled'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Filter by Date
                </label>
                <Select value={selectedDate} onValueChange={setSelectedDate}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Feedback</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="past">Past Sessions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleOpenAddFeedbackDialog}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Feedback to Session
                </Button>
              </div>
            </div>

            {/* Feedback Table */}
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No feedback recorded yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Topic</TableHead>
                      <TableHead>Facilitator</TableHead>
                      <TableHead>Volunteer</TableHead>
                      <TableHead>Coordinator</TableHead>
                      <TableHead>Session Date</TableHead>
                      <TableHead>Recorded Date</TableHead>
                      <TableHead>Highlights</TableHead>
                      <TableHead>Ratings</TableHead>
                      <TableHead className="w-[60px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">
                          {session.topics_covered || session.title || '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {session.facilitator_name || '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {session.volunteer_name || '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {session.coordinator_name || '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(session.session_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {session.recorded_at
                            ? new Date(session.recorded_at).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell className="text-sm max-w-[150px] truncate">
                          {session.session_highlights || '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {session.mic_sound_rating && (
                            <span>Mic: {session.mic_sound_rating}</span>
                          )}
                          {session.session_strength && (
                            <span className="block">Strength: {session.session_strength}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover">
                              <DropdownMenuItem
                                onClick={() => handleViewDetails(session.id)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleAddFeedback(session.id)}
                              >
                                Edit Feedback
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Feedback Dialog - Select Session */}
      <Dialog open={isAddFeedbackDialogOpen} onOpenChange={setIsAddFeedbackDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Session to Add Feedback</DialogTitle>
            <DialogDescription>
              Choose a committed session to add feedback and record session details
            </DialogDescription>
          </DialogHeader>

          {loadingCommitted ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : committedSessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No sessions available for feedback</p>
            </div>
          ) : (
            <div className="space-y-3">
              {committedSessions.map((session) => (
                <Button
                  key={session.id}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3 hover:bg-accent"
                  onClick={() => {
                    setIsAddFeedbackDialogOpen(false);
                    handleAddFeedback(session.id);
                  }}
                >
                  <div className="flex flex-col gap-1 w-full">
                    <span className="font-semibold">{session.topics_covered || session.title || 'Untitled'}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(session.session_date).toLocaleDateString()} at {session.session_time}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Facilitator: {session.facilitator_name || '-'} | Volunteer: {session.volunteer_name || '-'} | Coordinator: {session.coordinator_name || '-'}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
