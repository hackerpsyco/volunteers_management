import { useState, useEffect } from 'react';
import { Calendar, ListTodo } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface StudentTask {
  id: string;
  task_name: string;
  deadline: string;
  feedback_type: string;
  status: string;
  feedback_notes?: string;
  submission_link?: string;
}

interface SessionMeeting {
  id: string;
  title: string;
  session_date: string;
  session_time: string;
  facilitator_name?: string;
  meeting_link?: string;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [studentName, setStudentName] = useState('');
  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [sessions, setSessions] = useState<SessionMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'calendar' | 'tasks'>('calendar');
  const [selectedTask, setSelectedTask] = useState<StudentTask | null>(null);
  const [submissionLink, setSubmissionLink] = useState('');
  const [submissionDate, setSubmissionDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (user?.id) {
      loadStudentData();
    }
  }, [user?.id]);

  const loadStudentData = async () => {
    try {
      setLoading(true);

      // Get student profile with class_id
      let profileData = null;
      let profileError = null;

      // Try to get profile using auth user ID first
      const { data: idData, error: idError } = await supabase
        .from('user_profiles')
        .select('full_name, class_id')
        .eq('id', user?.id)
        .single();

      if (idError) {
        // If RLS blocks it (profile ID mismatch), try querying by email
        if (idError.code === 'PGRST116') {
          console.warn('Profile ID mismatch detected, querying by email...');
          const { data: emailData, error: emailError } = await supabase
            .from('user_profiles')
            .select('full_name, class_id')
            .eq('email', user?.email)
            .single();

          profileData = emailData;
          profileError = emailError;
        } else {
          profileError = idError;
        }
      } else {
        profileData = idData;
      }

      if (profileError) {
        console.error('Profile error:', profileError);
        // Profile doesn't exist or RLS blocked access
        setTasks([]);
        setSessions([]);
        return;
      }

      if (profileData?.full_name) {
        setStudentName(profileData.full_name);
      }

      // If student has a class_id, fetch class-specific data
      if (profileData?.class_id) {
        // Get the class info
        const { data: classData } = await supabase
          .from('classes')
          .select('id, name, email')
          .eq('id', profileData.class_id)
          .single();

        // Fetch tasks for THIS STUDENT ONLY
        // First, get the student record from students table
        const { data: studentRecord, error: studentError } = await supabase
          .from('students')
          .select('id')
          .eq('email', user?.email)
          .single();

        if (studentError) {
          console.warn('Student record not found for email:', user?.email);
          setTasks([]);
        } else if (studentRecord) {
          const { data: tasksData, error: tasksError } = await supabase
            .from('student_task_feedback')
            .select('*')
            .eq('student_id', studentRecord.id)
            .order('deadline', { ascending: true });

          if (tasksError) throw tasksError;
          setTasks(tasksData || []);
        }

        // Fetch sessions for this class
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select('id, title, session_date, session_time, facilitator_name, meeting_link, class_batch')
          .eq('class_batch', classData?.name)
          .gte('session_date', new Date().toISOString().split('T')[0])
          .order('session_date', { ascending: true });

        if (sessionsError) throw sessionsError;
        setSessions(sessionsData || []);
      } else {
        // No class assigned - show empty state
        setTasks([]);
        setSessions([]);
      }
    } catch (error) {
      console.error('Error loading student data:', error);
      toast.error('Failed to load your tasks');
    } finally {
      setLoading(false);
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

  const handleTaskClick = (task: StudentTask) => {
    setSelectedTask(task);
    setSubmissionLink(task.submission_link || '');
    setSubmissionDate(new Date().toISOString().split('T')[0]);
  };

  const handleSubmitTask = async () => {
    if (!selectedTask || !submissionLink.trim()) {
      toast.error('Please enter a submission link');
      return;
    }

    // Validate submission link is a valid URL
    let validLink = submissionLink.trim();
    if (!validLink.startsWith('http://') && !validLink.startsWith('https://')) {
      validLink = `https://${validLink}`;
    }

    // Basic URL validation
    try {
      new URL(validLink);
    } catch {
      toast.error('Please enter a valid URL (e.g., https://example.com or example.com)');
      return;
    }

    // Validate submission date is not after deadline
    if (new Date(submissionDate) > new Date(selectedTask.deadline)) {
      toast.error('Submission date cannot be after the deadline');
      return;
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
      loadStudentData();
    } catch (error) {
      console.error('Error submitting task:', error);
      toast.error('Failed to submit task');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Tasks</h1>
          <p className="text-sm text-muted-foreground">Welcome, {studentName}</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'calendar' ? 'default' : 'outline'}
            onClick={() => setActiveTab('calendar')}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            Calendar
          </Button>
          <Button
            variant={activeTab === 'tasks' ? 'default' : 'outline'}
            onClick={() => setActiveTab('tasks')}
            className="gap-2"
          >
            <ListTodo className="h-4 w-4" />
            Tasks ({tasks.length})
          </Button>
        </div>

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upcoming Tasks */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Upcoming Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No tasks assigned yet</p>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleTaskClick(task)}
                        className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">{task.task_name}</h3>
                            <p className="text-sm text-muted-foreground capitalize">{task.feedback_type}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                            task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            task.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                            task.status === 'reviewed' ? 'bg-purple-100 text-purple-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                        <div className="mt-2 text-sm">
                          <p className="text-muted-foreground">
                            Deadline: {new Date(task.deadline).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Class Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8 text-sm">No upcoming sessions</p>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="border border-border rounded-lg p-3 text-sm"
                      >
                        <h4 className="font-semibold text-foreground">{session.title}</h4>
                        <p className="text-muted-foreground text-xs mt-1">
                          {new Date(session.session_date).toLocaleDateString()} at {session.session_time}
                        </p>
                        {session.facilitator_name && (
                          <p className="text-muted-foreground text-xs">
                            {session.facilitator_name}
                          </p>
                        )}
                        {session.meeting_link && (
                          <a
                            href={session.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-xs mt-2 inline-block"
                          >
                            Join Meeting
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <Card>
            <CardHeader>
              <CardTitle>All Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No tasks assigned yet</p>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleTaskClick(task)}
                      className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{task.task_name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">{task.feedback_type}</p>
                          {task.feedback_notes && (
                            <p className="text-sm text-foreground mt-2">{task.feedback_notes}</p>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                          task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          task.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                          task.status === 'reviewed' ? 'bg-purple-100 text-purple-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                      <div className="mt-3 text-sm">
                        <p className="text-muted-foreground">
                          Deadline: {new Date(task.deadline).toLocaleDateString()}
                        </p>
                        {task.submission_link && (
                          <a
                            href={task.submission_link.startsWith('http') ? task.submission_link : `https://${task.submission_link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline mt-2 inline-block"
                          >
                            View Submission
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Task Details Modal */}
        <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Task Details</DialogTitle>
              <DialogClose />
            </DialogHeader>

            {selectedTask && (
              <div className="space-y-6">
                {/* Task Information */}
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Task Name</p>
                    <p className="font-semibold text-lg">{selectedTask.task_name}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="font-medium capitalize">{selectedTask.feedback_type}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Deadline</p>
                    <p className="font-medium">{new Date(selectedTask.deadline).toLocaleDateString()}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                      selectedTask.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedTask.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                      selectedTask.status === 'reviewed' ? 'bg-purple-100 text-purple-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {selectedTask.status}
                    </span>
                  </div>

                  {selectedTask.feedback_notes && (
                    <div>
                      <p className="text-xs text-muted-foreground">Feedback Notes</p>
                      <p className="text-sm">{selectedTask.feedback_notes}</p>
                    </div>
                  )}
                </div>

                {/* Submission Section */}
                <div className="border-t border-border pt-4 space-y-4">
                  <h3 className="font-semibold">Submit Your Work</h3>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Submission Link
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/your-submission"
                      value={submissionLink}
                      onChange={(e) => setSubmissionLink(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Submission Date
                    </label>
                    <input
                      type="date"
                      value={submissionDate}
                      onChange={(e) => setSubmissionDate(e.target.value)}
                      max={selectedTask.deadline}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Must be on or before deadline: {new Date(selectedTask.deadline).toLocaleDateString()}
                    </p>
                  </div>

                  {selectedTask.submission_link && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Current Submission:</strong>{' '}
                        <a
                          href={selectedTask.submission_link.startsWith('http') ? selectedTask.submission_link : `https://${selectedTask.submission_link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-blue-900"
                        >
                          {selectedTask.submission_link}
                        </a>
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 justify-end border-t border-border pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedTask(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitTask}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Save Submission
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
