import { useState, useEffect } from 'react';
import { Wallet, Search, Filter, ArrowUpDown, Pencil, Trash2, TrendingUp, Info, FileSpreadsheet } from 'lucide-react';
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
  designation: string;
  total_earned: number;
  last_earned_at: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  ifsc_code?: string | null;
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
  reviewer_rate?: number;
}

const DEFAULT_EARNING_POTENTIAL = [
  { task_type: 'English Reading & speaking Task', expected_tasks: 2, frequency: 'Daily', rate_per_task: 5, potential_monthly: 10, how_to_earn: 'Read, Write, Speak & Record The Given article and earn.', reviewer_rate: 0 },
  { task_type: 'CCC - Computers - Task', expected_tasks: 1, frequency: 'Daily', rate_per_task: 10, potential_monthly: 10, how_to_earn: 'Complete the assigned homework, research and write and earn', reviewer_rate: 0 },
  { task_type: 'GT Session Task', expected_tasks: 1, frequency: 'Daily', rate_per_task: 20, potential_monthly: 20, how_to_earn: 'Complete GT Session task and earn', reviewer_rate: 0 },
  { task_type: 'Mentor connect Task', expected_tasks: 2, frequency: 'Monthly', rate_per_task: 400, potential_monthly: 800, how_to_earn: 'Connect with your mentor complete the mentprhsip sessions as per the agenda share record timey and earn', reviewer_rate: 0 },
  { task_type: 'Bonus for 100% attendance', expected_tasks: 25, frequency: 'Monthly', rate_per_task: 8, potential_monthly: 200, how_to_earn: 'Achive 100% attendance and earn bonus of 200 rs', reviewer_rate: 0 },
];

