import { useState, useEffect } from 'react';
import { Clock, CheckCircle2, Wallet, ClipboardCheck, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StudentTask {
  id: string;
  task_name: string;
  deadline: string;
  feedback_type: string;
  status: string;
  feedback_notes?: string;
  submission_link?: string;
}

interface SessionMeeting {
  id: string;
  title: string;
  session_date: string;
  session_time: string;
  facilitator_name?: string;
  meeting_link?: string;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [studentName, setStudentName] = useState('');
  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [sessions, setSessions] = useState<SessionMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [topStudent, setTopStudent] = useState<{ name: string; earnings: number } | null>(null);
  const [classStudentsList, setClassStudentsList] = useState<{ id: string; name: string; earnings: number; attendance: number }[]>([]);
  const [classEarnersLimit, setClassEarnersLimit] = useState(5);
  const [classAttendeesLimit, setClassAttendeesLimit] = useState(5);


  const [totalEarnings, setTotalEarnings] = useState(0);
  const [attendanceRate, setAttendanceRate] = useState('100%');
  const [attendanceDetails, setAttendanceDetails] = useState('No sessions');
  const { selectedYear, getDateRange } = useAcademicYear();

  useEffect(() => {
    if (user?.id) {
      loadStudentData();
    }
  }, [user?.id, selectedYear]);

  const loadStudentData = async () => {
    try {
      setLoading(true);

      // Get student profile with class_id
      let profileData = null;
      let profileError = null;

      // Try to get profile using auth user ID first
      const { data: idData, error: idError } = await supabase
        .from('user_profiles')
        .select('full_name, class_id')
        .eq('id', user?.id)
        .single();

      if (idError) {
        // If RLS blocks it (profile ID mismatch), try querying by email
        if (idError.code === 'PGRST116') {
          console.warn('Profile ID mismatch detected, querying by email...');
          const { data: emailData, error: emailError } = await supabase
            .from('user_profiles')
            .select('full_name, class_id')
            .ilike('email', user?.email)
            .single();

          profileData = emailData;
          profileError = emailError;
        } else {
          profileError = idError;
        }
      } else {
        profileData = idData;
      }

      if (profileError) {
        console.error('Profile error:', profileError);
      }

      // Fetch student records from students table
      const { data: studentRecords, error: studentError } = await supabase
        .from('students')
        .select('id, name')
        .ilike('email', user?.email);

      let activeStudentName = profileData?.full_name || '';
      if (!activeStudentName && studentRecords && studentRecords.length > 0) {
        const { data: sRec } = await supabase
          .from('students')
          .select('name')
          .ilike('email', user?.email)
          .limit(1)
          .maybeSingle();
        if (sRec?.name) {
          activeStudentName = sRec.name;
        }
      }
      setStudentName(activeStudentName);

      if (studentError) {
        console.warn('Student record not found for email:', user?.email, studentError);
        setTasks([]);
      } else if (studentRecords && studentRecords.length > 0) {
        const studentIds = studentRecords.map(s => s.id);
        
        // Fetch tasks for THIS STUDENT ONLY filtered by academic year
        const { startDate, endDate } = getDateRange();
        const { data: tasksData, error: tasksError } = await supabase
          .from('student_task_feedback')
          .select('*')
          .in('student_id', studentIds)
          .or(`academic_year.eq."${selectedYear}",and(academic_year.is.null,created_at.gte."${startDate.toISOString()}",created_at.lte."${endDate.toISOString()}")`)
          .order('deadline', { ascending: true });

        if (tasksError) {
          console.error('Error fetching tasks:', tasksError);
          setTasks([]);
        } else {
          setTasks(tasksData || []);
        }

        // Fetch Total Earnings filtered by academic year
        const { startDate: earningStart, endDate: earningEnd } = getDateRange();
        const { data: earningsData } = await supabase
          .from('student_earnings')
          .select('amount')
          .in('student_id', studentIds)
          .gte('earned_at', earningStart.toISOString())
          .lte('earned_at', earningEnd.toISOString());
        
        const total = (earningsData || []).reduce((sum, item) => sum + parseFloat(item.amount as any), 0);
        setTotalEarnings(total);
      }

      // Resolve class_id (profileData or fallback to students table)
      let classId = profileData?.class_id;
      if (!classId && studentRecords && studentRecords.length > 0) {
        const { data: studentWithClass } = await supabase
          .from('students')
          .select('class_id')
          .ilike('email', user?.email)
          .limit(1)
          .maybeSingle();
        if (studentWithClass?.class_id) {
          classId = studentWithClass.class_id;
        }
      }

      let sessionsDataList: SessionMeeting[] = [];
      if (classId) {
        // Get the class info
        const { data: classData } = await supabase
          .from('classes')
          .select('id, name, email')
          .eq('id', classId)
          .single();

        // Fetch sessions for this class filtered by academic year
        const { startDate, endDate } = getDateRange();
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select('id, title, session_date, session_time, facilitator_name, meeting_link, class_batch')
          .eq('class_batch', classData?.name)
          .gte('session_date', startDate.toISOString().split('T')[0])
          .lte('session_date', endDate.toISOString().split('T')[0])
          .order('session_date', { ascending: true });

        if (sessionsError) {
          console.error('Error fetching sessions:', sessionsError);
          setSessions([]);
        } else {
          sessionsDataList = sessionsData || [];
          setSessions(sessionsDataList);
        }
      } else {
        setSessions([]);
      }

      // Fetch all class or global students data (earnings and attendance)
      try {
        let studentsList: { id: string; name: string }[] = [];
        let classDataName: string | null = null;
        
        if (classId) {
          const { data: classData } = await supabase
            .from('classes')
            .select('id, name')
            .eq('id', classId)
            .single();
          if (classData) {
            classDataName = classData.name;
          }

          const { data: studentsInClass } = await supabase
            .from('students')
            .select('id, name')
            .eq('class_id', classId);
          
          if (studentsInClass && studentsInClass.length > 0) {
            studentsList = studentsInClass.map(s => ({ id: s.id, name: s.name || '' }));
          }
        }

        // Fallback: If no classId or no students found in class, fetch all students (like admin panel)
        if (studentsList.length === 0) {
          const { data: allStudents } = await supabase
            .from('students')
            .select('id, name');
          if (allStudents) {
            studentsList = allStudents.map(s => ({ id: s.id, name: s.name || '' }));
          }
        }

        if (studentsList.length > 0) {
          const studentIds = studentsList.map(s => s.id);
          const { startDate: earningStart, endDate: earningEnd } = getDateRange();
          
          // Query 1: Earnings for all selected students
          const { data: earningsData, error: earningsError } = await supabase
            .from('student_earnings')
            .select('student_id, amount')
            .in('student_id', studentIds)
            .gte('earned_at', earningStart.toISOString())
            .lte('earned_at', earningEnd.toISOString());

          if (earningsError) {
            console.error('Leaderboard earnings error:', earningsError);
          }

          // Query 2: Sessions for the class (or all classes if fallback)
          let sessionsQuery = supabase
            .from('sessions')
            .select('id')
            .gte('session_date', earningStart.toISOString().split('T')[0])
            .lte('session_date', earningEnd.toISOString().split('T')[0]);
          
          if (classDataName) {
            sessionsQuery = sessionsQuery.eq('class_batch', classDataName);
          }
          const { data: sessionsData, error: sessionsError } = await sessionsQuery;
          if (sessionsError) {
            console.error('Leaderboard sessions error:', sessionsError);
          }

          let attendanceData: any[] = [];
          if (sessionsData && sessionsData.length > 0) {
            const sessionIds = sessionsData.map(s => s.id);
            const { data: perfData, error: perfError } = await supabase
              .from('student_performance')
              .select('attendance_status, student_name')
              .in('session_id', sessionIds)
              .eq('attendance_status', 'Present');
            
            if (perfError) {
              console.error('Leaderboard student performance error:', perfError);
            } else if (perfData) {
              attendanceData = perfData;
            }
          }

          // Aggregate stats
          const statsMap: Record<string, { id: string; name: string; earnings: number; attendance: number }> = {};
          const studentNameMap: Record<string, string> = {};
          studentsList.forEach(s => {
            statsMap[s.id] = { id: s.id, name: s.name, earnings: 0, attendance: 0 };
            studentNameMap[s.name.toLowerCase().trim()] = s.id;
          });

          // Process Earnings
          earningsData?.forEach(item => {
            const amount = parseFloat(item.amount as any) || 0;
            if (statsMap[item.student_id]) {
              statsMap[item.student_id].earnings += amount;
            }
          });

          // Process Attendance
          attendanceData?.forEach(record => {
            if (!record.student_name) return;
            const nameKey = record.student_name.toLowerCase().trim();
            const sId = studentNameMap[nameKey];
            if (sId && statsMap[sId]) {
              statsMap[sId].attendance += 1;
            }
          });

          const aggregatedList = Object.values(statsMap);
          setClassStudentsList(aggregatedList);

          // Set top student metric (remains for state support if needed)
          let bestStudentName = '';
          let bestStudentEarnings = -1;

          aggregatedList.forEach(s => {
            if (s.earnings > bestStudentEarnings) {
              bestStudentEarnings = s.earnings;
              bestStudentName = s.name;
            }
          });

          if (bestStudentEarnings > 0 && bestStudentName) {
            setTopStudent({ name: bestStudentName, earnings: bestStudentEarnings });
          } else {
            setTopStudent(null);
          }
        } else {
          setClassStudentsList([]);
          setTopStudent(null);
        }
      } catch (err) {
        console.error('Error fetching class students stats:', err);
        setClassStudentsList([]);
        setTopStudent(null);
      }

      // Calculate attendance rate
      if (activeStudentName && sessionsDataList.length > 0) {
        const { data: perfData } = await supabase
          .from('student_performance' as any)
          .select('session_id, attendance_status')
          .ilike('student_name', profileData.full_name.trim());

        if (perfData) {
          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth();

          const currentMonthSessions = sessionsDataList.filter(s => {
            const date = new Date(s.session_date);
            return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
          });

          let presentCount = 0;
          let totalCount = 0;

          currentMonthSessions.forEach(session => {
            const perf = perfData.find(p => p.session_id === session.id);
            if (perf) {
              totalCount++;
              if (perf.attendance_status === 'Present') {
                presentCount++;
              }
            }
          });

          if (totalCount > 0) {
            setAttendanceRate(`${Math.round((presentCount / totalCount) * 100)}%`);
            setAttendanceDetails(`${presentCount} of ${totalCount} present`);
          } else {
            setAttendanceRate('100%');
            setAttendanceDetails('0 sessions recorded');
          }
        }
      } else {
        setAttendanceRate('100%');
        setAttendanceDetails('No sessions');
      }
    } catch (error) {
      console.error('Error loading student data:', error);
      toast.error('Failed to load your tasks');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }



  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome, {studentName}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-card border-border/50 shadow-sm overflow-hidden border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Assigned to you</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50 shadow-sm overflow-hidden border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Tasks</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'pending').length}</div>
              <p className="text-xs text-muted-foreground mt-1">Action required</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50 shadow-sm overflow-hidden border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'completed').length}</div>
              <p className="text-xs text-muted-foreground mt-1">Successfully finished</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50 shadow-sm overflow-hidden border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
              <Wallet className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalEarnings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Tokens earned</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50 shadow-sm overflow-hidden border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Attendance</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendanceRate}</div>
              <p className="text-xs text-muted-foreground mt-1">{attendanceDetails} this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Class Top Students List Widget */}
        <div className="max-w-md mt-6">
          <Card className="border-border/50 shadow-sm bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Class Top Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              {classStudentsList.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No student data found.</p>
              ) : (
                <Tabs defaultValue="earnings" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="earnings">By Earnings</TabsTrigger>
                    <TabsTrigger value="attendance">By Attendance</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="earnings" className="space-y-4">
                    {classStudentsList.filter(s => s.earnings > 0).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No earnings found.</p>
                    ) : (
                      <>
                        {[...classStudentsList]
                          .sort((a, b) => b.earnings - a.earnings)
                          .slice(0, classEarnersLimit)
                          .map((student, i) => (
                            <div key={`earn-${student.id}`} className="flex items-center justify-between group">
                              <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold text-muted-foreground">
                                  {i + 1}
                                </span>
                                <span className="font-medium text-sm group-hover:text-primary transition-colors">{student.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-amber-600 font-bold text-sm bg-amber-50 px-2.5 py-0.5 rounded-full">
                                <span>{student.earnings}</span>
                                <span className="text-[10px] uppercase tracking-wider">Units</span>
                              </div>
                            </div>
                          ))}
                        
                        {(classStudentsList.filter(s => s.earnings > 0).length > classEarnersLimit || classEarnersLimit > 5) && (
                          <div className="pt-2 flex justify-center gap-2 border-t border-dashed mt-2">
                            {classStudentsList.filter(s => s.earnings > 0).length > classEarnersLimit && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setClassEarnersLimit(prev => prev + 5)}
                                className="text-xs text-primary font-semibold hover:underline h-8 flex-1"
                              >
                                See More
                              </Button>
                            )}
                            {classEarnersLimit > 5 && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setClassEarnersLimit(5)}
                                className="text-xs text-muted-foreground font-semibold hover:underline h-8 flex-1"
                              >
                                See Less
                              </Button>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="attendance" className="space-y-4">
                    {classStudentsList.filter(s => s.attendance > 0).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No attendance records found.</p>
                    ) : (
                      <>
                        {[...classStudentsList]
                          .sort((a, b) => b.attendance - a.attendance)
                          .slice(0, classAttendeesLimit)
                          .map((student, i) => (
                            <div key={`att-${student.id}`} className="flex items-center justify-between group">
                              <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold text-muted-foreground">
                                  {i + 1}
                                </span>
                                <span className="font-medium text-sm group-hover:text-primary transition-colors">{student.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-green-600 font-bold text-sm bg-green-50 px-2.5 py-0.5 rounded-full">
                                <span>{student.attendance}</span>
                                <span className="text-[10px] uppercase tracking-wider">Present</span>
                              </div>
                            </div>
                          ))}
                        
                        {(classStudentsList.filter(s => s.attendance > 0).length > classAttendeesLimit || classAttendeesLimit > 5) && (
                          <div className="pt-2 flex justify-center gap-2 border-t border-dashed mt-2">
                            {classStudentsList.filter(s => s.attendance > 0).length > classAttendeesLimit && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setClassAttendeesLimit(prev => prev + 5)}
                                className="text-xs text-primary font-semibold hover:underline h-8 flex-1"
                              >
                                See More
                              </Button>
                            )}
                            {classAttendeesLimit > 5 && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setClassAttendeesLimit(5)}
                                className="text-xs text-muted-foreground font-semibold hover:underline h-8 flex-1"
                              >
                                See Less
                              </Button>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
}
