import { useState, useEffect } from 'react';
import { ArrowLeft, Save, ChevronRight, ChevronLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SessionRecording {
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
}

export default function SessionRecording() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<SessionRecording | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    session_objective: '',
    practical_activities: '',
    session_highlights: '',
    learning_outcomes: '',
    facilitator_reflection: '',
    best_performer: '',
    guest_teacher_feedback: '',
    incharge_reviewer_feedback: '',
    mic_sound_rating: 5,
    seating_view_rating: 5,
    session_strength: 5,
    class_batch: '',
  });

  useEffect(() => {
    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;

      const sessionData = data as any;
      setSession(sessionData as SessionRecording);
      setFormData({
        session_objective: (sessionData as any).session_objective || '',
        practical_activities: (sessionData as any).practical_activities || '',
        session_highlights: (sessionData as any).session_highlights || '',
        learning_outcomes: (sessionData as any).learning_outcomes || '',
        facilitator_reflection: (sessionData as any).facilitator_reflection || '',
        best_performer: (sessionData as any).best_performer || '',
        guest_teacher_feedback: (sessionData as any).guest_teacher_feedback || '',
        incharge_reviewer_feedback: (sessionData as any).incharge_reviewer_feedback || '',
        mic_sound_rating: (sessionData as any).mic_sound_rating || 5,
        seating_view_rating: (sessionData as any).seating_view_rating || 5,
        session_strength: (sessionData as any).session_strength || 5,
        class_batch: (sessionData as any).class_batch || '',
      } as any);
    } catch (error) {
      console.error('Error fetching session:', error);
      toast.error('Failed to load session');
      navigate('/sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!sessionId) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('sessions')
        .update({
          session_objective: formData.session_objective,
          practical_activities: formData.practical_activities,
          session_highlights: formData.session_highlights,
          learning_outcomes: formData.learning_outcomes,
          facilitator_reflection: formData.facilitator_reflection,
          best_performer: formData.best_performer,
          guest_teacher_feedback: formData.guest_teacher_feedback,
          incharge_reviewer_feedback: formData.incharge_reviewer_feedback,
          mic_sound_rating: formData.mic_sound_rating,
          seating_view_rating: formData.seating_view_rating,
          session_strength: formData.session_strength,
          class_batch: formData.class_batch,
          recorded_at: new Date().toISOString(),
        } as any)
        .eq('id', sessionId);

      if (error) throw error;
      toast.success('Session feedback saved successfully');
      navigate('/sessions');
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Failed to save session feedback');
    } finally {
      setSaving(false);
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

  if (!session) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Session not found</p>
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
            onClick={() => navigate('/sessions')}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Session Feedback</h1>
            <p className="text-sm text-muted-foreground">
              {session.title} - {new Date(session.session_date).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Session Info */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Date</span>
                <p className="font-medium">{new Date(session.session_date).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Time</span>
                <p className="font-medium">{session.session_time}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Facilitator</span>
                <p className="font-medium">{session.facilitator_name || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Volunteer</span>
                <p className="font-medium">{session.volunteer_name || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Page Indicator */}
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage(1)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === 1
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Page 1: Feedback
          </button>
          <button
            onClick={() => setCurrentPage(2)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === 2
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Page 2: Performance
          </button>
        </div>

        {/* Page 1: Session Feedback */}
        {currentPage === 1 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Class/Batch</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={formData.class_batch}
                  onChange={(e) => setFormData({ ...formData, class_batch: e.target.value })}
                  placeholder="e.g., Class A, Batch 1"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Session Objective</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.session_objective}
                  onChange={(e) => setFormData({ ...formData, session_objective: e.target.value })}
                  placeholder="What were the main objectives?"
                  className="min-h-[80px]"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Practical Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.practical_activities}
                  onChange={(e) => setFormData({ ...formData, practical_activities: e.target.value })}
                  placeholder="Describe the practical activities"
                  className="min-h-[80px]"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Session Highlights</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.session_highlights}
                  onChange={(e) => setFormData({ ...formData, session_highlights: e.target.value })}
                  placeholder="Key highlights and summary"
                  className="min-h-[80px]"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Learning Outcomes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.learning_outcomes}
                  onChange={(e) => setFormData({ ...formData, learning_outcomes: e.target.value })}
                  placeholder="What did students learn?"
                  className="min-h-[80px]"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Facilitator Reflection</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.facilitator_reflection}
                  onChange={(e) => setFormData({ ...formData, facilitator_reflection: e.target.value })}
                  placeholder="Facilitator's reflection and remarks"
                  className="min-h-[80px]"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Best Performer</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.best_performer}
                  onChange={(e) => setFormData({ ...formData, best_performer: e.target.value })}
                  placeholder="Name and details of best performer"
                  className="min-h-[60px]"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Guest Teacher Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.guest_teacher_feedback}
                  onChange={(e) => setFormData({ ...formData, guest_teacher_feedback: e.target.value })}
                  placeholder="Feedback from guest teacher"
                  className="min-h-[80px]"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Incharge/Reviewer Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.incharge_reviewer_feedback}
                  onChange={(e) => setFormData({ ...formData, incharge_reviewer_feedback: e.target.value })}
                  placeholder="Feedback from incharge or reviewer"
                  className="min-h-[80px]"
                />
              </CardContent>
            </Card>

            {/* Ratings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quality Ratings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs">Mic/Sound</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.mic_sound_rating}
                      onChange={(e) => setFormData({ ...formData, mic_sound_rating: parseInt(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Seating/View</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.seating_view_rating}
                      onChange={(e) => setFormData({ ...formData, seating_view_rating: parseInt(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Strength</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.session_strength}
                      onChange={(e) => setFormData({ ...formData, session_strength: parseInt(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Page 2: Student Performance */}
        {currentPage === 2 && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Student Performance</CardTitle>
                <p className="text-xs text-muted-foreground mt-2">
                  Manage student performance records in the dedicated Student Performance page
                </p>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate(`/student-performance/${sessionId}`)}
                  className="w-full gap-2"
                >
                  Go to Student Performance
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/sessions')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex gap-2">
            {currentPage === 2 && (
              <Button
                variant="outline"
                onClick={() => setCurrentPage(1)}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
            )}

            {currentPage === 1 && (
              <Button
                onClick={() => setCurrentPage(2)}
                variant="outline"
                className="gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}

            {currentPage === 1 && (
              <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Feedback'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
