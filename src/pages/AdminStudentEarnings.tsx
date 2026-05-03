import { useState, useEffect } from 'react';
import { Wallet, Search, Filter, ArrowUpDown, Pencil, Trash2, TrendingUp, Info } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useAcademicYear } from '@/contexts/AcademicYearContext';

interface StudentEarning {
  student_id: string;
  student_name: string;
  class_name: string;
  total_earned: number;
  last_earned_at: string | null;
}

interface EarningRecord {
  id: string;
  student_id: string;
  amount: number;
  earned_at: string;
  description: string;
}

interface RewardConfig {
  id: string;
  task_type: string;
  expected_tasks: number;
  frequency: string;
  rate_per_task: number;
  potential_monthly: number;
  how_to_earn: string;
}

const DEFAULT_EARNING_POTENTIAL = [
  { task_type: 'English Reading & speaking Task', expected_tasks: 2, frequency: 'Daily', rate_per_task: 5, potential_monthly: 10, how_to_earn: 'Read, Write, Speak & Record The Given article and earn.' },
  { task_type: 'CCC - Computers - Task', expected_tasks: 1, frequency: 'Daily', rate_per_task: 10, potential_monthly: 10, how_to_earn: 'Complete the assigned homework, research and write and earn' },
  { task_type: 'GT Session Task', expected_tasks: 1, frequency: 'Daily', rate_per_task: 20, potential_monthly: 20, how_to_earn: 'Complete GT Session task and earn' },
  { task_type: 'Mentor connect Task', expected_tasks: 2, frequency: 'Monthly', rate_per_task: 400, potential_monthly: 800, how_to_earn: 'Connect with your mentor complete the mentprhsip sessions as per the agenda share record timey and earn' },
  { task_type: 'Bonus for 100% attendance', expected_tasks: 25, frequency: 'Monthly', rate_per_task: 8, potential_monthly: 200, how_to_earn: 'Achive 100% attendance and earn bonus of 200 rs' },
];

