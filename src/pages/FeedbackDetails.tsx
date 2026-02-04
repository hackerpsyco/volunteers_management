import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface FeedbackData {
  id: string;
  title: string;
  session_date: string;
  session_time: string;
  facilitator_name: string;
  volunteer_name: string;
  session_objective: string | null;
  practical_activities: string | null;
  session_highlights: string | null;
  learning_outcomes: string | null;
  facilitator_reflection: string | null;
  best_performer: string | null;
  guest_teacher_feedback: string | null;
  incharge_reviewer_feedback: string | null;
  mic_sound_rating: number | null;
  seating_view_rating: number | null;
  session_strength: number | null;
  class_batch: string | null;
  recorded_at: string | null;
}

interface StudentPerformance {
  id: string;
  student_name: string;
  questions_asked: number;
  performance_rating: number;
  performance_comment: string;
}

interface SessionHoursTracker {
  id: string;
  plan_coordinate_hours: number;
  preparation_hours: number;
  session_hours: number;
  reflection_feedback_followup_hours: number;
  total_volunteering_time: number;
  logged_hours_in_benevity: boolean;
  notes: string;
}

export default function FeedbackDetails() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sessionId } = useParams();
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformance[]>([]);
  const [hoursTracker, setHoursTracker] = useState<SessionHoursTracker | null>(null);
  const [userRole, setUserRole] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'facilitator' | 'coordinator' | 'supervisor'>('facilitator');

  useEffect(() => {
    if (user?.id) {
      loadUserRole();
    }
  }, [user?.id]);

  const loadUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role_id')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user role:', error);
      }

      if (data?.role_id) {
        setUserRole(data.role_id);
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchFeedback();
      fetchStudentPerformance();
      fetchHoursTracker();
    }
  }, [sessionId]);

  const fetchStudentPerformance = async () => {
    try {
      const { data, error } = await supabase
        .from('student_performance' as any)
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setStudentPerformance((data || []) as unknown as StudentPerformance[]);
    } catch (error) {
      console.error('Error fetching student performance:', error);
    }
  };

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      setFeedback(data as any);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast.error('Failed to load feedback');
      navigate('/feedback');
    } finally {
      setLoading(false);
    }
  };

  const fetchHoursTracker = async () => {
    try {
      const { data, error } = await supabase
        .from('session_hours_tracker' as any)
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      if (data) {
        setHoursTracker(data as unknown as SessionHoursTracker);
      }
    } catch (error) {
      console.error('Error fetching hours tracker:', error);
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

  if (!feedback) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Feedback not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/feedback')}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Feedback Details</h1>
            <p className="text-sm text-muted-foreground">
              {feedback.title} - {new Date(feedback.session_date).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Session Info */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Date</span>
                <p className="font-medium">{new Date(feedback.session_date).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Time</span>
                <p className="font-medium">{feedback.session_time}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Facilitator</span>
                <p className="font-medium">{feedback.facilitator_name || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Volunteer</span>
                <p className="font-medium">{feedback.volunteer_name || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap border-b border-border pb-4">
          <button
            onClick={() => setActiveTab('facilitator')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'facilitator'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Facilitator Feedback
          </button>
          <button
            onClick={() => setActiveTab('coordinator')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'coordinator'
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Coordinator Feedback
          </button>
          <button
            onClick={() => setActiveTab('supervisor')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'supervisor'
                ? 'bg-purple-100 text-purple-700 border border-purple-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Supervisor Feedback (Admin Only)
          </button>
        </div>

        {/* Facilitator Feedback Tab - Table Format */}
        {activeTab === 'facilitator' && (
          <Card>
            <CardHeader>
              <CardTitle>Facilitator Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Field</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedback.session_objective && (
                      <TableRow>
                        <TableCell className="font-semibold">Session Objective</TableCell>
                        <TableCell className="whitespace-pre-wrap">{feedback.session_objective}</TableCell>
                      </TableRow>
                    )}
                    {feedback.practical_activities && (
                      <TableRow>
                        <TableCell className="font-semibold">Practical Activities</TableCell>
                        <TableCell className="whitespace-pre-wrap">{feedback.practical_activities}</TableCell>
                      </TableRow>
                    )}
                    {feedback.session_highlights && (
                      <TableRow>
                        <TableCell className="font-semibold">Session Highlights</TableCell>
                        <TableCell className="whitespace-pre-wrap">{feedback.session_highlights}</TableCell>
                      </TableRow>
                    )}
                    {feedback.learning_outcomes && (
                      <TableRow>
                        <TableCell className="font-semibold">Learning Outcomes</TableCell>
                        <TableCell className="whitespace-pre-wrap">{feedback.learning_outcomes}</TableCell>
                      </TableRow>
                    )}
                    {feedback.facilitator_reflection && (
                      <TableRow>
                        <TableCell className="font-semibold">Facilitator Reflection</TableCell>
                        <TableCell className="whitespace-pre-wrap">{feedback.facilitator_reflection}</TableCell>
                      </TableRow>
                    )}
                    {feedback.best_performer && (
                      <TableRow>
                        <TableCell className="font-semibold">Best Performer</TableCell>
                        <TableCell className="whitespace-pre-wrap">{feedback.best_performer}</TableCell>
                      </TableRow>
                    )}
                    {!feedback.session_objective && !feedback.practical_activities && !feedback.session_highlights && !feedback.learning_outcomes && !feedback.facilitator_reflection && !feedback.best_performer && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground italic py-8">
                          No facilitator feedback provided
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {studentPerformance.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-sm mb-3">Student Performance Records</h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">SN</TableHead>
                          <TableHead>Student Name</TableHead>
                          <TableHead className="w-[120px]">Questions</TableHead>
                          <TableHead className="w-[100px]">Rating</TableHead>
                          <TableHead>Comment</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentPerformance.map((student, index) => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell className="font-medium">{student.student_name}</TableCell>
                            <TableCell className="text-center">{student.questions_asked}</TableCell>
                            <TableCell className="text-center font-medium">{student.performance_rating}/10</TableCell>
                            <TableCell className="max-w-[300px] truncate text-sm">{student.performance_comment || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Coordinator Feedback Tab - Table Format */}
        {activeTab === 'coordinator' && (
          <Card>
            <CardHeader>
              <CardTitle>Coordinator Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Field</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedback.guest_teacher_feedback && (
                      <TableRow>
                        <TableCell className="font-semibold">Guest Teacher Feedback</TableCell>
                        <TableCell className="whitespace-pre-wrap">{feedback.guest_teacher_feedback}</TableCell>
                      </TableRow>
                    )}
                    {feedback.incharge_reviewer_feedback && (
                      <TableRow>
                        <TableCell className="font-semibold">Incharge/Reviewer Feedback</TableCell>
                        <TableCell className="whitespace-pre-wrap">{feedback.incharge_reviewer_feedback}</TableCell>
                      </TableRow>
                    )}
                    {feedback.mic_sound_rating && (
                      <TableRow>
                        <TableCell className="font-semibold">Mic/Sound Rating</TableCell>
                        <TableCell className="font-medium">{feedback.mic_sound_rating}/10</TableCell>
                      </TableRow>
                    )}
                    {feedback.seating_view_rating && (
                      <TableRow>
                        <TableCell className="font-semibold">Seating/View Rating</TableCell>
                        <TableCell className="font-medium">{feedback.seating_view_rating}/10</TableCell>
                      </TableRow>
                    )}
                    {feedback.session_strength && (
                      <TableRow>
                        <TableCell className="font-semibold">Session Strength</TableCell>
                        <TableCell className="font-medium">{feedback.session_strength}/10</TableCell>
                      </TableRow>
                    )}
                    {!feedback.guest_teacher_feedback && !feedback.incharge_reviewer_feedback && !feedback.mic_sound_rating && !feedback.seating_view_rating && !feedback.session_strength && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground italic py-8">
                          No coordinator feedback provided
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Supervisor Feedback Tab - Table Format - Admin Only */}
        {activeTab === 'supervisor' && userRole === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Supervisor Hours Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              {hoursTracker ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Field</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-semibold">Plan & Coordinate Hours</TableCell>
                        <TableCell className="font-medium">{hoursTracker.plan_coordinate_hours} hrs</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold">Preparation Hours</TableCell>
                        <TableCell className="font-medium">{hoursTracker.preparation_hours} hrs</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold">Session Hours</TableCell>
                        <TableCell className="font-medium">{hoursTracker.session_hours} hrs</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold">Reflection & Feedback Hours</TableCell>
                        <TableCell className="font-medium">{hoursTracker.reflection_feedback_followup_hours} hrs</TableCell>
                      </TableRow>
                      <TableRow className="bg-blue-50">
                        <TableCell className="font-semibold">Total Volunteering Time</TableCell>
                        <TableCell className="font-bold text-lg text-blue-700">{hoursTracker.total_volunteering_time} hrs</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-semibold">Logged in Benevity</TableCell>
                        <TableCell>
                          <Badge variant={hoursTracker.logged_hours_in_benevity ? 'default' : 'secondary'}>
                            {hoursTracker.logged_hours_in_benevity ? '✓ Yes' : 'No'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      {hoursTracker.notes && (
                        <TableRow>
                          <TableCell className="font-semibold">Notes</TableCell>
                          <TableCell className="whitespace-pre-wrap">{hoursTracker.notes}</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center text-muted-foreground italic py-8">
                  No hours tracked
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Back Button */}
        <div className="flex justify-start">
          <Button
            variant="outline"
            onClick={() => navigate('/feedback')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
