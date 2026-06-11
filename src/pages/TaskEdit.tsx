import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TaskData {
  id: string;
  task_name: string;
  task_description: string;
  deadline: string;
  session_id: string;
  academic_year: string;
  earning_amount: number;
  class_id?: string;
  feedback_type?: string;
  subject_id?: string;
  submission_link?: string;
}

interface ClassOption {
  id: string;
  name: string;
}

export default function TaskEdit() {
  const navigate = useNavigate();
  const { taskTitle } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [taskData, setTaskData] = useState<TaskData | null>(null);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    academicYear: '',
    reward: 0,
    classId: '',
  });
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [students, setStudents] = useState<{id: string, name: string}[]>([]);
  const [originalStudents, setOriginalStudents] = useState<string[]>([]);

  useEffect(() => {
    if (formData.classId) {
      fetchStudentsByClass(formData.classId, formData.academicYear);
    } else if (originalStudents.length > 0) {
      fetchAssignedStudents(originalStudents);
    }
  }, [formData.classId, formData.academicYear, originalStudents]);

  useEffect(() => {
    if (taskTitle) {
      loadData();
    }
  }, [taskTitle]);

  const loadData = async () => {
    setLoading(true);
    // Fetch classes first, then task data
    await fetchClasses();
    await fetchTaskData();
    setLoading(false);
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchAssignedStudents = async (studentIds: string[]) => {
    if (studentIds.length === 0) return;
    const { data, error } = await supabase
      .from('students')
      .select('id, name')
      .in('id', studentIds)
      .order('name');
    if (!error && data) setStudents(data);
  };

  const fetchStudentsByClass = async (classId: string, academicYear: string) => {
    let query = supabase
      .from('students')
      .select('id, name')
      .eq('class_id', classId)
      .order('name');
      
    // Optionally filter by academic year if it's strictly needed, 
    // but loosening it helps prevent missing students.
    // if (academicYear) {
    //   query = query.eq('academic_year', academicYear);
    // }
    
    const { data, error } = await query;
    if (!error && data) setStudents(data);
  };

  const formatDatetimeLocal = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const fetchTaskData = async () => {
    try {
      const { data, error } = await supabase
        .from('student_task_feedback')
        .select('*')
        .eq('task_name', decodeURIComponent(taskTitle || ''));

      if (error) throw error;

      if (data && data.length > 0) {
        const firstRow = data[0];
        setTaskData(firstRow);
        
        const assignedStudentIds = data.map(r => r.student_id).filter(Boolean);
        setSelectedStudents(assignedStudentIds);
        setOriginalStudents(assignedStudentIds);

        let resolvedClassId = firstRow.class_id;

        // If the task doesn't have a class_id saved, find it from the first assigned student
        if (!resolvedClassId && assignedStudentIds.length > 0) {
          const { data: studentData } = await supabase
            .from('students')
            .select('class_id')
            .eq('id', assignedStudentIds[0])
            .single();
            
          if (studentData && studentData.class_id) {
            resolvedClassId = studentData.class_id;
          }
        }

        setFormData({
          title: firstRow.task_name || '',
          description: firstRow.task_description || '',
          dueDate: firstRow.deadline ? formatDatetimeLocal(firstRow.deadline) : '',
          academicYear: firstRow.academic_year || '',
          reward: firstRow.earning_amount || 0,
          classId: resolvedClassId || '',
        });
      }
    } catch (error) {
      console.error('Error fetching task data:', error);
      toast.error('Failed to load task');
      navigate('/tasks');
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('student_task_feedback')
        .update({
          task_name: formData.title,
          task_description: formData.description,
          deadline: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
          academic_year: formData.academicYear,
          earning_amount: formData.reward,
          class_id: formData.classId || null,
        })
        .eq('task_name', decodeURIComponent(taskTitle || ''));

      if (error) throw error;

      const addedStudents = selectedStudents.filter(id => !originalStudents.includes(id));
      const removedStudents = originalStudents.filter(id => !selectedStudents.includes(id));
      
      if (removedStudents.length > 0) {
        await supabase
          .from('student_task_feedback')
          .delete()
          .eq('task_name', formData.title)
          .in('student_id', removedStudents);
      }
      
      if (addedStudents.length > 0 && taskData) {
        const newRecords = addedStudents.map(studentId => ({
            session_id: taskData.session_id || null,
            student_id: studentId,
            feedback_type: taskData.feedback_type || 'Custom Task',
            task_name: formData.title,
            task_description: formData.description || null,
            deadline: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
            submission_link: taskData.submission_link || null,
            status: 'pending',
            created_at: new Date().toISOString(),
            academic_year: formData.academicYear,
            subject_id: taskData.subject_id || null,
            earning_amount: formData.reward,
            class_id: formData.classId || null
        }));
        await supabase.from('student_task_feedback').insert(newRecords);
      }

      toast.success('Task updated successfully');
      navigate(`/tasks/${encodeURIComponent(formData.title)}`);
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Failed to save task');
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

  if (!taskData) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Task not found</p>
          <Button onClick={() => navigate('/tasks')} className="mt-4">
            Back to Tasks
          </Button>
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
            onClick={() => navigate(`/tasks/${encodeURIComponent(taskTitle || '')}`)
            }
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit Task</h1>
            <p className="text-sm text-muted-foreground">Update task details</p>
          </div>
        </div>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Task Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Task Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter task title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Task Description
              </label>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
              />
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Academic Year
              </label>
              <Select
                value={formData.academicYear}
                onValueChange={(value) => setFormData({ ...formData, academicYear: value })}
              >
                <SelectTrigger className="w-full bg-background border-border">
                  <SelectValue placeholder="Select Academic Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025-26">2025-26</SelectItem>
                  <SelectItem value="2026-27">2026-27</SelectItem>
                  <SelectItem value="2027-28">2027-28</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Students Selection */}
            {students.length > 0 && (
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Assign to Students *
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal border-border">
                          {selectedStudents.length === students.length 
                            ? "All Students Selected" 
                            : selectedStudents.length > 0 
                              ? `${selectedStudents.length} Student(s) Selected` 
                              : "Select Students..."}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] sm:w-[400px] p-0" align="start">
                        <div className="p-3 border-b flex justify-between items-center bg-muted/20">
                          <span className="text-sm font-medium">Select Students</span>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-xs px-2"
                            onClick={() => {
                                if (selectedStudents.length === students.length) {
                                    setSelectedStudents([]);
                                } else {
                                    setSelectedStudents(students.map(s => s.id));
                                }
                            }}
                          >
                              {selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
                          </Button>
                        </div>
                        <div className="max-h-[250px] overflow-y-auto p-2 space-y-1">
                          {students.map(student => (
                            <div key={student.id} className="flex items-center space-x-3 hover:bg-accent hover:text-accent-foreground p-2 rounded-sm cursor-pointer"
                              onClick={() => {
                                if (selectedStudents.includes(student.id)) {
                                  setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                                } else {
                                  setSelectedStudents([...selectedStudents, student.id]);
                                }
                              }}
                            >
                              <Checkbox 
                                id={`student-${student.id}`}
                                checked={selectedStudents.includes(student.id)}
                                onCheckedChange={(checked) => {
                                    if (checked) {
                                        setSelectedStudents([...selectedStudents, student.id]);
                                    } else {
                                        setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                                    }
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <label 
                                htmlFor={`student-${student.id}`}
                                className="text-sm font-medium leading-none cursor-pointer flex-1"
                                onClick={(e) => e.preventDefault()}
                              >
                                {student.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                </div>
            )}



            {/* Reward */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Reward Points
              </label>
              <input
                type="number"
                value={formData.reward}
                onChange={(e) => setFormData({ ...formData, reward: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>


            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Due Date
              </label>
              <input
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/tasks/${encodeURIComponent(taskTitle || '')}`)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
