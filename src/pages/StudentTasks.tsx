import { useState, useEffect } from 'react';
import { ListTodo, Search, Clock, CheckCircle2, History, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAcademicYear } from '@/contexts/AcademicYearContext';

interface StudentTask {
  id: string;
  task_name: string;
  task_description: string;
  deadline: string;
  feedback_type: string;
  status: string;
  feedback_notes?: string;
  submission_link?: string;
  created_at: string;
  earning_amount?: number;
}

export default function StudentTasks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'upcoming'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { selectedYear, getDateRange } = useAcademicYear();

  useEffect(() => {
    if (user?.email) {
      loadStudentTasks();
    }
  }, [user?.email, selectedYear]);

  const loadStudentTasks = async () => {
    try {
      setLoading(true);

      // Get student record first
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('email', user?.email)
        .single();

      if (studentError) throw studentError;

      const { startDate, endDate } = getDateRange();

      const { data, error } = await supabase
        .from('student_task_feedback')
        .select('*')
        .eq('student_id', student.id)
        .or(`academic_year.eq."${selectedYear}",and(academic_year.is.null,created_at.gte."${startDate.toISOString()}",created_at.lte."${endDate.toISOString()}")`)
        .order('deadline', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Failed to load your tasks');
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.task_name.toLowerCase().includes(searchQuery.toLowerCase());

    if (filter === 'all') return matchesSearch;
    if (filter === 'submitted') return matchesSearch && task.status === 'submitted';
    if (filter === 'pending') return matchesSearch && task.status === 'pending';
    if (filter === 'upcoming') {
      const isPending = task.status === 'pending';
      const isUpcoming = new Date(task.deadline) >= new Date();
      return matchesSearch && isPending && isUpcoming;
    }
    return matchesSearch;
  });

  const statusBadgeVariant = (status: string) => {
    if (status === 'submitted') return 'secondary';
    if (status === 'approved' || status === 'reviewed') return 'default';
    return 'outline';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ListTodo className="h-8 w-8 text-primary" />
            My Tasks
          </h1>
          <p className="text-muted-foreground mt-1">Manage and track your assigned activities</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/50 border-none focus-visible:ring-primary"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <Button variant={filter === 'all' ? 'default' : 'ghost'} onClick={() => setFilter('all')} size="sm">All</Button>
            <Button variant={filter === 'upcoming' ? 'default' : 'ghost'} onClick={() => setFilter('upcoming')} size="sm" className="gap-1.5">
              <Clock className="h-4 w-4" /> Upcoming
            </Button>
            <Button variant={filter === 'pending' ? 'default' : 'ghost'} onClick={() => setFilter('pending')} size="sm" className="gap-1.5">
              <History className="h-4 w-4" /> Pending
            </Button>
            <Button variant={filter === 'submitted' ? 'default' : 'ghost'} onClick={() => setFilter('submitted')} size="sm" className="gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Submitted
            </Button>
          </div>
        </div>

        {/* Task Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <Card className="border-dashed py-20">
            <CardContent className="flex flex-col items-center gap-4">
              <div className="p-4 bg-muted rounded-full">
                <ListTodo className="h-10 w-10 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">No tasks found</p>
                <p className="text-sm text-muted-foreground">Adjust your filters or search to find what you're looking for</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => (
              <Card
                key={task.id}
                className="hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group border-border/50"
                onClick={() => navigate(`/student-tasks/${task.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <Badge variant={statusBadgeVariant(task.status)}>
                      {task.status}
                    </Badge>
                    {task.deadline && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(task.deadline).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <CardTitle className="text-xl mt-3 group-hover:text-primary transition-colors line-clamp-2">
                    {task.task_name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 mt-1">
                    {task.task_description
                      ? task.task_description.replace(/<[^>]*>/g, '').slice(0, 120) + (task.task_description.length > 120 ? '…' : '')
                      : 'No description provided'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between pt-4 border-t border-border mt-2">
                    <div className="text-xs text-muted-foreground font-medium flex gap-3">
                      <span>TYPE: {task.feedback_type.toUpperCase()}</span>
                      <span className="text-primary font-bold">Earn: {task.earning_amount || 5}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-primary gap-1 group-hover:gap-2 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/student-tasks/${task.id}`);
                      }}
                    >
                      View Details
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
