import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
}

interface TaskGroup {
  title: string;
  description: string;
  created_at: string;
  due_date: string;
  tasks: TaskItem[];
}

export default function TaskDetail() {
  const navigate = useNavigate();
  const { taskTitle } = useParams();
  const [taskGroup, setTaskGroup] = useState<TaskGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTaskDetail();
  }, [taskTitle]);

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
          students:student_id(name),
          sessions:session_id(title, class_batch)
        `)
        .eq('task_name', decodeURIComponent(taskTitle || ''))
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
        }));

        setTaskGroup({
          title: data[0].task_name,
          description: data[0].task_description || '',
          created_at: data[0].created_at || new Date().toISOString(),
          due_date: data[0].deadline || '',
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
      const { error } = await supabase
        .from('student_task_feedback')
        .update({ status: 'completed' })
        .eq('id', taskId);

      if (error) throw error;

      if (taskGroup) {
        setTaskGroup({
          ...taskGroup,
          tasks: taskGroup.tasks.map(t =>
            t.id === taskId ? { ...t, status: 'completed' } : t
          ),
        });
      }

      toast.success('Task marked as completed');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    } finally {
      setUpdatingId(null);
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

        {/* Task Summary */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  className="font-medium mt-1 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: taskGroup.description }}
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
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
