import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Edit2, Trash2, XCircle, MessageSquare, Pencil, Calendar, Download } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logActivity } from '@/utils/activityLogger';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  feedback_type?: string;
  rejection_comment?: string | null;
  feedback_notes?: string | null;
  volunteer_name?: string;
  facilitator_name?: string;
}

interface TaskGroup {
  title: string;
  description: string;
  created_at: string;
  due_date: string;
  academic_year: string;
  class_name: string;
  volunteer_name?: string;
  facilitator_name?: string;
  tasks: TaskItem[];
}

export default function TaskDetail() {
  const navigate = useNavigate();
  const { taskTitle } = useParams();
  const [taskGroup, setTaskGroup] = useState<TaskGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [verifyingTaskId, setVerifyingTaskId] = useState<string | null>(null);
  const [verifyingAmount, setVerifyingAmount] = useState<number | ''>(5);
  const [verificationComment, setVerificationComment] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  // Reject dialog state
  const [rejectingTaskId, setRejectingTaskId] = useState<string | null>(null);
  const [rejectionComment, setRejectionComment] = useState('');
  const [editingCommentTaskId, setEditingCommentTaskId] = useState<string | null>(null);
  const [editCommentValue, setEditCommentValue] = useState('');
  const [editingDeadlineTaskId, setEditingDeadlineTaskId] = useState<string | null>(null);
  const [editDeadlineValue, setEditDeadlineValue] = useState('');

  const { selectedYear } = useAcademicYear();
  const { user } = useAuth();

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
          feedback_type,
          rejection_comment,
          feedback_notes,
          created_at,
          students:student_id(name),
          sessions:session_id(title, class_batch, volunteer_name, facilitator_name)
        `)
        .eq('task_name', decodeURIComponent(taskTitle || ''))
        .eq('academic_year', selectedYear)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Calculate the oldest created_at timestamp as the original creation date
        let oldestCreatedAt = data[0].created_at;
        data.forEach((task: any) => {
          if (task.created_at && (!oldestCreatedAt || new Date(task.created_at) < new Date(oldestCreatedAt))) {
            oldestCreatedAt = task.created_at;
          }
        });

        // Calculate the minimum (original) deadline across all assigned students
        let earliestDeadline = null;
        data.forEach((task: any) => {
          if (task.deadline) {
            if (!earliestDeadline || new Date(task.deadline) < new Date(earliestDeadline)) {
              earliestDeadline = task.deadline;
            }
          }
        });

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
          created_at: task.created_at || '',
          student_name: task.students?.name || '-',
          session_title: task.sessions?.title || '-',
          class_name: task.sessions?.class_batch || '-',
          earning_amount: task.earning_amount || 0,
          feedback_type: task.feedback_type || '',
          rejection_comment: task.rejection_comment || null,
          feedback_notes: task.feedback_notes || null,
          volunteer_name: task.sessions?.volunteer_name || '-',
          facilitator_name: task.sessions?.facilitator_name || '-',
        }));

        setTaskGroup({
          title: data[0].task_name,
          description: data[0].task_description || '',
          created_at: oldestCreatedAt || new Date().toISOString(),
          due_date: earliestDeadline || data[0].deadline || '',
          academic_year: data[0].academic_year || '-',
          class_name: data[0].sessions?.class_batch || '-',
          volunteer_name: data[0].sessions?.volunteer_name || '-',
          facilitator_name: data[0].sessions?.facilitator_name || '-',
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

  const handleMarkAsDone = async (taskId: string, amount: number, comment: string) => {
    try {
      setUpdatingId(taskId);
      
      const task = taskGroup?.tasks.find(t => t.id === taskId);
      if (!task) return;

      const maxAmount = task.earning_amount || 5;
      if (amount > maxAmount) {
        toast.error(`Earning units cannot exceed the task limit of ${maxAmount} units.`);
        setUpdatingId(null);
        return;
      }

      const { data, error } = await supabase
        .from('student_task_feedback')
        .update({ 
          status: 'completed', 
          earning_amount: amount, 
          feedback_notes: comment || null,
          verified_by: user?.id || null,
          updated_at: new Date().toISOString() 
        })
        .eq('id', taskId)
        .select();

      if (error) throw error;
      
      await logActivity('VERIFY', 'Tasks', `Approved task submission: ${task.title} for student: ${task.student_name} (Points: ${amount})`);
      
      if (!data || data.length === 0) {
        throw new Error('No rows updated. You might not have permission or student mapping is incorrect.');
      }

      // Add or update earning record
      const earningDesc = `Completed task: ${task.title} (Verified)` + (comment ? `. Note: ${comment}` : '');
      
      const { data: existingEarning } = await supabase
        .from('student_earnings')
        .select('id')
        .eq('student_id', task.student_id)
        .eq('task_id', taskId)
        .maybeSingle();

      let earningError = null;
      if (existingEarning) {
        const { error } = await supabase
          .from('student_earnings')
          .update({ amount: amount, description: earningDesc })
          .eq('id', existingEarning.id);
        earningError = error;
      } else {
        const { error } = await supabase.from('student_earnings').insert({
          student_id: task.student_id,
          task_id: taskId,
          amount: amount,
          description: earningDesc
        });
        earningError = error;
      }

      if (earningError) {
        console.error('Error adding earnings:', earningError);
        toast.warning('Task completed, but failed to add earnings');
      }

      // Add reviewer earning if the verifying user is a student (class leader/monitor)
      if (user?.email) {
        const { data: reviewerStudent } = await supabase
          .from('students')
          .select('id, name')
          .ilike('email', user.email)
          .limit(1)
          .maybeSingle();

        if (reviewerStudent) {
          const { data: configData } = await supabase
            .from('reward_configurations')
            .select('reviewer_rate')
            .eq('task_type', task.feedback_type)
            .maybeSingle();

          const reviewerRate = configData?.reviewer_rate ? Number(configData.reviewer_rate) : 0;
          if (reviewerRate > 0) {
            const reviewerDesc = `Reviewed task: ${task.title} for ${task.student_name}`;
            const { error: reviewerEarningError } = await supabase.from('student_earnings').insert({
              student_id: reviewerStudent.id,
              task_id: taskId,
              amount: reviewerRate,
              description: reviewerDesc
            });

            if (reviewerEarningError) {
              console.error('Error adding reviewer earnings:', reviewerEarningError);
            } else {
              toast.success(`Added ₹${reviewerRate} reviewer earning for ${reviewerStudent.name}`);
            }
          }
        }
      }

      if (taskGroup) {
        setTaskGroup({
          ...taskGroup,
          tasks: taskGroup.tasks.map(t =>
            t.id === taskId ? { ...t, status: 'completed', earning_amount: amount, feedback_notes: comment || null, rejection_comment: null } : t
          ),
        });
      }

      toast.success('Task verified successfully');
      setVerifyingTaskId(null);
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task: ' + (error.message || 'Unknown error'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRejectTask = async () => {
    const taskId = rejectingTaskId;
    if (!taskId) return;
    try {
      setUpdatingId(taskId);
      
      const task = taskGroup?.tasks.find(t => t.id === taskId);
      if (!task) return;
      
      if (task.submission_link) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const links = task.submission_link.split(',');
          for (const link of links) {
            if (link.includes('drive.google.com')) {
              await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-to-gdrive`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ link: link.trim() })
              });
            }
          }
        } catch (err) {
          console.error("Failed to delete files from Google Drive", err);
        }
      }

      const { data, error } = await supabase
        .from('student_task_feedback')
        .update({ 
          status: 'rejected', 
          rejection_comment: rejectionComment.trim() || null,
          feedback_notes: null,
          submission_link: null,
          updated_at: new Date().toISOString() 
        })
        .eq('id', taskId)
        .select();

      if (error) throw error;
      
      await logActivity('REJECT', 'Tasks', `Rejected task submission: ${task.title} for student: ${task.student_name}. Reason: ${rejectionComment}`);
      
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
            t.id === taskId ? { ...t, status: 'rejected', rejection_comment: rejectionComment.trim() || null, submission_link: null, feedback_notes: null } : t
          )
        });
      }

      toast.success('Task rejected with comment');
      setRejectingTaskId(null);
      setRejectionComment('');
    } catch (error: any) {
      console.error('Error rejecting task:', error);
      toast.error('Failed to reject task: ' + (error.message || 'Unknown error'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleEditComment = async () => {
    const taskId = editingCommentTaskId;
    if (!taskId) return;
    try {
      setUpdatingId(taskId);
      const { error } = await supabase
        .from('student_task_feedback')
        .update({ rejection_comment: editCommentValue.trim() || null, updated_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;

      if (taskGroup) {
        setTaskGroup({
          ...taskGroup,
          tasks: taskGroup.tasks.map(t =>
            t.id === taskId ? { ...t, rejection_comment: editCommentValue.trim() || null } : t
          ),
        });
      }
      toast.success('Rejection comment updated');
      setEditingCommentTaskId(null);
      setEditCommentValue('');
    } catch (error: any) {
      toast.error('Failed to update comment: ' + (error.message || 'Unknown error'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleEditDeadline = async () => {
    if (!editingDeadlineTaskId) return;
    try {
      setUpdatingId(editingDeadlineTaskId);
      const { error } = await supabase
        .from('student_task_feedback')
        .update({
          deadline: editDeadlineValue ? new Date(editDeadlineValue).toISOString() : null
        })
        .eq('id', editingDeadlineTaskId);

      if (error) throw error;
      const targetTask = taskGroup?.tasks.find(t => t.id === editingDeadlineTaskId);
      await logActivity('UPDATE', 'Tasks', `Updated deadline for task: ${decodeURIComponent(taskTitle || '')} for student: ${targetTask ? targetTask.student_name : editingDeadlineTaskId} to ${editDeadlineValue}`);
      toast.success('Deadline updated successfully!');
      fetchTaskDetail();
      setEditingDeadlineTaskId(null);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to update deadline: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteTask = async () => {
    try {
      const { error } = await supabase
        .from('student_task_feedback')
        .delete()
        .eq('task_name', decodeURIComponent(taskTitle || ''))
        .eq('academic_year', selectedYear);

      if (error) throw error;

      await logActivity('DELETE', 'Tasks', `Deleted task: ${decodeURIComponent(taskTitle || '')}`);

      toast.success('Task deleted successfully');
      navigate('/tasks');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    } finally {
      setDeleteDialogOpen(false);
      setDeleteConfirmText('');
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
      {/* PRINT VIEW - Only visible when printing */}
      <div className="hidden print:block w-full max-w-none bg-white text-black p-4 space-y-6">
        <div className="text-[10px] text-gray-500 mb-4 border-b pb-2 break-all">
          Task URL: {window.location.href}
        </div>
        
        {/* Header Info */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">{taskGroup.title}</h1>
          <div className="grid grid-cols-2 gap-y-2 gap-x-8 text-sm">
             <p><strong>Class:</strong> {taskGroup.class_name || '-'}</p>
             <p><strong>Volunteer:</strong> {taskGroup.volunteer_name || '-'}</p>
             <p><strong>Facilitator:</strong> {taskGroup.facilitator_name || '-'}</p>
             <p><strong>Year:</strong> {taskGroup.academic_year || '-'}</p>
             <p><strong>Created:</strong> {new Date(taskGroup.created_at).toLocaleDateString()}</p>
             <p><strong>Deadline:</strong> {taskGroup.due_date ? new Date(taskGroup.due_date).toLocaleDateString() : '-'}</p>
             <p><strong>Total Students:</strong> {taskGroup.tasks.length}</p>
             <p><strong>Completed:</strong> {taskGroup.tasks.filter(t => t.status === 'completed').length}</p>
          </div>
        </div>

        {taskGroup.description && (
          <>
            <hr className="border-gray-300" />
            <div className="space-y-2 text-sm">
              <h2 className="text-lg font-bold">Description</h2>
              <div 
                className="prose prose-sm text-black" 
                dangerouslySetInnerHTML={{ __html: taskGroup.description }} 
              />
            </div>
          </>
        )}

        <hr className="border-gray-300" />

        {/* Student Submissions List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Student Submissions</h2>
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-300 bg-gray-50">
                <th className="py-2 px-3 font-bold">Student Name</th>
                <th className="py-2 px-3 font-bold">Class</th>
                <th className="py-2 px-3 font-bold">Status</th>
                <th className="py-2 px-3 font-bold">Submission Link(s)</th>
                <th className="py-2 px-3 font-bold">Feedback / Comments</th>
              </tr>
            </thead>
            <tbody>
              {taskGroup.tasks.map((task) => (
                <tr key={task.id} className="border-b border-gray-200">
                  <td className="py-2.5 px-3 font-medium">{task.student_name}</td>
                  <td className="py-2.5 px-3">{task.class_name}</td>
                  <td className="py-2.5 px-3 capitalize">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                      task.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                      task.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 break-all">
                    {task.submission_link ? (
                      <div className="space-y-1">
                        {task.submission_link.split(',').filter(Boolean).map((link, idx) => (
                          <div key={idx}>
                            <a 
                              href={link.trim()} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 underline hover:text-blue-800"
                            >
                              {link.trim()}
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">No submission</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-xs">
                    {task.status === 'rejected' && task.rejection_comment && (
                      <p className="text-red-600"><strong>Rejected:</strong> {task.rejection_comment}</p>
                    )}
                    {task.status === 'completed' && task.feedback_notes && (
                      <p className="text-green-700"><strong>Verified Note:</strong> {task.feedback_notes}</p>
                    )}
                    {!task.rejection_comment && !task.feedback_notes && (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6 print:hidden">
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
              onClick={() => window.print()}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
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
              onClick={() => setDeleteDialogOpen(true)}
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Class</span>
                <p className="font-medium">{taskGroup.class_name}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Volunteer</span>
                <p className="font-medium text-sm break-all">{taskGroup.volunteer_name || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Facilitator</span>
                <p className="font-medium text-sm break-all">{taskGroup.facilitator_name || '-'}</p>
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
                  className="prose prose-sm max-w-none text-muted-foreground task-description-content"
                  dangerouslySetInnerHTML={{ __html: taskGroup.description }}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.tagName === 'IMG') {
                      setLightboxImage((target as HTMLImageElement).src);
                    }
                    if (target.tagName === 'A') {
                      e.preventDefault();
                      const href = target.getAttribute('href');
                      if (href) {
                        window.open(href, '_blank', 'noopener,noreferrer');
                      }
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
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <Input
                type="text"
                placeholder="Search student..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="max-w-sm h-8 text-xs flex-1"
              />
              <div className="flex gap-2 w-full sm:w-auto">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 w-[140px] text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                  <SelectTrigger className="h-8 w-[140px] text-xs">
                    <SelectValue placeholder="Verification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Verification</SelectItem>
                    <SelectItem value="to_verify">To Verify</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              {taskGroup.tasks.filter(t => {
                const matchesSearch = t.student_name.toLowerCase().includes(studentSearchQuery.toLowerCase());
                const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
                let matchesVerification = true;
                if (verificationFilter === 'to_verify') {
                  matchesVerification = t.status === 'submitted';
                } else if (verificationFilter === 'verified') {
                  matchesVerification = t.status === 'completed';
                }
                return matchesSearch && matchesStatus && matchesVerification;
              }).map((task) => (
                <div key={task.id} className="flex flex-col gap-2 p-4 bg-muted/30 rounded border border-border">
                  <div className="flex items-center justify-between gap-3">
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
                            : task.status === 'rejected'
                            ? 'destructive'
                            : task.status === 'in_progress'
                            ? 'outline'
                            : 'secondary'
                        }
                        className={task.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100' : ''}
                      >
                        {task.status}
                      </Badge>
                      {task.submission_link && (
                        <div className="flex gap-1.5">
                          {task.submission_link.split(',').filter(Boolean).map((link, idx) => (
                            <a
                              key={idx}
                              href={link.trim()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline bg-primary/10 p-1.5 rounded-md"
                              title={`View File ${idx + 1}`}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        {task.status !== 'pending' && task.status !== 'rejected' && (
                          <Button
                            size="sm"
                            className={task.status === 'completed' ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}
                            onClick={() => {
                              setVerifyingTaskId(task.id);
                              setVerifyingAmount(task.earning_amount || 5);
                              setVerificationComment('');
                            }}
                            disabled={updatingId === task.id}
                          >
                            {updatingId === task.id ? 'Updating...' : (task.status === 'completed' ? 'Re-Verify' : 'Verify')}
                          </Button>
                        )}
                        {task.status !== 'pending' && task.status !== 'rejected' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRejectingTaskId(task.id);
                              setRejectionComment('');
                            }}
                            disabled={updatingId === task.id}
                            className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        )}
                        {task.status === 'rejected' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingCommentTaskId(task.id);
                              setEditCommentValue(task.rejection_comment || '');
                            }}
                            disabled={updatingId === task.id}
                            className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Edit Comment
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingDeadlineTaskId(task.id);
                            // Convert Date to YYYY-MM-DDThh:mm format for datetime-local input
                            const d = task.due_date ? new Date(task.due_date) : null;
                            const formattedDate = d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
                            setEditDeadlineValue(formattedDate);
                          }}
                          disabled={updatingId === task.id}
                          className="text-xs text-orange-600 border-orange-200 hover:bg-orange-50"
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit Deadline
                        </Button>
                      </div>
                    </div>
                  </div>
                  {/* Rejection comment display */}
                  {task.status === 'rejected' && task.rejection_comment && (
                    <div className="flex items-start gap-2 mt-1 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                      <MessageSquare className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-red-600 mb-0.5">Rejection Reason:</p>
                        <p className="text-sm text-red-700">{task.rejection_comment}</p>
                      </div>
                    </div>
                  )}
                  {/* Verified comment display */}
                  {task.status === 'completed' && task.feedback_notes && (
                    <div className="flex items-start gap-2 mt-1 px-3 py-2 rounded-lg bg-green-50 border border-green-200">
                      <MessageSquare className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-green-600 mb-0.5">Verified Note:</p>
                        <p className="text-sm text-green-700">{task.feedback_notes}</p>
                      </div>
                    </div>
                  )}
                  {task.status === 'rejected' && !task.rejection_comment && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200">
                      <MessageSquare className="h-3.5 w-3.5 text-red-400" />
                      <p className="text-xs text-red-500 italic">No rejection reason added. Click "Edit Comment" to add one.</p>
                    </div>
                  )}
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
      {/* Reject Dialog */}
      <Dialog open={!!rejectingTaskId} onOpenChange={(open) => { if (!open) { setRejectingTaskId(null); setRejectionComment(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Reject Task Submission
            </DialogTitle>
            <DialogDescription>
              Rejecting this will set the task status to <strong>Rejected</strong> and remove any earnings. Please add a reason so the student knows why their work was rejected.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="rejection-comment">Rejection Reason <span className="text-muted-foreground font-normal">(required)</span></Label>
              <Textarea
                id="rejection-comment"
                placeholder="e.g. Submission link is broken, work is incomplete, wrong format..."
                value={rejectionComment}
                onChange={(e) => setRejectionComment(e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">This comment will be shown to the student in their task details.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectingTaskId(null); setRejectionComment(''); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectTask}
              disabled={!rejectionComment.trim() || updatingId === rejectingTaskId}
            >
              {updatingId === rejectingTaskId ? 'Rejecting...' : 'Confirm Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Rejection Comment Dialog */}
      <Dialog open={!!editingCommentTaskId} onOpenChange={(open) => { if (!open) { setEditingCommentTaskId(null); setEditCommentValue(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Rejection Comment
            </DialogTitle>
            <DialogDescription>
              Update the rejection reason shown to the student.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-rejection-comment">Rejection Reason</Label>
              <Textarea
                id="edit-rejection-comment"
                placeholder="Enter rejection reason..."
                value={editCommentValue}
                onChange={(e) => setEditCommentValue(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingCommentTaskId(null); setEditCommentValue(''); }}>
              Cancel
            </Button>
            <Button
              onClick={handleEditComment}
              disabled={updatingId === editingCommentTaskId}
            >
              {updatingId === editingCommentTaskId ? 'Saving...' : 'Save Comment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Deadline Dialog */}
      <Dialog open={!!editingDeadlineTaskId} onOpenChange={(open) => { if (!open) { setEditingDeadlineTaskId(null); setEditDeadlineValue(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Edit Task Deadline
            </DialogTitle>
            <DialogDescription>
              Update the deadline for this specific student.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-deadline">New Deadline</Label>
              <Input
                id="edit-deadline"
                type="datetime-local"
                value={editDeadlineValue}
                onChange={(e) => setEditDeadlineValue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingDeadlineTaskId(null); setEditDeadlineValue(''); }}>
              Cancel
            </Button>
            <Button
              onClick={handleEditDeadline}
              disabled={updatingId === editingDeadlineTaskId}
            >
              {updatingId === editingDeadlineTaskId ? 'Saving...' : 'Save Deadline'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verification Dialog */}
      <Dialog open={!!verifyingTaskId} onOpenChange={(open) => !open && setVerifyingTaskId(null)}>
        <DialogContent className="max-w-md">
          {(() => {
            const maxAmount = verifyingTaskId ? (taskGroup.tasks.find(t => t.id === verifyingTaskId)?.earning_amount || 5) : 5;
            return (
              <>
                <DialogHeader>
                  <DialogTitle>Verify Submission</DialogTitle>
                  <DialogDescription>
                    Assign the earning units and add an optional comment explaining any adjustments for {taskGroup.tasks.find(t => t.id === verifyingTaskId)?.student_name}'s work.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="verifying-amount" className={cn(verifyingAmount !== '' && verifyingAmount > maxAmount && "text-destructive")}>Earning Units (Credits)</Label>
                    <Input
                      id="verifying-amount"
                      type="number"
                      value={verifyingAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setVerifyingAmount(val === '' ? '' : Number(val));
                      }}
                      min={0}
                      max={maxAmount}
                      className={cn("w-full", verifyingAmount !== '' && verifyingAmount > maxAmount && "border-destructive focus-visible:ring-destructive")}
                    />
                    {verifyingAmount !== '' && verifyingAmount > maxAmount ? (
                      <p className="text-xs text-destructive font-semibold">
                        Earning units cannot exceed the task limit of {maxAmount} units.
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Default starting units for this task: {maxAmount} units
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="verifying-comment">Comment / Notes (Optional)</Label>
                    <Textarea
                      id="verifying-comment"
                      placeholder="Explain why the money was edited or any other notes for the student..."
                      value={verificationComment}
                      onChange={(e) => setVerificationComment(e.target.value)}
                      className="w-full min-h-[80px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      This note will be shown to the student as a Teacher's Note and logged in their earnings report.
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setVerifyingTaskId(null)}
                    disabled={updatingId === verifyingTaskId}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (verifyingTaskId) {
                        handleMarkAsDone(verifyingTaskId, verifyingAmount === '' ? 0 : verifyingAmount, verificationComment);
                      }
                    }}
                    disabled={updatingId === verifyingTaskId || verifyingAmount === '' || verifyingAmount > maxAmount}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {updatingId === verifyingTaskId ? 'Verifying...' : 'Confirm Verified'}
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        setDeleteDialogOpen(open);
        if (!open) {
          setDeleteConfirmText('');
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Are you sure you want to delete this task? This will delete it for all students and cannot be undone.
                </p>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm:
                  </p>
                  <Input
                    id="delete-confirm-input"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE here"
                    className="border-destructive/50 focus-visible:ring-destructive"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              disabled={deleteConfirmText !== 'DELETE'}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