export default function AdminStudentEarnings() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<{ id: string, name: string }[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [studentEarnings, setStudentEarnings] = useState<StudentEarning[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentEarning | null>(null);
  const [studentRecords, setStudentRecords] = useState<EarningRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EarningRecord | null>(null);
  const [isPotentialModalOpen, setIsPotentialModalOpen] = useState(false);
  const [rewardConfigs, setRewardConfigs] = useState<RewardConfig[]>([]);
  const [isEditingConfigs, setIsEditingConfigs] = useState(false);
  const [editingConfigs, setEditingConfigs] = useState<RewardConfig[]>([]);
  const { selectedYear, getDateRange } = useAcademicYear();

  useEffect(() => {
    fetchClasses();
    fetchStudentEarnings();
    fetchRewardConfigs();
  }, [selectedYear]);

  const fetchRewardConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('reward_configurations')
        .select('*')
        .order('task_type');

      if (error) {
        console.warn('reward_configurations table might not exist, using defaults');
        setRewardConfigs(DEFAULT_EARNING_POTENTIAL as any);
        return;
      }

      if (data && data.length > 0) {
        setRewardConfigs(data);
      } else {
        setRewardConfigs(DEFAULT_EARNING_POTENTIAL as any);
      }
    } catch (error) {
      console.error('Error fetching configs:', error);
      setRewardConfigs(DEFAULT_EARNING_POTENTIAL as any);
    }
  };

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from('classes')
      .select('id, name')
      .order('name');
    if (data) setClasses(data);
  };

  const fetchStudentEarnings = async () => {
    try {
      setLoading(true);
      
      // Fetch students and their earnings
      const { data: students, error: studentError } = await supabase
        .from('students')
        .select(`
          id,
          name,
          classes (name),
          student_earnings (amount, earned_at)
        `);

      if (studentError) throw studentError;

      const { startDate, endDate } = getDateRange();
      const aggregated = (students || []).map((s: any) => {
        const filteredEarnings = (s.student_earnings || []).filter((e: any) => {
          const earnedAt = new Date(e.earned_at);
          return earnedAt >= startDate && earnedAt <= endDate;
        });
        
        const total = filteredEarnings.reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0);
        const lastDate = filteredEarnings.length > 0 
          ? filteredEarnings.sort((a: any, b: any) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime())[0].earned_at
          : null;

        return {
          student_id: s.id,
          student_name: s.name,
          class_name: s.classes?.name || 'Unassigned',
          total_earned: total,
          last_earned_at: lastDate
        };
      });

      setStudentEarnings(aggregated);
    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentRecords = async (studentId: string) => {
    try {
      setLoadingRecords(true);
      const { startDate, endDate } = getDateRange();
      const { data, error } = await supabase
        .from('student_earnings')
        .select('*')
        .eq('student_id', studentId)
        .gte('earned_at', startDate.toISOString())
        .lte('earned_at', endDate.toISOString())
        .order('earned_at', { ascending: false });

      if (error) throw error;
      setStudentRecords(data || []);
    } catch (error) {
      console.error('Error fetching records:', error);
      toast.error('Failed to load records');
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleEditRecord = async () => {
    if (!editingRecord) return;
    try {
      const { error } = await supabase
        .from('student_earnings')
        .update({
          amount: editingRecord.amount,
          description: editingRecord.description,
          earned_at: editingRecord.earned_at
        })
        .eq('id', editingRecord.id);

      if (error) throw error;
      toast.success('Record updated successfully');
      setIsEditModalOpen(false);
      if (selectedStudent) fetchStudentRecords(selectedStudent.student_id);
      fetchStudentEarnings();
    } catch (error) {
      console.error('Error updating record:', error);
      toast.error('Failed to update record');
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this earning record?')) return;
    try {
      const { error } = await supabase
        .from('student_earnings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Record deleted successfully');
      if (selectedStudent) fetchStudentRecords(selectedStudent.student_id);
      fetchStudentEarnings();
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Failed to delete record');
    }
  };

  const handleSaveConfigs = async () => {
    try {
      setLoading(true);
      for (const config of editingConfigs) {
        const { error } = await supabase
          .from('reward_configurations')
          .upsert({
            task_type: config.task_type,
            expected_tasks: config.expected_tasks,
            frequency: config.frequency,
            rate_per_task: config.rate_per_task,
            potential_monthly: config.expected_tasks * config.rate_per_task,
            how_to_earn: config.how_to_earn
          }, { 
            onConflict: 'task_type' 
          });
        if (error) throw error;
      }
      toast.success('Reward configurations updated');
      fetchRewardConfigs();
      setIsEditingConfigs(false);
    } catch (error: any) {
      console.error('Error saving configs:', error);
      toast.error(`Failed to save: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = studentEarnings.filter(s => {
    const matchesSearch = s.student_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === 'all' || s.class_name === selectedClass;
    return matchesSearch && matchesClass;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" />
              Student Earnings Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor and manage rewards earned by students
            </p>
          </div>
          <Button onClick={() => setIsPotentialModalOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <TrendingUp className="h-4 w-4" />
            Set Monthly Potential
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-right">Total Earned</TableHead>
                  <TableHead>Last Reward</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      Loading data...
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      No student records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((s) => (
                    <TableRow key={s.student_id}>
                      <TableCell className="font-medium">{s.student_name}</TableCell>
                      <TableCell>{s.class_name}</TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        ₹{s.total_earned.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {s.last_earned_at ? new Date(s.last_earned_at).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedStudent(s);
                            fetchStudentRecords(s.student_id);
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Student Records Dialog */}
        <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Earning History: {selectedStudent?.student_name}</DialogTitle>
              <DialogDescription>
                Detailed breakdown of rewards for {selectedStudent?.student_name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4">
              {loadingRecords ? (
                <div className="py-10 text-center">Loading records...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                          No records found for this student
                        </TableCell>
                      </TableRow>
                    ) : (
                      studentRecords.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-sm">
                            {new Date(r.earned_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-sm">{r.description}</TableCell>
                          <TableCell className="text-right font-bold text-green-600">
                            ₹{r.amount}
                          </TableCell>
                          <TableCell className="text-right flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-blue-600"
                              onClick={() => {
                                setEditingRecord(r);
                                setIsEditModalOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteRecord(r.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Record Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Earning Record</DialogTitle>
            </DialogHeader>
            {editingRecord && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input 
                    type="number" 
                    value={editingRecord.amount} 
                    onChange={(e) => setEditingRecord({...editingRecord, amount: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input 
                    value={editingRecord.description} 
                    onChange={(e) => setEditingRecord({...editingRecord, description: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input 
                    type="date" 
                    value={editingRecord.earned_at.split('T')[0]} 
                    onChange={(e) => setEditingRecord({...editingRecord, earned_at: new Date(e.target.value).toISOString()})}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button onClick={handleEditRecord}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Potential Earning Info Modal */}
        <Dialog open={isPotentialModalOpen} onOpenChange={(open) => {
          setIsPotentialModalOpen(open);
          if (!open) setIsEditingConfigs(false);
        }}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between pr-8">
                <div>
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                    Reward Structure & Monthly Potential
                  </DialogTitle>
                  <DialogDescription>
                    Configure how much students can earn for each task type
                  </DialogDescription>
                </div>
                {!isEditingConfigs ? (
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditingConfigs([...rewardConfigs]);
                    setIsEditingConfigs(true);
                  }}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Structure
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditingConfigs(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveConfigs}>
                      Save All
                    </Button>
                  </div>
                )}
              </div>
            </DialogHeader>
            
            <div className="mt-4 border rounded-xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-bold text-foreground">Task Type</TableHead>
                    <TableHead className="text-center font-bold text-foreground">Tasks/Month</TableHead>
                    <TableHead className="text-center font-bold text-foreground">Frequency</TableHead>
                    <TableHead className="text-center font-bold text-foreground">Rate (₹)</TableHead>
                    <TableHead className="text-center font-bold text-foreground">Monthly (₹)</TableHead>
                    <TableHead className="font-bold text-foreground">How to Earn</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(isEditingConfigs ? editingConfigs : rewardConfigs).map((row, idx) => (
                    <TableRow key={idx} className="group hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold text-sm">
                        {isEditingConfigs ? (
                          <Input 
                            value={row.task_type} 
                            onChange={(e) => {
                              const newConfigs = [...editingConfigs];
                              newConfigs[idx].task_type = e.target.value;
                              setEditingConfigs(newConfigs);
                            }}
                            className="h-8 text-xs"
                          />
                        ) : row.task_type}
                      </TableCell>
                      <TableCell className="text-center">
                        {isEditingConfigs ? (
                          <Input 
                            type="number"
                            value={row.expected_tasks} 
                            onChange={(e) => {
                              const newConfigs = [...editingConfigs];
                              newConfigs[idx].expected_tasks = parseInt(e.target.value) || 0;
                              setEditingConfigs(newConfigs);
                            }}
                            className="h-8 w-16 mx-auto text-center text-xs"
                          />
                        ) : <span className="text-sm font-medium">{row.expected_tasks}</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {isEditingConfigs ? (
                          <Select 
                            value={row.frequency} 
                            onValueChange={(v) => {
                              const newConfigs = [...editingConfigs];
                              newConfigs[idx].frequency = v;
                              setEditingConfigs(newConfigs);
                            }}
                          >
                            <SelectTrigger className="h-8 w-24 mx-auto text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Daily">Daily</SelectItem>
                              <SelectItem value="Weekly">Weekly</SelectItem>
                              <SelectItem value="Monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : <Badge variant="secondary" className="text-[10px] uppercase font-bold px-1.5">{row.frequency}</Badge>}
                      </TableCell>
                      <TableCell className="text-center">
                        {isEditingConfigs ? (
                          <Input 
                            type="number"
                            value={row.rate_per_task} 
                            onChange={(e) => {
                              const newConfigs = [...editingConfigs];
                              newConfigs[idx].rate_per_task = parseInt(e.target.value) || 0;
                              setEditingConfigs(newConfigs);
                            }}
                            className="h-8 w-16 mx-auto text-center text-xs font-bold text-green-600"
                          />
                        ) : <span className="text-sm font-bold text-green-600">₹{row.rate_per_task}</span>}
                      </TableCell>
                      <TableCell className="text-center font-black text-blue-600 text-sm">
                        ₹{(isEditingConfigs ? (row.expected_tasks * row.rate_per_task) : row.potential_monthly).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {isEditingConfigs ? (
                          <Input 
                            value={row.how_to_earn} 
                            onChange={(e) => {
                              const newConfigs = [...editingConfigs];
                              newConfigs[idx].how_to_earn = e.target.value;
                              setEditingConfigs(newConfigs);
                            }}
                            className="h-8 text-xs min-w-[300px]"
                          />
                        ) : <p className="text-xs text-muted-foreground leading-snug">{row.how_to_earn}</p>}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-blue-50/50 hover:bg-blue-50/50 border-t-2 border-blue-100">
                    <TableCell colSpan={4} className="font-bold text-right text-base text-blue-900 py-4">Total Potential Monthly:</TableCell>
                    <TableCell className="text-center font-black text-blue-700 text-lg py-4">
                      ₹{(isEditingConfigs ? editingConfigs : rewardConfigs).reduce((sum, r) => sum + (r.expected_tasks * r.rate_per_task), 0).toLocaleString()}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex gap-2">
              <Info className="h-4 w-4 flex-shrink-0" />
              <p>
                <strong>Note:</strong> This table reflects the standardized reward rates. Individual student earnings are calculated based on these rates when tasks are marked as completed.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
