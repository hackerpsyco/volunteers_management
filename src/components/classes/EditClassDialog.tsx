import { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EditClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  classData: any; // contains id, name, email
}

export function EditClassDialog({
  open,
  onOpenChange,
  onSuccess,
  classData,
}: EditClassDialogProps) {
  const [className, setClassName] = useState('');
  const [email, setEmail] = useState('');
  const [allowProfileEdit, setAllowProfileEdit] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ✅ Prefill Data */
  useEffect(() => {
    if (classData) {
      setClassName(classData.name || '');
      setEmail(classData.email || '');
      setAllowProfileEdit(classData.allow_profile_edit !== false);
    }
  }, [classData]);

  const handleUpdate = async () => {
    if (!className.trim()) {
      toast.error('Class name is required');
      return;
    }

    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }

    try {
      setSaving(true);

      const newName = className.trim();
      const oldName = classData.name;

      const { error } = await (supabase as any)
        .from('classes')
        .update({
          name: newName,
          description: newName,
          email: email.trim(),
          allow_profile_edit: allowProfileEdit,
        })
        .eq('id', classData.id);

      if (error) throw error;

      // If the class name was changed, update all string references in other tables
      if (oldName && oldName !== newName) {
        await (supabase as any)
          .from('sessions')
          .update({ class_batch: newName })
          .eq('class_batch', oldName);
          
        await (supabase as any)
          .from('volunteers')
          .update({ preferred_class: newName })
          .eq('preferred_class', oldName);
      }

      toast.success('Class updated successfully');

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Update error:', error);

      if (error.code === '23505') {
        toast.error('Class already exists');
      } else {
        toast.error('Failed to update class');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Edit Class
          </DialogTitle>
          <DialogDescription>
            Modify class details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Class Name */}
          <div>
            <Label htmlFor="class-name">Class Name</Label>
            <Input
              id="class-name"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Allow Student Profile Editing Toggle */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              id="allow-profile-edit"
              type="checkbox"
              checked={allowProfileEdit}
              onChange={(e) => setAllowProfileEdit(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
            />
            <Label htmlFor="allow-profile-edit" className="text-sm font-medium cursor-pointer">
              Allow students to edit their profile
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={saving || !className.trim() || !email.trim()}
          >
            {saving ? 'Updating...' : 'Update Class'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
