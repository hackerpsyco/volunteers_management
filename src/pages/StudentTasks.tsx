import { useState, useEffect } from 'react';
import { ListTodo, Search, Filter, Clock, CheckCircle2, History } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface StudentTask {
  id: string;
  task_name: string;
  task_description: string;
  deadline: string;
  feedback_type: string;
  status: string;
  feedback_notes?: string;
  submission_link?: string;
  created_at: string;
}

export default function StudentTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'upcoming'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<StudentTask | null>(null);
  const [submissionLink, setSubmissionLink] = useState('');

  useEffect(() => {
    if (user?.email) {
      loadStudentTasks();
    }
  }, [user?.email]);

  const loadStudentTasks = async () => {
    try {
      setLoading(true);
      
      // Get student record first
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('email', user?.email)
        .single();

      if (studentError) throw studentError;

      const { data, error } = await supabase
        .from('student_task_feedback')
        .select('*')
        .eq('student_id', student.id)
        .order('deadline', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Failed to load your tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (task: StudentTask) => {
    setSelectedTask(task);
    setSubmissionLink(task.submission_link || '');
  };

  const handleSubmitTask = async () => {
    if (!selectedTask || !submissionLink.trim()) {
      toast.error('Please enter a submission link');
      return;
    }

    let validLink = submissionLink.trim();
    if (!validLink.startsWith('http://') && !validLink.startsWith('https://')) {
      validLink = `https://${validLink}`;
    }

    try {
      const { error } = await supabase
        .from('student_task_feedback')
        .update({
          submission_link: validLink,
          status: 'submitted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedTask.id);

      if (error) throw error;

      toast.success('Task submitted successfully!');
      setSelectedTask(null);
      loadStudentTasks();
    } catch (error) {
      console.error('Error submitting task:', error);
      toast.error('Failed to submit task');
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.task_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'submitted') return matchesSearch && task.status === 'submitted';
    if (filter === 'pending') return matchesSearch && task.status === 'pending';
    if (filter === 'upcoming') {
      const isPending = task.status === 'pending';
      const isUpcoming = new Date(task.deadline) >= new Date();
      return matchesSearch && isPending && isUpcoming;
    }
    return matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ListTodo className="h-8 w-8 text-primary" />
            My Tasks
          </h1>
          <p className="text-muted-foreground mt-1">Manage and track your assigned activities</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/50 border-none focus-visible:ring-primary"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <Button
              variant={filter === 'all' ? 'default' : 'ghost'}
              onClick={() => setFilter('all')}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={filter === 'upcoming' ? 'default' : 'ghost'}
              onClick={() => setFilter('upcoming')}
              size="sm"
              className="gap-1.5"
            >
              <Clock className="h-4 w-4" />
              Upcoming
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'ghost'}
              onClick={() => setFilter('pending')}
              size="sm"
              className="gap-1.5"
            >
              <History className="h-4 w-4" />
              Pending
            </Button>
            <Button
              variant={filter === 'submitted' ? 'default' : 'ghost'}
              onClick={() => setFilter('submitted')}
              size="sm"
              className="gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              Submitted
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <Card className="border-dashed py-20">
            <CardContent className="flex flex-col items-center gap-4">
              <div className="p-4 bg-muted rounded-full">
                <ListTodo className="h-10 w-10 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">No tasks found</p>
                <p className="text-sm text-muted-foreground">Adjust your filters or search to find what you're looking for</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => (
              <Card 
                key={task.id} 
                className="hover:shadow-md transition-all cursor-pointer group border-border/50"
                onClick={() => handleTaskClick(task)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <Badge variant={
                      task.status === 'pending' ? 'outline' :
                      task.status === 'submitted' ? 'secondary' :
                      'default'
                    }>
                      {task.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {new Date(task.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <CardTitle className="text-xl mt-3 group-hover:text-primary transition-colors">
                    {task.task_name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 mt-1">
                    {task.task_description || 'No description provided'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between pt-4 border-t border-border mt-2">
                    <div className="text-xs text-muted-foreground font-medium">
                      TYPE: {task.feedback_type.toUpperCase()}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTaskClick(task);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{selectedTask?.task_name}</DialogTitle>
            </DialogHeader>
            
            {selectedTask && (
              <div className="space-y-6 pt-4">
                <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Status</span>
                      <p className="font-medium capitalize">{selectedTask.status}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Deadline</span>
                      <p className="font-medium">{new Date(selectedTask.deadline).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {selectedTask.task_description && (
                    <div>
                      <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Description</span>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{selectedTask.task_description}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Submit Your Work
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="submission_link">Link to your work (Google Drive, Github, etc.)</Label>
                    <Input
                      id="submission_link"
                      placeholder="https://example.com/your-work"
                      value={submissionLink}
                      onChange={(e) => setSubmissionLink(e.target.value)}
                    />
                  </div>
                  {selectedTask.submission_link && (
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">Current submission:</p>
                      <a 
                        href={selectedTask.submission_link.startsWith('http') ? selectedTask.submission_link : `https://${selectedTask.submission_link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all"
                      >
                        {selectedTask.submission_link}
                      </a>
                    </div>
                  )}
                </div>

                <DialogFooter className="gap-3 pt-4">
                  <Button variant="outline" onClick={() => setSelectedTask(null)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitTask} className="flex-1">
                    Save Submission
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
