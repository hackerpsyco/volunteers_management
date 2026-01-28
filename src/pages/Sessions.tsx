import { useState, useEffect } from 'react';
import { Plus, Trash2, Upload, MoreVertical, GraduationCap } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SessionTypeDialog } from '@/components/sessions/SessionTypeDialog';
import { AddSessionDialog } from '@/components/sessions/AddSessionDialog';
import { UnifiedImportDialog } from '@/components/sessions/UnifiedImportDialog';

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
  created_at: string;
  updated_at: string;
}

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSessionType, setSelectedSessionType] = useState<'guest_teacher' | 'guest_speaker' | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('session_date', { ascending: false });

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

  const handleAddSession = () => {
    setSelectedDate(new Date());
    setIsTypeDialogOpen(true);
  };

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
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Topic</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Module</TableHead>
                        <TableHead>Facilitator</TableHead>
                        <TableHead>Volunteer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[60px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell className="font-medium">{session.topics_covered || '-'}</TableCell>
                          <TableCell>{session.content_category || '-'}</TableCell>
                          <TableCell>{session.module_name || '-'}</TableCell>
                          <TableCell>{session.facilitator_name || '-'}</TableCell>
                          <TableCell>{session.volunteer_name || '-'}</TableCell>
                          <TableCell>{new Date(session.session_date).toLocaleDateString()}</TableCell>
                          <TableCell>{session.session_time}</TableCell>
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
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-popover">
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
                  {sessions.map((session) => (
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

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-border">
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
        sessionType={selectedSessionType}
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
    </DashboardLayout>
  );
}
