import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, History, Gift, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EarningRecord {
  id: string;
  amount: number;
  earned_at: string;
  description: string;
  task_id?: string;
  task_name?: string;
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
  const [totalBalance, setTotalBalance] = useState(0);
  const [rewardConfigs, setRewardConfigs] = useState<RewardConfig[]>([]);

  useEffect(() => {
    if (user?.email) {
      loadEarningsData();
      fetchRewardConfigs();
    }
  }, [user?.email]);

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
      
      // Get student record first
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('email', user?.email)
        .single();

      if (studentError) throw studentError;

      // Fetch from student_earnings table
      const { data: earningsData, error: earningsError } = await supabase
        .from('student_earnings')
        .select(`
          id,
          amount,
          earned_at,
          description,
          task_id,
          student_task_feedback(task_name)
        `)
        .eq('student_id', student.id)
        .order('earned_at', { ascending: false });

      if (earningsError) throw earningsError;

      const formatted: EarningRecord[] = (earningsData || []).map((item: any) => ({
        id: item.id,
        amount: parseFloat(item.amount),
        earned_at: item.earned_at,
        description: item.description,
        task_id: item.task_id,
        task_name: item.student_task_feedback?.task_name
      }));

      setEarnings(formatted);
      const total = formatted.reduce((sum, item) => sum + item.amount, 0);
      setTotalBalance(total);
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
                {earnings.filter(e => e.task_id).length}
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

        {/* Earning Potential Table */}
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              How You Can Earn
            </CardTitle>
            <CardDescription>
              Check potential rewards for different types of activities
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold">Task Type</TableHead>
                    <TableHead className="text-center font-bold">Expected Tasks</TableHead>
                    <TableHead className="text-center font-bold">Frequency</TableHead>
                    <TableHead className="text-center font-bold">Rate</TableHead>
                    <TableHead className="text-center font-bold">Potential Monthly</TableHead>
                    <TableHead className="min-w-[200px] font-bold">How to Earn</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rewardConfigs.map((row, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-medium text-sm">{row.task_type}</TableCell>
                      <TableCell className="text-center text-sm">{row.expected_tasks}</TableCell>
                      <TableCell className="text-center text-sm">{row.frequency}</TableCell>
                      <TableCell className="text-center text-sm font-semibold text-green-600">₹{row.rate_per_task}</TableCell>
                      <TableCell className="text-center text-sm font-bold text-green-700">₹{row.expected_tasks * row.rate_per_task}</TableCell>
                      <TableCell className="text-xs text-muted-foreground leading-relaxed">{row.how_to_earn}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-green-50/50">
                    <TableCell colSpan={4} className="font-bold text-right py-4">Total Estimated Monthly Earning:</TableCell>
                    <TableCell className="text-center font-black text-green-700 py-4">
                      ₹{rewardConfigs.reduce((sum, r) => sum + (r.expected_tasks * r.rate_per_task), 0).toLocaleString()}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

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
                <div className="space-y-4">
                    {earnings.map((record) => (
                        <div key={record.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/30 transition-colors border border-transparent hover:border-border group">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-green-100 rounded-full text-green-700 group-hover:scale-110 transition-transform">
                                    <ArrowUpRight className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm md:text-base">
                                        {record.task_name ? `Task: ${record.task_name}` : record.description || 'Reward'}
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(record.earned_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="text-lg md:text-xl font-bold text-green-600">
                                +{record.amount}
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
