import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  onSuccess: () => void;
}

export function AddStudentDialog({
  open,
  onOpenChange,
  classId,
  onSuccess,
}: AddStudentDialogProps) {
  const [saving, setSaving] = useState(false);
  const [newStudent, setNewStudent] = useState({
    student_id: '',
    name: '',
    gender: '',
    dob: '',
    email: '',
    phone_number: '',
    roll_number: '',
    subject: '',
    academic_year: '',
    designation: '',
  });

  const handleAddStudent = async () => {
    if (!newStudent.name.trim()) {
      toast.error('Student Name is required');
      return;
    }
    if (!newStudent.email.trim()) {
      toast.error('Email is required to create the student login account');
      return;
    }
    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newStudent.email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setSaving(true);

      // Check if email already exists globally
      if (newStudent.email.trim()) {
        const { data: existingStudents, error: checkError } = await (supabase as any)
          .from('students')
          .select('id')
          .ilike('email', newStudent.email.trim());
          
        if (checkError) throw checkError;
        
        if (existingStudents && existingStudents.length > 0) {
          toast.error('A student with this email address already exists in the system.');
          setSaving(false);
          return;
        }
      }

      const { error } = await (supabase as any).from('students').insert([
        {
          class_id: classId,
          student_id: newStudent.student_id.trim() || `STU-${Date.now()}`,
          name: newStudent.name.trim(),
          gender: newStudent.gender || null,
          dob: newStudent.dob || null,
          email: newStudent.email || null,
          phone_number: newStudent.phone_number || null,
          roll_number: newStudent.roll_number || null,
          subject: newStudent.subject || null,
          academic_year: newStudent.academic_year || null,
          designation: newStudent.designation || null,
        },
      ]);

      if (error) throw error;
      
      // Automatically create Supabase Auth account and User Profile via RPC
      try {
        console.log('Ensuring student account for:', newStudent.email);
        const { error: accountError } = await supabase.rpc('ensure_student_account', {
          student_email: newStudent.email.trim(),
          student_full_name: newStudent.name.trim(),
          student_class_id: classId,
          old_email: null
        });

        if (accountError) {
          console.error('Error ensuring student account:', accountError);
          toast.warning(
            `Student added, but account creation failed: ${accountError.message || 'Unknown error'}. ` +
            'Student can be given access manually later.'
          );
        } else {
          console.log('Student auth account and profile ensured successfully');
        }
      } catch (accErr) {
        console.error('Exception during account creation:', accErr);
        // Don't block success — student row was already inserted
      }

      toast.success('Student added successfully');
      setNewStudent({
        student_id: '',
        name: '',
        gender: '',
        dob: '',
        email: '',
        phone_number: '',
        roll_number: '',
        subject: '',
        academic_year: '',
        designation: '',
      });
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error adding student:', error);
      if (error.code === '23505') {
        toast.error('This student ID already exists in this class');
      } else {
        toast.error('Failed to add student');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setNewStudent({
      student_id: '',
      name: '',
      gender: '',
      dob: '',
      email: '',
      phone_number: '',
      roll_number: '',
      subject: '',
      academic_year: '',
      designation: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add Student
          </DialogTitle>
          <DialogDescription>
            Enter student details to add to this class
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="student_id" className="text-sm">
                Student ID
              </Label>
              <Input
                id="student_id"
                placeholder="e.g., STU001"
                value={newStudent.student_id}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, student_id: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="name" className="text-sm">
                Student Name *
              </Label>
              <Input
                id="name"
                placeholder="Enter student name"
                value={newStudent.name}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, name: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="gender" className="text-sm">
                Gender
              </Label>
              <Select
                value={newStudent.gender}
                onValueChange={(value) =>
                  setNewStudent({ ...newStudent, gender: value })
                }
              >
                <SelectTrigger id="gender" className="mt-1">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dob" className="text-sm">
                Date of Birth
              </Label>
              <Input
                id="dob"
                type="date"
                value={newStudent.dob}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, dob: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-sm">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="student@example.com"
                value={newStudent.email}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, email: e.target.value })
                }
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-sm">
                Phone Number
              </Label>
              <Input
                id="phone"
                placeholder="+1234567890"
                value={newStudent.phone_number}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, phone_number: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="roll_number" className="text-sm">
                Roll Number
              </Label>
              <Input
                id="roll_number"
                placeholder="e.g., 1, 2, 3"
                value={newStudent.roll_number}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, roll_number: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="subject" className="text-sm">
                Subject
              </Label>
              <Select
                value={newStudent.subject}
                onValueChange={(value) =>
                  setNewStudent({ ...newStudent, subject: value })
                }
              >
                <SelectTrigger id="subject" className="mt-1">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Commerce">Commerce</SelectItem>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Arts">Arts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="academic_year" className="text-sm">
                Academic Year
              </Label>
              <Select
                value={newStudent.academic_year}
                onValueChange={(value) =>
                  setNewStudent({ ...newStudent, academic_year: value })
                }
              >
                <SelectTrigger id="academic_year" className="mt-1">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025-26">2025-26</SelectItem>
                  <SelectItem value="2026-27">2026-27</SelectItem>
                  <SelectItem value="2027-28">2027-28</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="designation" className="text-sm">
                Designation
              </Label>
              <Select
                value={newStudent.designation}
                onValueChange={(value) =>
                  setNewStudent({ ...newStudent, designation: value })
                }
              >
                <SelectTrigger id="designation" className="mt-1">
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1 Certified computer course">1 Certified computer course</SelectItem>
                  <SelectItem value="2 Certified computer course_EMP">2 Certified computer course_EMP</SelectItem>
                  <SelectItem value="3 WES Intern/Junior Fellow">3 WES Intern/Junior Fellow</SelectItem>
                  <SelectItem value="4 WES Senior Fellow">4 WES Senior Fellow</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Info banner */}
        <div className="mt-3 flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
          <span className="mt-0.5">ℹ️</span>
          <span>
            A <strong>login account</strong> will be auto-created using the student's email.
            Default password: <strong className="font-mono">123456</strong> (student can change after first login).
          </span>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAddStudent}
            disabled={
              saving ||
              !newStudent.name.trim() ||
              !newStudent.email.trim()
            }
          >
            {saving ? 'Adding...' : 'Add Student'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
