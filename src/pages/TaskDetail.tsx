import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Edit2, Trash2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { useAcademicYear } from '@/contexts/AcademicYearContext';

interface TaskItem {
  id: string;
  title: string;
  description: string;
  class_id: string;
  session_id: string;
  student_id: string;
  status: string;
  submission_link: string;
  due_date: string;
  created_at: string;
  student_name?: string;
  session_title?: string;
  class_name?: string;
  earning_amount?: number;
}

interface TaskGroup {
  title: string;
  description: string;
  created_at: string;
  due_date: string;
  academic_year: string;
  class_name: string;
  tasks: TaskItem[];
}

export default function TaskDetail() {
  const navigate = useNavigate();
  const { taskTitle } = useParams();
  const [taskGroup, setTaskGroup] = useState<TaskGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const { selectedYear } = useAcademicYear();

  useEffect(() => {
    fetchTaskDetail();
  }, [taskTitle, selectedYear]);

  const fetchTaskDetail = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('student_task_feedback')
        .select(`
          id,
          task_name,
          task_description,
          deadline,
          submission_link,
          status,
          student_id,
          session_id,
          earning_amount,
          academic_year,
          students:student_id(name),
          sessions:session_id(title, class_batch)
        `)
        .eq('task_name', decodeURIComponent(taskTitle || ''))
        .eq('academic_year', selectedYear)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const enriched: TaskItem[] = data.map((task: any) => ({
          id: task.id,
          title: task.task_name || '',
          description: task.task_description || '',
          class_id: '',
          session_id: task.session_id || '',
          student_id: task.student_id || '',
          status: task.status || 'pending',
          submission_link: task.submission_link || '',
          due_date: task.deadline || '',
          created_at: '',
          student_name: task.students?.name || '-',
          session_title: task.sessions?.title || '-',
          class_name: task.sessions?.class_batch || '-',
          earning_amount: task.earning_amount || 0,
        }));

        setTaskGroup({
          title: data[0].task_name,
          description: data[0].task_description || '',
          created_at: data[0].created_at || new Date().toISOString(),
          due_date: data[0].deadline || '',
          academic_year: data[0].academic_year || '-',
          class_name: data[0].sessions?.class_batch || '-',
          tasks: enriched,
        });
      }
    } catch (error) {
      console.error('Error fetching task detail:', error);
      toast.error('Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsDone = async (taskId: string) => {
    try {
      setUpdatingId(taskId);
      
      const task = taskGroup?.tasks.find(t => t.id === taskId);
      if (!task) return;

      const { data, error } = await supabase
        .from('student_task_feedback')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', taskId)
        .select();

      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('No rows updated. You might not have permission or student mapping is incorrect.');
      }

      // Add earning record
      const { error: earningError } = await supabase.from('student_earnings').insert({
        student_id: task.student_id,
        task_id: taskId,
        amount: task.earning_amount || 5,
        description: `Completed task: ${task.title} (Verified by Admin/Monitor)`
      });

      if (earningError) {
        console.error('Error adding earnings:', earningError);
        toast.warning('Task completed, but failed to add earnings');
      }

      if (taskGroup) {
        setTaskGroup({
          ...taskGroup,
          tasks: taskGroup.tasks.map(t =>
            t.id === taskId ? { ...t, status: 'completed' } : t
          ),
        });
      }

      toast.success('Task marked as completed and earnings added');
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task: ' + (error.message || 'Unknown error'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResetToPending = async (taskId: string) => {
    try {
      if (!confirm('Are you sure you want to reset this task to pending? This will remove any earnings associated with this task.')) return;
      
      setUpdatingId(taskId);
      
      const { data, error } = await supabase
        .from('student_task_feedback')
        .update({ status: 'pending', updated_at: new Date().toISOString() })
        .eq('id', taskId)
        .select();

      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('No rows updated. You might not have permission.');
      }

      // Remove earnings associated with this specific task record
      await supabase
        .from('student_earnings')
        .delete()
        .eq('task_id', taskId);

      if (taskGroup) {
        setTaskGroup({
          ...taskGroup,
          tasks: taskGroup.tasks.map(t =>
            t.id === taskId ? { ...t, status: 'pending' } : t
          ),
        });
      }

      toast.success('Task reset to pending and earnings removed');
    } catch (error: any) {
      console.error('Error resetting task:', error);
      toast.error('Failed to reset task: ' + (error.message || 'Unknown error'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteTask = async () => {
    if (!confirm('Are you sure you want to delete this task? This will delete it for all students.')) return;

    try {
      const { error } = await supabase
        .from('student_task_feedback')
        .delete()
        .eq('task_name', decodeURIComponent(taskTitle || ''))
        .eq('academic_year', selectedYear);

      if (error) throw error;

      toast.success('Task deleted successfully');
      navigate('/tasks');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!taskGroup) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Task not found</p>
          <Button onClick={() => navigate('/tasks')} className="mt-4">
            Back to Tasks
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/tasks')}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{taskGroup.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">Task Details & Student Submissions</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/tasks/${encodeURIComponent(taskGroup.title)}/edit`)}
              className="gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteTask}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Task Summary */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Class</span>
                <p className="font-medium">{taskGroup.class_name}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Year</span>
                <p className="font-medium">{taskGroup.academic_year}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Created</span>
                <p className="font-medium">{new Date(taskGroup.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Deadline</span>
                <p className="font-medium">{taskGroup.due_date ? new Date(taskGroup.due_date).toLocaleDateString() : '-'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Total Students</span>
                <p className="font-medium">{taskGroup.tasks.length}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Completed</span>
                <p className="font-medium">{taskGroup.tasks.filter(t => t.status === 'completed').length}</p>
              </div>
            </div>
            {taskGroup.description && (
              <div className="mt-4 pt-4 border-t border-border">
                <span className="text-sm text-muted-foreground">Description</span>
                <div 
                  className="font-medium mt-1 prose prose-sm max-w-none task-description-content"
                  dangerouslySetInnerHTML={{ __html: taskGroup.description }}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.tagName === 'IMG') {
                      setLightboxImage((target as HTMLImageElement).src);
                    }
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Details */}
        <Card>
          <CardHeader>
            <CardTitle>Student Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {taskGroup.tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 bg-muted/30 rounded border border-border">
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{task.student_name}</div>
                    <div className="text-sm text-muted-foreground">{task.class_name}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        task.status === 'completed'
                          ? 'default'
                          : task.status === 'submitted'
                          ? 'secondary'
                          : task.status === 'in_progress'
                          ? 'outline'
                          : 'secondary'
                      }
                    >
                      {task.status}
                    </Badge>
                    {task.submission_link && (
                      <a
                        href={task.submission_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <div className="flex gap-2">
                      {task.status !== 'completed' && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleMarkAsDone(task.id)}
                          disabled={updatingId === task.id}
                        >
                          {updatingId === task.id ? 'Updating...' : 'Done'}
                        </Button>
                      )}
                      {task.status !== 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResetToPending(task.id)}
                          disabled={updatingId === task.id}
                          className="text-xs"
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      {/* Lightbox Modal */}
      <Dialog open={!!lightboxImage} onOpenChange={(open) => !open && setLightboxImage(null)}>
        <DialogContent className="max-w-4xl p-1 bg-black/90 border-none overflow-hidden flex items-center justify-center rounded-xl shadow-2xl">
          <div className="relative w-full h-full max-h-[85vh] flex items-center justify-center p-2">
            <img 
              src={lightboxImage || ''} 
              alt="Full size task attachment" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-lg" 
            />
            <button 
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors duration-200"
              title="Close preview"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}
