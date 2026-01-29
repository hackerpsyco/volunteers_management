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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export default function FeedbackDetails() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformance[]>([]);

  useEffect(() => {
    if (sessionId) {
      fetchFeedback();
      fetchStudentPerformance();
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
      setStudentPerformance((data || []) as StudentPerformance[]);
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
      <div className="max-w-2xl mx-auto space-y-6">
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

        {/* Feedback Content */}
        <div className="space-y-4">
          {feedback.class_batch && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Class/Batch</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{feedback.class_batch}</p>
              </CardContent>
            </Card>
          )}

          {feedback.session_objective && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Session Objective</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{feedback.session_objective}</p>
              </CardContent>
            </Card>
          )}

          {feedback.practical_activities && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Practical Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{feedback.practical_activities}</p>
              </CardContent>
            </Card>
          )}

          {feedback.session_highlights && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Session Highlights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{feedback.session_highlights}</p>
              </CardContent>
            </Card>
          )}

          {feedback.learning_outcomes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Learning Outcomes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{feedback.learning_outcomes}</p>
              </CardContent>
            </Card>
          )}

          {feedback.facilitator_reflection && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Facilitator Reflection</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{feedback.facilitator_reflection}</p>
              </CardContent>
            </Card>
          )}

          {feedback.best_performer && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Best Performer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{feedback.best_performer}</p>
              </CardContent>
            </Card>
          )}

          {feedback.guest_teacher_feedback && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Guest Teacher Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{feedback.guest_teacher_feedback}</p>
              </CardContent>
            </Card>
          )}

          {feedback.incharge_reviewer_feedback && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Incharge/Reviewer Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{feedback.incharge_reviewer_feedback}</p>
              </CardContent>
            </Card>
          )}

          {(feedback.mic_sound_rating || feedback.seating_view_rating || feedback.session_strength) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quality Ratings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  {feedback.mic_sound_rating && (
                    <div>
                      <span className="text-muted-foreground block">Mic/Sound</span>
                      <p className="font-medium text-lg">{feedback.mic_sound_rating}/10</p>
                    </div>
                  )}
                  {feedback.seating_view_rating && (
                    <div>
                      <span className="text-muted-foreground block">Seating/View</span>
                      <p className="font-medium text-lg">{feedback.seating_view_rating}/10</p>
                    </div>
                  )}
                  {feedback.session_strength && (
                    <div>
                      <span className="text-muted-foreground block">Strength</span>
                      <p className="font-medium text-lg">{feedback.session_strength}/10</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {feedback.recorded_at && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">
                  Recorded on {new Date(feedback.recorded_at).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Student Performance Section */}
          {studentPerformance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Student Performance Records ({studentPerformance.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                          <TableCell className="max-w-[200px] truncate text-sm">{student.performance_comment || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

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
