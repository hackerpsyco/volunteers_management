import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Facilitator {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  experience_years: number;
  status: string;
  created_at: string;
}

export default function Facilitators() {
  const [facilitators, setFacilitators] = useState<Facilitator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    experience_years: 0,
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
    if (!confirm('Are you sure you want to delete this facilitator?')) return;

    try {
      const { error } = await supabase
        .from('facilitators')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Facilitator deleted successfully');
      fetchFacilitators();
    } catch (error) {
      console.error('Error deleting facilitator:', error);
      toast.error('Failed to delete facilitator');
    }
  };

  const handleEdit = (facilitator: Facilitator) => {
    setFormData({
      name: facilitator.name,
      email: facilitator.email,
      phone: facilitator.phone,
      specialization: facilitator.specialization,
      experience_years: facilitator.experience_years,
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
      specialization: '',
      experience_years: 0,
      status: 'active',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Facilitators</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Manage facilitators and instructors
            </p>
          </div>
          {/* <Button
            onClick={() => setShowForm(!showForm)}
            className="gap-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Facilitator</span>
            <span className="sm:hidden">Add</span>
          </Button> */}
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-card border border-border rounded-lg p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-4">
              {editingId ? 'Edit Facilitator' : 'Add New Facilitator'}
            </h2>
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
                  <label className="block text-sm font-medium mb-1">Specialization</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Area of expertise"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    value={formData.experience_years}
                    onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
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
                  {editingId ? 'Update Facilitator' : 'Add Facilitator'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Facilitators List */}
        <div className="space-y-3 md:space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : facilitators.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <p className="text-sm md:text-base text-muted-foreground">No facilitators yet. Add one to get started!</p>
            </div>
          ) : (
            facilitators.map((facilitator) => (
              <div key={facilitator.id} className="bg-card border border-border rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-semibold text-foreground">{facilitator.name}</h3>
                    <div className="flex flex-wrap gap-2 md:gap-4 mt-2 text-xs md:text-sm text-muted-foreground">
                      <span className="break-all">📧 {facilitator.email}</span>
                      {facilitator.phone && <span className="whitespace-nowrap">📱 {facilitator.phone}</span>}
                    </div>
                    {facilitator.specialization && (
                      <div className="mt-2 text-xs md:text-sm">
                        <span className="text-muted-foreground">Specialization: </span>
                        <span className="font-medium">{facilitator.specialization}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-4 mt-2 text-xs md:text-sm">
                      <span className="text-muted-foreground">Experience: {facilitator.experience_years} years</span>
                      <span className={`px-2 py-1 rounded-full ${facilitator.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {facilitator.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(facilitator)}
                      className="gap-1 flex-1 md:flex-none"
                    >
                      <Edit2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(facilitator.id)}
                      className="gap-1 flex-1 md:flex-none"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
