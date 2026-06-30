import { useState, useEffect } from 'react';
import { UserCog } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Student {
  id: string;
  name: string;
  designation: string | null;
}

interface AssignMonitorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: { id: string; name: string } | null;
  classId: string;
  onSuccess: () => void;
}

export function AssignMonitorDialog({
  open,
  onOpenChange,
  student,
  classId,
  onSuccess,
}: AssignMonitorDialogProps) {
  const [saving, setSaving] = useState(false);
  const [monitors, setMonitors] = useState<Student[]>([]);
  const [selectedMonitorId, setSelectedMonitorId] = useState<string>('none');

  useEffect(() => {
    if (open && classId) {
      fetchMonitors();
      if (student) {
        fetchCurrentMonitor();
      }
    }
  }, [open, classId, student]);

  const fetchMonitors = async () => {
    try {
      // Fetch students in this class with 'Senior Fellow' designation
      const { data, error } = await supabase
        .from('students')
        .select('id, name, designation')
        .eq('class_id', classId)
        .eq('designation', '3. Senior Fellow');

      if (error) throw error;
      setMonitors(data || []);
    } catch (error) {
      console.error('Error fetching monitors:', error);
    }
  };

  const fetchCurrentMonitor = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('monitor_id')
        .eq('id', student?.id)
        .single();
      
      if (error) throw error;
      setSelectedMonitorId(data?.monitor_id || 'none');
    } catch (error) {
      console.error('Error fetching current monitor:', error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const monitorId = selectedMonitorId === 'none' ? null : selectedMonitorId;
      const { error } = await supabase
        .from('students')
        .update({ monitor_id: monitorId })
        .eq('id', student?.id);

      if (error) throw error;
      
      toast.success('Class leader assigned successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error assigning monitor:', error);
      toast.error('Failed to assign class leader');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            Assign Class Leader
          </DialogTitle>
          <DialogDescription>
            Assign a Class Leader (Senior Fellow) for {student?.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="monitor">Class Leader (Senior Fellow)</Label>
            <Select value={selectedMonitorId} onValueChange={setSelectedMonitorId}>
              <SelectTrigger id="monitor">
                <SelectValue placeholder="Select monitor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {monitors.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {monitors.length === 0 && (
              <p className="text-xs text-yellow-600 italic mt-1">
                No students with '3. Senior Fellow' designation found in this class.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Assigning...' : 'Save Assignment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
