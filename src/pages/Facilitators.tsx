import { useState, useEffect } from 'react';
import { Plus, Trash2, MoreVertical } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface Facilitator {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: string;
  created_at: string;
}

export default function Facilitators() {
  const [facilitators, setFacilitators] = useState<Facilitator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFacilitator, setSelectedFacilitator] = useState<Facilitator | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    status: 'active',
  });

  useEffect(() => {
    fetchFacilitators();
  }, []);

  const fetchFacilitators = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('facilitators')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setFacilitators(data || []);
    } catch (error) {
      console.error('Error fetching facilitators:', error);
      toast.error('Failed to load facilitators');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('facilitators')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Facilitator updated successfully');
      } else {
        const { error } = await supabase
          .from('facilitators')
          .insert([formData]);

        if (error) throw error;
        toast.success('Facilitator created successfully');
      }

      resetForm();
      fetchFacilitators();
    } catch (error) {
      console.error('Error saving facilitator:', error);
      toast.error('Failed to save facilitator');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('facilitators')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Facilitator deleted successfully');
      setFacilitators(facilitators.filter((f) => f.id !== id));
    } catch (error) {
      console.error('Error deleting facilitator:', error);
      toast.error('Failed to delete facilitator');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedFacilitator(null);
    }
  };

  const handleEdit = (facilitator: Facilitator) => {
    setFormData({
      name: facilitator.name,
      email: facilitator.email,
      phone: facilitator.phone,
      location: facilitator.location,
      status: facilitator.status,
    });
    setEditingId(facilitator.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      location: '',
      status: 'active',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Facilitators</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Manage facilitators and instructors
            </p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="gap-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Facilitator</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Facilitator' : 'Add New Facilitator'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Facilitator name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="City or location"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">
                    {editingId ? 'Update Facilitator' : 'Add Facilitator'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Facilitators Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>All Facilitators</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : facilitators.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm md:text-base text-muted-foreground mb-4">
                  No facilitators yet. Add one to get started!
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Facilitator
                </Button>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[60px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {facilitators.map((facilitator) => (
                        <TableRow key={facilitator.id}>
                          <TableCell className="font-medium">{facilitator.name}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{facilitator.email}</TableCell>
                          <TableCell>{facilitator.phone || '-'}</TableCell>
                          <TableCell>{facilitator.location || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={facilitator.status === 'active' ? 'default' : 'secondary'}>
                              {facilitator.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-popover">
                                <DropdownMenuItem
                                  onClick={() => handleEdit(facilitator)}
                                >
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedFacilitator(facilitator);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {facilitators.map((facilitator) => (
                    <div key={facilitator.id} className="bg-muted/50 rounded-lg p-4 space-y-3 border border-border">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground break-words">{facilitator.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">ID: {facilitator.id.substring(0, 8)}</p>
                        </div>
                        <Badge variant={facilitator.status === 'active' ? 'default' : 'secondary'} className="flex-shrink-0">
                          {facilitator.status}
                        </Badge>
                      </div>

                      <div className="text-xs">
                        <span className="text-muted-foreground block">Email</span>
                        <p className="font-medium break-all text-sm">{facilitator.email}</p>
                      </div>

                      {facilitator.phone && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Phone</span>
                          <p className="font-medium text-sm">{facilitator.phone}</p>
                        </div>
                      )}

                      {facilitator.location && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Location</span>
                          <p className="font-medium text-sm">{facilitator.location}</p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2 border-t border-border">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(facilitator)}
                          className="flex-1"
                        >
                          Edit
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedFacilitator(facilitator);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Facilitator</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedFacilitator?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedFacilitator && handleDelete(selectedFacilitator.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
