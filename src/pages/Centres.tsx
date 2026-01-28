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

interface Centre {
  id: string;
  name: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  status: string;
  created_at: string;
}

export default function Centres() {
  const [centres, setCentres] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCentre, setSelectedCentre] = useState<Centre | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    address: '',
    phone: '',
    email: '',
    status: 'active',
  });

  useEffect(() => {
    fetchCentres();
  }, []);

  const fetchCentres = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('centres')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCentres(data || []);
    } catch (error) {
      console.error('Error fetching centres:', error);
      toast.error('Failed to load centres');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.location) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('centres')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Centre updated successfully');
      } else {
        const { error } = await supabase
          .from('centres')
          .insert([formData]);

        if (error) throw error;
        toast.success('Centre created successfully');
      }

      resetForm();
      fetchCentres();
    } catch (error) {
      console.error('Error saving centre:', error);
      toast.error('Failed to save centre');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('centres')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Centre deleted successfully');
      setCentres(centres.filter((c) => c.id !== id));
    } catch (error) {
      console.error('Error deleting centre:', error);
      toast.error('Failed to delete centre');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedCentre(null);
    }
  };

  const handleEdit = (centre: Centre) => {
    setFormData({
      name: centre.name,
      location: centre.location,
      address: centre.address,
      phone: centre.phone,
      email: centre.email,
      status: centre.status,
    });
    setEditingId(centre.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      location: '',
      address: '',
      phone: '',
      email: '',
      status: 'active',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Centres</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Manage volunteer centres and locations
            </p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="gap-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Centre</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Centre' : 'Add New Centre'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Centre Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Centre name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Location *</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="City or region"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Full address"
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
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Email address"
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
                    {editingId ? 'Update Centre' : 'Add Centre'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Centres Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>All Centres</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : centres.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm md:text-base text-muted-foreground mb-4">
                  No centres yet. Add one to get started!
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Centre
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
                        <TableHead>Location</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[60px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {centres.map((centre) => (
                        <TableRow key={centre.id}>
                          <TableCell className="font-medium">{centre.name}</TableCell>
                          <TableCell>{centre.location}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{centre.address || '-'}</TableCell>
                          <TableCell>{centre.phone || '-'}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{centre.email || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={centre.status === 'active' ? 'default' : 'secondary'}>
                              {centre.status}
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
                                  onClick={() => handleEdit(centre)}
                                >
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedCentre(centre);
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
                  {centres.map((centre) => (
                    <div key={centre.id} className="bg-muted/50 rounded-lg p-4 space-y-3 border border-border">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground break-words">{centre.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">ID: {centre.id.substring(0, 8)}</p>
                        </div>
                        <Badge variant={centre.status === 'active' ? 'default' : 'secondary'} className="flex-shrink-0">
                          {centre.status}
                        </Badge>
                      </div>

                      <div className="text-xs">
                        <span className="text-muted-foreground block">Location</span>
                        <p className="font-medium text-sm">{centre.location}</p>
                      </div>

                      {centre.address && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Address</span>
                          <p className="font-medium text-sm break-words">{centre.address}</p>
                        </div>
                      )}

                      {centre.phone && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Phone</span>
                          <p className="font-medium text-sm">{centre.phone}</p>
                        </div>
                      )}

                      {centre.email && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Email</span>
                          <p className="font-medium break-all text-sm">{centre.email}</p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2 border-t border-border">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(centre)}
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
                                setSelectedCentre(centre);
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
            <AlertDialogTitle>Delete Centre</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCentre?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedCentre && handleDelete(selectedCentre.id)}
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
