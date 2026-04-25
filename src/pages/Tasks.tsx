import { useState, useEffect } from 'react';
import { Search, Plus, ExternalLink, ClipboardList, ChevronDown, ChevronRight, Pencil, Trash2, Calendar, Clock, GraduationCap, BookOpen, Users, FileText, CheckCircle2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TaskItem {
  id: string;
  title: string;
  description: string;
  class_id: string;
  session_id: string;
  student_id: string;
  status: string;
  submission_link: string;
  due_date: string;
  created_at: string;
  student_name?: string;
  session_title?: string;
  class_name?: string;
  academic_year?: string;
  subject_name?: string;
}

interface TaskGroup {
  title: string;
  description: string;
  created_at: string;
  due_date: string;
  tasks: TaskItem[];
  academic_year?: string;
  subject_name?: string;
  session_title?: string;
  class_name?: string;
}

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

export default function Tasks() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskItem[]>([]);
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterSession, setFilterSession] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [selectedTaskGroup, setSelectedTaskGroup] = useState<TaskGroup | null>(null);

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [filterSessions, setFilterSessions] = useState<SessionOption[]>([]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    class_id: '',
    session_id: '',
    student_id: '',
    due_date: '',
    submission_link: '',
    academic_year: '',
    subject_id: '',
  });

  const [allSubjects, setAllSubjects] = useState<{ id: string, name: string }[]>([]);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    class_id: '',
    session_id: '',
    due_date: '',
    submission_link: '',
  });

  useEffect(() => {
    fetchClasses();
    fetchTasks();
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase.from('subjects').select('id, name').order('name');
      if (error) throw error;
      setAllSubjects(data || []);
    } catch (e) {
      console.error('Error fetching subjects:', e);
    }
  };

  useEffect(() => {
    if (formData.class_id) {
      fetchSessionsByClass(formData.class_id, formData.subject_id);
      fetchStudentsByClass(formData.class_id);
    } else {
      setSessions([]);
      setStudents([]);
    }
  }, [formData.class_id, formData.subject_id]);

  useEffect(() => {
    let filtered = tasks;
    if (filterClass !== 'all') {
      const cls = classes.find((c) => c.id === filterClass);
      if (cls) {
        filtered = filtered.filter((t) => t.class_name === cls.name);
      }
    }
    if (filterSession !== 'all') {
      filtered = filtered.filter((t) => t.session_id === filterSession);
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter((t) => t.status === filterStatus);
    }
    if (filterDate) {
      filtered = filtered.filter((t) => {
        if (!t.due_date) return false;
        return new Date(t.due_date).toLocaleDateString() === new Date(filterDate).toLocaleDateString();
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.student_name?.toLowerCase().includes(q) ||
          t.session_title?.toLowerCase().includes(q) ||
          t.class_name?.toLowerCase().includes(q) ||
          t.status?.toLowerCase().includes(q)
      );
    }
    setFilteredTasks(filtered);

    // Group tasks by title
    const grouped = new Map<string, TaskGroup>();
    filtered.forEach((task) => {
      const key = task.title;
      if (!grouped.has(key)) {
        grouped.set(key, {
          title: task.title,
          description: task.description,
          created_at: task.created_at,
          due_date: task.due_date,
          tasks: [],
          academic_year: task.academic_year,
          subject_name: task.subject_name,
          session_title: task.session_title,
          class_name: task.class_name,
        });
      }
      grouped.get(key)!.tasks.push(task);
    });
    setTaskGroups(Array.from(grouped.values()));
  }, [tasks, filterClass, filterSession, filterStatus, filterDate, searchQuery, classes]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('classes')
        .select('id, name')
        .order('name');
      if (error) throw error;
      setClasses(data || []);
    } catch (e) {
      console.error('Error fetching classes:', e);
    }
  };

  const fetchSessionsByClass = async (classId: string, subjectId?: string) => {
    try {
      const cls = classes.find((c) => c.id === classId);
      if (!cls) return;
      let query = (supabase as any)
        .from('sessions')
        .select('id, title')
        .eq('class_batch', cls.name);
      
      if (subjectId) {
        query = query.eq('subject_id', subjectId);
      }
      
      const { data, error } = await query.order('session_date', { ascending: false });
      if (error) throw error;
      setSessions(data || []);
    } catch (e) {
      console.error('Error fetching sessions:', e);
    }
  };

  const fetchStudentsByClass = async (classId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('students')
        .select('id, name')
        .eq('class_id', classId)
        .order('name');
      if (error) throw error;
      setStudents(data || []);
    } catch (e) {
      console.error('Error fetching students:', e);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('student_task_feedback')
        .select(`
          id,
          task_name,
          task_description,
          deadline,
          submission_link,
          status,
          student_id,
          session_id,
          created_at,
          students:student_id(
            name,
            academic_year,
            classes:class_id(name)
          ),
          sessions:session_id(
            title,
            class_batch,
            subjects:subject_id(name)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      const enriched: TaskItem[] = (data || []).map((task: any) => ({
        id: task.id,
        title: task.task_name || '',
        description: task.task_description || '',
        class_id: '',
        session_id: task.session_id || '',
        student_id: task.student_id || '',
        status: task.status || 'pending',
        submission_link: task.submission_link || '',
        due_date: task.deadline || '',
        created_at: task.created_at || '',
        student_name: task.students?.name || '-',
        session_title: task.sessions?.title || '-',
        class_name: task.students?.classes?.name || task.sessions?.class_batch || '-',
        academic_year: task.students?.academic_year || '-',
        subject_name: task.sessions?.subjects?.name || '-',
      }));

      setTasks(enriched);
    } catch (e) {
      console.error('Error fetching tasks:', e);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.class_id) {
      toast.error('Please fill in title and class');
      return;
    }

    try {
      // Fetch students if not already loaded or if filtered by academic year
      let studentsToAssign = students;
      let query = supabase
        .from('students')
        .select('id, name')
        .eq('class_id', formData.class_id);
      
      if (formData.academic_year) {
        query = query.eq('academic_year', formData.academic_year);
      }

      const { data: fetchedStudents, error: fetchError } = await query.order('name');
        
      if (fetchError) throw fetchError;
      studentsToAssign = fetchedStudents || [];

      if (studentsToAssign.length === 0) {
        toast.error('No students found in this class');
        return;
      }

      // Create task for each student in the class
      const taskRecords = studentsToAssign.map(student => ({
        session_id: formData.session_id || null,
        student_id: student.id,
        feedback_type: 'homework',
        task_name: formData.title,
        task_description: formData.description || null,
        deadline: formData.due_date || null,
        submission_link: formData.submission_link || null,
        status: 'pending',
      }));

      const { error } = await supabase.from('student_task_feedback').insert(taskRecords);
      if (error) throw error;

      toast.success(`Task assigned to ${studentsToAssign.length} students`);
      setIsCreateOpen(false);
      setFormData({ title: '', description: '', class_id: '', session_id: '', student_id: '', due_date: '', submission_link: '', academic_year: '', subject_id: '' });
      fetchTasks();
    } catch (e) {
      console.error('Error creating task:', e);
      toast.error('Failed to create task');
    }
  };

  const handleMarkCompleted = async (task: TaskItem) => {
    try {
      const { error: updateError } = await supabase
        .from('student_task_feedback')
        .update({ status: 'completed' })
        .eq('id', task.id);

      if (updateError) throw updateError;

      // Add to earnings
      const { error: earningError } = await supabase
        .from('student_earnings')
        .insert({
          student_id: task.student_id,
          task_id: task.id,
          amount: 5,
          description: `Completed task: ${task.title}`
        });

      if (earningError) {
        console.error('Error adding earnings:', earningError);
        // Don't fail the whole process if earning record fails, but notify
        toast.warning('Task completed, but reward recording failed');
      } else {
        toast.success(`Task marked as completed! Reward of 5 units added.`);
      }

      // Refresh tasks
      fetchTasks();
      
      // Update local state for the modal
      if (selectedTaskGroup) {
        const updatedTasks = selectedTaskGroup.tasks.map(t => 
          t.id === task.id ? { ...t, status: 'completed' } : t
        );
        setSelectedTaskGroup({ ...selectedTaskGroup, tasks: updatedTasks });
      }
    } catch (e) {
      console.error('Error completing task:', e);
      toast.error('Failed to update task status');
    }
  };

  const handleEditOpen = (group: TaskGroup) => {
    setEditFormData({
      title: group.title,
      description: group.description,
      class_id: group.tasks[0]?.class_id || '', // Note: grouping might not have class_id easily accessible if mixed, but usually tasks in a group share class info
      session_id: group.tasks[0]?.session_id || '',
      due_date: group.due_date ? new Date(group.due_date).toISOString().split('T')[0] : '',
      submission_link: group.tasks[0]?.submission_link || '',
    });
    // We need to find the class_id from class_name if possible
    const cls = classes.find(c => c.name === group.tasks[0]?.class_name);
    if (cls) {
      setEditFormData(prev => ({ ...prev, class_id: cls.id }));
      fetchSessionsByClass(cls.id);
    }
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedTaskGroup) return;
    
    try {
      const taskIds = selectedTaskGroup.tasks.map(t => t.id);
      const { error } = await supabase
        .from('student_task_feedback')
        .update({
          task_name: editFormData.title,
          task_description: editFormData.description,
          deadline: editFormData.due_date || null,
          session_id: editFormData.session_id || null,
          submission_link: editFormData.submission_link,
        })
        .in('id', taskIds);

      if (error) throw error;

      toast.success('Task updated for all students');
      setIsEditOpen(false);
      setSelectedTaskGroup(null);
      fetchTasks();
    } catch (e) {
      console.error('Error updating task:', e);
      toast.error('Failed to update task');
    }
  };

  const handleDeleteGroup = async (group: TaskGroup) => {
    if (!window.confirm(`Are you sure you want to delete "${group.title}"? This will remove it for all ${group.tasks.length} students.`)) {
      return;
    }

    try {
      const taskIds = group.tasks.map(t => t.id);
      const { error } = await supabase
        .from('student_task_feedback')
        .delete()
        .in('id', taskIds);

      if (error) throw error;

      toast.success('Task removed for all students');
      setSelectedTaskGroup(null);
      fetchTasks();
    } catch (e) {
      console.error('Error deleting task:', e);
      toast.error('Failed to delete task');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="outline">In Progress</Badge>;
      case 'submitted':
        return <Badge className="bg-primary/20 text-primary">Submitted</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  useEffect(() => {
    if (filterClass !== 'all') {
      const cls = classes.find((c) => c.id === filterClass);
      if (cls) {
        (supabase as any)
          .from('sessions')
          .select('id, title')
          .eq('class_batch', cls.name)
          .order('session_date', { ascending: false })
          .then(({ data }: any) => setFilterSessions(data || []));
      }
    } else {
      setFilterSessions([]);
      setFilterSession('all');
    }
  }, [filterClass, classes]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">📋 Tasks & Projects</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Manage student tasks and track submissions
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end flex-wrap">
          <div className="w-full sm:w-64">
            <label className="text-sm font-medium text-foreground mb-2 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="w-full sm:w-48">
            <label className="text-sm font-medium text-foreground mb-2 block">Filter by Class</label>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger>
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-48">
            <label className="text-sm font-medium text-foreground mb-2 block">Filter by Session</label>
            <Select value={filterSession} onValueChange={setFilterSession}>
              <SelectTrigger>
                <SelectValue placeholder="All Sessions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {filterSessions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-40">
            <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-48">
            <label className="text-sm font-medium text-foreground mb-2 block">Filter by Date</label>
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>

          {(filterClass !== 'all' || filterSession !== 'all' || filterStatus !== 'all' || searchQuery.trim() || filterDate) && (
            <div className="text-sm text-muted-foreground">
              Showing {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Task List */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              All Tasks ({taskGroups.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : taskGroups.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No tasks found</h3>
                <p className="text-muted-foreground mb-4">Create a task to get started</p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {taskGroups.map((group) => (
                  <button
                    key={group.title}
                    onClick={() => setSelectedTaskGroup(group)}
                    className="w-full border border-border rounded-lg p-4 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{group.title}</h3>
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-1">
                          <span>Created: {new Date(group.created_at || new Date()).toLocaleDateString()}</span>
                          <span>Deadline: {group.due_date ? new Date(group.due_date).toLocaleDateString() : '-'}</span>
                          <span className="font-medium text-foreground">{group.tasks.length} student{group.tasks.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Detail Modal */}
        <Dialog open={!!selectedTaskGroup} onOpenChange={(open) => !open && setSelectedTaskGroup(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedTaskGroup(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ← Back
                </button>
                <DialogTitle className="flex-1">{selectedTaskGroup?.title}</DialogTitle>
              </div>
            </DialogHeader>
            
            {selectedTaskGroup && (
              <div className="space-y-4">
                {/* Task Summary Grid */}
                <div className="bg-muted/30 rounded-xl p-6 border border-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Created</span>
                        <p className="font-medium">{new Date(selectedTaskGroup.created_at || new Date()).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-500/10 rounded-lg text-orange-600">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Deadline</span>
                        <p className="font-medium">{selectedTaskGroup.due_date ? new Date(selectedTaskGroup.due_date).toLocaleDateString() : '-'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Academic Year</span>
                        <p className="font-medium">{selectedTaskGroup.academic_year || '-'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Subject</span>
                        <p className="font-medium">{selectedTaskGroup.subject_name || '-'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-500/10 rounded-lg text-green-600">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Class</span>
                        <p className="font-medium">{selectedTaskGroup.class_name || '-'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-pink-500/10 rounded-lg text-pink-600">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Session</span>
                        <p className="font-medium">{selectedTaskGroup.session_title || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {selectedTaskGroup.description && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-2">Description</span>
                      <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{selectedTaskGroup.description}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-6 flex gap-3 border-t border-border mt-6">
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2 h-11"
                      onClick={() => handleEditOpen(selectedTaskGroup!)}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit Details
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="flex-1 gap-2 h-11 shadow-sm"
                      onClick={() => handleDeleteGroup(selectedTaskGroup!)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Task
                    </Button>
                  </div>
                </div>

                {/* Student Details */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Student Details ({selectedTaskGroup.tasks.length})</h3>
                  <div className="space-y-2">
                    {selectedTaskGroup.tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-muted/30 rounded border border-border text-sm">
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{task.student_name}</div>
                          <div className="text-xs text-muted-foreground">{task.class_name}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={
                            task.status === 'completed' ? 'default' :
                            task.status === 'submitted' ? 'secondary' :
                            task.status === 'in_progress' ? 'outline' :
                            'secondary'
                          }>
                            {task.status}
                          </Badge>
                          {task.submission_link && (
                            <a
                              href={task.submission_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          {task.status !== 'completed' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:bg-green-50"
                              onClick={() => handleMarkCompleted(task)}
                              title="Mark as Completed"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Task Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  placeholder="Task title"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder="Task description"
                />
              </div>
              <div>
                <Label>Class (View Only)</Label>
                <Select disabled value={editFormData.class_id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground mt-1">Class cannot be changed after creation</p>
              </div>
              <div>
                <Label>Session</Label>
                <Select
                  value={editFormData.session_id}
                  onValueChange={(v) => setEditFormData({ ...editFormData, session_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={editFormData.due_date}
                  onChange={(e) => setEditFormData({ ...editFormData, due_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Submission Link</Label>
                <Input
                  value={editFormData.submission_link}
                  onChange={(e) => setEditFormData({ ...editFormData, submission_link: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdate}>Update Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Task Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Task title"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Task description"
                />
              </div>
              <div>
                <Label>Academic Year</Label>
                <Select
                  value={formData.academic_year}
                  onValueChange={(v) => setFormData({ ...formData, academic_year: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025-26">2025-26</SelectItem>
                    <SelectItem value="2026-27">2026-27</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Class *</Label>
                <Select
                  value={formData.class_id}
                  onValueChange={(v) => setFormData({ ...formData, class_id: v, session_id: '', student_id: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subject</Label>
                <Select
                  value={formData.subject_id}
                  onValueChange={(v) => setFormData({ ...formData, subject_id: v, session_id: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {allSubjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Session</Label>
                <Select
                  value={formData.session_id}
                  onValueChange={(v) => setFormData({ ...formData, session_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Submission Link</Label>
                <Input
                  value={formData.submission_link}
                  onChange={(e) => setFormData({ ...formData, submission_link: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
