import { useState, useEffect } from 'react';
import { Search, Plus, ExternalLink, ClipboardList, ChevronRight, MoreHorizontal, Eye, Trash2, BookOpen, Calendar, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  subject_name?: string;
  academic_year?: string;
}

interface TaskGroup {
  title: string;
  description: string;
  created_at: string;
  due_date: string;
  subject_name: string;
  class_name: string;
  session_title: string;
  academic_year: string;
  reward: number;
  latestCompletionDate: string | null;
  tasks: TaskItem[];
  completedCount: number;
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
  const navigate = useNavigate();
  const { selectedYear, getDateRange } = useAcademicYear();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskItem[]>([]);
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterSession, setFilterSession] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [subjects, setSubjects] = useState<{ id: string, name: string }[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [filterSessions, setFilterSessions] = useState<SessionOption[]>([]);

  useEffect(() => {
    fetchClasses();
    fetchTasks();
    fetchSubjects();
  }, [selectedYear]);

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
    if (filterSubject !== 'all') {
      filtered = filtered.filter((t) => t.subject_name === filterSubject);
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter((t) => t.status === filterStatus);
    }
    if (filterDateFrom || filterDateTo) {
      filtered = filtered.filter((t) => {
        if (!t.due_date) return false;
        const taskDate = new Date(t.due_date);
        if (filterDateFrom && taskDate < new Date(filterDateFrom)) return false;
        if (filterDateTo && taskDate > new Date(filterDateTo)) return false;
        return true;
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
          subject_name: task.subject_name && task.subject_name !== '-' ? task.subject_name : '-',
          class_name: task.class_name && task.class_name !== '-' ? task.class_name : '-',
          session_title: task.session_title && task.session_title !== '-' ? task.session_title : '-',
          academic_year: task.academic_year || '-',
          reward: (task as any).earning_amount || 0,
          latestCompletionDate: null,
          tasks: [],
          completedCount: 0,
        });
      }
      const group = grouped.get(key)!;
      group.tasks.push(task);
      
      // Update group metadata if the current task has better info
      if (group.subject_name === '-' && task.subject_name && task.subject_name !== '-') {
        group.subject_name = task.subject_name;
      }
      if (group.class_name === '-' && task.class_name && task.class_name !== '-') {
        group.class_name = task.class_name;
      }
      if (group.session_title === '-' && task.session_title && task.session_title !== '-') {
        group.session_title = task.session_title;
      }
      if (group.academic_year === '-' && task.academic_year) {
        group.academic_year = task.academic_year;
      }
      if (group.reward === 0 && (task as any).earning_amount) {
        group.reward = (task as any).earning_amount;
      }

      if (task.status === 'completed') {
        group.completedCount++;
        const completionDate = (task as any).updated_at || task.created_at;
        if (!group.latestCompletionDate || completionDate > group.latestCompletionDate) {
          group.latestCompletionDate = completionDate;
        }
      }
    });
    setTaskGroups(Array.from(grouped.values()));
  }, [tasks, filterClass, filterSession, filterSubject, filterStatus, filterDateFrom, filterDateTo, searchQuery, classes]);

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

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name');
      if (error) throw error;
      setSubjects(data || []);
    } catch (e) {
      console.error('Error fetching subjects:', e);
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
      const { startDate, endDate } = getDateRange();
      
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
          updated_at,
          academic_year,
          earning_amount,
          students:student_id(
            name,
            classes(name)
          ),
          sessions:session_id(
            title, 
            class_batch,
            subjects:subject_id(name)
          ),
          subjects:subject_id(name)
        `)
        .or(`academic_year.eq."${selectedYear}",and(academic_year.is.null,created_at.gte."${startDate.toISOString()}",created_at.lte."${endDate.toISOString()}")`)
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
        updated_at: task.updated_at || '',
        academic_year: task.academic_year || '',
        earning_amount: task.earning_amount || 0,
        student_name: task.students?.name || '-',
        session_title: task.sessions?.title || '-',
        class_name: task.sessions?.class_batch || 
                   (task.students?.classes && !Array.isArray(task.students.classes) ? task.students.classes.name : 
                    Array.isArray(task.students?.classes) && task.students.classes.length > 0 ? task.students.classes[0].name : '-'),
        subject_name: task.subjects?.name || 
                     (task.sessions?.subjects && !Array.isArray(task.sessions.subjects) ? task.sessions.subjects.name : 
                      Array.isArray(task.sessions?.subjects) && task.sessions.subjects.length > 0 ? task.sessions.subjects[0].name : '-'),
      }));

      setTasks(enriched);
    } catch (e) {
      console.error('Error fetching tasks:', e);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
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

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedGroups = [...taskGroups].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    let aVal: any = a[key as keyof typeof a];
    let bVal: any = b[key as keyof typeof b];

    if (key === 'completion') {
      aVal = a.tasks.length ? a.completedCount / a.tasks.length : 0;
      bVal = b.tasks.length ? b.completedCount / b.tasks.length : 0;
    } else if (key === 'created_at' || key === 'due_date') {
      aVal = aVal ? new Date(aVal).getTime() : 0;
      bVal = bVal ? new Date(bVal).getTime() : 0;
    }

    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });

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
          <Button onClick={() => navigate('/tasks/add')} className="gap-2 w-full sm:w-auto">
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

          <div className="w-full sm:w-48">
            <label className="text-sm font-medium text-foreground mb-2 block">Subject</label>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger>
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
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
            <div className="flex gap-2">
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                placeholder="From"
                title="From date"
              />
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                placeholder="To"
                title="To date"
              />
            </div>
          </div>

          {(filterClass !== 'all' || filterSession !== 'all' || filterStatus !== 'all' || searchQuery.trim() || filterDateFrom || filterDateTo) && (
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
                <Button onClick={() => navigate('/tasks/add')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-md border border-border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[18%]"><div className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('title')}>Task Name <ArrowUpDown className="h-3 w-3" /></div></TableHead>
                      <TableHead><div className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('created_at')}>Created <ArrowUpDown className="h-3 w-3" /></div></TableHead>
                      <TableHead><div className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('subject_name')}>Subject <ArrowUpDown className="h-3 w-3" /></div></TableHead>
                      <TableHead><div className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('class_name')}>Class <ArrowUpDown className="h-3 w-3" /></div></TableHead>
                      <TableHead><div className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('session_title')}>Session <ArrowUpDown className="h-3 w-3" /></div></TableHead>
                      <TableHead><div className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('academic_year')}>Year <ArrowUpDown className="h-3 w-3" /></div></TableHead>
                      <TableHead><div className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('reward')}>Reward <ArrowUpDown className="h-3 w-3" /></div></TableHead>
                      <TableHead><div className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('due_date')}>Deadline <ArrowUpDown className="h-3 w-3" /></div></TableHead>
                      <TableHead><div className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('completion')}>Status <ArrowUpDown className="h-3 w-3" /></div></TableHead>
                      <TableHead className="text-center"><div className="flex justify-center items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('completion')}>Completion <ArrowUpDown className="h-3 w-3" /></div></TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedGroups.map((group) => (
                      <TableRow key={group.title} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">
                          <span className="text-foreground">{group.title}</span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(group.created_at || new Date()).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal whitespace-nowrap">
                            {group.subject_name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{group.class_name}</TableCell>
                        <TableCell>
                          {group.session_title !== '-' ? (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/30 px-2 py-1 rounded-md w-fit">
                              <Calendar className="h-3 w-3" />
                              <span className="truncate max-w-[80px]" title={group.session_title}>
                                {group.session_title}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-[10px] whitespace-nowrap">{group.academic_year}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-100 text-[10px]">
                            {group.reward} pts
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {group.due_date ? new Date(group.due_date).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>Progress</span>
                              <span>{group.completedCount}/{group.tasks.length}</span>
                            </div>
                            <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${(group.completedCount / group.tasks.length) * 100}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-medium text-center">
                          <span className={group.completedCount === group.tasks.length ? "text-green-600" : "text-foreground"}>
                            {group.completedCount}/{group.tasks.length}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px]">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => navigate(`/tasks/${encodeURIComponent(group.title)}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/tasks/${encodeURIComponent(group.title)}/edit`)}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Edit Task
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={async () => {
                                  if (confirm('Are you sure you want to delete this task for all students?')) {
                                    try {
                                      const { error } = await supabase
                                        .from('student_task_feedback')
                                        .delete()
                                        .eq('task_name', group.title);
                                      if (error) throw error;
                                      toast.success('Task deleted successfully');
                                      fetchTasks();
                                    } catch (e) {
                                      console.error(e);
                                      toast.error('Failed to delete task');
                                    }
                                  }
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
