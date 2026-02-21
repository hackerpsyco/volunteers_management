import { useState, useEffect } from 'react';
import { Plus, Trash2, Upload, MoreVertical, GraduationCap, FileText, Edit, Film } from 'lucide-react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SessionTypeDialog } from '@/components/sessions/SessionTypeDialog';
import { AddSessionDialog } from '@/components/sessions/AddSessionDialog';
import { UnifiedImportDialog } from '@/components/sessions/UnifiedImportDialog';
import { UpdateRecordingDialog } from '@/components/sessions/UpdateRecordingDialog';

interface Session {
  id: string;
  title: string;
  session_date: string;
  session_time: string;
  session_type: string;
  status: string;
  content_category: string | null;
  module_name: string | null;
  topics_covered: string | null;
  videos: string | null;
  quiz_content_ppt: string | null;
  facilitator_name: string | null;
  volunteer_name: string | null;
  coordinator_name: string | null;
  meeting_link: string | null;
  centre_id: string | null;
  centre_time_slot_id: string | null;
  class_batch: string | null;
  centre_name?: string | null;
  centre_location?: string | null;
  slot_day?: string | null;
  slot_start_time?: string | null;
  slot_end_time?: string | null;
  recording_url?: string | null;
  recording_status?: string | null;
  recording_duration?: number | null;
  recording_size?: string | null;
  recording_created_at?: string | null;
  google_event_id?: string | null;
  created_at: string;
  updated_at: string;
}

