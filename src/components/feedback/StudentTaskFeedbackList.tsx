import { useState, useEffect } from 'react';
import { Trash2, ExternalLink, Edit } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StudentTaskFeedback {
  id: string;
  student_id: string;
  student_name?: string;
  feedback_type: string;
  task_name: string;
  deadline?: string;
  submission_link?: string;
  status: string;
  created_at: string;
}

interface StudentTaskFeedbackListProps {
  sessionId: string;
  onRefresh?: () => void;
}

export function StudentTaskFeedbackList({
  sessionId,
  onRefresh,
}: StudentTaskFeedbackListProps) {
  const [feedbacks, setFeedbacks] = useState<StudentTaskFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedbacks();
  }, [sessionId]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('student_task_feedback')
        .select(`
          id,
          student_id,
          feedback_type,
          task_name,
          deadline,
          submission_link,
          status,
          created_at,
          students:student_id(name)
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedData = (data || []).map((item: any) => ({
        ...item,
        student_name: item.students?.name || 'Unknown',
      }));

      setFeedbacks(transformedData);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      toast.error('Failed to load feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;

    try {
      const { error } = await supabase
        .from('student_task_feedback')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Feedback deleted');
      setFeedbacks(feedbacks.filter((f) => f.id !== id));
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast.error('Failed to delete feedback');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'reviewed':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading feedbacks...</div>;
  }

  if (feedbacks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No task feedbacks yet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Task Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submission</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {feedbacks.map((feedback) => (
            <TableRow key={feedback.id}>
              <TableCell className="font-medium">{feedback.student_name}</TableCell>
              <TableCell>{feedback.task_name}</TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {feedback.feedback_type}
                </Badge>
              </TableCell>
              <TableCell>
                {feedback.deadline
                  ? new Date(feedback.deadline).toLocaleDateString()
                  : '-'}
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(feedback.status)}>
                  {feedback.status}
                </Badge>
              </TableCell>
              <TableCell>
                {feedback.submission_link ? (
                  <a
                    href={feedback.submission_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(feedback.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
