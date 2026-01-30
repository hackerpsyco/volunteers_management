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

  useEffect(() => {
    if (student) {
      setEditedStudent(student);
    }
  }, [student, open]);

  const handleSave = async () => {
    if (!editedStudent || !editedStudent.name.trim()) {
      toast.error('Student name is required');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('students')
        .update({
          name: editedStudent.name.trim(),
          gender: editedStudent.gender || null,
          dob: editedStudent.dob || null,
          email: editedStudent.email || null,
          phone_number: editedStudent.phone_number || null,
        })
        .eq('id', editedStudent.id);

      if (error) throw error;

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