export default function Sessions() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [updateRecordingDialogOpen, setUpdateRecordingDialogOpen] = useState(false);
  const [selectedSessionType, setSelectedSessionType] = useState<'guest_teacher' | 'guest_speaker' | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<string | null>(null);
  const [volunteerFilter, setVolunteerFilter] = useState<string | null>(null);
  const [facilitatorFilter, setFacilitatorFilter] = useState<string | null>(null);
  const [coordinatorFilter, setCoordinatorFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
    
    // Subscribe to real-time updates on sessions table using the new API
    const subscription = supabase
      .channel('sessions-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
        },
        (payload) => {
          // Update the specific session in state with new data
          setSessions(prev => 
            prev.map(s => s.id === payload.new.id ? {
              ...s,
              ...payload.new,
              // Preserve transformed fields if they exist
              coordinator_name: s.coordinator_name,
              centre_name: s.centre_name,
              centre_location: s.centre_location,
              slot_day: s.slot_day,
              slot_start_time: s.slot_start_time,
              slot_end_time: s.slot_end_time,
            } : s)
          );
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          coordinators:coordinator_id(name),
          centres:centre_id(name, location),
          centre_time_slots:centre_time_slot_id(day, start_time, end_time)
        `)
        .order('session_date', { ascending: false });

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
      
      setSessions(transformedData as Session[]);
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
      setSessions(sessions.filter((s) => s.id !== id));
      setDeleteDialogOpen(false);
      setSelectedSession(null);
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  };

  const handleEditStatus = (session: Session) => {
    setSelectedSession(session);
    setNewStatus(session.status);
    setStatusDialogOpen(true);
  };

  const handleSaveStatus = async () => {
    if (!selectedSession || !newStatus) return;

    try {
      const { error } = await supabase
        .from('sessions')
        .update({ status: newStatus })
        .eq('id', selectedSession.id);

      if (error) throw error;
      
      // Update local state
      setSessions(sessions.map(s => 
        s.id === selectedSession.id ? { ...s, status: newStatus } : s
      ));
      
      toast.success('Session status updated successfully');
      setStatusDialogOpen(false);
      setSelectedSession(null);
      setNewStatus('');
    } catch (error) {
      console.error('Error updating session status:', error);
      toast.error('Failed to update session status');
    }
  };

  const handleAddSession = () => {
    setSelectedDate(new Date());
    setIsTypeDialogOpen(true);
  };

  const getFilteredSessions = () => {
    let filtered = sessions;

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    // Apply time filter
    if (timeFilter) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (timeFilter === 'upcoming') {
        filtered = filtered.filter(s => new Date(s.session_date) >= today);
      } else if (timeFilter === 'past') {
        filtered = filtered.filter(s => new Date(s.session_date) < today);
      }
    }

    // Apply volunteer filter
    if (volunteerFilter) {
      filtered = filtered.filter(s => s.volunteer_name === volunteerFilter);
    }

    // Apply facilitator filter
    if (facilitatorFilter) {
      filtered = filtered.filter(s => s.facilitator_name === facilitatorFilter);
    }

    // Apply coordinator filter
    if (coordinatorFilter) {
      filtered = filtered.filter(s => s.coordinator_name === coordinatorFilter);
    }

    return filtered;
  };

  const filteredSessions = getFilteredSessions();

  const handleSessionTypeSelect = (type: 'guest_teacher' | 'guest_speaker') => {
    setSelectedSessionType(type);
    setIsFormDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Sessions</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Manage volunteer sessions and events
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={() => setIsImportOpen(true)}
              variant="outline"
              className="w-full sm:w-auto gap-2"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Import Data</span>
              <span className="sm:hidden">Import</span>
            </Button>
            <Button
              onClick={handleAddSession}
              className="w-full sm:w-auto gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Session</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Sessions Table/Cards */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              All Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12">
                <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No sessions yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Get started by creating your first session
                </p>
                <Button onClick={handleAddSession}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Session
                </Button>
              </div>
            ) : (
              <>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-6">
                  {/* Status Filter */}
                  <div className="w-full sm:w-48">
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Filter by Status
                    </label>
                    <Select value={statusFilter || 'all'} onValueChange={(value) => setStatusFilter(value === 'all' ? null : value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="committed">Committed</SelectItem>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Time Filter */}
                  <div className="w-full sm:w-48">
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Filter by Time
                    </label>
                    <Select value={timeFilter || 'all'} onValueChange={(value) => setTimeFilter(value === 'all' ? null : value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Times</SelectItem>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="past">Past</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Volunteer Filter */}
                  <div className="w-full sm:w-48">
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Filter by Volunteer
                    </label>
                    <Select value={volunteerFilter || 'all'} onValueChange={(value) => setVolunteerFilter(value === 'all' ? null : value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select volunteer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Volunteers</SelectItem>
                        {[...new Set(sessions.map(s => s.volunteer_name).filter(Boolean))].sort().map((volunteer) => (
                          <SelectItem key={volunteer} value={volunteer || ''}>
                            {volunteer}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Facilitator Filter */}
                  <div className="w-full sm:w-48">
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Filter by Facilitator
                    </label>
                    <Select value={facilitatorFilter || 'all'} onValueChange={(value) => setFacilitatorFilter(value === 'all' ? null : value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select facilitator" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Facilitators</SelectItem>
                        {[...new Set(sessions.map(s => s.facilitator_name).filter(Boolean))].sort().map((facilitator) => (
                          <SelectItem key={facilitator} value={facilitator || ''}>
                            {facilitator}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Coordinator Filter */}
                  <div className="w-full sm:w-48">
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Filter by Coordinator
                    </label>
                    <Select value={coordinatorFilter || 'all'} onValueChange={(value) => setCoordinatorFilter(value === 'all' ? null : value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select coordinator" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Coordinators</SelectItem>
                        {[...new Set(sessions.map(s => s.coordinator_name).filter(Boolean))].sort().map((coordinator) => (
                          <SelectItem key={coordinator} value={coordinator || ''}>
                            {coordinator}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Active Filters Summary */}
                  {(statusFilter || timeFilter || volunteerFilter || facilitatorFilter || coordinatorFilter) && (
                    <div className="text-sm text-muted-foreground mt-2 sm:mt-0">
                      Showing {filteredSessions.length} of {sessions.length} sessions
                    </div>
                  )}
                </div>

                {filteredSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No sessions match the selected filters</p>
                  </div>
                ) : (
                  <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Module</TableHead>
                        <TableHead className="max-w-[200px]">Topic</TableHead>
                        <TableHead>Facilitator</TableHead>
                        <TableHead>Volunteer</TableHead>
                        <TableHead>Coordinator</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Centre</TableHead>
                        <TableHead>Time Slot</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Recording</TableHead>
                        <TableHead>Meeting Link</TableHead>
                        <TableHead className="w-[60px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>{session.content_category || '-'}</TableCell>
                          <TableCell>{session.module_name || '-'}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={session.topics_covered || ''}>
                            <span className="font-medium">{session.topics_covered || '-'}</span>
                          </TableCell>
                          <TableCell>{session.facilitator_name || '-'}</TableCell>
                          <TableCell>{session.volunteer_name || '-'}</TableCell>
                          <TableCell>{session.coordinator_name || '-'}</TableCell>
                          <TableCell>{session.class_batch || '-'}</TableCell>
                          <TableCell>{session.centre_name || '-'}</TableCell>
                          <TableCell className="text-sm">
                            {session.slot_start_time && session.slot_end_time 
                              ? `${session.slot_start_time} - ${session.slot_end_time}` 
                              : '-'}
                          </TableCell>
                          <TableCell>{new Date(session.session_date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {session.session_type === 'guest_teacher' ? 'Guest Teacher' : 'Guest Speaker'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              session.status === 'completed' ? 'default' :
                              session.status === 'pending' ? 'secondary' :
                              'outline'
                            }>
                              {session.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {session.recording_status === 'available' ? (
                              <div className="space-y-1">
                                <a
                                  href={session.recording_url || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline text-sm font-medium block"
                                >
                                  📹 View Recording
                                </a>
                                <div className="text-xs text-muted-foreground">
                                  {session.recording_duration && `${Math.floor(session.recording_duration / 60)}m`}
                                  {session.recording_size && ` • ${session.recording_size}`}
                                </div>
                              </div>
                            ) : session.recording_status === 'pending' ? (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                ⏳ Processing
                              </Badge>
                            ) : session.recording_status === 'failed' ? (
                              <Badge variant="secondary" className="bg-red-100 text-red-800">
                                ❌ Failed
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {session.meeting_link ? (
                              <a
                                href={session.meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline text-sm truncate max-w-[150px] inline-block"
                                title={session.meeting_link}
                              >
                                Join Meeting
                              </a>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
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
                                  onClick={() => handleEditStatus(session)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Status
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedSession(session);
                                    setUpdateRecordingDialogOpen(true);
                                  }}
                                >
                                  <Film className="h-4 w-4 mr-2" />
                                  Update Recording
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => navigate(`/sessions/${session.id}/recording`)}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Record Session
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedSession(session);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
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
                      {/* Topic and Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground break-words">{session.topics_covered || '-'}</h3>
                          <p className="text-xs text-muted-foreground mt-1">ID: {session.id.substring(0, 8)}</p>
                        </div>
                        <Badge variant={
                          session.status === 'completed' ? 'default' :
                          session.status === 'pending' ? 'secondary' :
                          'outline'
                        }>
                          {session.status}
                        </Badge>
                      </div>

                      {/* Category and Module */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground block">Category</span>
                          <span className="font-medium text-sm">{session.content_category || '-'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Module</span>
                          <span className="font-medium text-sm">{session.module_name || '-'}</span>
                        </div>
                      </div>

                      {/* Facilitator and Volunteer */}
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

                      {/* Coordinator */}
                      <div className="text-xs">
                        <span className="text-muted-foreground block">Coordinator</span>
                        <span className="font-medium text-sm">{session.coordinator_name || '-'}</span>
                      </div>

                      {/* Class */}
                      <div className="text-xs">
                        <span className="text-muted-foreground block">Class</span>
                        <span className="font-medium text-sm">{session.class_batch || '-'}</span>
                      </div>

                      {/* Centre and Time Slot */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground block">Centre</span>
                          <span className="font-medium text-sm">{session.centre_name || '-'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Time Slot</span>
                          <span className="font-medium text-sm">
                            {session.slot_start_time && session.slot_end_time 
                              ? `${session.slot_start_time} - ${session.slot_end_time}` 
                              : '-'}
                          </span>
                        </div>
                      </div>

                      {/* Meeting Link */}
                      {session.meeting_link && (
                        <div className="text-xs">
                          <span className="text-muted-foreground block">Meeting Link</span>
                          <a
                            href={session.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium text-sm"
                          >
                            Join Meeting
                          </a>
                        </div>
                      )}

                      {/* Date and Time */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground block">Date</span>
                          <span className="font-medium text-sm">{new Date(session.session_date).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Time</span>
                          <span className="font-medium text-sm">{session.session_time}</span>
                        </div>
                      </div>

                      {/* Type */}
                      <div className="text-xs">
                        <span className="text-muted-foreground">Type</span>
                        <Badge variant="outline" className="capitalize mt-1">
                          {session.session_type === 'guest_teacher' ? 'Guest Teacher' : 'Guest Speaker'}
                        </Badge>
                      </div>

                      {/* Recording Status */}
                      {session.recording_status && (
                        <div className="text-xs">
                          <span className="text-muted-foreground block">Recording</span>
                          {session.recording_status === 'available' ? (
                            <div className="space-y-1 mt-1">
                              <a
                                href={session.recording_url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline font-medium text-sm block"
                              >
                                📹 View Recording
                              </a>
                              <div className="text-xs text-muted-foreground">
                                {session.recording_duration && `${Math.floor(session.recording_duration / 60)}m`}
                                {session.recording_size && ` • ${session.recording_size}`}
                              </div>
                            </div>
                          ) : session.recording_status === 'pending' ? (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 mt-1">
                              ⏳ Processing
                            </Badge>
                          ) : session.recording_status === 'failed' ? (
                            <Badge variant="secondary" className="bg-red-100 text-red-800 mt-1">
                              ❌ Failed
                            </Badge>
                          ) : null}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-border">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditStatus(session)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Status
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedSession(session);
                            setUpdateRecordingDialogOpen(true);
                          }}
                          className="flex-1"
                        >
                          <Film className="h-4 w-4 mr-1" />
                          Recording
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/sessions/${session.id}/recording`)}
                          className="flex-1"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Record
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => {
                            setSelectedSession(session);
                            setDeleteDialogOpen(true);
                          }}
                          className="flex-1"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
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

      {/* Add Session Dialog - Type Selection */}
      <SessionTypeDialog
        open={isTypeDialogOpen}
        onOpenChange={setIsTypeDialogOpen}
        onSelectType={handleSessionTypeSelect}
      />

      {/* Add Session Dialog - Form */}
      <AddSessionDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        selectedDate={selectedDate}
        onSuccess={fetchSessions}
      />

      {/* Unified Import Dialog */}
      <UnifiedImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={fetchSessions}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedSession?.topics_covered}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedSession && handleDelete(selectedSession.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Session Status</DialogTitle>
            <DialogDescription>
              Update the status for "{selectedSession?.topics_covered}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Status
              </label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="committed">Committed</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveStatus}>
              Save Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Recording Dialog */}
      <UpdateRecordingDialog
        open={updateRecordingDialogOpen}
        onOpenChange={setUpdateRecordingDialogOpen}
        sessionId={selectedSession?.id || ''}
        sessionTitle={selectedSession?.topics_covered || ''}
        currentRecordingUrl={selectedSession?.recording_url}
        currentRecordingStatus={selectedSession?.recording_status}
        onSuccess={fetchSessions}
      />
    </DashboardLayout>
  );
}
