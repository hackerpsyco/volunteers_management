import { useState, useEffect } from 'react';
import { Calendar, ListTodo, Clock, CheckCircle2, Wallet, ClipboardCheck, AlertCircle } from 'lucide-react';
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
import { useAcademicYear } from '@/contexts/AcademicYearContext';

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
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState('100%');
  const [attendanceDetails, setAttendanceDetails] = useState('No sessions');
  const { selectedYear, getDateRange } = useAcademicYear();

  useEffect(() => {
    if (user?.id) {
      loadStudentData();
    }
  }, [user?.id, selectedYear]);

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
            .ilike('email', user?.email)
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
        // Profile doesn't exist or RLS blocked access - this is expected for some users
        // Continue with empty data
        setTasks([]);
        setSessions([]);
        setLoading(false);
        return;
      }

      if (profileData?.full_name) {
        setStudentName(profileData.full_name);
      }

      // Fetch tasks for THIS STUDENT ONLY
      // First, get the student record from students table
      const { data: studentRecords, error: studentError } = await supabase
        .from('students')
        .select('id')
        .ilike('email', user?.email);

      if (studentError) {
        console.warn('Student record not found for email:', user?.email, studentError);
        setTasks([]);
      } else if (studentRecords && studentRecords.length > 0) {
        const studentIds = studentRecords.map(s => s.id);
        
        // Fetch tasks for THIS STUDENT ONLY filtered by academic year
        const { startDate, endDate } = getDateRange();
        const { data: tasksData, error: tasksError } = await supabase
          .from('student_task_feedback')
          .select('*')
          .in('student_id', studentIds)
          .or(`academic_year.eq."${selectedYear}",and(academic_year.is.null,created_at.gte."${startDate.toISOString()}",created_at.lte."${endDate.toISOString()}")`)
          .order('deadline', { ascending: true });

        if (tasksError) {
          console.error('Error fetching tasks:', tasksError);
          setTasks([]);
        } else {
          setTasks(tasksData || []);
        }

        // Fetch Total Earnings filtered by academic year
        const { startDate: earningStart, endDate: earningEnd } = getDateRange();
        const { data: earningsData } = await supabase
          .from('student_earnings')
          .select('amount')
          .in('student_id', studentIds)
          .gte('earned_at', earningStart.toISOString())
          .lte('earned_at', earningEnd.toISOString());
        
        const total = (earningsData || []).reduce((sum, item) => sum + parseFloat(item.amount as any), 0);
        setTotalEarnings(total);
      }

      // If student has a class_id, fetch class-specific session data
      let sessionsDataList: SessionMeeting[] = [];
      if (profileData?.class_id) {
        // Get the class info
        const { data: classData } = await supabase
          .from('classes')
          .select('id, name, email')
          .eq('id', profileData.class_id)
          .single();

        // Fetch sessions for this class filtered by academic year
        const { startDate, endDate } = getDateRange();
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select('id, title, session_date, session_time, facilitator_name, meeting_link, class_batch')
          .eq('class_batch', classData?.name)
          .gte('session_date', startDate.toISOString().split('T')[0])
          .lte('session_date', endDate.toISOString().split('T')[0])
          .order('session_date', { ascending: true });

        if (sessionsError) {
          console.error('Error fetching sessions:', sessionsError);
          setSessions([]);
        } else {
          sessionsDataList = sessionsData || [];
          setSessions(sessionsDataList);
        }
      } else {
        setSessions([]);
      }

      // Calculate attendance rate
      if (profileData?.full_name && sessionsDataList.length > 0) {
        const { data: perfData } = await supabase
          .from('student_performance' as any)
          .select('session_id, attendance_status')
          .ilike('student_name', profileData.full_name.trim());

        if (perfData) {
          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth();

          const currentMonthSessions = sessionsDataList.filter(s => {
            const date = new Date(s.session_date);
            return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
          });

          let presentCount = 0;
          let totalCount = 0;

          currentMonthSessions.forEach(session => {
            const perf = perfData.find(p => p.session_id === session.id);
            if (perf) {
              totalCount++;
              if (perf.attendance_status === 'Present') {
                presentCount++;
              }
            }
          });

          if (totalCount > 0) {
            setAttendanceRate(`${Math.round((presentCount / totalCount) * 100)}%`);
            setAttendanceDetails(`${presentCount} of ${totalCount} present`);
          } else {
            setAttendanceRate('100%');
            setAttendanceDetails('0 sessions recorded');
          }
        }
      } else {
        setAttendanceRate('100%');
        setAttendanceDetails('No sessions');
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

    // Validate submission is not more than 3 days past the deadline
    const deadlineDate = new Date(selectedTask.deadline);
    const cutoffDate = new Date(deadlineDate);
    cutoffDate.setDate(cutoffDate.getDate() + 3);
    cutoffDate.setHours(23, 59, 59, 999);

    if (new Date() > cutoffDate) {
      toast.error('Submission closed. The deadline was more than 3 days ago.');
      return;
    }

    if (new Date(submissionDate) > cutoffDate) {
      toast.error('Submission date cannot be more than 3 days after the deadline');
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
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome, {studentName}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-card border-border/50 shadow-sm overflow-hidden border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Assigned to you</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50 shadow-sm overflow-hidden border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Tasks</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'pending').length}</div>
              <p className="text-xs text-muted-foreground mt-1">Action required</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50 shadow-sm overflow-hidden border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'completed').length}</div>
              <p className="text-xs text-muted-foreground mt-1">Successfully finished</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50 shadow-sm overflow-hidden border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
              <Wallet className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalEarnings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Tokens earned</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50 shadow-sm overflow-hidden border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Attendance</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendanceRate}</div>
              <p className="text-xs text-muted-foreground mt-1">{attendanceDetails} this month</p>
            </CardContent>
          </Card>
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
          <div className="max-w-xl">
            {/* Upcoming Sessions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Class Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6 text-sm">No upcoming sessions</p>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="border border-border rounded-lg p-2.5 text-sm"
                      >
                        <h4 className="font-semibold text-foreground">{session.title}</h4>
                        <p className="text-muted-foreground text-xs mt-0.5">
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
                            className="text-primary hover:underline text-xs mt-1 inline-block"
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

            {selectedTask && (() => {
              const deadlineDate = new Date(selectedTask.deadline);
              const cutoffDate = new Date(deadlineDate);
              cutoffDate.setDate(cutoffDate.getDate() + 3);
              cutoffDate.setHours(23, 59, 59, 999);
              const isSubmissionClosed = new Date() > cutoffDate;
              const maxDateString = cutoffDate.toISOString().split('T')[0];
              const isReviewedOrApproved = selectedTask.status === 'reviewed' || selectedTask.status === 'approved';

              return (
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

                    {isSubmissionClosed && (
                      <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-3 text-sm flex items-center gap-2 font-medium">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>Submission period closed. Submissions are only allowed up to 3 days after the deadline.</span>
                      </div>
                    )}

                    {isReviewedOrApproved && (
                      <div className="bg-muted border border-border text-muted-foreground rounded-lg p-3 text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span>This task has already been reviewed/approved and cannot be updated.</span>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">
                        Submission Link
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.com/your-submission"
                        value={submissionLink}
                        onChange={(e) => setSubmissionLink(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={isSubmissionClosed || isReviewedOrApproved}
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
                        max={maxDateString}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={isSubmissionClosed || isReviewedOrApproved}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Must be on or before 3 days after deadline: {new Date(maxDateString).toLocaleDateString()}
                      </p>
                    </div>

                    {selectedTask.submission_link && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-sm text-blue-800 font-medium mb-1">
                          Current Submission(s):
                        </p>
                        <div className="flex flex-col gap-1">
                          {selectedTask.submission_link.split(',').filter(Boolean).map((link, idx) => (
                            <a
                              key={idx}
                              href={link.trim().startsWith('http') ? link.trim() : `https://${link.trim()}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:text-blue-900 text-sm truncate"
                            >
                              {link.trim()}
                            </a>
                          ))}
                        </div>
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
                      disabled={isSubmissionClosed || isReviewedOrApproved || !submissionLink.trim()}
                    >
                      Save Submission
                    </Button>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
