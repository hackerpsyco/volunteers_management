import { useState, useEffect } from 'react';
import { ArrowLeft, Save, ChevronRight, ChevronLeft, Plus, Trash2, Shield, ExternalLink } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

interface SessionHoursTracker {
  id?: string;
  session_id: string;
  volunteer_id?: string;
  plan_coordinate_hours: number;
  preparation_hours: number;
  session_hours: number;
  reflection_feedback_followup_hours: number;
  total_volunteering_time?: number;
  logged_hours_in_benevity: boolean;
  notes: string;
}

export default function SessionRecording() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sessionId } = useParams();
  const [userRole, setUserRole] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingStudents, setSavingStudents] = useState(false);
  const [session, setSession] = useState<SessionRecording | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSubTab, setCurrentSubTab] = useState('a');
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
  const [hoursData, setHoursData] = useState<SessionHoursTracker>({
    session_id: sessionId || '',
    plan_coordinate_hours: 0,
    preparation_hours: 0,
    session_hours: 0,
    reflection_feedback_followup_hours: 0,
    logged_hours_in_benevity: false,
    notes: '',
  });
  const [homeworkRecords, setHomeworkRecords] = useState<any[]>([]);
  const [homeworkLoading, setHomeworkLoading] = useState(false);
  const [savingHomework, setSavingHomework] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [newHomework, setNewHomework] = useState({
    student_id: '',
    task_name: '',
    task_type: '',
    deadline: '',
    task_description: '',
    submission_link: '',
    feedback_notes: '',
  });

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
      fetchSession();
      fetchStudentPerformance();
      fetchHoursTracker();
      fetchHomeworkRecords();
      fetchStudents();
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

  const fetchHoursTracker = async () => {
    try {
      const { data, error } = await supabase
        .from('session_hours_tracker' as any)
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "no rows found" which is expected if no hours tracker exists
        throw error;
      }
      if (data) {
        setHoursData(data as unknown as SessionHoursTracker);
      }
    } catch (error) {
      console.error('Error fetching hours tracker:', error);
    }
  };

  const fetchHomeworkRecords = async () => {
    try {
      setHomeworkLoading(true);
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
          feedback_notes,
          students:student_id(name)
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching homework records:', error);
        return;
      }

      const transformedData = (data || []).map((item: any) => ({
        ...item,
        student_name: item.students?.name || 'Unknown',
      }));

      setHomeworkRecords(transformedData);
    } catch (error) {
      console.error('Error fetching homework records:', error);
    } finally {
      setHomeworkLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);

      // Get session to find its class batch or class_id
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('class_batch, class_id')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      let classId = null;

      // Try to find class by class_id first
      if (sessionData?.class_id) {
        classId = sessionData.class_id;
      } 
      // Then try by class_batch name
      else if (sessionData?.class_batch) {
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select('id')
          .ilike('name', `%${sessionData.class_batch}%`)
          .single();

        if (!classError && classData) {
          classId = classData.id;
        }
      }

      if (!classId) {
        console.warn('Could not determine class for this session');
        setStudents([]);
        return;
      }

      // Fetch students from that class
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, name, student_id')
        .eq('class_id', classId)
        .order('name', { ascending: true });

      if (studentsError) throw studentsError;

      setStudents(studentsData || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    } finally {
      setStudentsLoading(false);
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

  const handleSaveHoursTracker = async () => {
    if (!sessionId) return;

    try {
      setSaving(true);
      
      // Check if hours tracker already exists
      const { data: existingData } = await supabase
        .from('session_hours_tracker' as any)
        .select('id')
        .eq('session_id', sessionId)
        .single();

      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from('session_hours_tracker' as any)
          .update({
            plan_coordinate_hours: hoursData.plan_coordinate_hours,
            preparation_hours: hoursData.preparation_hours,
            session_hours: hoursData.session_hours,
            reflection_feedback_followup_hours: hoursData.reflection_feedback_followup_hours,
            logged_hours_in_benevity: hoursData.logged_hours_in_benevity,
            notes: hoursData.notes,
            updated_at: new Date().toISOString(),
          })
          .eq('session_id', sessionId);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('session_hours_tracker' as any)
          .insert([
            {
              session_id: sessionId,
              plan_coordinate_hours: hoursData.plan_coordinate_hours,
              preparation_hours: hoursData.preparation_hours,
              session_hours: hoursData.session_hours,
              reflection_feedback_followup_hours: hoursData.reflection_feedback_followup_hours,
              logged_hours_in_benevity: hoursData.logged_hours_in_benevity,
              notes: hoursData.notes,
            },
          ]);

        if (error) throw error;
      }

      toast.success('Hours tracker saved successfully');
      navigate('/feedback');
    } catch (error) {
      console.error('Error saving hours tracker:', error);
      toast.error('Failed to save hours tracker');
    } finally {
      setSaving(false);
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

  const handleSaveHomework = async () => {
    if (!newHomework.student_id || !newHomework.task_name.trim()) {
      toast.error('Please select a student and enter task name');
      return;
    }

    try {
      setSavingHomework(true);

      // Get all students in the class
      if (students.length === 0) {
        toast.error('No students found in this class');
        return;
      }

      // Create task for each student
      const homeworkRecords = students.map(student => ({
        session_id: sessionId,
        student_id: student.id,
        feedback_type: newHomework.task_type || 'homework',
        task_name: newHomework.task_name,
        task_description: newHomework.task_description || null,
        deadline: newHomework.deadline || null,
        submission_link: newHomework.submission_link || null,
        feedback_notes: newHomework.feedback_notes || null,
        status: 'pending',
      }));

      const { error } = await supabase
        .from('student_task_feedback')
        .insert(homeworkRecords);

      if (error) throw error;

      toast.success(`Homework assigned to ${students.length} students`);
      setNewHomework({
        student_id: '',
        task_name: '',
        task_type: '',
        deadline: '',
        task_description: '',
        submission_link: '',
        feedback_notes: '',
      });
      fetchHomeworkRecords();
    } catch (error) {
      console.error('Error saving homework:', error);
      toast.error('Failed to save homework feedback');
    } finally {
      setSavingHomework(false);
    }
  };

  const handleDeleteHomework = async (id: string) => {
    if (!confirm('Delete this homework feedback?')) return;

    try {
      const { error } = await supabase
        .from('student_task_feedback')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Homework deleted successfully');
      fetchHomeworkRecords();
    } catch (error) {
      console.error('Error deleting homework:', error);
      toast.error('Failed to delete homework');
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
            onClick={() => {
              setCurrentPage(1);
              setCurrentSubTab('a');
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === 1
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <div className="flex flex-col items-center">
              <span className="text-sm font-semibold">A. Session Details & Performance</span>
              <span className="text-xs ">by Facilitator</span>
            </div>
          </button>
          <button
            onClick={() => setCurrentPage(3)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === 3
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <div className="flex flex-col items-center">
              <span className="text-sm font-semibold">B. Feedback & Closure</span>
              <span className="text-xs ">by Coordinator</span>
            </div>
          </button>
          <button
            onClick={() => setCurrentPage(2)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === 2
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <div className="flex flex-col items-center">
              <span className="text-sm font-semibold">C. Session Hours Tracker</span>
              <span className="text-xs ">by Supervisor</span>
            </div>
          </button>
        </div>

        {/* Sub-tabs for Tab A */}
        {currentPage === 1 && (
          <div className="flex justify-center gap-2 flex-wrap border-b border-border pb-4">
            <button
              onClick={() => setCurrentSubTab('a')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                currentSubTab === 'a'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              a) Session Objective
            </button>
            <button
              onClick={() => setCurrentSubTab('b')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                currentSubTab === 'b'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              b) Performance Details
            </button>
            <button
              onClick={() => setCurrentSubTab('c')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                currentSubTab === 'c'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              c) Student Homework Feedback
            </button>
          </div>
        )}

        {/* Page 1: Session Details & Performance by Facilitator */}
        {currentPage === 1 && (
          <div className="space-y-4">
            {/* Sub-tab a: Session Objective Only */}
            {currentSubTab === 'a' && (
              <div className="space-y-4">
                {/* Session Objective */}
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
                   {/* Quality Ratings - Before Session Objective */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quality Ratings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Mic/Sound Quality</Label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={formData.mic_sound_rating}
                          onChange={(e) => setFormData({ ...formData, mic_sound_rating: parseInt(e.target.value) || 5 })}
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Rate 1-10</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Seating/View</Label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={formData.seating_view_rating}
                          onChange={(e) => setFormData({ ...formData, seating_view_rating: parseInt(e.target.value) || 5 })}
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Rate 1-10</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Session Strength</Label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={formData.session_strength}
                          onChange={(e) => setFormData({ ...formData, session_strength: parseInt(e.target.value) || 5 })}
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Rate 1-10</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Sub-tab b: Performance Details */}
            {currentSubTab === 'b' && (
              <div className="space-y-4">
             

                {/* Practical Activities */}
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

                {/* Session Highlights */}
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

                {/* Learning Outcomes */}
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

                {/* Add Student Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Add Student Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="student_name" className="text-sm">Student Name *</Label>
                        <Select value={newStudent.student_name} onValueChange={(value) => setNewStudent({ ...newStudent, student_name: value })}>
                          <SelectTrigger id="student_name" className="mt-1">
                            <SelectValue placeholder="Select a student" />
                          </SelectTrigger>
                          <SelectContent>
                            {students.map((student) => (
                              <SelectItem key={student.id} value={student.name}>
                                {student.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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

                {/* Facilitator Reflection */}
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

                {/* Best Performer */}
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

            {/* Sub-tab c: Student Homework Feedback */}
            {currentSubTab === 'c' && (
              <div className="space-y-4">
                {/* Fetch students when this tab opens */}
                {students.length === 0 && !studentsLoading && (
                  <div className="mb-4">
                    {(() => {
                      fetchStudents();
                      return null;
                    })()}
                  </div>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Add Student Homework & Tasks</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="hw_task" className="text-sm">Task Name *</Label>
                        <Input
                          id="hw_task"
                          placeholder="e.g., Chapter 5 Exercise"
                          value={newHomework.task_name}
                          onChange={(e) => setNewHomework({ ...newHomework, task_name: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="hw_type" className="text-sm">Task Type</Label>
                        <Input
                          id="hw_type"
                          placeholder="homework, assignment, project, etc."
                          value={newHomework.task_type}
                          onChange={(e) => setNewHomework({ ...newHomework, task_type: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="hw_deadline" className="text-sm">Deadline</Label>
                        <Input
                          id="hw_deadline"
                          type="date"
                          value={newHomework.deadline}
                          onChange={(e) => setNewHomework({ ...newHomework, deadline: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="hw_description" className="text-sm">Task Description</Label>
                      <Textarea
                        id="hw_description"
                        placeholder="Describe the task or assignment"
                        value={newHomework.task_description}
                        onChange={(e) => setNewHomework({ ...newHomework, task_description: e.target.value })}
                        className="mt-1 min-h-[60px]"
                      />
                    </div>
                    {/* <div>
                      <Label htmlFor="hw_link" className="text-sm">Submission Link</Label>
                      <Input
                        id="hw_link"
                        type="url"
                        placeholder="https://example.com/submission"
                        value={newHomework.submission_link}
                        onChange={(e) => setNewHomework({ ...newHomework, submission_link: e.target.value })}
                        className="mt-1"
                      />
                    </div> */}
                    {/* <div>
                      <Label htmlFor="hw_notes" className="text-sm">Feedback Notes</Label>
                      <Textarea
                        id="hw_notes"
                        placeholder="Add feedback or instructions"
                        value={newHomework.feedback_notes}
                        onChange={(e) => setNewHomework({ ...newHomework, feedback_notes: e.target.value })}
                        className="mt-1 min-h-[60px]"
                      />
                    </div> */}
                    <Button 
                      onClick={handleSaveHomework}
                      disabled={savingHomework}
                      className="w-full gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      {savingHomework ? 'Saving...' : 'Save Homework Feedback'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Homework List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Student Homework Records ({homeworkRecords.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {homeworkLoading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                        Loading homework records...
                      </div>
                    ) : homeworkRecords.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No homework records yet</p>
                        <p className="text-xs mt-2">Add homework feedback above</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {homeworkRecords.map((homework, index) => (
                          <div
                            key={homework.id}
                            className="border border-border rounded-lg p-4 space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-foreground">
                                  {index + 1}. {homework.student_name}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {homework.task_name}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  homework.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  homework.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                                  homework.status === 'reviewed' ? 'bg-purple-100 text-purple-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {homework.status}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteHomework(homework.id)}
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-muted-foreground">Type</span>
                                <p className="font-medium capitalize">
                                  {homework.feedback_type}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Deadline</span>
                                <p className="font-medium">
                                  {homework.deadline
                                    ? new Date(homework.deadline).toLocaleDateString()
                                    : '-'}
                                </p>
                              </div>
                            </div>

                            {homework.feedback_notes && (
                              <div className="bg-muted/50 rounded p-2 text-sm">
                                <p className="text-muted-foreground">Notes:</p>
                                <p className="text-foreground">{homework.feedback_notes}</p>
                              </div>
                            )}

                            {homework.submission_link && (
                              <div className="pt-2 border-t border-border">
                                <a
                                  href={homework.submission_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline text-sm flex items-center gap-1"
                                >
                                  View Submission <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}



        {/* Page 2: Feedback & Closure */}
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
          </div>
        )}

        {/* Page 2: Session Hours Tracker */}
        {currentPage === 2 && (
          <>
            {userRole === 1 ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Volunteer Hours Tracking</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="plan_coordinate_hours" className="text-sm">Plan & Coordinate Hours</Label>
                    <Input
                      id="plan_coordinate_hours"
                      type="number"
                      min="0"
                      step="0.5"
                      value={hoursData.plan_coordinate_hours}
                      onChange={(e) => setHoursData({ ...hoursData, plan_coordinate_hours: parseFloat(e.target.value) || 0 })}
                      placeholder="0.0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="preparation_hours" className="text-sm">Preparation Hours</Label>
                    <Input
                      id="preparation_hours"
                      type="number"
                      min="0"
                      step="0.5"
                      value={hoursData.preparation_hours}
                      onChange={(e) => setHoursData({ ...hoursData, preparation_hours: parseFloat(e.target.value) || 0 })}
                      placeholder="0.0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="session_hours" className="text-sm">Session Hours</Label>
                    <Input
                      id="session_hours"
                      type="number"
                      min="0"
                      step="0.5"
                      value={hoursData.session_hours}
                      onChange={(e) => setHoursData({ ...hoursData, session_hours: parseFloat(e.target.value) || 0 })}
                      placeholder="0.0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reflection_feedback_followup_hours" className="text-sm">Reflection & Feedback & Followup Hours</Label>
                    <Input
                      id="reflection_feedback_followup_hours"
                      type="number"
                      min="0"
                      step="0.5"
                      value={hoursData.reflection_feedback_followup_hours}
                      onChange={(e) => setHoursData({ ...hoursData, reflection_feedback_followup_hours: parseFloat(e.target.value) || 0 })}
                      placeholder="0.0"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Total Volunteering Time Display */}
                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Total Volunteering Time</Label>
                      <p className="text-2xl font-bold text-blue-600 mt-2">
                        {(
                          (hoursData.plan_coordinate_hours || 0) +
                          (hoursData.preparation_hours || 0) +
                          (hoursData.session_hours || 0) +
                          (hoursData.reflection_feedback_followup_hours || 0)
                        ).toFixed(2)} hours
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="logged_hours_in_benevity" className="text-sm">Logged hours in Benevity?</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          id="logged_hours_in_benevity"
                          type="checkbox"
                          checked={hoursData.logged_hours_in_benevity}
                          onChange={(e) => setHoursData({ ...hoursData, logged_hours_in_benevity: e.target.checked })}
                          className="w-5 h-5"
                        />
                        <span className="text-sm">{hoursData.logged_hours_in_benevity ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="hours_notes" className="text-sm">Notes</Label>
                  <Textarea
                    id="hours_notes"
                    value={hoursData.notes}
                    onChange={(e) => setHoursData({ ...hoursData, notes: e.target.value })}
                    placeholder="Add any additional notes about the hours tracked"
                    className="mt-1 min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <Shield className="h-12 w-12 text-destructive mx-auto" />
                    <h2 className="text-xl font-bold">Access Denied</h2>
                    <p className="text-muted-foreground">
                      Session Hours Tracker is only accessible to administrators.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
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

            {currentPage < 4 && (
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
                onClick={handleSaveHoursTracker}
                disabled={saving}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Hours'}
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
