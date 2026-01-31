import { useState, useEffect } from 'react';
import { ArrowLeft, Save, ChevronRight, ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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

interface SessionRecording {
  id: string;
  title: string;
  session_date: string;
  session_time: string;
  facilitator_name: string;
  volunteer_name: string;
  coordinator_name?: string;
  preferred_class?: string;
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

interface StudentPerformance {
  id?: string;
  student_name: string;
  questions_asked: number;
  performance_rating: number;
  performance_comment: string;
}

export default function SessionRecording() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingStudents, setSavingStudents] = useState(false);
  const [session, setSession] = useState<SessionRecording | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformance[]>([]);
  const [newStudent, setNewStudent] = useState<StudentPerformance>({
    student_name: '',
    questions_asked: 0,
    performance_rating: 5,
    performance_comment: '',
  });
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
      fetchStudentPerformance();
    }
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          coordinators:coordinator_id(name)
        `)
        .eq('id', sessionId)
        .single();

      if (error) throw error;

      const sessionData = data as any;
      
      // Fetch volunteer's preferred class separately
      let preferredClass = null;
      if (sessionData.volunteer_name) {
        const { data: volunteerData } = await supabase
          .from('volunteers')
          .select('preferred_class')
          .eq('name', sessionData.volunteer_name)
          .single();
        
        preferredClass = volunteerData?.preferred_class || null;
      }

      setSession({
        ...sessionData,
        coordinator_name: sessionData.coordinators?.name || null,
        preferred_class: preferredClass,
      } as SessionRecording);
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

  const handleSaveFeedback = async () => {
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
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Failed to save session feedback');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStudentPerformance = async () => {
    try {
      setSavingStudents(true);
      // Student performance is already saved when added via handleAddStudent
      // This just confirms and navigates back
      toast.success('Student performance saved successfully');
      navigate('/feedback');
    } catch (error) {
      console.error('Error saving student performance:', error);
      toast.error('Failed to save student performance');
    } finally {
      setSavingStudents(false);
    }
  };

  const handleAddStudent = async () => {
    if (!newStudent.student_name.trim()) {
      toast.error('Please enter student name');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('student_performance' as any)
        .insert([
          {
            session_id: sessionId,
            student_name: newStudent.student_name,
            questions_asked: newStudent.questions_asked,
            performance_rating: newStudent.performance_rating,
            performance_comment: newStudent.performance_comment,
          },
        ])
        .select();

      if (error) throw error;

      setStudentPerformance([...studentPerformance, data[0] as unknown as StudentPerformance]);
      setNewStudent({
        student_name: '',
        questions_asked: 0,
        performance_rating: 5,
        performance_comment: '',
      });
      toast.success('Student added successfully');
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error('Failed to add student');
    }
  };

  const handleDeleteStudent = async (id: string | undefined) => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from('student_performance' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setStudentPerformance(studentPerformance.filter(s => s.id !== id));
      toast.success('Student removed successfully');
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to remove student');
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
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
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
              <div>
                <span className="text-muted-foreground">Coordinator</span>
                <p className="font-medium">{session.coordinator_name || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Class</span>
                <p className="font-medium">{session.preferred_class || formData.class_batch || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Page Indicator - 3 Tabs */}
        <div className="flex justify-center gap-2 flex-wrap">
          <button
            onClick={() => setCurrentPage(1)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === 1
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            1. Prepare Session
          </button>
          <button
            onClick={() => setCurrentPage(2)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === 2
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            2. Performance Record
          </button>
          <button
            onClick={() => setCurrentPage(3)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === 3
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            3. Feedback & Closure
          </button>
        </div>

        {/* Page 1: Prepare Session */}
        {currentPage === 1 && (
          <div className="space-y-4">
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
          </div>
        )}

        {/* Page 2: Performance Record */}
        {currentPage === 2 && (
          <div className="space-y-4">
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
                <CardTitle className="text-base">Add Student Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="student_name" className="text-sm">Student Name *</Label>
                    <Input
                      id="student_name"
                      value={newStudent.student_name}
                      onChange={(e) => setNewStudent({ ...newStudent, student_name: e.target.value })}
                      placeholder="Enter student name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="questions_asked" className="text-sm">No. of Questions Asked</Label>
                    <Input
                      id="questions_asked"
                      type="number"
                      min="0"
                      value={newStudent.questions_asked}
                      onChange={(e) => setNewStudent({ ...newStudent, questions_asked: parseInt(e.target.value) || 0 })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="performance_rating" className="text-sm">Performance Rating (1-10) *</Label>
                    <Input
                      id="performance_rating"
                      type="number"
                      min="1"
                      max="10"
                      value={newStudent.performance_rating}
                      onChange={(e) => setNewStudent({ ...newStudent, performance_rating: parseInt(e.target.value) || 5 })}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleAddStudent}
                      className="w-full gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Student
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="performance_comment" className="text-sm">Performance Comment</Label>
                  <Textarea
                    id="performance_comment"
                    value={newStudent.performance_comment}
                    onChange={(e) => setNewStudent({ ...newStudent, performance_comment: e.target.value })}
                    placeholder="Add any comments about the student's performance"
                    className="mt-1 min-h-[60px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Students Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Student Performance Records ({studentPerformance.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {studentPerformance.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">SN</TableHead>
                          <TableHead>Student Name</TableHead>
                          <TableHead className="w-[120px]">Questions</TableHead>
                          <TableHead className="w-[100px]">Rating</TableHead>
                          <TableHead>Comment</TableHead>
                          <TableHead className="w-[60px]">Action</TableHead>
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
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteStudent(student.id)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No students added yet. Add student performance records above.</p>
                  </div>
                )}
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
          </div>
        )}

        {/* Page 3: Feedback & Closure */}
        {currentPage === 3 && (
          <div className="space-y-4">
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

        {/* Navigation Buttons */}
        <div className="flex gap-3 justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/feedback')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex gap-2">
            {currentPage > 1 && (
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage - 1)}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
            )}

            {currentPage < 3 && (
              <Button
                onClick={() => setCurrentPage(currentPage + 1)}
                variant="outline"
                className="gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}

            {currentPage === 1 && (
              <Button
                onClick={handleSaveFeedback}
                disabled={saving}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            )}

            {currentPage === 2 && (
              <Button
                onClick={handleSaveStudentPerformance}
                disabled={savingStudents}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {savingStudents ? 'Saving...' : 'Save'}
              </Button>
            )}

            {currentPage === 3 && (
              <Button
                onClick={handleSaveFeedback}
                disabled={saving}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save & Complete'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
