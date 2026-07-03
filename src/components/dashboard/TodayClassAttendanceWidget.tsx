import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ClassOption {
  id: string;
  name: string;
}

export function TodayClassAttendanceWidget() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [presentCount, setPresentCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClasses() {
      const { data } = await supabase.from('classes').select('id, name').order('name');
      if (data) setClasses(data);
    }
    fetchClasses();
  }, []);

  useEffect(() => {
    async function fetchTodayAttendance() {
      setLoading(true);
      try {
        const targetDateStr = selectedDate;

        // Fetch target date's sessions
        let sessionsQuery = supabase
          .from('sessions')
          .select('id, class_batch')
          .eq('session_date', targetDateStr);

        if (selectedClass !== 'all') {
          const classObj = classes.find(c => c.id === selectedClass);
          if (classObj) {
            sessionsQuery = sessionsQuery.eq('class_batch', classObj.name);
          }
        }

        const { data: sessionsData, error: sessionsError } = await sessionsQuery;
        
        if (sessionsError) {
          console.error('Error fetching sessions:', sessionsError);
          return;
        }

        if (!sessionsData || sessionsData.length === 0) {
          setPresentCount(0);
          setAbsentCount(0);
          setLoading(false);
          return;
        }

        const sessionIds = sessionsData.map(s => s.id);

        // Fetch performance for these sessions
        const { data, error } = await supabase
          .from('student_performance')
          .select('attendance_status')
          .in('session_id', sessionIds);
        
        if (error) {
          console.error('Error fetching attendance:', error);
          return;
        }

        let present = 0;
        let absent = 0;
        
        data?.forEach((record: any) => {
          if (record.attendance_status === 'Present') present++;
          if (record.attendance_status === 'Absent') absent++;
        });

        setPresentCount(present);
        setAbsentCount(absent);
      } catch (e) {
        console.error('Error in fetchTodayAttendance:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchTodayAttendance();
  }, [selectedClass, selectedDate]);

  const total = presentCount + absentCount;
  const presentPercent = total > 0 ? Math.round((presentCount / total) * 100) : 0;
  const absentPercent = total > 0 ? Math.round((absentCount / total) * 100) : 0;

  return (
    <Card className="col-span-1 border-border/50 shadow-sm flex flex-col h-full">
      <CardHeader className="pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-emerald-500" />
          {selectedDate === new Date().toISOString().split('T')[0] ? "Today's Attendance" : "Attendance"}
        </CardTitle>
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="w-[125px] h-8 text-xs bg-muted/50 border-0 rounded-md px-2 focus:ring-0 focus:outline-none cursor-pointer"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[120px] h-8 text-xs bg-muted/50 border-0">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center">
        {loading ? (
          <div className="flex justify-center items-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : total === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              No attendance recorded for {selectedDate === new Date().toISOString().split('T')[0] ? 'today' : new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Present</p>
                <p className="text-3xl font-bold text-emerald-600">{presentCount}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Absent</p>
                <p className="text-3xl font-bold text-rose-500">{absentCount}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                <span>{presentPercent}%</span>
                <span>{absentPercent}%</span>
              </div>
              <div className="h-2.5 w-full bg-rose-100 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500 ease-in-out" 
                  style={{ width: `${presentPercent}%` }} 
                />
                <div 
                  className="h-full bg-rose-500 transition-all duration-500 ease-in-out" 
                  style={{ width: `${absentPercent}%` }} 
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
