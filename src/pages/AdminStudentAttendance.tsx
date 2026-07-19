import { useState, useEffect } from 'react';
import { Users, Search, ArrowUpDown, CalendarCheck } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
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
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useAcademicYear } from '@/contexts/AcademicYearContext';

interface StudentAttendanceSummary {
  student_id: string;
  student_name: string;
  class_name: string;
  designation: string;
  total_present: number;
  total_absent: number;
  attendance_percentage: number;
}

interface AttendanceRecord {
  id: string;
  student_name: string;
  attendance_status: string;
  created_at: string;
  sessions: {
    title: string;
    session_date: string;
    session_type: string;
  } | null;
}

export default function AdminStudentAttendance() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<{ id: string, name: string }[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [studentAttendance, setStudentAttendance] = useState<StudentAttendanceSummary[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentAttendanceSummary | null>(null);
  const [studentRecords, setStudentRecords] = useState<AttendanceRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return String(new Date().getMonth());
  });
  const [selectedDesignation, setSelectedDesignation] = useState<string>('all');
  const { selectedYear, getDateRange } = useAcademicYear();

  useEffect(() => {
    fetchClasses();
    fetchStudentAttendance();
  }, [selectedYear, selectedMonth]);

  const fetchClasses = async () => {
    const { data } = await supabase
      .from('classes')
      .select('id, name')
      .order('name');
    if (data) setClasses(data);
  };

  const fetchStudentAttendance = async () => {
    try {
      setLoading(true);
      
      // Fetch students
      const { data: students, error: studentError } = await supabase
        .from('students')
        .select(`
          id,
          name,
          designation,
          classes (name)
        `);

      if (studentError) throw studentError;

      // Fetch all student_performance for the selected academic year and month
      // Fetch all student_performance for the selected academic year
      const { startDate, endDate } = getDateRange();
      
      // Fetch performance with pagination to bypass the 1000 row limit
      let allPerformance: any[] = [];
      let hasMore = true;
      let offset = 0;
      const limit = 1000;

      while (hasMore) {
        const { data, error: perfError } = await supabase
          .from('student_performance')
          .select(`
            id,
            student_id,
            student_name,
            attendance_status,
            sessions!inner (
              session_date
            )
          `)
          .gte('sessions.session_date', startDate.toISOString().split('T')[0])
          .lte('sessions.session_date', endDate.toISOString().split('T')[0])
          .order('id')
          .range(offset, offset + limit - 1);

        if (perfError) throw perfError;

        if (data && data.length > 0) {
          allPerformance = [...allPerformance, ...data];
        }
        
        offset += limit;
        
        // PostgREST can return fewer rows than the limit if the inner join filters rows out
        // after the limit is applied. We must only stop when we get exactly 0 rows.
        if (!data || data.length === 0) {
          hasMore = false;
        }
      }

      // Filter by selected month locally
      const filteredPerformance = (allPerformance || []).filter((p: any) => {
        const sessionDateStr = p.sessions?.session_date;
        if (!sessionDateStr) return false;
        
        const sessionDate = new Date(sessionDateStr);
        if (selectedMonth !== 'all') {
          if (sessionDate.getMonth().toString() !== selectedMonth) {
            return false;
          }
        }
        return true;
      });

      // Group by student_id, fallback to name if missing
      const attendanceMap = new Map();
      filteredPerformance.forEach(p => {
        let key = p.student_id;
        
        // Fallback for any records that somehow missed the backfill
        if (!key) {
          let name = (p.student_name || '').trim().replace(/\s+/g, ' ').toLowerCase();
          if (name.includes('puspa lodhi')) name = 'pushpa lodhi';
          if (name.includes('nausheen naaj')) name = 'nausheen naaz';
          if (name === 'mohammad tauseef') name = 'tauseef';
          key = name;
        }

        if (!attendanceMap.has(key)) {
          attendanceMap.set(key, { present: 0, absent: 0 });
        }
        const counts = attendanceMap.get(key);
        if (p.attendance_status === 'Present') counts.present++;
        if (p.attendance_status === 'Absent') counts.absent++;
      });

      const aggregated = (students || []).map((s: any) => {
        const nameKey = (s.name || '').trim().replace(/\s+/g, ' ').toLowerCase();
        // Try getting by ID first, fallback to name key
        const counts = attendanceMap.get(s.id) || attendanceMap.get(nameKey) || { present: 0, absent: 0 };
        const totalSessions = counts.present + counts.absent;
        const percentage = totalSessions > 0 ? Math.round((counts.present / totalSessions) * 100) : 0;

        return {
          student_id: s.id,
          student_name: s.name,
          class_name: s.classes?.name || 'Unassigned',
          designation: s.designation || '-',
          total_present: counts.present,
          total_absent: counts.absent,
          attendance_percentage: percentage
        };
      });

      setStudentAttendance(aggregated);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentRecords = async (studentName: string) => {
    try {
      setLoadingRecords(true);
      const { startDate, endDate } = getDateRange();
      
      const normalizedName = studentName.trim().replace(/\s+/g, ' ');
      const doubleSpacedName = normalizedName.replace(' ', '  ');
      
      let aliases = `student_name.ilike."${normalizedName}",student_name.ilike."${doubleSpacedName}"`;
      if (normalizedName.toLowerCase() === 'pushpa lodhi') aliases += `,student_name.ilike."%puspa%lodhi%"`;
      if (normalizedName.toLowerCase() === 'nausheen naaz') aliases += `,student_name.ilike."%nausheen%naaj%"`;
      if (normalizedName.toLowerCase() === 'tauseef') aliases += `,student_name.ilike."%mohammad%tauseef%"`;

      const { data, error } = await supabase
        .from('student_performance')
        .select(`
          id,
          student_name,
          attendance_status,
          created_at,
          sessions!inner (
            title,
            session_date,
            session_type
          )
        `)
        .or(aliases)
        .gte('sessions.session_date', startDate.toISOString().split('T')[0])
        .lte('sessions.session_date', endDate.toISOString().split('T')[0]);

      if (error) throw error;
      
      // Also filter by month if needed
      let records = data || [];
      if (selectedMonth !== 'all') {
        records = records.filter((r: any) => {
          const d = new Date(r.sessions.session_date);
          return d.getMonth().toString() === selectedMonth;
        });
      }
      
      // Sort by date descending
      records.sort((a: any, b: any) => new Date(b.sessions.session_date).getTime() - new Date(a.sessions.session_date).getTime());

      setStudentRecords(records as AttendanceRecord[]);
    } catch (error) {
      console.error('Error fetching records:', error);
      toast.error('Failed to load student records');
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredStudents = studentAttendance.filter(s => {
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
              <CalendarCheck className="h-6 w-6 text-primary" />
              Student Attendance Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor and manage session attendance for students
            </p>
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
            <Select value={selectedDesignation} onValueChange={setSelectedDesignation}>
              <SelectTrigger>
                <SelectValue placeholder="All Designations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Designations</SelectItem>
                <SelectItem value="1. CCC">1. CCC</SelectItem>
                <SelectItem value="2. Junior Fellow">2. Junior Fellow</SelectItem>
                <SelectItem value="3. Senior Fellow">3. Senior Fellow</SelectItem>
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
                  <TableHead className="text-center"><div className="flex justify-center items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('total_present')}>Present <ArrowUpDown className="h-3 w-3" /></div></TableHead>
                  <TableHead className="text-center"><div className="flex justify-center items-center gap-1 cursor-pointer hover:text-primary" onClick={() => handleSort('total_absent')}>Absent <ArrowUpDown className="h-3 w-3" /></div></TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      Loading data...
                    </TableCell>
                  </TableRow>
                ) : sortedStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
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
                      <TableCell className="text-center font-bold text-green-600">
                        {s.total_present}
                      </TableCell>
                      <TableCell className="text-center font-bold text-red-500">
                        {s.total_absent}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedStudent(s);
                            fetchStudentRecords(s.student_name);
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
              <DialogTitle>Attendance History: {selectedStudent?.student_name}</DialogTitle>
              <DialogDescription>
                Detailed breakdown of session attendance for {selectedStudent?.student_name}
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
                      <TableHead>Session Title</TableHead>
                      <TableHead>Session Type</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                          No attendance records found for this student
                        </TableCell>
                      </TableRow>
                    ) : (
                      studentRecords.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-xs whitespace-nowrap">
                            {r.sessions?.session_date ? new Date(r.sessions.session_date).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-sm truncate max-w-[250px]" title={r.sessions?.title || ''}>
                              {r.sessions?.title || 'Unknown Session'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {r.sessions?.session_type ? (
                              <Badge variant="outline" className="text-[10px] uppercase font-bold">
                                {r.sessions?.session_type.replace(/_/g, ' ')}
                              </Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {r.attendance_status === 'Present' ? (
                              <span className="text-green-600">Present</span>
                            ) : r.attendance_status === 'Absent' ? (
                              <span className="text-red-500">Absent</span>
                            ) : (
                              <span className="text-muted-foreground">{r.attendance_status}</span>
                            )}
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

      </div>
    </DashboardLayout>
  );
}
