import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, MoreVertical, Edit, ArrowUpRight, Info } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AddStudentDialog } from '@/components/classes/AddStudentDialog';
import { EditStudentDialog } from '@/components/classes/EditStudentDialog';
import { StudentInfoDialog } from '@/components/classes/StudentInfoDialog';

interface Class {
  id: string;
  name: string;
}

interface Student {
  id: string;
  student_id: string;
  name: string;
  gender: string | null;
  dob: string | null;
  email: string | null;
  phone_number: string | null;
  roll_number: string | null;
  subject: string | null;
  academic_year: string | null;
  designation: string | null;
  joining_year?: string | null;
  promotion_history?: any;
}

type SortDirection = 'asc' | 'desc' | null;
type SortColumn = keyof Student | null;

export default function ClassStudents() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [classItem, setClassItem] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('all');
  const [selectedDesignation, setSelectedDesignation] = useState<string>('all');
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [selectedStudentForInfo, setSelectedStudentForInfo] = useState<Student | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleColumnSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) return '↕';
    if (sortDirection === 'asc') return '↑';
    if (sortDirection === 'desc') return '↓';
    return '↕';
  };

  const promoteAcademicYear = (currentYear: string | null) => {
    if (!currentYear) {
      const nextYear = new Date().getFullYear();
      return `${nextYear}-${(nextYear + 1).toString().slice(2)}`;
    }
    const match = currentYear.match(/^(\d{4})-(\d{2})$/);
    if (match) {
      const startYear = parseInt(match[1], 10);
      const endYear = parseInt(match[2], 10);
      return `${startYear + 1}-${(endYear + 1).toString().padStart(2, '0')}`;
    }
    const match2 = currentYear.match(/^(\d{4})-(\d{4})$/);
    if (match2) {
      const startYear = parseInt(match2[1], 10);
      const endYear = parseInt(match2[2], 10);
      return `${startYear + 1}-${startYear + 2}`;
    }
    return currentYear;
  };

  const getNextDesignation = (currentDesignation: string | null) => {
    if (!currentDesignation) return currentDesignation;
    const lower = currentDesignation.toLowerCase();
    if (lower === 'ccc') return 'cccemp';
    if (lower === 'cccemp') return 'intern';
    if (lower === 'intern') return 'fellow';
    return currentDesignation;
  };

  const handlePromoteStudent = async (student: Student) => {
    if (!student.academic_year) {
      toast.error('Student does not have an academic year set');
      return;
    }
    
    const nextYear = promoteAcademicYear(student.academic_year);
    if (nextYear === student.academic_year) {
      toast.error('Could not determine next academic year format');
      return;
    }

    try {
      const currentHistory = Array.isArray(student.promotion_history) ? student.promotion_history : [];
      const newHistoryRecord = {
        from: student.academic_year,
        to: nextYear,
        date: new Date().toISOString()
      };
      const updatedHistory = [...currentHistory, newHistoryRecord];

      const nextDesignation = getNextDesignation(student.designation);

      const { error } = await supabase
        .from('students')
        .update({ 
          academic_year: nextYear,
          designation: nextDesignation,
          promotion_history: updatedHistory
        })
        .eq('id', student.id);

      if (error) throw error;

      setStudents(students.map((s) => (s.id === student.id ? { ...s, academic_year: nextYear, designation: nextDesignation, promotion_history: updatedHistory } : s)));
      toast.success(`Student promoted to ${nextYear} (${nextDesignation || 'no designation change'})`);
    } catch (error) {
      console.error('Error promoting student:', error);
      toast.error('Failed to promote student');
    }
  };

  const filteredStudents = students.filter(student => {
    if (selectedAcademicYear !== 'all' && student.academic_year !== selectedAcademicYear) return false;
    if (selectedDesignation !== 'all' && student.designation !== selectedDesignation) return false;
    return true;
  }).sort((a, b) => {
    if (!sortColumn || !sortDirection) return 0;
    
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
    if (bValue == null) return sortDirection === 'asc' ? -1 : 1;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
      return sortDirection === 'asc' ? comparison : -comparison;
    }

    return 0;
  });

  const academicYears = Array.from(new Set(students.map(s => s.academic_year).filter(Boolean))).sort() as string[];
  const designations = Array.from(new Set(students.map(s => s.designation).filter(Boolean))).sort() as string[];

  useEffect(() => {
    if (classId) {
      fetchClassAndStudents();
    }
  }, [classId]);

  const fetchClassAndStudents = async () => {
    try {
      setLoading(true);
      
      // Fetch class
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single();

      if (classError) throw classError;
      setClassItem(classData);

      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', classId)
        .order('name', { ascending: true });

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load class and students');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      const { error } = await supabase.from('students').delete().eq('id', id);

      if (error) throw error;

      setStudents(students.filter((s) => s.id !== id));
      toast.success('Student removed successfully');
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to remove student');
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setIsEditStudentOpen(true);
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

  if (!classItem) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Class not found</p>
          <Button onClick={() => navigate('/classes')} className="mt-4">
            Back to Classes
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/classes')}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {classItem.name}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                Manage students
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsAddStudentOpen(true)}
            className="w-full sm:w-auto gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Student</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 bg-muted/10 p-2 rounded-lg border border-border/60">
          <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
            <SelectTrigger className="h-9 w-[180px] text-xs bg-transparent">
              <SelectValue placeholder="Academic Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Academic Years</SelectItem>
              {academicYears.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedDesignation} onValueChange={setSelectedDesignation}>
            <SelectTrigger className="h-9 w-[180px] text-xs bg-transparent">
              <SelectValue placeholder="Designation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Designations</SelectItem>
              {designations.map(desig => (
                <SelectItem key={desig} value={desig}>{desig}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Students Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Students ({filteredStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No students added yet</p>
                <Button onClick={() => setIsAddStudentOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="w-[100px] cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleColumnSort('student_id')}
                        >
                          <div className="flex items-center gap-1">Student ID <span className="text-muted-foreground ml-1">{getSortIndicator('student_id')}</span></div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleColumnSort('name')}
                        >
                          <div className="flex items-center gap-1">Name <span className="text-muted-foreground ml-1">{getSortIndicator('name')}</span></div>
                        </TableHead>
                        <TableHead 
                          className="w-[90px] cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleColumnSort('gender')}
                        >
                          <div className="flex items-center gap-1">Gender <span className="text-muted-foreground ml-1">{getSortIndicator('gender')}</span></div>
                        </TableHead>
                        <TableHead className="w-[100px]">DOB</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead className="w-[100px]">Roll Number</TableHead>
                        <TableHead className="w-[120px]">Subject</TableHead>
                        <TableHead className="w-[120px]">Academic Year</TableHead>
                        <TableHead className="w-[150px]">Designation</TableHead>
                        <TableHead className="w-[60px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.student_id}</TableCell>
                          <TableCell>{student.name}</TableCell>
                          <TableCell className="text-sm">{student.gender || '-'}</TableCell>
                          <TableCell className="text-sm">
                            {student.dob
                              ? new Date(student.dob).toLocaleDateString()
                              : '-'}
                          </TableCell>
                          <TableCell className="text-sm">{student.email || '-'}</TableCell>
                          <TableCell className="text-sm">{student.phone_number || '-'}</TableCell>
                          <TableCell className="text-sm">{student.roll_number || '-'}</TableCell>
                          <TableCell className="text-sm">{student.subject || '-'}</TableCell>
                          <TableCell className="text-sm">{student.academic_year || '-'}</TableCell>
                          <TableCell className="text-sm">{student.designation || '-'}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-popover">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedStudentForInfo(student);
                                  setInfoDialogOpen(true);
                                }}>
                                  <Info className="h-4 w-4 mr-2" />
                                  Info
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePromoteStudent(student)}>
                                  <ArrowUpRight className="h-4 w-4 mr-2" />
                                  Promote
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditStudent(student)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setStudentToDelete(student);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {filteredStudents.map((student) => (
                    <div key={student.id} className="bg-muted/50 rounded-lg p-4 space-y-3 border border-border">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground break-words">{student.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            ID: {student.student_id}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground block">Gender</span>
                          <span className="font-medium">{student.gender || '-'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">DOB</span>
                          <span className="font-medium">
                            {student.dob
                              ? new Date(student.dob).toLocaleDateString()
                              : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Roll Number</span>
                          <span className="font-medium">{student.roll_number || '-'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Subject</span>
                          <span className="font-medium">{student.subject || '-'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Academic Year</span>
                          <span className="font-medium">{student.academic_year || '-'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Designation</span>
                          <span className="font-medium">{student.designation || '-'}</span>
                        </div>
                        {student.email && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground block">Email</span>
                            <span className="font-medium text-xs break-all">{student.email}</span>
                          </div>
                        )}
                        {student.phone_number && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground block">Phone</span>
                            <span className="font-medium">{student.phone_number}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-border flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedStudentForInfo(student);
                            setInfoDialogOpen(true);
                          }}
                          className="flex-1 min-w-[45%]"
                          variant="outline"
                        >
                          <Info className="h-4 w-4 mr-1" />
                          Info
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handlePromoteStudent(student)}
                          className="flex-1 min-w-[45%]"
                          variant="outline"
                        >
                          <ArrowUpRight className="h-4 w-4 mr-1" />
                          Promote
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleEditStudent(student)}
                          className="flex-1 min-w-[30%]"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setStudentToDelete(student);
                            setDeleteDialogOpen(true);
                          }}
                          className="flex-1 min-w-[30%]"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Student Dialog */}
      <AddStudentDialog
        open={isAddStudentOpen}
        onOpenChange={setIsAddStudentOpen}
        classId={classId!}
        onSuccess={fetchClassAndStudents}
      />

      {/* Edit Student Dialog */}
      <EditStudentDialog
        open={isEditStudentOpen}
        onOpenChange={setIsEditStudentOpen}
        student={editingStudent}
        onSuccess={fetchClassAndStudents}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{studentToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => studentToDelete && handleDeleteStudent(studentToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Student Info Dialog */}
      <StudentInfoDialog
        open={infoDialogOpen}
        onOpenChange={setInfoDialogOpen}
        student={selectedStudentForInfo}
      />
    </DashboardLayout>
  );
}
