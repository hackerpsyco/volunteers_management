import { useState } from 'react';
import { format } from 'date-fns';
import { Clock, GraduationCap, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
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
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AddSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  onSuccess: () => void;
}

type SessionCategory = 'guest_speaker' | 'guest_teacher' | null;

export function AddSessionDialog({ 
  open, 
  onOpenChange, 
  selectedDate, 
  onSuccess 
}: AddSessionDialogProps) {
  const [sessionCategory, setSessionCategory] = useState<SessionCategory>(null);
  const [formData, setFormData] = useState({
    title: '',
    session_time: '09:00',
    session_type: 'regular',
    // Teacher session fields
    content_category: '',
    s_no: '',
    modules: '',
    topics_covered: '',
    videos: '',
    quiz_content_ppt: '',
    final_content_ppt: '',
    session_status: 'pending',
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !user) return;

    const sessionData = {
      title: formData.title,
      session_date: format(selectedDate, 'yyyy-MM-dd'),
      session_time: formData.session_time,
      session_type: sessionCategory === 'guest_speaker' ? 'guest_speaker' : 
                    sessionCategory === 'guest_teacher' ? 'guest_teacher' : formData.session_type,
      status: 'scheduled',
      content_category: sessionCategory === 'guest_teacher' ? formData.content_category : null,
      s_no: sessionCategory === 'guest_teacher' && formData.s_no ? parseInt(formData.s_no) : null,
      modules: sessionCategory === 'guest_teacher' ? formData.modules : null,
      topics_covered: sessionCategory === 'guest_teacher' ? formData.topics_covered : null,
      videos: sessionCategory === 'guest_teacher' ? formData.videos : null,
      quiz_content_ppt: sessionCategory === 'guest_teacher' ? formData.quiz_content_ppt : null,
      final_content_ppt: sessionCategory === 'guest_teacher' ? formData.final_content_ppt : null,
      session_status: sessionCategory === 'guest_teacher' ? formData.session_status : null,
    };

    const { error } = await supabase.from('sessions').insert([sessionData]);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create session. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Session Created',
        description: `Session "${formData.title}" has been scheduled for ${format(selectedDate, 'MMMM d, yyyy')}`,
      });
      handleClose();
      onSuccess();
    }
  };

  const handleClose = () => {
    setSessionCategory(null);
    setFormData({
      title: '',
      session_time: '09:00',
      session_type: 'regular',
      content_category: '',
      s_no: '',
      modules: '',
      topics_covered: '',
      videos: '',
      quiz_content_ppt: '',
      final_content_ppt: '',
      session_status: 'pending',
    });
    onOpenChange(false);
  };

  // Category Selection Screen
  if (!sessionCategory) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Add Session - {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground text-center mb-4">
              Select the type of session you want to add
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSessionCategory('guest_speaker')}
                className={cn(
                  "flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border",
                  "hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                )}
              >
                <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Mic className="h-6 w-6 text-purple-500" />
                </div>
                <span className="font-medium text-foreground">Guest Speaker</span>
                <span className="text-xs text-muted-foreground text-center">
                  Invite external speakers for presentations
                </span>
              </button>

              <button
                onClick={() => setSessionCategory('guest_teacher')}
                className={cn(
                  "flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border",
                  "hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                )}
              >
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-green-500" />
                </div>
                <span className="font-medium text-foreground">Guest Teacher</span>
                <span className="text-xs text-muted-foreground text-center">
                  Educational sessions with content tracking
                </span>
              </button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Guest Speaker Form
  if (sessionCategory === 'guest_speaker') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-purple-500" />
              Guest Speaker Session - {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Session Title</Label>
              <Input
                id="title"
                placeholder="Enter session title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.session_time}
                onChange={(e) => setFormData({ ...formData, session_time: e.target.value })}
                required
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
              <p>Session will be linked to: <span className="font-medium text-foreground">{user?.email}</span></p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSessionCategory(null)}>
                Back
              </Button>
              <Button type="submit">Create Session</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // Guest Teacher Form with Content Fields
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-green-500" />
            Guest Teacher Session - {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Session Title *</Label>
              <Input
                id="title"
                placeholder="Enter session title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={formData.session_time}
                onChange={(e) => setFormData({ ...formData, session_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h4 className="font-medium text-sm text-foreground mb-3">Content Details</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="content_category">Content Category</Label>
                <Input
                  id="content_category"
                  placeholder="e.g., English, Math, Science"
                  value={formData.content_category}
                  onChange={(e) => setFormData({ ...formData, content_category: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="s_no">S.No</Label>
                <Input
                  id="s_no"
                  type="number"
                  placeholder="Serial number"
                  value={formData.s_no}
                  onChange={(e) => setFormData({ ...formData, s_no: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="modules">Modules</Label>
              <Input
                id="modules"
                placeholder="Module name or number"
                value={formData.modules}
                onChange={(e) => setFormData({ ...formData, modules: e.target.value })}
              />
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="topics_covered">Topics Covered</Label>
              <Textarea
                id="topics_covered"
                placeholder="List the topics that will be covered"
                value={formData.topics_covered}
                onChange={(e) => setFormData({ ...formData, topics_covered: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="videos">Videos</Label>
              <Input
                id="videos"
                placeholder="Video links or references"
                value={formData.videos}
                onChange={(e) => setFormData({ ...formData, videos: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="quiz_content_ppt">Quiz/Content PPT</Label>
                <Input
                  id="quiz_content_ppt"
                  placeholder="Quiz or content PPT link"
                  value={formData.quiz_content_ppt}
                  onChange={(e) => setFormData({ ...formData, quiz_content_ppt: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="final_content_ppt">Final Content PPT</Label>
                <Input
                  id="final_content_ppt"
                  placeholder="Final PPT link"
                  value={formData.final_content_ppt}
                  onChange={(e) => setFormData({ ...formData, final_content_ppt: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="session_status">Session Status</Label>
              <Select
                value={formData.session_status}
                onValueChange={(value) => setFormData({ ...formData, session_status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
            <p>Session will be linked to: <span className="font-medium text-foreground">{user?.email}</span></p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSessionCategory(null)}>
              Back
            </Button>
            <Button type="submit">Create Session</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
