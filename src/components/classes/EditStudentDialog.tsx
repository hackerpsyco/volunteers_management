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
import { logActivity } from '@/utils/activityLogger';

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
  bank_name?: string | null;
  account_number?: string | null;
  ifsc_code?: string | null;
  allow_profile_edit?: boolean;
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

    // Bank Account validation if provided
    if (editedStudent.account_number && editedStudent.account_number.trim()) {
      const accountRegex = /^\d{9,18}$/;
      if (!accountRegex.test(editedStudent.account_number.trim())) {
        toast.error('Bank Account Number must be between 9 and 18 digits');
        return;
      }
    }

    // IFSC Code validation if provided
    if (editedStudent.ifsc_code && editedStudent.ifsc_code.trim()) {
      const ifscRegex = /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/;
      if (!ifscRegex.test(editedStudent.ifsc_code.trim())) {
        toast.error('IFSC Code must be an 11-character alphanumeric code (e.g. SBIN0001234)');
        return;
      }
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
          bank_name: editedStudent.bank_name ? editedStudent.bank_name.trim() : null,
          account_number: editedStudent.account_number ? editedStudent.account_number.trim() : null,
          ifsc_code: editedStudent.ifsc_code ? editedStudent.ifsc_code.trim() : null,
          allow_profile_edit: editedStudent.allow_profile_edit !== false,
        })
        .eq('id', editedStudent.id);

      if (error) throw error;

      await logActivity('UPDATE', 'Students', `Updated student details: ${editedStudent.name.trim()} (Email: ${editedStudent.email})`);
      
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
                  <SelectItem value="1. CCC">1. CCC</SelectItem>
                  <SelectItem value="2. Junior Fellow">2. Junior Fellow</SelectItem>
                  <SelectItem value="3. Senior Fellow">3. Senior Fellow</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Allow Profile Edit Toggle */}
          <div className="flex items-center space-x-2 pt-2 pb-1">
            <input
              id="allow-profile-edit"
              type="checkbox"
              checked={editedStudent.allow_profile_edit !== false}
              onChange={(e) => setEditedStudent({ ...editedStudent, allow_profile_edit: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
            />
            <Label htmlFor="allow-profile-edit" className="text-sm font-medium cursor-pointer">
              Allow student to edit their profile details
            </Label>
          </div>

          {/* Bank Details Section */}
          <div className="border-t pt-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Bank Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bank_name" className="text-sm">Bank Name</Label>
                <Input
                  id="bank_name"
                  placeholder="e.g. State Bank of India"
                  value={editedStudent.bank_name || ''}
                  onChange={(e) => setEditedStudent({ ...editedStudent, bank_name: e.target.value || null })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="account_number" className="text-sm">Account Number</Label>
                <Input
                  id="account_number"
                  placeholder="e.g. 123456789012"
                  value={editedStudent.account_number || ''}
                  onChange={(e) => setEditedStudent({ ...editedStudent, account_number: e.target.value || null })}
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="ifsc_code" className="text-sm">IFSC Code</Label>
                <Input
                  id="ifsc_code"
                  placeholder="e.g. SBIN0001234"
                  value={editedStudent.ifsc_code || ''}
                  onChange={(e) => setEditedStudent({ ...editedStudent, ifsc_code: e.target.value || null })}
                  className="mt-1"
                />
              </div>
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
