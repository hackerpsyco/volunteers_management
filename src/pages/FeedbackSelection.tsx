import { useState, useEffect } from 'react';
import { FileText, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
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
  const [allSessions, setAllSessions] = useState<FeedbackSession[]>([]);
  const [allCreatedSessions, setAllCreatedSessions] = useState<FeedbackSession[]>([]);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [sessionFilter, setSessionFilter] = useState<string | null>(null);
  const [isSessionSelectOpen, setIsSessionSelectOpen] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      
      // Fetch sessions with feedback
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('sessions')
        .select(`
          *,
          coordinators:coordinator_id(name)
        `)
        .not('session_objective', 'is', null)
        .order('recorded_at', { ascending: false });

      if (feedbackError) throw feedbackError;

      // Fetch all created sessions
      const { data: allSessionsData, error: allSessionsError } = await supabase
        .from('sessions')
        .select(`
          *,
          coordinators:coordinator_id(name)
        `)
        .order('session_date', { ascending: false });

      if (allSessionsError) throw allSessionsError;

      // Transform feedback data
      const transformedFeedbackData = (feedbackData || []).map((session: any) => ({
        ...session,
        coordinator_name: session.coordinators?.name || null,
      }));

      // Transform all sessions data
      const transformedAllSessions = (allSessionsData || []).map((session: any) => ({
        ...session,
        coordinator_name: session.coordinators?.name || null,
      }));

      setAllSessions(transformedFeedbackData as FeedbackSession[]);
      setAllCreatedSessions(transformedAllSessions as FeedbackSession[]);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredSessions = () => {
    let filtered = allSessions;

    // Apply session filter
    if (sessionFilter) {
      filtered = filtered.filter(s => s.id === sessionFilter);
    }

    // Apply date filter
    if (dateFilter) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dateFilter === 'today') {
        filtered = filtered.filter(s => {
          const recordedDate = s.recorded_at ? new Date(s.recorded_at) : new Date(s.session_date);
          recordedDate.setHours(0, 0, 0, 0);
          return recordedDate.getTime() === today.getTime();
        });
      } else if (dateFilter === 'past') {
        filtered = filtered.filter(s => {
          const recordedDate = s.recorded_at ? new Date(s.recorded_at) : new Date(s.session_date);
          return recordedDate < today;
        });
      }
    }

    return filtered;
  };

  const handleAddFeedback = (sessionId: string) => {
    navigate(`/sessions/${sessionId}/recording`);
    setIsSessionSelectOpen(false);
  };

  const filteredSessions = getFilteredSessions();

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

        {/* Feedback Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Recorded Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {/* Filters - Always Show */}
                <div className="mb-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Session Filter */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Filter by Session
                      </label>
                      <Select value={sessionFilter || 'all'} onValueChange={(value) => setSessionFilter(value === 'all' ? null : value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select session" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sessions</SelectItem>
                          {allCreatedSessions.map((session) => (
                            <SelectItem key={session.id} value={session.id}>
                              {session.topics_covered || session.title || 'Untitled'} - {new Date(session.session_date).toLocaleDateString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date Filter */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Filter by Date
                      </label>
                      <Select value={dateFilter || 'all'} onValueChange={(value) => setDateFilter(value === 'all' ? null : value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select date" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Feedback</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="past">Past Feedback</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Add Feedback Button - Opens Session Selection */}
                  <div>
                    <Button onClick={() => setIsSessionSelectOpen(true)} className="w-full sm:w-auto">
                      Add Feedback to Session
                    </Button>
                  </div>
                </div>

                {/* Content - Show based on data */}
                {allSessions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm md:text-base text-muted-foreground mb-4">
                      No feedback recorded yet
                    </p>
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No feedback matches the selected filter</p>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
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
                              <TableCell className="font-medium">{session.topics_covered || '-'}</TableCell>
                              <TableCell>{session.facilitator_name || '-'}</TableCell>
                              <TableCell>{session.volunteer_name || '-'}</TableCell>
                              <TableCell>{session.coordinator_name || '-'}</TableCell>
                              <TableCell>{new Date(session.session_date).toLocaleDateString()}</TableCell>
                              <TableCell>
                                {session.recorded_at 
                                  ? new Date(session.recorded_at).toLocaleDateString() 
                                  : '-'}
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate text-sm">
                                {session.session_highlights || '-'}
                              </TableCell>
                              <TableCell className="text-sm">
                                <div className="flex gap-1">
                                  {session.mic_sound_rating && (
                                    <Badge variant="outline" className="text-xs">
                                      Mic: {session.mic_sound_rating}
                                    </Badge>
                                  )}
                                  {session.session_strength && (
                                    <Badge variant="outline" className="text-xs">
                                      Strength: {session.session_strength}
                                    </Badge>
                                  )}
                                </div>
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
                                      onClick={() => navigate(`/sessions/${session.id}/recording`)}
                                    >
                                      Record Session
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => navigate(`/sessions/${session.id}/feedback-details`)}
                                    >
                                      View Details
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                      {filteredSessions.map((session) => (
                        <div key={session.id} className="bg-muted/50 rounded-lg p-4 space-y-3 border border-border">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-foreground break-words">{session.topics_covered || '-'}</h3>
                              <p className="text-xs text-muted-foreground mt-1">ID: {session.id.substring(0, 8)}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground block">Session Date</span>
                              <span className="font-medium text-sm">{new Date(session.session_date).toLocaleDateString()}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block">Recorded Date</span>
                              <span className="font-medium text-sm">
                                {session.recorded_at 
                                  ? new Date(session.recorded_at).toLocaleDateString() 
                                  : '-'}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground block">Facilitator</span>
                              <span className="font-medium text-sm">{session.facilitator_name || '-'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block">Volunteer</span>
                              <span className="font-medium text-sm">{session.volunteer_name || '-'}</span>
                            </div>
                          </div>

                          <div className="text-xs">
                            <span className="text-muted-foreground block">Coordinator</span>
                            <span className="font-medium text-sm">{session.coordinator_name || '-'}</span>
                          </div>

                          <div className="text-xs">
                            <span className="text-muted-foreground block">Highlights</span>
                            <span className="font-medium text-sm">{session.session_highlights || '-'}</span>
                          </div>

                          <div className="text-xs">
                            <span className="text-muted-foreground block">Ratings</span>
                            <div className="flex gap-1 mt-1">
                              {session.mic_sound_rating && (
                                <Badge variant="outline" className="text-xs">
                                  Mic: {session.mic_sound_rating}
                                </Badge>
                              )}
                              {session.session_strength && (
                                <Badge variant="outline" className="text-xs">
                                  Strength: {session.session_strength}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2 border-t border-border">
                            <Button
                              size="sm"
                              onClick={() => navigate(`/sessions/${session.id}/recording`)}
                              className="flex-1"
                            >
                              Record Session
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/sessions/${session.id}/feedback-details`)}
                              className="flex-1"
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Session Selection Dialog */}
      <Dialog open={isSessionSelectOpen} onOpenChange={setIsSessionSelectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Session for Feedback</DialogTitle>
            <DialogDescription>
              Choose a session to add feedback
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {allCreatedSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No sessions available
              </p>
            ) : (
              allCreatedSessions.map((session) => (
                <Button
                  key={session.id}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3"
                  onClick={() => handleAddFeedback(session.id)}
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{session.topics_covered || session.title || 'Untitled'}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(session.session_date).toLocaleDateString()} - {session.facilitator_name || '-'}
                    </span>
                  </div>
                </Button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
