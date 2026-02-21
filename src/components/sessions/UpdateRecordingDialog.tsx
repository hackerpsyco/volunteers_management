import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { useToast } from '@/hooks/use-toast';

interface UpdateRecordingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  sessionTitle: string;
  currentRecordingUrl?: string | null;
  currentRecordingStatus?: string | null;
  onSuccess: () => void;
}

export function UpdateRecordingDialog({
  open,
  onOpenChange,
  sessionId,
  sessionTitle,
  currentRecordingUrl,
  currentRecordingStatus,
  onSuccess,
}: UpdateRecordingDialogProps) {
  const [recordingUrl, setRecordingUrl] = useState(currentRecordingUrl || '');
  const [recordingStatus, setRecordingStatus] = useState(currentRecordingStatus || 'available');
  const [recordingDuration, setRecordingDuration] = useState('');
  const [recordingSize, setRecordingSize] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recordingUrl.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a recording URL',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const updateData: any = {
        recording_url: recordingUrl.trim(),
        recording_status: recordingStatus,
        recording_created_at: new Date().toISOString(),
      };

      if (recordingDuration) {
        updateData.recording_duration = parseInt(recordingDuration);
      }

      if (recordingSize) {
        updateData.recording_size = recordingSize.trim();
      }

      const { error } = await supabase
        .from('sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Recording information updated successfully',
      });

      handleClose();
      onSuccess();
    } catch (error) {
      console.error('Error updating recording:', error);
      toast({
        title: 'Error',
        description: 'Failed to update recording information',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setRecordingUrl(currentRecordingUrl || '');
    setRecordingStatus(currentRecordingStatus || 'available');
    setRecordingDuration('');
    setRecordingSize('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Recording</DialogTitle>
          <DialogDescription>
            Add or update recording information for "{sessionTitle}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recording URL */}
          <div className="space-y-2">
            <Label htmlFor="recording_url" className="text-sm">
              Recording URL *
            </Label>
            <Input
              id="recording_url"
              type="url"
              placeholder="https://drive.google.com/file/d/..."
              value={recordingUrl}
              onChange={(e) => setRecordingUrl(e.target.value)}
              className="text-sm"
              required
            />
            <p className="text-xs text-muted-foreground">
              Paste the Google Drive link or any other recording URL
            </p>
          </div>

          {/* Recording Status */}
          <div className="space-y-2">
            <Label htmlFor="recording_status" className="text-sm">
              Recording Status
            </Label>
            <Select value={recordingStatus} onValueChange={setRecordingStatus}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">📹 Available</SelectItem>
                <SelectItem value="pending">⏳ Processing</SelectItem>
                <SelectItem value="failed">❌ Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recording Duration (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="recording_duration" className="text-sm">
              Duration (seconds) - Optional
            </Label>
            <Input
              id="recording_duration"
              type="number"
              placeholder="3600"
              value={recordingDuration}
              onChange={(e) => setRecordingDuration(e.target.value)}
              className="text-sm"
              min="0"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to skip. Example: 3600 for 1 hour
            </p>
          </div>

          {/* Recording Size (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="recording_size" className="text-sm">
              File Size - Optional
            </Label>
            <Input
              id="recording_size"
              type="text"
              placeholder="500MB"
              value={recordingSize}
              onChange={(e) => setRecordingSize(e.target.value)}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Example: 500MB, 1.2GB
            </p>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="w-full sm:w-auto text-sm"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto text-sm"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Recording'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
