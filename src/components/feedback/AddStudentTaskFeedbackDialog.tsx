import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AddStudentTaskFeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  classId?: string;
  onSuccess?: () => void;
}

interface Student {
  id: string;
  name: string;
  roll_number?: string;
}

export function AddStudentTaskFeedbackDialog({
  isOpen,
  onClose,
  sessionId,
  classId,
  onSuccess,
}: AddStudentTaskFeedbackDialogProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    student_id: '',
    feedback_type: 'task',
    task_name: '',
    task_description: '',
    deadline: '',
    submission_link: '',
    feedback_notes: '',
  });

  // Fetch students from session's class
  useEffect(() => {
    if (isOpen && sessionId) {
      fetchStudents();
    }
  }, [isOpen, sessionId]);

  const fetchStudents = async () => {
    try {
      setLoading(true);

      // First, get the session to find its class
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('class_id, class_batch')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      console.log('📍 Session data:', sessionData);

      // Use class_id if available, otherwise try to match by class_batch name
      let classId = sessionData?.class_id;
      
      if (!classId && sessionData?.class_batch) {
        // Try to find class by name matching class_batch
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select('id')
          .ilike('name', `%${sessionData.class_batch}%`)
          .single();

        if (classError) {
          console.warn('Could not find class by name:', sessionData.class_batch);
        } else {
          classId = classData?.id;
        }
      }

      if (!classId) {
        toast.error('Session has no class assigned');
        return;
      }

      // Then fetch students from that class
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, name, student_id')
        .eq('class_id', classId)
        .order('name', { ascending: true });

      if (studentsError) throw studentsError;

      console.log('👥 Students fetched:', studentsData?.length || 0);
      setStudents(studentsData || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.student_id || !formData.task_name) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('student_task_feedback')
        .insert({
          session_id: sessionId,
          student_id: formData.student_id,
          feedback_type: formData.feedback_type,
          task_name: formData.task_name,
          task_description: formData.task_description || null,
          deadline: formData.deadline || null,
          submission_link: formData.submission_link || null,
          feedback_notes: formData.feedback_notes || null,
          status: 'pending',
        });

      if (error) throw error;

      toast.success('Task feedback added successfully');
      setFormData({
        student_id: '',
        feedback_type: 'task',
        task_name: '',
        task_description: '',
        deadline: '',
        submission_link: '',
        feedback_notes: '',
      });
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast.error('Failed to save task feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Student Task Feedback</DialogTitle>
          <DialogDescription>
            Create a task or assignment feedback for a student
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student Selection */}
          <div className="space-y-2">
            <Label htmlFor="student">Student *</Label>
            <Select
              value={formData.student_id}
              onValueChange={(value) =>
                setFormData({ ...formData, student_id: value })
              }
            >
              <SelectTrigger id="student">
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                    {student.student_id && ` (${student.student_id})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Feedback Type */}
          <div className="space-y-2">
            <Label htmlFor="feedback-type">Feedback Type</Label>
            <Select
              value={formData.feedback_type}
              onValueChange={(value) =>
                setFormData({ ...formData, feedback_type: value })
              }
            >
              <SelectTrigger id="feedback-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="task">Task</SelectItem>
                <SelectItem value="homework">Homework</SelectItem>
                <SelectItem value="assignment">Assignment</SelectItem>
                <SelectItem value="deadline">Deadline</SelectItem>
                <SelectItem value="project">Project</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Task Name */}
          <div className="space-y-2">
            <Label htmlFor="task-name">Task Name *</Label>
            <Input
              id="task-name"
              placeholder="e.g., Chapter 5 Exercise"
              value={formData.task_name}
              onChange={(e) =>
                setFormData({ ...formData, task_name: e.target.value })
              }
              required
            />
          </div>

          {/* Task Description */}
          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              placeholder="Describe the task or assignment"
              value={formData.task_description}
              onChange={(e) =>
                setFormData({ ...formData, task_description: e.target.value })
              }
              rows={3}
            />
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) =>
                setFormData({ ...formData, deadline: e.target.value })
              }
            />
          </div>

          {/* Submission Link */}
          <div className="space-y-2">
            <Label htmlFor="submission-link">Submission Link</Label>
            <Input
              id="submission-link"
              type="url"
              placeholder="https://example.com/submission"
              value={formData.submission_link}
              onChange={(e) =>
                setFormData({ ...formData, submission_link: e.target.value })
              }
            />
          </div>

          {/* Feedback Notes */}
          <div className="space-y-2">
            <Label htmlFor="feedback-notes">Feedback Notes</Label>
            <Textarea
              id="feedback-notes"
              placeholder="Add any additional notes or instructions"
              value={formData.feedback_notes}
              onChange={(e) =>
                setFormData({ ...formData, feedback_notes: e.target.value })
              }
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || loading}>
              {submitting ? 'Saving...' : 'Save Feedback'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
