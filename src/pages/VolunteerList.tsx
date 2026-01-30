import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  DropdownMenuSeparator,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Users, MoreVertical, Pencil, Calendar, Trash2, UserCheck, UserX, Upload, BookOpen, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BulkUploadDialog } from '@/components/volunteers/BulkUploadDialog';
import { SessionTypeDialog } from '@/components/sessions/SessionTypeDialog';
import { AddSessionDialog } from '@/components/sessions/AddSessionDialog';

interface Volunteer {
  id: string;
  organization_type: string;
  organization_name: string | null;
  name: string;
  personal_email: string | null;
  work_email: string | null;
  country: string | null;
  city: string | null;
  phone_number: string;
  linkedin_profile: string | null;
  is_active: boolean;
  regular_volunteering: boolean | null;
  frequency_per_month: number | null;
  interested_area: string | null;
  interested_topic: string | null;
  preferred_day: string | null;
  preferred_class: string | null;
  remarks: string | null;
  volunteer_status: string | null;
  created_at: string;
}

export default function VolunteerList() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [preferencesDialogOpen, setPreferencesDialogOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectedSessionType, setSelectedSessionType] = useState<'guest_teacher' | 'guest_speaker' | null>(null);
  const [preferencesData, setPreferencesData] = useState({
    regular_volunteering: false,
    frequency_per_month: 0,
    interested_area: '',
    interested_topic: '',
    preferred_day: '',
    preferred_class: '',
    remarks: '',
    volunteer_status: 'active',
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchVolunteers();
  }, []);

  async function fetchVolunteers() {
    try {
      const { data, error } = await supabase
        .from('volunteers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVolunteers(data || []);
    } catch (error) {
      console.error('Error fetching volunteers:', error);
      toast.error('Failed to load volunteers');
    } finally {
      setLoading(false);
    }
  }

  async function deleteVolunteer(id: string) {
    try {
      const { error } = await supabase.from('volunteers').delete().eq('id', id);
      if (error) throw error;
      toast.success('Volunteer deleted successfully');
      setVolunteers(volunteers.filter((v) => v.id !== id));
    } catch (error) {
      console.error('Error deleting volunteer:', error);
      toast.error('Failed to delete volunteer');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedVolunteer(null);
    }
  }

  async function toggleVolunteerStatus(volunteer: Volunteer) {
    try {
      const newStatus = !volunteer.is_active;
      const { error } = await supabase
        .from('volunteers')
        .update({ is_active: newStatus })
        .eq('id', volunteer.id);
      
      if (error) throw error;
      
      toast.success(`Volunteer ${newStatus ? 'activated' : 'deactivated'} successfully`);
      setVolunteers(volunteers.map((v) => 
        v.id === volunteer.id ? { ...v, is_active: newStatus } : v
      ));
    } catch (error) {
      console.error('Error updating volunteer status:', error);
      toast.error('Failed to update volunteer status');
    }
  }

  function getOrganizationDisplay(volunteer: Volunteer) {
    if (volunteer.organization_type === 'individual') {
      return 'Self';
    }
    return volunteer.organization_name || '-';
  }

  function getEmailDisplay(volunteer: Volunteer) {
    const emails = [];
    if (volunteer.work_email) emails.push(volunteer.work_email);
    if (volunteer.personal_email) emails.push(volunteer.personal_email);
    return emails.length > 0 ? emails.join(', ') : '-';
  }

  function getLocationDisplay(volunteer: Volunteer) {
    const parts = [];
    if (volunteer.city) parts.push(volunteer.city);
    if (volunteer.country) parts.push(volunteer.country);
    return parts.length > 0 ? parts.join(', ') : '-';
  }

  const handleAddSession = () => {
    setIsTypeDialogOpen(true);
  };

  const handleSessionTypeSelect = (type: 'guest_teacher' | 'guest_speaker') => {
    setSelectedSessionType(type);
    setIsFormDialogOpen(true);
  };

  const handleEditPreferences = (volunteer: Volunteer) => {
    setSelectedVolunteer(volunteer);
    setPreferencesData({
      regular_volunteering: volunteer.regular_volunteering || false,
      frequency_per_month: volunteer.frequency_per_month || 0,
      interested_area: volunteer.interested_area || '',
      interested_topic: volunteer.interested_topic || '',
      preferred_day: volunteer.preferred_day || '',
      preferred_class: volunteer.preferred_class || '',
      remarks: volunteer.remarks || '',
      volunteer_status: volunteer.volunteer_status || 'active',
    });
    setPreferencesDialogOpen(true);
  };

  const handleSavePreferences = async () => {
    if (!selectedVolunteer) return;

    try {
      const { error } = await supabase
        .from('volunteers')
        .update(preferencesData)
        .eq('id', selectedVolunteer.id);

      if (error) throw error;

      // Update local state
      setVolunteers(volunteers.map(v =>
        v.id === selectedVolunteer.id ? { ...v, ...preferencesData } : v
      ));

      toast.success('Volunteer preferences updated successfully');
      setPreferencesDialogOpen(false);
      setSelectedVolunteer(null);
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Volunteer List</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Manage your volunteers
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => setBulkUploadOpen(true)} className="w-full sm:w-auto">
              <Upload className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Bulk Upload</span>
              <span className="sm:hidden">Upload</span>
            </Button>
            <Button onClick={() => navigate('/volunteers/add')} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Volunteer</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Volunteers Table/Cards */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              All Volunteers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : volunteers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No volunteers yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Get started by adding your first volunteer
                </p>
                <Button onClick={() => navigate('/volunteers/add')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Volunteer
                </Button>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Personal Email</TableHead>
                        <TableHead>Work Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>LinkedIn</TableHead>
                        <TableHead>Regular Vol.</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Interested Area</TableHead>
                        <TableHead>Interested Topic</TableHead>
                        <TableHead>Preferred Day</TableHead>
                        <TableHead>Preferred Class</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[60px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {volunteers.map((volunteer) => (
                        <TableRow key={volunteer.id}>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {volunteer.organization_type}
                            </Badge>
                          </TableCell>
                          <TableCell>{getOrganizationDisplay(volunteer)}</TableCell>
                          <TableCell className="font-medium">{volunteer.name}</TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {volunteer.personal_email || '-'}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {volunteer.work_email || '-'}
                          </TableCell>
                          <TableCell>{volunteer.phone_number}</TableCell>
                          <TableCell>{volunteer.country || '-'}</TableCell>
                          <TableCell>{volunteer.city || '-'}</TableCell>
                          <TableCell>
                            {volunteer.linkedin_profile ? (
                              <a 
                                href={volunteer.linkedin_profile} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                View
                              </a>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={volunteer.regular_volunteering ? 'default' : 'secondary'}>
                              {volunteer.regular_volunteering ? 'Yes' : 'No'}
                            </Badge>
                          </TableCell>
                          <TableCell>{volunteer.frequency_per_month || '-'}</TableCell>
                          <TableCell className="max-w-[120px] truncate">{volunteer.interested_area || '-'}</TableCell>
                          <TableCell className="max-w-[120px] truncate">{volunteer.interested_topic || '-'}</TableCell>
                          <TableCell>{volunteer.preferred_day || '-'}</TableCell>
                          <TableCell>{volunteer.preferred_class || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={volunteer.is_active ? 'default' : 'secondary'}>
                              {volunteer.is_active ? 'Active' : 'Inactive'}
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
                                  onClick={() => navigate(`/volunteers/edit/${volunteer.id}`)}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleEditPreferences(volunteer)}
                                >
                                  <Settings className="h-4 w-4 mr-2" />
                                  Edit Preferences
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => navigate(`/calendar?assign=${volunteer.id}`)}
                                >
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Assign Session
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={handleAddSession}
                                  className="gap-2"
                                >
                                  <BookOpen className="h-4 w-4" />
                                  Add Session
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => toggleVolunteerStatus(volunteer)}
                                >
                                  {volunteer.is_active ? (
                                    <>
                                      <UserX className="h-4 w-4 mr-2" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="h-4 w-4 mr-2" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedVolunteer(volunteer);
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
                  {volunteers.map((volunteer) => (
                    <div key={volunteer.id} className="bg-muted/50 rounded-lg p-4 space-y-3 border border-border">
                      {/* Name and Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground break-words">{volunteer.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">ID: {volunteer.id.substring(0, 8)}</p>
                        </div>
                        <Badge variant={volunteer.is_active ? 'default' : 'secondary'} className="flex-shrink-0">
                          {volunteer.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      {/* Organization Type and Name */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground block">Type</span>
                          <Badge variant="outline" className="capitalize mt-1">
                            {volunteer.organization_type}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Organization</span>
                          <span className="font-medium text-sm break-words">{getOrganizationDisplay(volunteer)}</span>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="text-xs">
                        <span className="text-muted-foreground">Phone</span>
                        <p className="font-medium text-sm">{volunteer.phone_number}</p>
                      </div>

                      {/* Personal Email - Separate */}
                      {volunteer.personal_email && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Personal Email</span>
                          <p className="font-medium break-all text-sm">{volunteer.personal_email}</p>
                        </div>
                      )}

                      {/* Work Email - Separate */}
                      {volunteer.work_email && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Work Email</span>
                          <p className="font-medium break-all text-sm">{volunteer.work_email}</p>
                        </div>
                      )}

                      {/* Country - Separate */}
                      {volunteer.country && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Country</span>
                          <p className="font-medium text-sm">{volunteer.country}</p>
                        </div>
                      )}

                      {/* City - Separate */}
                      {volunteer.city && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">City</span>
                          <p className="font-medium text-sm">{volunteer.city}</p>
                        </div>
                      )}

                      {/* LinkedIn */}
                      {volunteer.linkedin_profile && (
                        <div className="text-xs">
                          <a 
                            href={volunteer.linkedin_profile} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium"
                          >
                            View LinkedIn Profile →
                          </a>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-border">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/volunteers/edit/${volunteer.id}`)}
                          className="flex-1"
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/calendar?assign=${volunteer.id}`)}
                          className="flex-1"
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          Assign
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem
                              onClick={handleAddSession}
                              className="gap-2"
                            >
                              <BookOpen className="h-4 w-4" />
                              Add Session
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => toggleVolunteerStatus(volunteer)}
                            >
                              {volunteer.is_active ? (
                                <>
                                  <UserX className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedVolunteer(volunteer);
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
            <AlertDialogTitle>Delete Volunteer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedVolunteer?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedVolunteer && deleteVolunteer(selectedVolunteer.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Add Session Dialog - Type Selection */}
      <SessionTypeDialog
        open={isTypeDialogOpen}
        onOpenChange={setIsTypeDialogOpen}
        onSelectType={handleSessionTypeSelect}
      />

      {/* Add Session Dialog - Form */}
      <AddSessionDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        selectedDate={new Date()}
        sessionType={selectedSessionType}
        onSuccess={fetchVolunteers}
      />

      {/* Bulk Upload Dialog */}
      <BulkUploadDialog
        open={bulkUploadOpen}
        onOpenChange={setBulkUploadOpen}
        onSuccess={fetchVolunteers}
      />

      {/* Edit Preferences Dialog */}
      <Dialog open={preferencesDialogOpen} onOpenChange={setPreferencesDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Volunteer Preferences</DialogTitle>
            <DialogDescription>
              Update volunteering preferences for {selectedVolunteer?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Regular Volunteering */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="regular_volunteering"
                checked={preferencesData.regular_volunteering}
                onCheckedChange={(checked) =>
                  setPreferencesData({ ...preferencesData, regular_volunteering: checked as boolean })
                }
              />
              <Label htmlFor="regular_volunteering" className="text-sm font-medium cursor-pointer">
                Regular Volunteering
              </Label>
            </div>

            {/* Frequency per Month */}
            <div>
              <Label htmlFor="frequency" className="text-sm font-medium mb-2 block">
                Frequency of Volunteering in a Month
              </Label>
              <Input
                id="frequency"
                type="number"
                min="0"
                value={preferencesData.frequency_per_month}
                onChange={(e) =>
                  setPreferencesData({ ...preferencesData, frequency_per_month: parseInt(e.target.value) || 0 })
                }
                placeholder="e.g., 2"
              />
            </div>

            {/* Interested Area */}
            <div>
              <Label htmlFor="interested_area" className="text-sm font-medium mb-2 block">
                Interested Area
              </Label>
              <Input
                id="interested_area"
                value={preferencesData.interested_area}
                onChange={(e) =>
                  setPreferencesData({ ...preferencesData, interested_area: e.target.value })
                }
                placeholder="e.g., Technology, Education"
              />
            </div>

            {/* Interested Topic */}
            <div>
              <Label htmlFor="interested_topic" className="text-sm font-medium mb-2 block">
                Interested Topic
              </Label>
              <Input
                id="interested_topic"
                value={preferencesData.interested_topic}
                onChange={(e) =>
                  setPreferencesData({ ...preferencesData, interested_topic: e.target.value })
                }
                placeholder="e.g., AI, Web Development"
              />
            </div>

            {/* Preferred Day */}
            <div>
              <Label htmlFor="preferred_day" className="text-sm font-medium mb-2 block">
                Preferred Day
              </Label>
              <Select value={preferencesData.preferred_day} onValueChange={(value) =>
                setPreferencesData({ ...preferencesData, preferred_day: value })
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="Monday">Monday</SelectItem>
                  <SelectItem value="Tuesday">Tuesday</SelectItem>
                  <SelectItem value="Wednesday">Wednesday</SelectItem>
                  <SelectItem value="Thursday">Thursday</SelectItem>
                  <SelectItem value="Friday">Friday</SelectItem>
                  <SelectItem value="Saturday">Saturday</SelectItem>
                  <SelectItem value="Sunday">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preferred Class */}
            <div>
              <Label htmlFor="preferred_class" className="text-sm font-medium mb-2 block">
                Preferred Class
              </Label>
              <Input
                id="preferred_class"
                value={preferencesData.preferred_class}
                onChange={(e) =>
                  setPreferencesData({ ...preferencesData, preferred_class: e.target.value })
                }
                placeholder="e.g., Class 7, Class 8"
              />
            </div>

            {/* Remarks */}
            <div>
              <Label htmlFor="remarks" className="text-sm font-medium mb-2 block">
                Any Remark
              </Label>
              <Textarea
                id="remarks"
                value={preferencesData.remarks}
                onChange={(e) =>
                  setPreferencesData({ ...preferencesData, remarks: e.target.value })
                }
                placeholder="Add any remarks or notes"
                className="min-h-[80px]"
              />
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status" className="text-sm font-medium mb-2 block">
                Status
              </Label>
              <Select value={preferencesData.volunteer_status} onValueChange={(value) =>
                setPreferencesData({ ...preferencesData, volunteer_status: value })
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreferencesDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreferences}>
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
