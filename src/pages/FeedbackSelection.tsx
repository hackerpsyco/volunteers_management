import { useState, useEffect } from 'react';
import { FileText, MoreVertical, Eye, Plus, Search, X, GraduationCap, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import { TruncatedText } from '@/components/ui/truncated-text';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FeedbackSession {
  id: string;
  title: string;
  session_date: string;
  session_time: string;
  session_type: string;
  facilitator_name: string;
  volunteer_name: string;
  coordinator_name: string | null;
  status: string;
  topics_covered: string | null;
  content_category: string | null;
  module_name: string | null;
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
  subject_name?: string | null;
  recording_url?: string | null;
}

export default function FeedbackSelection() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [feedbackSessions, setFeedbackSessions] = useState<FeedbackSession[]>([]);
  
  // Filters and sorting state matching Sessions.tsx
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<string | null>(null);
  const [volunteerFilter, setVolunteerFilter] = useState<string | null>(null);
  const [facilitatorFilter, setFacilitatorFilter] = useState<string | null>(null);
  const [coordinatorFilter, setCoordinatorFilter] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [sessionTypeFilter, setSessionTypeFilter] = useState<string | null>(null);
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<keyof FeedbackSession | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  const [isAddFeedbackDialogOpen, setIsAddFeedbackDialogOpen] = useState(false);
  const [committedSessions, setCommittedSessions] = useState<FeedbackSession[]>([]);
  const [loadingCommitted, setLoadingCommitted] = useState(false);
  const [dialogFilter, setDialogFilter] = useState<string>('recent');

  useEffect(() => {
    fetchFeedbackSessions();
  }, []);

  const fetchFeedbackSessions = async () => {
    try {
      setLoading(true);
      
      // Fetch all sessions with recorded feedback (recorded_at is not null)
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          *,
          coordinators:coordinator_id(name),
          subjects(name)
        `)
        .not('recorded_at', 'is', null)
        .order('session_date', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Transform sessions data
      const transformedSessions = (sessionsData || []).map((session: any) => ({
        ...session,
        coordinator_name: session.coordinators?.name || null,
        subject_name: session.subjects?.name || null,
      }));

      setFeedbackSessions(transformedSessions as FeedbackSession[]);
    } catch (error) {
      console.error('Error fetching feedback sessions:', error);
      toast.error('Failed to load feedback sessions');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredSessions = () => {
    let filtered = feedbackSessions;

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        (s.title?.toLowerCase().includes(query)) ||
        (s.content_category?.toLowerCase().includes(query)) ||
        (s.module_name?.toLowerCase().includes(query)) ||
        (s.topics_covered?.toLowerCase().includes(query)) ||
        (s.facilitator_name?.toLowerCase().includes(query)) ||
        (s.volunteer_name?.toLowerCase().includes(query)) ||
        (s.coordinator_name?.toLowerCase().includes(query)) ||
        (s.class_batch?.toLowerCase().includes(query)) ||
        (s.subject_name?.toLowerCase().includes(query)) ||
        (s.status?.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    // Time filter
    if (timeFilter) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (timeFilter === 'upcoming') {
        filtered = filtered.filter(s => new Date(s.session_date) >= today);
      } else if (timeFilter === 'past') {
        filtered = filtered.filter(s => new Date(s.session_date) < today);
      }
    }

    // Session Type filter
    if (sessionTypeFilter) {
      filtered = filtered.filter(s => s.session_type === sessionTypeFilter);
    }

    // Subject filter
    if (subjectFilter) {
      filtered = filtered.filter(s => s.subject_name === subjectFilter);
    }

    // Date range
    if (dateFromFilter) {
      filtered = filtered.filter(s => s.session_date >= dateFromFilter);
    }
    if (dateToFilter) {
      filtered = filtered.filter(s => s.session_date <= dateToFilter);
    }

    // Other filters
    if (volunteerFilter) filtered = filtered.filter(s => s.volunteer_name === volunteerFilter);
    if (facilitatorFilter) filtered = filtered.filter(s => s.facilitator_name === facilitatorFilter);
    if (coordinatorFilter) filtered = filtered.filter(s => s.coordinator_name === coordinatorFilter);

    // Sorting
    if (sortColumn && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
        if (bValue == null) return sortDirection === 'asc' ? -1 : 1;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
          return sortDirection === 'asc' ? comparison : -comparison;
        }
        return 0;
      });
    }

    return filtered;
  };

  const handleColumnSort = (column: keyof FeedbackSession) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIndicator = (column: keyof FeedbackSession) => {
    if (sortColumn !== column) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
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
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select(`*, coordinators:coordinator_id(name)`)
        .is('recorded_at', null)
        .order('session_date', { ascending: false });

      if (sessionsError) throw sessionsError;
      const transformed = (sessionsData || []).map((session: any) => ({
        ...session,
        coordinator_name: session.coordinators?.name || null,
      }));
      setCommittedSessions(transformed as FeedbackSession[]);
      setIsAddFeedbackDialogOpen(true);
    } catch (error) {
      console.error('Error fetching committed sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoadingCommitted(false);
    }
  };

  const getFilteredCommittedSessions = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];

    return committedSessions.filter(session => {
      if (dialogFilter === 'present') return session.session_date === todayString;
      if (dialogFilter === 'past') return session.session_date < todayString;
      if (dialogFilter === 'upcoming') return session.session_date > todayString;
      return true;
    });
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
          <Button onClick={handleOpenAddFeedbackDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Feedback to Session
          </Button>
        </div>

        {/* Filters */}
        <Card className="shadow-sm">
          <CardContent className="pt-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search feedback by topic, facilitator, volunteer, coordinator, class, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter Rows */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {/* Row 1 */}
              <div>
                <label className="text-xs font-medium mb-1 block">Subject</label>
                <Select value={subjectFilter || 'all'} onValueChange={(v) => setSubjectFilter(v === 'all' ? null : v)}>
                  <SelectTrigger className="h-9 truncate"><SelectValue placeholder="All Subjects" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {[...new Set(feedbackSessions.map(s => s.subject_name).filter(Boolean))].sort().map(s => (
                      <SelectItem key={s} value={s!}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Time</label>
                <Select value={timeFilter || 'all'} onValueChange={(v) => setTimeFilter(v === 'all' ? null : v)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="All Time" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="past">Past</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Type</label>
                <Select value={sessionTypeFilter || 'all'} onValueChange={(v) => setSessionTypeFilter(v === 'all' ? null : v)}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="All Types" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="guest_teacher">Guest Teacher (GT)</SelectItem>
                    <SelectItem value="guest_speaker">Guest Speaker (GS)</SelectItem>
                    <SelectItem value="local_teacher">Local Teacher (LT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">From Date</label>
                <Input type="date" value={dateFromFilter} onChange={(e) => setDateFromFilter(e.target.value)} className="h-9" />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">To Date</label>
                <Input type="date" value={dateToFilter} onChange={(e) => setDateToFilter(e.target.value)} className="h-9" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Row 2 */}
              <div>
                <label className="text-xs font-medium mb-1 block">Volunteer</label>
                <Select value={volunteerFilter || 'all'} onValueChange={(v) => setVolunteerFilter(v === 'all' ? null : v)}>
                  <SelectTrigger className="h-9 truncate"><SelectValue placeholder="All Volunteers" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Volunteers</SelectItem>
                    {[...new Set(feedbackSessions.map(s => s.volunteer_name).filter(Boolean))].sort().map(s => (
                      <SelectItem key={s} value={s!}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Facilitator</label>
                <Select value={facilitatorFilter || 'all'} onValueChange={(v) => setFacilitatorFilter(v === 'all' ? null : v)}>
                  <SelectTrigger className="h-9 truncate"><SelectValue placeholder="All Facilitators" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Facilitators</SelectItem>
                    {[...new Set(feedbackSessions.map(s => s.facilitator_name).filter(Boolean))].sort().map(s => (
                      <SelectItem key={s} value={s!}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">Coordinator</label>
                <Select value={coordinatorFilter || 'all'} onValueChange={(v) => setCoordinatorFilter(v === 'all' ? null : v)}>
                  <SelectTrigger className="h-9 truncate"><SelectValue placeholder="All Coordinators" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Coordinators</SelectItem>
                    {[...new Set(feedbackSessions.map(s => s.coordinator_name).filter(Boolean))].sort().map(s => (
                      <SelectItem key={s} value={s!}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end text-xs text-muted-foreground pb-2">
                Showing {filteredSessions.length} of {feedbackSessions.length} results
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="overflow-x-auto border border-border rounded-lg">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="cursor-pointer" onClick={() => handleColumnSort('subject_name')}>
                        Subject {getSortIndicator('subject_name')}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleColumnSort('content_category')}>
                        Category {getSortIndicator('content_category')}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleColumnSort('module_name')}>
                        Module No & Name {getSortIndicator('module_name')}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleColumnSort('topics_covered')}>
                        Topics Covered {getSortIndicator('topics_covered')}
                      </TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Volunteer</TableHead>
                      <TableHead>Coordinator</TableHead>
                      <TableHead>Facilitator</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Session Date</TableHead>
                      <TableHead>Recording</TableHead>
                      <TableHead className="w-[60px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSessions.map((session) => (
                      <TableRow key={session.id} className="hover:bg-muted/50">
                        <TableCell><TruncatedText text={session.subject_name} maxLength={20} /></TableCell>
                        <TableCell><TruncatedText text={session.content_category} maxLength={20} /></TableCell>
                        <TableCell><TruncatedText text={session.module_name} maxLength={20} /></TableCell>
                        <TableCell><TruncatedText text={session.topics_covered} maxLength={30} /></TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] h-5 px-1 whitespace-nowrap">
                            {session.session_type === 'guest_speaker' ? 'GS' : session.session_type === 'local_teacher' ? 'LT' : 'GT'}
                          </Badge>
                        </TableCell>
                        <TableCell><TruncatedText text={session.volunteer_name} maxLength={15} /></TableCell>
                        <TableCell><TruncatedText text={session.coordinator_name} maxLength={15} /></TableCell>
                        <TableCell><TruncatedText text={session.facilitator_name} maxLength={15} /></TableCell>
                        <TableCell>{session.class_batch || '-'}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {new Date(session.session_date).toLocaleDateString('en-GB')}
                        </TableCell>
                        <TableCell>
                          {session.recording_url ? (
                            <a href={session.recording_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">Link</a>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(session.id)}>
                                <Eye className="h-4 w-4 mr-2" /> View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAddFeedback(session.id)}>
                                <Plus className="h-4 w-4 mr-2" /> Edit
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

      {/* Add Feedback Dialog */}
      <Dialog open={isAddFeedbackDialogOpen} onOpenChange={setIsAddFeedbackDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Session to Add Feedback</DialogTitle>
            <DialogDescription>Choose a session to record performance details.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mb-4">
            <Button variant={dialogFilter === 'recent' ? 'default' : 'outline'} size="sm" onClick={() => setDialogFilter('recent')}>Recent</Button>
            <Button variant={dialogFilter === 'past' ? 'default' : 'outline'} size="sm" onClick={() => setDialogFilter('past')}>Past</Button>
            <Button variant={dialogFilter === 'present' ? 'default' : 'outline'} size="sm" onClick={() => setDialogFilter('present')}>Today</Button>
            <Button variant={dialogFilter === 'upcoming' ? 'default' : 'outline'} size="sm" onClick={() => setDialogFilter('upcoming')}>Upcoming</Button>
          </div>
          <div className="space-y-2">
            {getFilteredCommittedSessions().map(s => (
              <Button key={s.id} variant="outline" className="w-full justify-start text-left h-auto py-2" onClick={() => { setIsAddFeedbackDialogOpen(false); handleAddFeedback(s.id); }}>
                <div className="flex flex-col text-sm">
                  <span className="font-bold">{s.topics_covered || s.title}</span>
                  <span className="text-xs text-muted-foreground">{new Date(s.session_date).toLocaleDateString()} | {s.facilitator_name}</span>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