export default function AdminStudentEarnings() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<{ id: string, name: string }[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [studentEarnings, setStudentEarnings] = useState<StudentEarning[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentEarning | null>(null);
  const [studentRecords, setStudentRecords] = useState<EarningRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EarningRecord | null>(null);
  const [isPotentialModalOpen, setIsPotentialModalOpen] = useState(false);
  const [subjects, setSubjects] = useState<{id: string, name: string}[]>([]);
  const [filterSubject, setFilterSubject] = useState('all');
  const [rewardConfigs, setRewardConfigs] = useState<RewardConfig[]>([]);
  const [isEditingConfigs, setIsEditingConfigs] = useState(false);
  const [editingConfigs, setEditingConfigs] = useState<RewardConfig[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedDesignation, setSelectedDesignation] = useState<string>('all');
  const { selectedYear, getDateRange } = useAcademicYear();

  useEffect(() => {
    fetchClasses();
    fetchStudentEarnings();
    fetchRewardConfigs();
    fetchSubjects();
  }, [selectedYear, selectedMonth]);

  const fetchSubjects = async () => {
    const { data } = await supabase.from('subjects').select('id, name').order('name');
    if (data) setSubjects(data);
  };

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
          designation,
          bank_name,
          account_number,
          ifsc_code,
          classes (name),
          student_earnings (
            amount, 
            earned_at
          )
        `);

      if (studentError) throw studentError;

      const { startDate, endDate } = getDateRange();
      const aggregated = (students || []).map((s: any) => {
        const filteredEarnings = (s.student_earnings || []).filter((e: any) => {
          const earnedAt = new Date(e.earned_at);
          const matchesAcademicYear = earnedAt >= startDate && earnedAt <= endDate;
          const matchesMonth = selectedMonth === 'all' || earnedAt.getMonth().toString() === selectedMonth;
          return matchesAcademicYear && matchesMonth;
        });
        
        const total = filteredEarnings.reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0);
        const lastRecord = filteredEarnings.length > 0 
          ? [...filteredEarnings].sort((a: any, b: any) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime())[0]
          : null;
        
        const lastDate = lastRecord?.earned_at || null;

        return {
          student_id: s.id,
          student_name: s.name,
          class_name: s.classes?.name || 'Unassigned',
          designation: s.designation || '-',
          total_earned: total,
          last_earned_at: lastDate,
          bank_name: s.bank_name || null,
          account_number: s.account_number || null,
          ifsc_code: s.ifsc_code || null
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
        .select(`
          *,
          student_task_feedback(
            task_name,
            task_id,
            deadline,
            subjects(name),
            sessions(title)
          )
        `)
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
            how_to_earn: config.how_to_earn,
            reviewer_rate: config.reviewer_rate || 0
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

  const handleExportBankFormat = () => {
    if (selectedMonth === 'all') {
      toast.warning('Please select a specific month from the dropdown to export payouts.');
      return;
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthLabel = monthNames[parseInt(selectedMonth)];

    const headers = [
      'Student Name',
      'Class',
      'Designation',
      'Bank Name',
      'Account Number',
      'IFSC Code',
      `Earnings (₹) - ${monthLabel} ${selectedYear}`
    ];

    const csvRows = [headers.join(',')];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    let count = 0;
    sortedStudents.forEach((s) => {
      if (s.total_earned <= 0) return;
      count++;
      const row = [
        s.student_name,
        s.class_name,
        s.designation,
        s.bank_name || '-',
        s.account_number || '-',
        s.ifsc_code || '-',
        s.total_earned
      ];
      csvRows.push(row.map(escapeCsv).join(','));
    });

    if (count === 0) {
      toast.error('No earnings found for the selected month.');
      return;
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bank_Payout_${monthLabel}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Successfully exported payouts for ${count} students`);
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredStudents = studentEarnings.filter(s => {
    const matchesSearch = s.student_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === 'all' || s.class_name === selectedClass;
    const matchesDesignation = selectedDesignation === 'all' || s.designation === selectedDesignation;
    return matchesSearch && matchesClass && matchesDesignation;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    let aVal: any = a[key as keyof typeof a];
    let bVal: any = b[key as keyof typeof b];

    if (key === 'last_earned_at') {
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
          <div className="flex gap-2">
            <Button onClick={handleExportBankFormat} className="gap-2 bg-green-600 hover:bg-green-700">
              <FileSpreadsheet className="h-4 w-4" />
              Export Bank Format
            </Button>
            <Button onClick={() => setIsPotentialModalOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <TrendingUp className="h-4 w-4" />
              Set Monthly Potential
            </Button>
          </div>
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
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="All Months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                <SelectItem value="5">June</SelectItem>
                <SelectItem value="6">July</SelectItem>
                <SelectItem value="7">August</SelectItem>
                <SelectItem value="8">September</SelectItem>
                <SelectItem value="9">October</SelectItem>
                <SelectItem value="10">November</SelectItem>
                <SelectItem value="11">December</SelectItem>
                <SelectItem value="0">January</SelectItem>
                <SelectItem value="1">February</SelectItem>
                <SelectItem value="2">March</SelectItem>
                <SelectItem value="3">April</SelectItem>
                <SelectItem value="4">May</SelectItem>
              </SelectContent>
            </Select>
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
          <div className="w-full sm:w-48">
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
          <div className="w-full sm:w-48">
            <Select value={selectedDesignation} onValueChange={setSelectedDesignation}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="1 Certified computer course">1 Certified computer course</SelectItem>
                <SelectItem value="2 Certified computer course_EMP">2 Certified computer course_EMP</SelectItem>
                <SelectItem value="3 WES Intern/Junior Fellow">3 WES Intern/Junior Fellow</SelectItem>
                <SelectItem value="4 WES Senior Fellow">4 WES Senior Fellow</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><div className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('student_name')}>Student Name <ArrowUpDown className="h-3 w-3" /></div></TableHead>
                  <TableHead><div className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('class_name')}>Class <ArrowUpDown className="h-3 w-3" /></div></TableHead>
                  <TableHead><div className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('designation')}>Designation <ArrowUpDown className="h-3 w-3" /></div></TableHead>
                  <TableHead className="text-right"><div className="flex items-center justify-end gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('total_earned')}>Total Earned <ArrowUpDown className="h-3 w-3" /></div></TableHead>
                  <TableHead><div className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('last_earned_at')}>Last Reward <ArrowUpDown className="h-3 w-3" /></div></TableHead>
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
                ) : sortedStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      No student records found
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedStudents.map((s) => (
                    <TableRow key={s.student_id}>
                      <TableCell className="font-medium">{s.student_name}</TableCell>
                      <TableCell>{s.class_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold">{s.designation}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        ₹{s.total_earned.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
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
                      <TableHead>Task ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Task / Description</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentRecords.filter(r => {
                      const earnedAt = new Date(r.earned_at);
                      return selectedMonth === 'all' || earnedAt.getMonth().toString() === selectedMonth;
                    }).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                          No records found for this student
                        </TableCell>
                      </TableRow>
                    ) : (
                      studentRecords
                        .filter(r => {
                          const earnedAt = new Date(r.earned_at);
                          return selectedMonth === 'all' || earnedAt.getMonth().toString() === selectedMonth;
                        })
                        .map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                              {(r as any).student_task_feedback?.task_id || '-'}
                            </TableCell>
                            <TableCell className="text-xs">
                              {new Date(r.earned_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-sm">
                                {(r as any).student_task_feedback?.task_name || r.description || 'Reward'}
                              </div>
                              {(r as any).student_task_feedback?.task_name && r.description && (
                                <div className="text-[10px] text-muted-foreground">{r.description}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              {(r as any).student_task_feedback?.subjects?.name ? (
                                <Badge variant="outline" className="text-[10px] uppercase font-bold">
                                  {(r as any).student_task_feedback?.subjects?.name}
                                </Badge>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-xs truncate max-w-[100px]">
                              {(r as any).student_task_feedback?.sessions?.title || '-'}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {(r as any).student_task_feedback?.deadline ? new Date((r as any).student_task_feedback.deadline).toLocaleDateString() : '-'}
                            </TableCell>
                            <TableCell className="text-right font-bold text-green-600">
                              ₹{r.amount}
                            </TableCell>
                            <TableCell className="text-right">
                              <button
                                onClick={() => handleDeleteRecord(r.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete this earning record"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
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
                    <TableHead className="text-center font-bold text-foreground">Reviewer Earning (₹)</TableHead>
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
                      <TableCell className="text-center">
                        {isEditingConfigs ? (
                          <Input 
                            type="number"
                            value={row.reviewer_rate || 0} 
                            onChange={(e) => {
                              const newConfigs = [...editingConfigs];
                              newConfigs[idx] = {
                                ...newConfigs[idx],
                                reviewer_rate: parseInt(e.target.value) || 0
                              };
                              setEditingConfigs(newConfigs);
                            }}
                            className="h-8 w-16 mx-auto text-center text-xs font-bold text-purple-600"
                          />
                        ) : <span className="text-sm font-bold text-purple-600">₹{row.reviewer_rate || 0}</span>}
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
                    <TableCell colSpan={5} className="font-bold text-right text-base text-blue-900 py-4">Total Potential Monthly:</TableCell>
                    <TableCell className="text-center font-black text-blue-700 text-lg py-4">
                      ₹{(isEditingConfigs ? editingConfigs : rewardConfigs).reduce((sum, r) => sum + (r.expected_tasks * r.rate_per_task), 0).toLocaleString()}
                    </TableCell>
                    <TableCell colSpan={2}></TableCell>
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
