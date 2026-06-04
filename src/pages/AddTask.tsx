import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Save } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAcademicYear } from '@/contexts/AcademicYearContext';

interface ClassOption {
  id: string;
  name: string;
}

interface SessionOption {
  id: string;
  title: string;
}

interface StudentOption {
  id: string;
  name: string;
}

export default function AddTask() {
  const navigate = useNavigate();
  const { selectedYear } = useAcademicYear();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [subjects, setSubjects] = useState<{ id: string, name: string }[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    class_id: '',
    session_id: '',
    student_id: '',
    due_date: '',
    submission_link: '',
    academic_year: selectedYear,
    subject_id: '',
    earning_amount: 5,
  });

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (formData.class_id) {
      fetchSessionsByClass(formData.class_id);
      fetchStudentsByClass(formData.class_id, formData.academic_year);
    } else {
      setSessions([]);
      setStudents([]);
    }
  }, [formData.class_id, formData.academic_year]);

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from('classes')
      .select('id, name')
      .order('name');
    if (!error && data) setClasses(data);
  };

  const fetchSubjects = async () => {
    const { data, error } = await supabase
      .from('subjects')
      .select('id, name')
      .order('name');
    if (!error && data) setSubjects(data);
  };

  const fetchSessionsByClass = async (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return;
    const { data, error } = await supabase
      .from('sessions')
      .select('id, title')
      .eq('class_batch', cls.name)
      .order('session_date', { ascending: false });
    if (!error && data) setSessions(data);
  };

  const fetchStudentsByClass = async (classId: string, academicYear: string) => {
    const { data, error } = await supabase
      .from('students')
      .select('id, name')
      .eq('class_id', classId)
      .eq('academic_year', academicYear)
      .order('name');
    if (!error && data) setStudents(data);
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.class_id || !formData.academic_year) {
      toast.error('Please fill in required fields (Title, Class, Academic Year)');
      return;
    }

    try {
      setLoading(true);
      let studentsToAssign: { id: string }[] = [];

      if (formData.student_id && formData.student_id !== 'all') {
        studentsToAssign = [{ id: formData.student_id }];
      } else {
        const { data: classStudents, error: studentsError } = await supabase
          .from('students')
          .select('id')
          .eq('class_id', formData.class_id)
          .eq('academic_year', formData.academic_year);
        
        if (studentsError) throw studentsError;
        studentsToAssign = classStudents || [];
      }

      if (studentsToAssign.length === 0) {
        toast.error('No students found in this class');
        return;
      }

      const taskRecords = studentsToAssign.map(student => ({
        session_id: formData.session_id || null,
        student_id: student.id,
        feedback_type: 'homework',
        task_name: formData.title,
        task_description: formData.description || null,
        deadline: formData.due_date ? new Date(formData.due_date).toISOString() : null,
        submission_link: formData.submission_link || null,
        status: 'pending',
        created_at: new Date().toISOString(),
        academic_year: formData.academic_year,
        subject_id: formData.subject_id || null,
        earning_amount: formData.earning_amount,
      }));

      const { error } = await supabase.from('student_task_feedback').insert(taskRecords);
      if (error) throw error;

      toast.success(`Task assigned to ${studentsToAssign.length} students`);
      navigate('/tasks');
    } catch (e) {
      console.error('Error creating task:', e);
      toast.error('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/tasks')}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create New Task</h1>
            <p className="text-sm text-muted-foreground">Assign a new task to students or a whole class</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Homework Assignment 1"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select
                  value={formData.subject_id}
                  onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="class">Assign to Class *</Label>
                <Select
                  value={formData.class_id}
                  onValueChange={(value) => setFormData({ ...formData, class_id: value, student_id: 'all' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="student">Specific Student (Optional)</Label>
                <Select
                  value={formData.student_id}
                  onValueChange={(value) => setFormData({ ...formData, student_id: value })}
                  disabled={!formData.class_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Students" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="session">Linked Session (Optional)</Label>
                <Select
                  value={formData.session_id}
                  onValueChange={(value) => setFormData({ ...formData, session_id: value })}
                  disabled={!formData.class_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No Session" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {sessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>{session.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="academic_year">Academic Year *</Label>
                <Select
                  value={formData.academic_year}
                  onValueChange={(value) => setFormData({ ...formData, academic_year: value })}
                >
                  <SelectTrigger id="academic_year">
                    <SelectValue placeholder="Select Academic Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025-26">2025-26</SelectItem>
                    <SelectItem value="2026-27">2026-27</SelectItem>
                    <SelectItem value="2027-28">2027-28</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reward">Reward Points</Label>
                <Input
                  id="reward"
                  type="number"
                  value={formData.earning_amount}
                  onChange={(e) => setFormData({ ...formData, earning_amount: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Task Description</Label>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => navigate('/tasks')}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={loading} className="gap-2">
                {loading ? 'Creating...' : (
                  <>
                    <Save className="h-4 w-4" />
                    Create Task
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
