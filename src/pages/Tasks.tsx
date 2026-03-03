import { useState, useEffect } from 'react';
import { Search, Plus, ExternalLink, ClipboardList } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterSession, setFilterSession] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

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
  });

  useEffect(() => {
    fetchClasses();
    fetchTasks();
  }, []);

  useEffect(() => {
    if (formData.class_id) {
      fetchSessionsByClass(formData.class_id);
      fetchStudentsByClass(formData.class_id);
    } else {
      setSessions([]);
      setStudents([]);
    }
  }, [formData.class_id]);

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
  }, [tasks, filterClass, filterSession, filterStatus, searchQuery, classes]);

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

  const fetchSessionsByClass = async (classId: string) => {
    try {
      const cls = classes.find((c) => c.id === classId);
      if (!cls) return;
      const { data, error } = await (supabase as any)
        .from('sessions')
        .select('id, title')
        .eq('class_batch', cls.name)
        .order('session_date', { ascending: false });
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
          students:student_id(name),
          sessions:session_id(title, class_batch)
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
        created_at: '',
        student_name: task.students?.name || '-',
        session_title: task.sessions?.title || '-',
        class_name: task.sessions?.class_batch || '-',
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
      // Fetch students if not already loaded
      let studentsToAssign = students;
      if (studentsToAssign.length === 0) {
        const { data: fetchedStudents, error: fetchError } = await supabase
          .from('students')
          .select('id, name')
          .eq('class_id', formData.class_id)
          .order('name');
        
        if (fetchError) throw fetchError;
        studentsToAssign = fetchedStudents || [];
      }

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
      setFormData({ title: '', description: '', class_id: '', session_id: '', student_id: '', due_date: '', submission_link: '' });
      fetchTasks();
    } catch (e) {
      console.error('Error creating task:', e);
      toast.error('Failed to create task');
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

          {(filterClass !== 'all' || filterSession !== 'all' || filterStatus !== 'all' || searchQuery.trim()) && (
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
              All Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredTasks.length === 0 ? (
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
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Session</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submission</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{task.title}</div>
                              {task.description && (
                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {task.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{task.class_name || '-'}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{task.session_title || '-'}</TableCell>
                          <TableCell>{task.student_name || '-'}</TableCell>
                          <TableCell>
                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>{getStatusBadge(task.status)}</TableCell>
                          <TableCell>
                            {task.submission_link ? (
                              <a
                                href={task.submission_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                View
                              </a>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {filteredTasks.map((task) => (
                    <Card key={task.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-foreground">{task.title}</h3>
                        {getStatusBadge(task.status)}
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      )}
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>Class: {task.class_name || '-'}</div>
                        <div>Session: {task.session_title || '-'}</div>
                        <div>Student: {task.student_name || '-'}</div>
                        <div>Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}</div>
                        {task.submission_link && (
                          <a
                            href={task.submission_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View Submission
                          </a>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

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
