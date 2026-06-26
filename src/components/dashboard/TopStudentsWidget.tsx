import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, CheckCircle, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';

interface TopStudentsWidgetProps {
  startDate: Date | null;
  endDate: Date | null;
  academicYear: string;
}

interface StudentStat {
  id: string;
  name: string;
  earnings: number;
  attendance: number;
}

export function TopStudentsWidget({ startDate, endDate, academicYear }: TopStudentsWidgetProps) {
  const [students, setStudents] = useState<StudentStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [earnersLimit, setEarnersLimit] = useState(5);
  const [attendeesLimit, setAttendeesLimit] = useState(5);

  useEffect(() => {
    async function fetchTopStudents() {
      setLoading(true);
      try {
        // Fetch all students for mapping
        const { data: allStudents } = await supabase.from('students').select('id, name, academic_year');
        const studentNameMap = new Map();
        const studentIdMap = new Map();
        allStudents?.forEach(s => {
          if (s.name) studentNameMap.set(s.name.toLowerCase().trim(), s);
          studentIdMap.set(s.id, s);
        });

        // Query 1: Earnings
        let earningsQuery = supabase
          .from('student_earnings')
          .select(`
            amount,
            student_id
          `);
        
        if (startDate) {
          earningsQuery = earningsQuery.gte('earned_at', startDate.toISOString());
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setDate(end.getDate() + 1);
          earningsQuery = earningsQuery.lt('earned_at', end.toISOString());
        }

        const { data: earningsData, error: earningsError } = await earningsQuery;
        
        if (earningsError) {
          console.error('Error fetching earnings:', earningsError);
          setErrorMessage(`Earnings Error: ${earningsError.message || JSON.stringify(earningsError)}`);
          // don't return, we can still show attendance
        }

        // Query 2: Attendance (Fetch sessions first to avoid missing relation error)
        let sessionsQuery = supabase
          .from('sessions')
          .select('id');

        if (startDate) {
          sessionsQuery = sessionsQuery.gte('session_date', startDate.toISOString().split('T')[0]);
        }
        if (endDate) {
          sessionsQuery = sessionsQuery.lte('session_date', endDate.toISOString().split('T')[0]);
        }

        const { data: sessionsData, error: sessionsError } = await sessionsQuery;
        
        let attendanceData: any[] = [];
        let attendanceError: any = null;

        if (sessionsError) {
          attendanceError = sessionsError;
        } else if (sessionsData && sessionsData.length > 0) {
          const sessionIds = sessionsData.map(s => s.id);
          const { data, error } = await supabase
            .from('student_performance')
            .select('attendance_status, student_name')
            .in('session_id', sessionIds)
            .eq('attendance_status', 'Present');
            
          attendanceData = data || [];
          attendanceError = error;
        }

        if (attendanceError) {
          console.error('Error fetching attendance:', attendanceError);
          setErrorMessage(`Attendance Error: ${attendanceError.message || JSON.stringify(attendanceError)}`);
          // don't return, show whatever we have
        }

        // Aggregate
        const statsMap = new Map<string, StudentStat>();

        // Process Earnings
        earningsData?.forEach((record: any) => {
          const s = studentIdMap.get(record.student_id);
          if (!s) return;
          if (academicYear && academicYear !== 'All' && s.academic_year && s.academic_year !== academicYear) return;
          
          const sId = record.student_id;
          if (!statsMap.has(sId)) {
            statsMap.set(sId, { id: sId, name: s.name, earnings: 0, attendance: 0 });
          }
          statsMap.get(sId)!.earnings += Number(record.amount || 0);
        });

        // Process Attendance
        attendanceData?.forEach((record: any) => {
          if (!record.student_name) return;
          const s = studentNameMap.get(record.student_name.toLowerCase().trim());
          if (!s) return;
          if (academicYear && academicYear !== 'All' && s.academic_year && s.academic_year !== academicYear) return;

          const sId = s.id;
          if (!statsMap.has(sId)) {
            statsMap.set(sId, { id: sId, name: s.name, earnings: 0, attendance: 0 });
          }
          statsMap.get(sId)!.attendance += 1;
        });

        setStudents(Array.from(statsMap.values()));
      } catch (e) {
        console.error('Error in fetchTopStudents:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchTopStudents();
  }, [startDate, endDate, academicYear]);

  const topEarners = [...students].sort((a, b) => b.earnings - a.earnings).slice(0, earnersLimit);
  const topAttendees = [...students].sort((a, b) => b.attendance - a.attendance).slice(0, attendeesLimit);

  return (
    <Card className="col-span-1 border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Top Performers
        </CardTitle>
      </CardHeader>
      <CardContent>
        {errorMessage ? (
          <div className="p-4 text-sm text-red-500 bg-red-50 rounded-md">
            {errorMessage}
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : students.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">No student data found for this period.</p>
        ) : (
          <Tabs defaultValue="earnings" className="w-full">
            <TabsList className="flex w-full mb-4 bg-muted/60 p-1 rounded-xl">
              <TabsTrigger value="earnings" className="flex-1 rounded-lg">By Earnings</TabsTrigger>
              <TabsTrigger value="attendance" className="flex-1 rounded-lg">By Attendance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="earnings" className="space-y-4">
              {topEarners.length > 0 ? topEarners.map((student, i) => (
                <div key={`earn-${student.id}`} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3 min-w-0">
                    {i === 0 && (
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-[11px] font-extrabold text-amber-700 border border-amber-200 shrink-0">
                        1
                      </span>
                    )}
                    {i === 1 && (
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-[11px] font-extrabold text-slate-700 border border-slate-200 shrink-0">
                        2
                      </span>
                    )}
                    {i === 2 && (
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-[11px] font-extrabold text-orange-700 border border-orange-200 shrink-0">
                        3
                      </span>
                    )}
                    {i > 2 && (
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-[11px] font-bold text-muted-foreground shrink-0">
                        {i + 1}
                      </span>
                    )}
                    <span className="font-medium text-sm group-hover:text-primary transition-colors truncate" title={student.name}>{student.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-600 font-bold text-xs bg-amber-50/85 px-2.5 py-0.5 rounded-full border border-amber-100 shrink-0">
                    <span>{student.earnings}</span>
                    <span className="text-[9px] uppercase tracking-wider text-amber-700/80">Units</span>
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground text-center py-4">No earnings found.</p>}
              {(students.filter(s => s.earnings > 0).length > earnersLimit || earnersLimit > 5) && (
                <div className="pt-2 flex justify-center gap-2 border-t border-dashed mt-2">
                  {students.filter(s => s.earnings > 0).length > earnersLimit && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setEarnersLimit(prev => prev + 5)}
                      className="text-xs text-primary font-semibold hover:underline h-8 flex-1"
                    >
                      See More
                    </Button>
                  )}
                  {earnersLimit > 5 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setEarnersLimit(5)}
                      className="text-xs text-muted-foreground font-semibold hover:underline h-8 flex-1"
                    >
                      See Less
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="attendance" className="space-y-4">
              {topAttendees.length > 0 ? topAttendees.map((student, i) => (
                <div key={`att-${student.id}`} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3 min-w-0">
                    {i === 0 && (
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-[11px] font-extrabold text-amber-700 border border-amber-200 shrink-0">
                        1
                      </span>
                    )}
                    {i === 1 && (
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-[11px] font-extrabold text-slate-700 border border-slate-200 shrink-0">
                        2
                      </span>
                    )}
                    {i === 2 && (
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-[11px] font-extrabold text-orange-700 border border-orange-200 shrink-0">
                        3
                      </span>
                    )}
                    {i > 2 && (
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-[11px] font-bold text-muted-foreground shrink-0">
                        {i + 1}
                      </span>
                    )}
                    <span className="font-medium text-sm group-hover:text-primary transition-colors truncate" title={student.name}>{student.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-green-600 font-bold text-xs bg-green-50/85 px-2.5 py-0.5 rounded-full border border-green-100 shrink-0">
                    <span>{student.attendance}</span>
                    <span className="text-[9px] uppercase tracking-wider text-green-700/80">Present</span>
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground text-center py-4">No attendance records found.</p>}
              {(students.filter(s => s.attendance > 0).length > attendeesLimit || attendeesLimit > 5) && (
                <div className="pt-2 flex justify-center gap-2 border-t border-dashed mt-2">
                  {students.filter(s => s.attendance > 0).length > attendeesLimit && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setAttendeesLimit(prev => prev + 5)}
                      className="text-xs text-primary font-semibold hover:underline h-8 flex-1"
                    >
                      See More
                    </Button>
                  )}
                  {attendeesLimit > 5 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setAttendeesLimit(5)}
                      className="text-xs text-muted-foreground font-semibold hover:underline h-8 flex-1"
                    >
                      See Less
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
