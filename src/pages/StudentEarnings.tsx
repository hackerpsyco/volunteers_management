import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, History, Gift, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

interface EarningRecord {
  id: string;
  amount: number;
  earned_at: string;
  description: string;
  task_id?: string;
  task_name?: string;
}

export default function StudentEarnings() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<EarningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    if (user?.email) {
      loadEarningsData();
    }
  }, [user?.email]);

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
          student_task_feedback:task_id(task_name)
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
          <p className="text-muted-foreground mt-1">Track your rewards for completed tasks</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
