import { useState, useEffect, useMemo } from 'react';
import { Wallet, TrendingUp, History, Gift, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface EarningRecord {
  id: string;
  amount: number;
  earned_at: string;
  description: string;
  task_id?: string;
  task_id_code?: string;
  task_name?: string;
  deadline?: string;
  subject_name?: string;
  session_title?: string;
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

export default function StudentEarnings() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<EarningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [rewardConfigs, setRewardConfigs] = useState<RewardConfig[]>([]);
  const [subjects, setSubjects] = useState<{id: string, name: string}[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return String(new Date().getMonth()); // 0 to 11 (0-indexed matching SelectItem values)
  });
  const { selectedYear, getDateRange } = useAcademicYear();

  useEffect(() => {
    if (user?.email) {
      loadEarningsData();
      fetchRewardConfigs();
      fetchSubjects();
    }
  }, [user?.email, selectedYear]);

  const filteredEarnings = useMemo(() => {
    return earnings.filter(record => {
      const matchesSearch = 
        (record.task_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (record.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = filterSubject === 'all' || record.subject_name === filterSubject;
      const recordDate = new Date(record.earned_at);
      const matchesMonth = selectedMonth === 'all' || recordDate.getMonth().toString() === selectedMonth;
      return matchesSearch && matchesSubject && matchesMonth;
    });
  }, [earnings, searchQuery, filterSubject, selectedMonth]);

  const totalBalance = useMemo(() => {
    return filteredEarnings.reduce((sum, item) => sum + item.amount, 0);
  }, [filteredEarnings]);

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

  const loadEarningsData = async () => {
    try {
      setLoading(true);
      
      // Get all student records first
      const { data: students, error: studentError } = await supabase
        .from('students')
        .select('id')
        .ilike('email', user?.email);

      if (studentError) throw studentError;

      if (!students || students.length === 0) {
        setEarnings([]);
        setLoading(false);
        return;
      }

      const studentIds = students.map(s => s.id);

      // Fetch from student_earnings table filtered by academic year
      const { startDate, endDate } = getDateRange();
      const { data: earningsData, error: earningsError } = await supabase
        .from('student_earnings')
        .select(`
          id,
          amount,
          earned_at,
          description,
          task_id,
          task:task_id(
            task_name, 
            task_id,
            deadline,
            subject:subjects(name),
            session:sessions(title)
          )
        `)
        .in('student_id', studentIds)
        .gte('earned_at', startDate.toISOString())
        .lte('earned_at', endDate.toISOString())
        .order('earned_at', { ascending: false });

      if (earningsError) throw earningsError;

      const formatted: EarningRecord[] = (earningsData || []).map((item: any) => {
        const taskData = Array.isArray(item.task) ? item.task[0] : item.task;
        return {
          id: item.id,
          amount: parseFloat(item.amount),
          earned_at: item.earned_at,
          description: item.description,
          task_id: item.task_id,
          task_id_code: taskData?.task_id,
          task_name: taskData?.task_name,
          deadline: taskData?.deadline,
          subject_name: taskData?.subject?.name,
          session_title: taskData?.session?.title || item.description
        };
      });

      setEarnings(formatted);
    } catch (error) {
      console.error('Error loading earnings:', error);
      toast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-foreground">
            <Wallet className="h-8 w-8 text-green-600" />
            My Earnings
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            You can earn up to <span className="text-primary font-bold">₹{rewardConfigs.reduce((sum, r) => sum + (r.expected_tasks * r.rate_per_task), 0).toLocaleString()}</span> every month by completing all your tasks!
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white border-none shadow-lg overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
                <Wallet className="h-24 w-24" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-green-100 flex items-center gap-2 text-sm font-medium uppercase tracking-wider">
                Total Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black flex items-baseline gap-1">
                <span className="text-2xl font-light opacity-80">₹</span>
                {totalBalance.toLocaleString()}
              </div>
              <div className="mt-4 flex items-center gap-2 text-green-100 text-sm bg-white/10 w-fit px-2 py-1 rounded">
                <TrendingUp className="h-4 w-4" />
                <span>Steady Growth</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium uppercase tracking-wider">
                Tasks Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold flex items-baseline gap-2">
                {filteredEarnings.filter(e => e.task_id).length}
                <span className="text-sm font-normal text-muted-foreground">Activities</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-lg overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
                <TrendingUp className="h-24 w-24" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-blue-100 flex items-center gap-2 text-sm font-medium uppercase tracking-wider">
                Monthly Potential
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black flex items-baseline gap-1">
                <span className="text-2xl font-light opacity-80">₹</span>
                {rewardConfigs.reduce((sum, r) => sum + (r.expected_tasks * r.rate_per_task), 0).toLocaleString()}
              </div>
              <div className="mt-4 flex items-center gap-2 text-blue-100 text-sm bg-white/10 w-fit px-2 py-1 rounded">
                <CheckCircle2 className="h-4 w-4" />
                <span>Max Possible Earning</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="w-full sm:w-64">
            <Label className="mb-2 block">Search Task</Label>
            <Input 
              placeholder="Search by task or description..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Label className="mb-2 block">Filter Subject</Label>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger>
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(s => (
                  <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-48">
            <Label className="mb-2 block">Filter Month</Label>
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
        </div>

        {/* Transaction History */}
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Transaction History
                </CardTitle>
                <CardDescription>Recent earnings and rewards</CardDescription>
              </div>
              <Gift className="h-8 w-8 text-muted/20" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : earnings.length === 0 ? (
              <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                <p className="text-muted-foreground font-medium">No transactions yet</p>
                <p className="text-xs text-muted-foreground mt-1 text-balance max-w-xs mx-auto">
                    Complete your first task to start earning rewards!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Task ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Task / Activity</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      if (filteredEarnings.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                              No matching transactions found
                            </TableCell>
                          </TableRow>
                        );
                      }

                      return filteredEarnings.map((record) => (
                        <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                            {record.task_id_code || '-'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(record.earned_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-sm">
                              {record.task_name || record.description || 'Reward'}
                            </div>
                            {record.task_name && record.description && (
                              <div className="text-[10px] text-muted-foreground">{record.description}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            {record.subject_name ? (
                              <Badge variant="outline" className="text-[10px] uppercase font-bold">
                                {record.subject_name}
                              </Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-xs max-w-[150px] truncate" title={record.session_title}>
                            {record.session_title || '-'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {record.deadline ? new Date(record.deadline).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell className="text-right font-bold text-green-600">
                            +₹{record.amount}
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
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
