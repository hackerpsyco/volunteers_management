import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Clock } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Centre {
  id: string;
  name: string;
  location: string;
  address: string;
  phone: string;
  email: string;
  capacity: number;
  status: string;
  created_at: string;
}

interface TimeSlot {
  id: string;
  centre_id: string;
  day: string;
  start_time: string;
  end_time: string;
  capacity: number;
}

export default function Centres() {
  const [centres, setCentres] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCentreId, setSelectedCentreId] = useState<string | null>(null);
  const [showTimeSlotForm, setShowTimeSlotForm] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    address: '',
    phone: '',
    email: '',
    capacity: 0,
    status: 'active',
  });
  const [timeSlotData, setTimeSlotData] = useState({
    day: 'Monday',
    start_time: '09:00',
    end_time: '17:00',
    capacity: 0,
  });

  useEffect(() => {
    fetchCentres();
  }, []);

  const fetchCentres = async () => {
    try {
      setLoading(true);
      // Since centres table might not exist in Supabase types, we'll handle this gracefully
      const { data, error } = await supabase
        .from('centres' as any)
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.warn('Centres table not found:', error);
        setCentres([]);
      } else {
        setCentres(data || []);
      }
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
          .from('centres' as any)
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Centre updated successfully');
      } else {
        const { error } = await supabase
          .from('centres' as any)
          .insert([formData] as any);

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

  const handleAddTimeSlot = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCentreId) {
      toast.error('Please select a centre');
      return;
    }

    try {
      const { error } = await supabase
        .from('centre_time_slots' as any)
        .insert([{
          centre_id: selectedCentreId,
          ...timeSlotData,
        }] as any);

      if (error) throw error;
      toast.success('Time slot added successfully');
      setTimeSlotData({
        day: 'Monday',
        start_time: '09:00',
        end_time: '17:00',
        capacity: 0,
      });
      setShowTimeSlotForm(false);
      fetchTimeSlots(selectedCentreId);
    } catch (error) {
      console.error('Error adding time slot:', error);
      toast.error('Failed to add time slot');
    }
  };

  const fetchTimeSlots = async (centreId: string) => {
    try {
      const { data, error } = await supabase
        .from('centre_time_slots' as any)
        .select('*')
        .eq('centre_id', centreId);

      if (error) {
        console.warn('Time slots table not found:', error);
        setTimeSlots([]);
      } else {
        setTimeSlots(data || []);
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this centre?')) return;

    try {
      const { error } = await supabase
        .from('centres' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Centre deleted successfully');
      fetchCentres();
    } catch (error) {
      console.error('Error deleting centre:', error);
      toast.error('Failed to delete centre');
    }
  };

  const handleEdit = (centre: Centre) => {
    setFormData({
      name: centre.name,
      location: centre.location,
      address: centre.address,
      phone: centre.phone,
      email: centre.email,
      capacity: centre.capacity,
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
      capacity: 0,
      status: 'active',
    });
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8">
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
            <span className="hidden sm:inline">New Centre</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-card border border-border rounded-lg p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-4">
              {editingId ? 'Edit Centre' : 'Add New Centre'}
            </h2>
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
                  <label className="block text-sm font-medium mb-1">Capacity</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Max capacity"
                    min="0"
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
          </div>
        )}

        {/* Centres List */}
        <div className="space-y-3 md:space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : centres.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <p className="text-sm md:text-base text-muted-foreground">No centres yet. Add one to get started!</p>
            </div>
          ) : (
            centres.map((centre) => (
              <div key={centre.id} className="bg-card border border-border rounded-lg p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-semibold text-foreground">{centre.name}</h3>
                    <div className="flex flex-wrap gap-2 md:gap-4 mt-2 text-xs md:text-sm text-muted-foreground">
                      <span className="whitespace-nowrap">📍 {centre.location}</span>
                      {centre.phone && <span className="whitespace-nowrap">📱 {centre.phone}</span>}
                      {centre.email && <span className="break-all">📧 {centre.email}</span>}
                    </div>
                    {centre.address && (
                      <div className="mt-2 text-xs md:text-sm">
                        <span className="text-muted-foreground">Address: </span>
                        <span className="font-medium break-words">{centre.address}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-4 mt-2 text-xs md:text-sm">
                      <span className="text-muted-foreground">Capacity: {centre.capacity} people</span>
                      <span className={`px-2 py-1 rounded-full ${centre.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {centre.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(centre)}
                      className="gap-1 flex-1 md:flex-none"
                    >
                      <Edit2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(centre.id)}
                      className="gap-1 flex-1 md:flex-none"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </div>
                </div>

                {/* Time Slots Section */}
                <div className="border-t border-border pt-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm md:text-base font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Session Time Slots
                    </h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCentreId(centre.id);
                        setShowTimeSlotForm(!showTimeSlotForm);
                        fetchTimeSlots(centre.id);
                      }}
                      className="gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Add Slot
                    </Button>
                  </div>

                  {/* Time Slot Form */}
                  {showTimeSlotForm && selectedCentreId === centre.id && (
                    <form onSubmit={handleAddTimeSlot} className="bg-muted/50 rounded-lg p-3 md:p-4 mb-3 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs md:text-sm font-medium mb-1">Day *</label>
                          <select
                            value={timeSlotData.day}
                            onChange={(e) => setTimeSlotData({ ...timeSlotData, day: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            {days.map(day => (
                              <option key={day} value={day}>{day}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs md:text-sm font-medium mb-1">Start Time *</label>
                          <input
                            type="time"
                            value={timeSlotData.start_time}
                            onChange={(e) => setTimeSlotData({ ...timeSlotData, start_time: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs md:text-sm font-medium mb-1">End Time *</label>
                          <input
                            type="time"
                            value={timeSlotData.end_time}
                            onChange={(e) => setTimeSlotData({ ...timeSlotData, end_time: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs md:text-sm font-medium mb-1">Capacity</label>
                          <input
                            type="number"
                            value={timeSlotData.capacity}
                            onChange={(e) => setTimeSlotData({ ...timeSlotData, capacity: parseInt(e.target.value) })}
                            className="w-full px-2 py-1 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Slot capacity"
                            min="0"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" size="sm">Add Time Slot</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => setShowTimeSlotForm(false)}>Cancel</Button>
                      </div>
                    </form>
                  )}

                  {/* Time Slots List */}
                  {selectedCentreId === centre.id && timeSlots.length > 0 && (
                    <div className="space-y-2">
                      {timeSlots.map((slot) => (
                        <div key={slot.id} className="bg-muted/30 rounded-lg p-2 md:p-3 flex justify-between items-center text-xs md:text-sm">
                          <span className="font-medium">{slot.day}: {slot.start_time} - {slot.end_time}</span>
                          <span className="text-muted-foreground">Capacity: {slot.capacity}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
