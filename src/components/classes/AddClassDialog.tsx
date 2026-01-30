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

interface AddClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const PREDEFINED_CLASSES = [
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'CCC (11+12+1st Y+2ndY+3rdYr)',
];

export function AddClassDialog({ open, onOpenChange, onSuccess }: AddClassDialogProps) {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [customClass, setCustomClass] = useState('');
  const [isManual, setIsManual] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    const className = isManual ? customClass.trim() : selectedClass;

    if (!className) {
      toast.error('Please select or enter a class name');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.from('classes').insert([
        {
          name: className,
          description: className,
        },
      ]);

      if (error) throw error;

      toast.success('Class added successfully');
      setSelectedClass('');
      setCustomClass('');
      setIsManual(false);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error adding class:', error);
      if (error.code === '23505') {
        toast.error('This class already exists');
      } else {
        toast.error('Failed to add class');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedClass('');
    setCustomClass('');
    setIsManual(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add Class
          </DialogTitle>
          <DialogDescription>
            Select a predefined class or enter a custom class name
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Toggle between predefined and manual */}
          <div className="flex gap-2">
            <Button
              variant={!isManual ? 'default' : 'outline'}
              onClick={() => setIsManual(false)}
              className="flex-1"
            >
              Predefined
            </Button>
            <Button
              variant={isManual ? 'default' : 'outline'}
              onClick={() => setIsManual(true)}
              className="flex-1"
            >
              Manual
            </Button>
          </div>

          {/* Predefined Classes */}
          {!isManual && (
            <div>
              <Label htmlFor="class-select" className="text-sm">
                Select Class
              </Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger id="class-select" className="mt-2">
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  {PREDEFINED_CLASSES.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Manual Entry */}
          {isManual && (
            <div>
              <Label htmlFor="class-name" className="text-sm">
                Class Name
              </Label>
              <Input
                id="class-name"
                placeholder="Enter class name"
                value={customClass}
                onChange={(e) => setCustomClass(e.target.value)}
                className="mt-2"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={saving || (!isManual && !selectedClass) || (isManual && !customClass.trim())}
          >
            {saving ? 'Adding...' : 'Add Class'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
