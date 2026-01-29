import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
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

interface StudentPerformance {
  id?: string;
  student_name: string;
  questions_asked: number;
  performance_rating: number;
  performance_comment: string;
}

interface Session {
  id: string;
  title: string;
  session_date: string;
}

export default function StudentPerformance() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformance[]>([]);
  const [newStudent, setNewStudent] = useState<StudentPerformance>({
    student_name: '',
    questions_asked: 0,
    performance_rating: 5,
    performance_comment: '',
  });

  useEffect(() => {
    if (sessionId) {
      fetchSession();
      fetchStudentPerformance();
    }
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, title, session_date')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      setSession(data);
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Student Performance</h1>
            <p className="text-sm text-muted-foreground">
              {session.title} - {new Date(session.session_date).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Add Student Form */}
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

        {/* Back Button */}
        <div className="flex justify-start">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
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
