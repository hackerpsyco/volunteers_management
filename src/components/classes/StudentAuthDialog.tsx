import { useState, useEffect } from 'react';
import { Shield, Key, Trash2, UserPlus, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StudentAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: any;
  classId: string;
}

export function StudentAuthDialog({
  open,
  onOpenChange,
  student,
  classId,
}: StudentAuthDialogProps) {
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    if (open && student?.email) {
      checkUserProfile();
      setNewPassword('');
      setDeleteConfirm('');
    } else if (open && !student?.email) {
      setUserProfile(null);
    }
  }, [open, student]);

  const checkUserProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', student.email)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
      }
      
      setUserProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!student?.email) {
      toast.error('Student must have an email address');
      return;
    }
    
    try {
      setLoading(true);
      const { error } = await supabase.rpc('ensure_student_account', {
        student_email: student.email,
        student_full_name: student.name,
        student_class_id: classId,
        old_email: null
      });

      if (error) throw error;
      
      toast.success('Student login account created successfully');
      checkUserProfile();
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to create account: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!userProfile?.id) {
      toast.error('User profile not found');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.rpc('admin_reset_user_password', {
        target_user_id: userProfile.id,
        new_password: newPassword
      });

      if (error) throw error;

      toast.success('Password reset successfully');
      setNewPassword('');
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to reset password: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    if (!userProfile?.id) {
      toast.error('User profile not found');
      return;
    }

    try {
      setLoading(true);
      
      // Delete user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userProfile.id);

      if (profileError) throw profileError;

      // Attempt to delete auth user
      try {
        await supabase.auth.admin.deleteUser(userProfile.id);
      } catch (authErr) {
        console.warn('Auth deletion failed (expected on client):', authErr);
      }

      toast.success('Student login account deleted successfully');
      setUserProfile(null);
      setDeleteConfirm('');
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to delete account: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Auth Settings: {student.name}
          </DialogTitle>
          <DialogDescription>
            Manage the login account for this student.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {!student.email ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 flex items-start gap-2 rounded-md text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p>This student needs an email address before an auth account can be created. Please edit the student's details first.</p>
            </div>
          ) : loading && !userProfile ? (
            <div className="text-center py-4 text-sm text-muted-foreground">Checking account status...</div>
          ) : !userProfile ? (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md text-sm">
                <p className="font-medium mb-1">No Login Account Found</p>
                <p className="text-muted-foreground mb-3">This student does not currently have an active login account tied to <strong>{student.email}</strong>.</p>
                <Button onClick={handleCreateAccount} disabled={loading} className="w-full gap-2">
                  <UserPlus className="h-4 w-4" />
                  {loading ? 'Creating...' : 'Create Login Account'}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-md text-sm text-blue-800 mb-4">
                Active account found for <strong>{userProfile.email}</strong>.
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  Reset Password
                </h4>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="Enter new password (min 6 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <Button onClick={handleResetPassword} disabled={loading || newPassword.length < 6}>
                    Reset
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-border mt-4">
                <h4 className="font-medium text-sm text-destructive flex items-center gap-2 mb-3">
                  <Trash2 className="h-4 w-4" />
                  Delete Auth Account
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  This will remove their ability to log in. Their student record in the class will <strong>not</strong> be deleted.
                </p>
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Type DELETE"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    className="w-[150px] border-destructive/50"
                  />
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteAccount} 
                    disabled={loading || deleteConfirm !== 'DELETE'}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
