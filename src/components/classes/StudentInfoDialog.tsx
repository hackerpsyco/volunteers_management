import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface StudentInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: any;
}

export function StudentInfoDialog({ open, onOpenChange, student }: StudentInfoDialogProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && student) {
      fetchStudentData();
    }
  }, [open, student]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      // Fetch tasks
      const { data: taskData, error: taskError } = await supabase
        .from('student_task_feedback')
        .select('*')
        .eq('student_id', student.id);
      
      if (taskError) throw taskError;
      setTasks(taskData || []);

      // Fetch earnings
      const { data: earningData, error: earningError } = await supabase
        .from('student_earnings')
        .select('*')
        .eq('student_id', student.id);

      if (earningError) throw earningError;
      setEarnings(earningData || []);

    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!student) return null;

  const completedTasks = tasks.filter(t => t.status === 'completed');
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const totalEarnings = earnings.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  
  const history = Array.isArray(student.promotion_history) ? student.promotion_history : [];

  const getCalculatedJoiningYear = () => {
    if (student.joining_year) return student.joining_year;
    if (!student.academic_year || !student.designation) return '-';
    
    const designation = student.designation.toLowerCase();
    let yearsToSubtract = 0;
    
    if (designation === 'cccemp') yearsToSubtract = 1;
    else if (designation === 'intern') yearsToSubtract = 2;
    else if (designation === 'fellow') yearsToSubtract = 3;
    else if (designation === 'ccc') yearsToSubtract = 0;
    else return '-';

    const match = student.academic_year.match(/^(\d{4})-(\d{2})$/);
    if (match) {
      const startYear = parseInt(match[1], 10) - yearsToSubtract;
      const endYearStr = (startYear + 1).toString().slice(2);
      return `${startYear}-${endYearStr}`;
    }
    return '-';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Student Information: {student.name}</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Joining Year</div>
                  <div className="text-xl font-bold">{getCalculatedJoiningYear()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Current Academic Year</div>
                  <div className="text-xl font-bold">{student.academic_year || '-'}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Task & Earnings Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
                    <div className="text-sm text-muted-foreground">Completed Tasks</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{pendingTasks.length}</div>
                    <div className="text-sm text-muted-foreground">Pending Tasks</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">₹{totalEarnings}</div>
                    <div className="text-sm text-muted-foreground">Total Earnings</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Promotion History</h3>
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No promotion history available.</p>
                ) : (
                  <div className="space-y-4">
                    {history.map((record: any, index: number) => (
                      <div key={index} className="flex justify-between items-center border-b pb-2 last:border-0">
                        <div>
                          <span className="font-medium">{record.from}</span>
                          <span className="mx-2 text-muted-foreground">→</span>
                          <span className="font-medium text-primary">{record.to}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(record.date).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
