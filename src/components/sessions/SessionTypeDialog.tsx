import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GraduationCap, Users } from 'lucide-react';

interface SessionTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectType: (type: 'guest_teacher' | 'guest_speaker') => void;
}

export function SessionTypeDialog({
  open,
  onOpenChange,
  onSelectType,
}: SessionTypeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[500px] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Create New Session</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Select the type of session you want to create
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6">
          {/* Guest Teacher Option */}
          <button
            onClick={() => {
              onSelectType('guest_teacher');
              onOpenChange(false);
            }}
            className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-border rounded-lg hover:border-primary hover:bg-muted transition-all"
          >
            <GraduationCap className="h-12 w-12 text-blue-500" />
            <div className="text-center">
              <h3 className="font-semibold text-foreground">Guest Teacher</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Session led by a teacher
              </p>
            </div>
          </button>

          {/* Guest Speaker Option */}
          <button
            onClick={() => {
              onSelectType('guest_speaker');
              onOpenChange(false);
            }}
            className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-border rounded-lg hover:border-primary hover:bg-muted transition-all"
          >
            <Users className="h-12 w-12 text-green-500" />
            <div className="text-center">
              <h3 className="font-semibold text-foreground">Guest Speaker</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Session led by a speaker
              </p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
