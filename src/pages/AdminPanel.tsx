import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Mail, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role_id: number | null;
  is_active: boolean;
  created_at: string;
}

interface Role {
  id: number;
  name: string;
  description: string | null;
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<number | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role_id: '',
    password: '',
  });

  useEffect(() => {
    if (user?.id) {
      checkAdminAccess();
    }
  }, [user?.id]);

  const checkAdminAccess = async () => {
    try {
      setCheckingAccess(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('role_id')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking access:', error);
      }

      if (data?.role_id === 1) {
        // User is Admin (role_id = 1)
        setUserRole(data.role_id);
        loadRoles();
        loadUsers();
      } else {
        // User is not Admin, redirect to dashboard
        toast.error('Access denied. Admin panel is only for administrators.');
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/dashboard', { replace: true });
    } finally {
      setCheckingAccess(false);
    }
  };

  const loadRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('id');

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error loading roles:', error);
      toast.error('Failed to load roles');
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user?: UserProfile) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        full_name: user.full_name || '',
        role_id: user.role_id?.toString() || '',
        password: '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        full_name: '',
        role_id: '',
        password: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setFormData({
      email: '',
      full_name: '',
      role_id: '',
      password: '',
    });
  };

  const handleSaveUser = async () => {
    try {
      if (!formData.email || !formData.role_id) {
        toast.error('Email and role are required');
        return;
      }

      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from('user_profiles')
          .update({
            full_name: formData.full_name,
            role_id: parseInt(formData.role_id),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingUser.id);

        if (error) throw error;
        toast.success('User updated successfully');
      } else {
        // Create new auth user with password
        if (!formData.password) {
          toast.error('Password is required for new users');
          return;
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: {
              skip_email_verification: true
            }
          }
        });

        if (authError) {
          console.error('Auth error:', authError);
          if (authError.message?.includes('already registered')) {
            toast.error('This email is already registered');
          } else {
            toast.error(`Error: ${authError.message || 'Failed to create user'}`);
          }
          return;
        }

        if (!authData.user?.id) {
          toast.error('Failed to create user account');
          return;
        }

        // Create user profile with the auth user ID
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([{
            id: authData.user.id,
            email: formData.email,
            full_name: formData.full_name || null,
            role_id: parseInt(formData.role_id),
            is_active: true,
          }]);

        if (profileError) {
          console.error('Profile error:', profileError);
          toast.error(`Error: ${profileError.message || 'Failed to create user profile'}`);
          return;
        }

        // Sign out the newly created user to prevent auto-login
        // This ensures the new user is NOT logged in
        await supabase.auth.signOut();

        toast.success('User created successfully. They can login with their email and password.');
        handleCloseDialog();
        loadUsers();
        return;
      }

      handleCloseDialog();
      loadUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Failed to save user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      // First, delete the user profile from user_profiles table
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      // Then, delete the auth user account
      // Note: This requires admin privileges in Supabase
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) {
        console.error('Error deleting auth user:', authError);
        // If auth deletion fails, the profile is already deleted, so show partial success
        toast.success('User profile deleted. Auth account may need manual deletion from Supabase console.');
      } else {
        toast.success('User and auth account deleted successfully');
      }

      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const getRoleName = (roleId: number | null) => {
    if (!roleId) return 'Unassigned';
    const role = roles.find(r => r.id === roleId);
    return role?.name || 'Unknown';
  };

  return (
    <DashboardLayout>
      {checkingAccess ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Checking access...</p>
          </div>
        </div>
      ) : userRole !== 1 ? (
        <div className="flex items-center justify-center py-12">
          <Card className="max-w-md">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Shield className="h-12 w-12 text-destructive mx-auto" />
                <h2 className="text-xl font-bold">Access Denied</h2>
                <p className="text-muted-foreground">
                  You do not have permission to access the Admin Panel. Only administrators can access this page.
                </p>
                <Button onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Admin Panel
            </h1>
            <p className="text-muted-foreground mt-1">Manage users and assign roles</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? 'Edit User' : 'Add New User'}
                </DialogTitle>
                <DialogDescription>
                  {editingUser
                    ? 'Update user information and role assignment'
                    : 'Add a new user and assign a role'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    disabled={!!editingUser}
                    className="mt-1"
                  />
                  {editingUser && (
                    <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role_id: value })
                    }
                  >
                    <SelectTrigger id="role" className="mt-1">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {!editingUser && (
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">User will login with this password</p>
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleCloseDialog}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveUser}>
                    {editingUser ? 'Update User' : 'Add User'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Manage all users and their role assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>{user.full_name || '-'}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {getRoleName(user.role_id)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(user)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Roles Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Available Roles</CardTitle>
            <CardDescription>
              Reference guide for user roles in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="p-4 border border-border rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-foreground">{role.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {role.description || 'No description'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      )}
    </DashboardLayout>
  );
}
