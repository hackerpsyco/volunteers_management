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
  });

  const handleAddStudent = async () => {
    if (!newStudent.name.trim()) {
      toast.error('Student Name is required');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.from('students').insert([
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
        },
      ]);

      if (error) throw error;

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
                Email
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
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAddStudent}
            disabled={
              saving ||
              !newStudent.name.trim()
            }
          >
            {saving ? 'Adding...' : 'Add Student'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
