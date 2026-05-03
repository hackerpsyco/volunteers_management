import { useState, useEffect } from 'react';
import { Edit } from 'lucide-react';
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
}

interface EditStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  onSuccess: () => void;
}

export function EditStudentDialog({
  open,
  onOpenChange,
  student,
  onSuccess,
}: EditStudentDialogProps) {
  const [saving, setSaving] = useState(false);
  const [editedStudent, setEditedStudent] = useState<Student | null>(null);
  const [originalEmail, setOriginalEmail] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      setEditedStudent(student);
      setOriginalEmail(student.email);
    }
  }, [student, open]);

  const handleSave = async () => {
    if (!editedStudent || !editedStudent.name.trim()) {
      toast.error('Student name is required');
      return;
    }

    try {
      setSaving(true);
      const { error } = await (supabase as any)
        .from('students')
        .update({
          name: editedStudent.name.trim(),
          gender: editedStudent.gender || null,
          dob: editedStudent.dob || null,
          email: editedStudent.email || null,
          phone_number: editedStudent.phone_number || null,
          roll_number: editedStudent.roll_number || null,
          subject: editedStudent.subject || null,
          academic_year: editedStudent.academic_year || null,
          designation: editedStudent.designation || null,
        })
        .eq('id', editedStudent.id);

      if (error) throw error;
      
      // Automatic account creation/update if email is provided
      if (editedStudent.email) {
        try {
          // Find the class_id for the student if not already present in editedStudent
          // In this component, class_id might not be in the student object passed as prop
          // But we can try to get it from the editedStudent if available or from the student record
          // Looking at the Student interface, class_id is NOT included.
          // Let's fetch it if needed, or assume it doesn't change here.
          // Wait, I should probably include class_id in the Student interface or fetch it.
          
          // Let's check if we have class_id. 
          // If not, we might need to fetch the student's class_id from the database.
          const { data: studentData } = await supabase
            .from('students')
            .select('class_id')
            .eq('id', editedStudent.id)
            .single();
            
          const classId = studentData?.class_id;

          if (classId) {
            console.log('Ensuring student account for:', editedStudent.email, 'Old email:', originalEmail);
            const { error: accountError } = await supabase.rpc('ensure_student_account', {
              student_email: editedStudent.email.trim(),
              student_full_name: editedStudent.name.trim(),
              student_class_id: classId,
              old_email: originalEmail?.trim() || null
            });
            
            if (accountError) {
              console.error('Error ensuring student account:', accountError);
              toast.error('Student updated, but account sync failed: ' + accountError.message);
            } else {
              // Update original email for next potential save without closing dialog
              setOriginalEmail(editedStudent.email.trim());
            }
          }
        } catch (accError) {
          console.error('Exception ensuring student account:', accError);
        }
      }

      toast.success('Student updated successfully');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error updating student:', error);
      toast.error('Failed to update student');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setEditedStudent(null);
    onOpenChange(false);
  };

  if (!editedStudent) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            Edit Student
          </DialogTitle>
          <DialogDescription>
            Update student details
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
                value={editedStudent.student_id}
                disabled
                className="mt-1 bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">Cannot be changed</p>
            </div>
            <div>
              <Label htmlFor="name" className="text-sm">
                Student Name *
              </Label>
              <Input
                id="name"
                placeholder="Enter student name"
                value={editedStudent.name}
                onChange={(e) =>
                  setEditedStudent({ ...editedStudent, name: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="gender" className="text-sm">
                Gender
              </Label>
              <Select
                value={editedStudent.gender || 'none'}
                onValueChange={(value) =>
                  setEditedStudent({ ...editedStudent, gender: value === 'none' ? null : value })
                }
              >
                <SelectTrigger id="gender" className="mt-1">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
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
                value={editedStudent.dob || ''}
                onChange={(e) =>
                  setEditedStudent({ ...editedStudent, dob: e.target.value || null })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="student@example.com"
                value={editedStudent.email || ''}
                onChange={(e) =>
                  setEditedStudent({ ...editedStudent, email: e.target.value || null })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-sm">
                Phone Number
              </Label>
              <Input
                id="phone"
                placeholder="+1234567890"
                value={editedStudent.phone_number || ''}
                onChange={(e) =>
                  setEditedStudent({ ...editedStudent, phone_number: e.target.value || null })
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
                value={editedStudent.roll_number || ''}
                onChange={(e) =>
                  setEditedStudent({ ...editedStudent, roll_number: e.target.value || null })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="subject" className="text-sm">
                Subject
              </Label>
              <Select
                value={editedStudent.subject || 'none'}
                onValueChange={(value) =>
                  setEditedStudent({ ...editedStudent, subject: value === 'none' ? null : value })
                }
              >
                <SelectTrigger id="subject" className="mt-1">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
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
                value={editedStudent.academic_year || 'none'}
                onValueChange={(value) =>
                  setEditedStudent({ ...editedStudent, academic_year: value === 'none' ? null : value })
                }
              >
                <SelectTrigger id="academic_year" className="mt-1">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
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
                value={editedStudent.designation || 'none'}
                onValueChange={(value) =>
                  setEditedStudent({ ...editedStudent, designation: value === 'none' ? null : value })
                }
              >
                <SelectTrigger id="designation" className="mt-1">
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="1 Certified computer course">1 Certified computer course</SelectItem>
                  <SelectItem value="2 Certified computer course_EMP">2 Certified computer course_EMP</SelectItem>
                  <SelectItem value="3 WES Intern/Junior Fellow">3 WES Intern/Junior Fellow</SelectItem>
                  <SelectItem value="4 WES Senior Fellow">4 WES Senior Fellow</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !editedStudent.name.trim()}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
