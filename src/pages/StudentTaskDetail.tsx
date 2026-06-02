import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, Clock, CalendarDays,
  BookOpen, Link2, Trophy, AlertCircle, ExternalLink, Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  earning_amount?: number;
  academic_year?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:   { label: 'Pending',   color: 'bg-amber-100 text-amber-700 border-amber-200',  icon: Clock },
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700 border-blue-200',     icon: CheckCircle2 },
  reviewed:  { label: 'Reviewed',  color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Trophy },
  approved:  { label: 'Approved',  color: 'bg-green-100 text-green-700 border-green-200',  icon: CheckCircle2 },
};


export default function StudentTaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask] = useState<StudentTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [submissionLink, setSubmissionLink] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (taskId) fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('student_task_feedback')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) throw error;
      setTask(data as StudentTask);
      setSubmissionLink((data as StudentTask).submission_link || '');
    } catch (err) {
      console.error(err);
      toast.error('Failed to load task details');
      navigate('/student-tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!task) return;
    if (!submissionLink.trim()) {
      toast.error('Please enter a submission link');
      return;
    }

    let link = submissionLink.trim();
    if (!link.startsWith('http://') && !link.startsWith('https://')) {
      link = `https://${link}`;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('student_task_feedback')
        .update({
          submission_link: link,
          status: 'submitted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id);

      if (error) throw error;
      toast.success('Task submitted successfully! 🎉');
      await fetchTask(); // refresh
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit task');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!task) return null;

  const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG['pending'];
  const StatusIcon = statusCfg.icon;
  const isDeadlinePast = task.deadline && new Date(task.deadline) < new Date();
  const canSubmit = task.status === 'pending';

  const rawDesc = task.task_description || '';

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/student-tasks')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Tasks
        </Button>

        {/* Hero Header */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full border',
                statusCfg.color
              )}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {statusCfg.label}
            </span>

            {task.academic_year && (
              <span className="text-xs bg-muted px-2.5 py-1 rounded-full text-muted-foreground font-medium">
                AY: {task.academic_year}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {task.task_name}
          </h1>

          {/* Meta row */}
          <div className="mt-4 flex flex-wrap gap-4">
            {task.deadline && (
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className={cn('h-4 w-4', isDeadlinePast && task.status === 'pending' ? 'text-destructive' : 'text-muted-foreground')} />
                <span className={cn('font-medium', isDeadlinePast && task.status === 'pending' && 'text-destructive')}>
                  {isDeadlinePast && task.status === 'pending' ? 'Overdue · ' : 'Due '}
                  {new Date(task.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground capitalize">{task.feedback_type.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="font-semibold text-amber-600">+{task.earning_amount || 5} units</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {rawDesc && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Description
            </h2>
            {/* Full HTML rendered — supports images, links, colors, headings */}
            <div
              className="prose prose-sm max-w-none text-foreground/90 leading-relaxed"
              style={{ lineHeight: '1.75' }}
              dangerouslySetInnerHTML={{ __html: rawDesc }}
            />
          </div>
        )}

        {/* Feedback Notes from Teacher */}
        {task.feedback_notes && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> Teacher's Note
            </h2>
            <p className="text-sm text-amber-800 leading-relaxed">{task.feedback_notes}</p>
          </div>
        )}

        {/* Current Submission */}
        {task.submission_link && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-blue-700 flex items-center gap-2">
              <Link2 className="h-4 w-4" /> Submitted Work
            </h2>
            <a
              href={task.submission_link.startsWith('http') ? task.submission_link : `https://${task.submission_link}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium break-all"
            >
              {task.submission_link}
              <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
            </a>
          </div>
        )}

        {/* Submit Work Section */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            {canSubmit ? 'Submit Your Work' : 'Update Submission'}
          </h2>

          {!canSubmit && task.status !== 'submitted' ? (
            <div className="rounded-xl bg-muted/60 border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              This task has been <strong className="text-foreground capitalize">{task.status}</strong> — no further submissions needed.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="submission_link">Link to your work (Google Drive, GitHub, etc.)</Label>
                <Input
                  id="submission_link"
                  placeholder="https://drive.google.com/your-work"
                  value={submissionLink}
                  onChange={(e) => setSubmissionLink(e.target.value)}
                  className="text-sm"
                  disabled={!canSubmit}
                />
                <p className="text-xs text-muted-foreground">
                  Paste a shareable link to your completed work
                </p>
              </div>

              {canSubmit && (
                <Button
                  onClick={handleSubmit}
                  disabled={saving || !submissionLink.trim()}
                  className="w-full sm:w-auto gap-2"
                  size="lg"
                >
                  {saving ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4" /> Save Submission</>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Created date footer */}
        <p className="text-xs text-muted-foreground text-center pb-4">
          Task assigned on {new Date(task.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
    </DashboardLayout>
  );
}
