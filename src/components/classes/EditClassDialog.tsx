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
  const [saving, setSaving] = useState(false);

  /* ✅ Prefill Data */
  useEffect(() => {
    if (classData) {
      setClassName(classData.name || '');
      setEmail(classData.email || '');
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

      const { error } = await supabase
        .from('classes')
        .update({
          name: className.trim(),
          description: className.trim(),
          email: email.trim(),
        })
        .eq('id', classData.id);

      if (error) throw error;

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
