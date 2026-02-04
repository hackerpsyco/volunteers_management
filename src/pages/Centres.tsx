import { useState, useEffect } from 'react';
import { Plus, Trash2, MoreVertical, Clock } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface Centre {
  id: string;
  name: string;
  location: string;
  address?: string | null;
  email?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface CentreTimeSlot {
  id: string;
  centre_id: string;
  day: string;
  start_time: string;
  end_time: string;
}

export default function Centres() {
  const [centres, setCentres] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCentre, setSelectedCentre] = useState<Centre | null>(null);
  const [centreSlots, setCentreSlots] = useState<Record<string, CentreTimeSlot[]>>({});
  const [showSlotForm, setShowSlotForm] = useState<string | null>(null);
  const [slotFormData, setSlotFormData] = useState({
    start_time: '09:00',
    end_time: '10:00',
  });
  const [addSlotDialogOpen, setAddSlotDialogOpen] = useState(false);
  const [selectedCentreForSlot, setSelectedCentreForSlot] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    address: '',
    email: '',
    status: 'active',
  });
  const [timeSlots, setTimeSlots] = useState<Array<{ start_time: string; end_time: string }>>([
    { start_time: '09:00', end_time: '10:00' }
  ]);

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
      
      // Fetch slots for all centres
      if (data && data.length > 0) {
        for (const centre of data) {
          await fetchCentreSlots(centre.id);
        }
      }
    } catch (error) {
      console.error('Error fetching centres:', error);
      toast.error('Failed to load centres');
    } finally {
      setLoading(false);
    }
  };

  const fetchCentreSlots = async (centreId: string) => {
    try {
      const { data, error } = await supabase
        .from('centre_time_slots')
        .select('*')
        .eq('centre_id', centreId)
        .order('day', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setCentreSlots(prev => ({
        ...prev,
        [centreId]: data || []
      }));
    } catch (error) {
      console.error('Error fetching centre slots:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.location) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      let centreId = editingId;

      if (editingId) {
        const { error } = await supabase
          .from('centres')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Centre updated successfully');
      } else {
        const { data, error } = await supabase
          .from('centres')
          .insert([formData])
          .select();

        if (error) throw error;
        centreId = data?.[0]?.id;
        toast.success('Centre created successfully');
      }

      // Add time slots if creating new centre
      if (centreId && !editingId && timeSlots.length > 0) {
        const slotsToInsert = timeSlots.map(slot => ({
          centre_id: centreId,
          day: 'Monday',
          start_time: slot.start_time,
          end_time: slot.end_time,
        }));

        const { error: slotError } = await supabase
          .from('centre_time_slots')
          .insert(slotsToInsert);

        if (slotError) throw slotError;
        toast.success('Time slots added successfully');
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
      email: centre.email || '',
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
      email: '',
      status: 'active',
    });
    setTimeSlots([{ start_time: '09:00', end_time: '10:00' }]);
  };

  const handleAddSlot = async (centreId: string) => {
    if (!slotFormData.start_time || !slotFormData.end_time) {
      toast.error('Please fill in all time slot fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('centre_time_slots')
        .insert([{
          centre_id: centreId,
          day: 'Monday',
          start_time: slotFormData.start_time,
          end_time: slotFormData.end_time,
        }]);

      if (error) throw error;
      toast.success('Time slot added successfully');
      setShowSlotForm(null);
      setAddSlotDialogOpen(false);
      setSelectedCentreForSlot('');
      setSlotFormData({ start_time: '09:00', end_time: '10:00' });
      await fetchCentreSlots(centreId);
    } catch (error) {
      console.error('Error adding time slot:', error);
      toast.error('Failed to add time slot');
    }
  };

  const handleDeleteSlot = async (slotId: string, centreId: string) => {
    try {
      const { error } = await supabase
        .from('centre_time_slots')
        .delete()
        .eq('id', slotId);

      if (error) throw error;
      toast.success('Time slot deleted successfully');
      await fetchCentreSlots(centreId);
    } catch (error) {
      console.error('Error deleting time slot:', error);
      toast.error('Failed to delete time slot');
    }
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
          <div className="flex gap-2 w-full sm:w-auto">
            <Dialog open={addSlotDialogOpen} onOpenChange={setAddSlotDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 flex-1 sm:flex-none">
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Time Slot</span>
                  <span className="sm:hidden">Slot</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Time Slot to Centre</DialogTitle>
                  <DialogDescription>
                    Select a centre and add a new time slot
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Select Centre</label>
                    <Select value={selectedCentreForSlot} onValueChange={setSelectedCentreForSlot}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a centre" />
                      </SelectTrigger>
                      <SelectContent>
                        {centres.map(centre => (
                          <SelectItem key={centre.id} value={centre.id}>
                            {centre.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">Start Time</label>
                      <input
                        type="time"
                        value={slotFormData.start_time}
                        onChange={(e) => setSlotFormData({ ...slotFormData, start_time: e.target.value })}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">End Time</label>
                      <input
                        type="time"
                        value={slotFormData.end_time}
                        onChange={(e) => setSlotFormData({ ...slotFormData, end_time: e.target.value })}
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => {
                        if (!selectedCentreForSlot) {
                          toast.error('Please select a centre');
                          return;
                        }
                        handleAddSlot(selectedCentreForSlot);
                      }}
                      className="flex-1"
                    >
                      Add Slot
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAddSlotDialogOpen(false);
                        setSelectedCentreForSlot('');
                        setSlotFormData({ start_time: '09:00', end_time: '10:00' });
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              onClick={() => setShowForm(!showForm)}
              className="gap-2 flex-1 sm:flex-none"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Centre</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
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
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Centre email address"
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

                {/* Time Slots Section */}
                {!editingId && (
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-sm">Add Time Slots</h3>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setTimeSlots([...timeSlots, { start_time: '09:00', end_time: '10:00' }])}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Slot
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {timeSlots.map((slot, index) => (
                        <div key={index} className="flex gap-2 items-end">
                          <div className="flex-1">
                            <label className="block text-xs font-medium mb-1">Start Time</label>
                            <input
                              type="time"
                              value={slot.start_time}
                              onChange={(e) => {
                                const newSlots = [...timeSlots];
                                newSlots[index].start_time = e.target.value;
                                setTimeSlots(newSlots);
                              }}
                              className="w-full px-2 py-2 border border-input rounded-md text-sm"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-medium mb-1">End Time</label>
                            <input
                              type="time"
                              value={slot.end_time}
                              onChange={(e) => {
                                const newSlots = [...timeSlots];
                                newSlots[index].end_time = e.target.value;
                                setTimeSlots(newSlots);
                              }}
                              className="w-full px-2 py-2 border border-input rounded-md text-sm"
                            />
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setTimeSlots(timeSlots.filter((_, i) => i !== index))}
                            className="h-9 w-9 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
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
                        <TableHead>Email</TableHead>
                        <TableHead>Time Slots</TableHead>
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
                          <TableCell className="max-w-[200px] truncate">{centre.email || '-'}</TableCell>
                          <TableCell className="text-sm">
                            {centreSlots[centre.id] && centreSlots[centre.id].length > 0 ? (
                              <div className="space-y-1">
                                {centreSlots[centre.id].slice(0, 2).map((slot, idx) => (
                                  <div key={idx} className="text-xs">
                                    {slot.start_time} - {slot.end_time}
                                  </div>
                                ))}
                                {centreSlots[centre.id].length > 2 && (
                                  <div className="text-xs text-muted-foreground">
                                    +{centreSlots[centre.id].length - 2} more
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
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
                    <div key={centre.id} className="bg-muted/50 rounded-lg border border-border overflow-hidden">
                      <div className="p-4 space-y-3">
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

                      {/* Time Slots Section */}
                      <div className="border-t border-border bg-background/50 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-sm">Time Slots</h4>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowSlotForm(showSlotForm === centre.id ? null : centre.id)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Slot
                          </Button>
                        </div>

                        {showSlotForm === centre.id && (
                          <div className="bg-muted p-3 rounded mb-3 space-y-2">
                            <div className="flex gap-2">
                              <input
                                type="time"
                                value={slotFormData.start_time}
                                onChange={(e) => setSlotFormData({ ...slotFormData, start_time: e.target.value })}
                                className="flex-1 px-2 py-1 text-sm border border-input rounded"
                              />
                              <input
                                type="time"
                                value={slotFormData.end_time}
                                onChange={(e) => setSlotFormData({ ...slotFormData, end_time: e.target.value })}
                                className="flex-1 px-2 py-1 text-sm border border-input rounded"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleAddSlot(centre.id)}
                                className="flex-1"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowSlotForm(null)}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}

                        {centreSlots[centre.id] && centreSlots[centre.id].length > 0 ? (
                          <div className="space-y-2">
                            {centreSlots[centre.id].map(slot => (
                              <div key={slot.id} className="flex items-center justify-between bg-background p-2 rounded text-xs border border-border">
                                <span className="font-medium">{slot.start_time}-{slot.end_time}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteSlot(slot.id, centre.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No time slots added yet</p>
                        )}
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
