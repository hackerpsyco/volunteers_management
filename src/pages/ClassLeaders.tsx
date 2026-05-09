import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, UserCheck, Eye, ArrowUpDown, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MenteeProgress {
  id: string;
  name: string;
  totalTasks: number;
  completedTasks: number;
}

interface MonitorGroup {
  monitorId: string;
  monitorName: string;
  className: string;
  assignedStudents: MenteeProgress[];
  totalAssignedTasks: number;
  totalCompletedTasks: number;
}

export default function ClassLeaders() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [leaders, setLeaders] = useState<MonitorGroup[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedLeader, setSelectedLeader] = useState<MonitorGroup | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: allStudents, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          name,
          monitor_id,
          classes:class_id(name)
        `);

      if (studentsError) throw studentsError;

      const { data: tasks, error: tasksError } = await supabase
        .from('student_task_feedback')
        .select('student_id, status');

      if (tasksError) throw tasksError;

      const assignedStudentsMap = new Map<string, any[]>();
      
      allStudents?.forEach(student => {
        if (student.monitor_id) {
          if (!assignedStudentsMap.has(student.monitor_id)) {
            assignedStudentsMap.set(student.monitor_id, []);
          }
          assignedStudentsMap.get(student.monitor_id)!.push(student);
        }
      });

      const leaderData: MonitorGroup[] = [];

      assignedStudentsMap.forEach((mentees, monitorId) => {
        const monitor = allStudents?.find(s => s.id === monitorId);
        if (monitor) {
          const className = monitor.classes ? (monitor.classes as any).name : '-';
          
          let totalAssigned = 0;
          let totalCompleted = 0;

          const menteesWithProgress = mentees.map(mentee => {
            const menteeTasks = tasks?.filter(t => t.student_id === mentee.id) || [];
            const menteeTotal = menteeTasks.length;
            const menteeCompleted = menteeTasks.filter(t => t.status === 'completed').length;
            
            totalAssigned += menteeTotal;
            totalCompleted += menteeCompleted;

            return {
              id: mentee.id,
              name: mentee.name,
              totalTasks: menteeTotal,
              completedTasks: menteeCompleted
            };
          }).sort((a, b) => a.name.localeCompare(b.name));

          leaderData.push({
            monitorId: monitor.id,
            monitorName: monitor.name,
            className,
            assignedStudents: menteesWithProgress,
            totalAssignedTasks: totalAssigned,
            totalCompletedTasks: totalCompleted
          });
        }
      });

      setLeaders(leaderData);
    } catch (error: any) {
      console.error('Error fetching class leaders:', error);
      toast.error('Failed to load class leaders data');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredLeaders = leaders.filter(leader => 
    leader.monitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    leader.className.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedLeaders = [...filteredLeaders].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    
    let aVal: any = a[key as keyof MonitorGroup];
    let bVal: any = b[key as keyof MonitorGroup];

    if (key === 'assignedCount') {
      aVal = a.assignedStudents.length;
      bVal = b.assignedStudents.length;
    } else if (key === 'progress') {
      aVal = a.totalAssignedTasks ? (a.totalCompletedTasks / a.totalAssignedTasks) : 0;
      bVal = b.totalAssignedTasks ? (b.totalCompletedTasks / b.totalAssignedTasks) : 0;
    }

    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const openDetails = (leader: MonitorGroup) => {
    setSelectedLeader(leader);
    setDetailsOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Class Leaders
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor task review progress of assigned class leaders
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by leader name or class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[25%]"><div className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('monitorName')}>Class Leader <ArrowUpDown className="h-3 w-3" /></div></TableHead>
                  <TableHead className="w-[20%]"><div className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('className')}>Class <ArrowUpDown className="h-3 w-3" /></div></TableHead>
                  <TableHead className="w-[15%] text-center"><div className="flex items-center justify-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('assignedCount')}>Assigned Students <ArrowUpDown className="h-3 w-3" /></div></TableHead>
                  <TableHead className="w-[25%]"><div className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('progress')}>Review Progress <ArrowUpDown className="h-3 w-3" /></div></TableHead>
                  <TableHead className="w-[15%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sortedLeaders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No class leaders found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedLeaders.map((leader) => {
                    const progressPercent = leader.totalAssignedTasks > 0 
                      ? Math.round((leader.totalCompletedTasks / leader.totalAssignedTasks) * 100) 
                      : 0;
                    
                    return (
                      <TableRow key={leader.monitorId}>
                        <TableCell className="font-medium">{leader.monitorName}</TableCell>
                        <TableCell>{leader.className}</TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {leader.assignedStudents.length} Students
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{leader.totalCompletedTasks} / {leader.totalAssignedTasks} Tasks</span>
                              <span className="font-medium">{progressPercent}%</span>
                            </div>
                            <Progress value={progressPercent} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => openDetails(leader)} className="gap-2">
                            <Eye className="h-4 w-4" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                {selectedLeader?.monitorName}'s Assigned Students
              </DialogTitle>
            </DialogHeader>
            
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Class</p>
                  <p className="font-medium">{selectedLeader?.className}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Assigned Mentees</p>
                  <p className="font-medium">{selectedLeader?.assignedStudents.length} Students</p>
                </div>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead className="text-center">Tasks Completed</TableHead>
                      <TableHead className="text-right">Review Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedLeader?.assignedStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                          No students assigned to this leader.
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedLeader?.assignedStudents.map((mentee) => {
                        const isFullyReviewed = mentee.totalTasks > 0 && mentee.completedTasks === mentee.totalTasks;
                        const hasNoTasks = mentee.totalTasks === 0;
                        
                        return (
                          <TableRow key={mentee.id}>
                            <TableCell className="font-medium">{mentee.name}</TableCell>
                            <TableCell className="text-center">
                              {mentee.completedTasks} / {mentee.totalTasks}
                            </TableCell>
                            <TableCell className="text-right">
                              {hasNoTasks ? (
                                <span className="text-xs text-muted-foreground">No tasks</span>
                              ) : isFullyReviewed ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                  Fully Reviewed
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                  Pending Review
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
