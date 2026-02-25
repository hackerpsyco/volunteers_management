import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { GraduationCap, Calendar } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { VolunteerSelector } from './VolunteerSelector';

interface CurriculumItem {
  id: string;
  content_category: string;
  module_no: number;
  module_name: string;
  topics_covered: string;
  videos: string;
  quiz_content_ppt: string;
}

interface Session {
  id: string;
  title: string;
  session_date: string;
  session_time: string;
  content_category?: string;
  module_name?: string;
  topics_covered?: string;
  videos?: string;
  quiz_content_ppt?: string;
  facilitator_name?: string;
  volunteer_name?: string;
  coordinator_name?: string;
  meeting_link?: string;
  centre_id?: string;
  centre_time_slot_id?: string;
  class_batch?: string;
  volunteer_id?: string;
  coordinator_id?: string;
  session_type_option?: string;
}

interface Centre {
  id: string;
  name: string;
  location: string;
}

interface CentreTimeSlot {
  id: string;
  centre_id: string;
  day: string;
  start_time: string;
  end_time: string;
}

interface Volunteer {
  id: string;
  name: string;
  personal_email: string;
  work_email: string;
  phone_number: string;
  organization_name: string;
}

interface Facilitator {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: string;
}

interface Coordinator {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: string;
}

interface EditSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
  onSuccess: () => void;
}

export function EditSessionDialog({
  open,
  onOpenChange,
  session,
  onSuccess,
}: EditSessionDialogProps) {
  const [formData, setFormData] = useState<Session | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [topics, setTopics] = useState<CurriculumItem[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [centreSlots, setCentreSlots] = useState<CentreTimeSlot[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [facilitators, setFacilitators] = useState<Facilitator[]>([]);
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<CurriculumItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (session && open) {
      setFormData(session);
      fetchAllData();
    }
  }, [session, open]);

  useEffect(() => {
    if (formData?.class_batch && classes.length > 0) {
      const classObj = classes.find(c => c.name === formData.class_batch);
      if (classObj) {
        setSelectedClassId(classObj.id);
        fetchCategories(classObj.id);
        setModules([]);
        setTopics([]);
      }
    }
  }, [formData?.class_batch, classes]);

  useEffect(() => {
    if (formData?.content_category && selectedClassId) {
      fetchModules(formData.content_category, selectedClassId);
      setTopics([]);
    }
  }, [formData?.content_category, selectedClassId]);

  useEffect(() => {
    if (formData?.content_category && formData?.module_name && selectedClassId) {
      fetchTopics(formData.content_category, formData.module_name, selectedClassId);
    }
  }, [formData?.content_category, formData?.module_name, selectedClassId]);

  useEffect(() => {
    if (formData?.centre_id) {
      fetchCentreSlots(formData.centre_id);
    }
  }, [formData?.centre_id]);

  const fetchAllData = async () => {
    try {
      const [centresRes, classesRes, volunteersRes, facilitatorsRes, coordinatorsRes] = await Promise.all([
        supabase.from('centres').select('id, name, location').eq('status', 'active'),
        supabase.from('classes').select('id, name').order('name', { ascending: true }),
        supabase.from('volunteers').select('id, name, personal_email, work_email, phone_number, organization_name').eq('is_active', true).order('name', { ascending: true }),
        supabase.from('facilitators').select('id, name, email, phone, location, status').eq('status', 'active').order('name', { ascending: true }),
        supabase.from('coordinators').select('id, name, email, phone, location, status').eq('status', 'active').order('name', { ascending: true }),
      ]);

      setCentres(centresRes.data || []);
      setClasses(classesRes.data || []);
      setVolunteers(volunteersRes.data || []);
      setFacilitators(facilitatorsRes.data || []);
      setCoordinators(coordinatorsRes.data || []);

      // Set selectedClassId if session has class_batch
      if (session?.class_batch && classesRes.data) {
        const classObj = classesRes.data.find(c => c.name === session.class_batch);
        if (classObj) {
          setSelectedClassId(classObj.id);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchCategories = async (classId?: string) => {
    try {
      let query: any = supabase
        .from('curriculum')
        .select('content_category')
        .not('content_category', 'is', null);

      if (classId) {
        query = query.eq('class_id', classId);
      }

      const { data, error } = await query;

      if (error) throw error;
      const uniqueCategories = [...new Set(data?.map(item => item.content_category) || [])];
      setCategories(uniqueCategories as string[]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchModules = async (category: string, classId?: string) => {
    try {
      let query: any = supabase
        .from('curriculum')
        .select('module_name')
        .eq('content_category', category)
        .not('module_name', 'is', null);

      if (classId) {
        query = query.eq('class_id', classId);
      }

      let { data, error } = await query;

      if (error) throw error;

      // If no data with class_id filter, try without it (fallback for NULL class_id)
      if ((!data || data.length === 0) && classId) {
        const fallbackQuery = supabase
          .from('curriculum')
          .select('module_name')
          .eq('content_category', category)
          .not('module_name', 'is', null);
        
        const { data: fallbackData, error: fallbackError } = await fallbackQuery;
        if (fallbackError) throw fallbackError;
        data = fallbackData;
      }

      const uniqueModules = [...new Set(data?.map(item => item.module_name) || [])];
      setModules(uniqueModules as string[]);
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const fetchTopics = async (category: string, moduleName: string, classId?: string) => {
    try {
      let query: any = supabase
        .from('curriculum')
        .select('*')
        .eq('content_category', category)
        .eq('module_name', moduleName)
        .order('topics_covered', { ascending: true });

      if (classId) {
        query = query.eq('class_id', classId);
      }

      let { data, error } = await query;

      if (error) throw error;

      // If no data with class_id filter, try without it (fallback for NULL class_id)
      if ((!data || data.length === 0) && classId) {
        const fallbackQuery = supabase
          .from('curriculum')
          .select('*')
          .eq('content_category', category)
          .eq('module_name', moduleName)
          .order('topics_covered', { ascending: true });
        
        const { data: fallbackData, error: fallbackError } = await fallbackQuery;
        if (fallbackError) throw fallbackError;
        data = fallbackData;
      }

      setTopics(data || []);
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  const fetchCentreSlots = async (centreId: string) => {
    try {
      const { data } = await supabase
        .from('centre_time_slots')
        .select('id, centre_id, day, start_time, end_time')
        .eq('centre_id', centreId)
        .order('day', { ascending: true })
        .order('start_time', { ascending: true });

      setCentreSlots(data || []);
    } catch (error) {
      console.error('Error fetching centre slots:', error);
    }
  };

  const handleTopicSelect = (topicId: string) => {
    const topic = topics.find(t => t.id === topicId);
    if (topic) {
      setSelectedTopic(topic);
      setFormData(prev => prev ? {
        ...prev,
        module_name: topic.module_name || '',
        topics_covered: topic.topics_covered || '',
        videos: topic.videos || '',
        quiz_content_ppt: topic.quiz_content_ppt || '',
        title: topic.topics_covered || '',
      } : null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setIsLoading(true);

    try {
      // Get the time from the selected time slot
      const selectedSlot = centreSlots.find(s => s.id === formData.centre_time_slot_id);
      const sessionTime = selectedSlot?.start_time || formData.session_time;

      const { error } = await supabase
        .from('sessions')
        .update({
          title: formData.title,
          session_date: formData.session_date,
          session_time: sessionTime,
          content_category: formData.content_category,
          module_name: formData.module_name,
          topics_covered: formData.topics_covered,
          videos: formData.videos,
          quiz_content_ppt: formData.quiz_content_ppt,
          class_batch: formData.class_batch,
          centre_id: formData.centre_id,
          centre_time_slot_id: formData.centre_time_slot_id,
          session_type_option: formData.session_type_option,
          status: 'pending',
        })
        .eq('id', formData.id);

      if (error) throw error;

      // Try to update Google Calendar
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        const selectedSlot = centreSlots.find(s => s.id === formData.centre_time_slot_id);
        const sessionTime = selectedSlot?.start_time || formData.session_time;
        const startDateTime = new Date(`${formData.session_date}T${sessionTime}`);
        const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

        // Get volunteer and facilitator emails
        const volunteerData = volunteers.find(v => v.id === formData.volunteer_id);
        const facilitatorData = facilitators.find(f => f.name === formData.facilitator_name);
        const coordinatorData = coordinators.find(c => c.id === formData.coordinator_id);

        await fetch(`${supabaseUrl}/functions/v1/sync-google-calendar`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            sessionId: formData.id,
            title: formData.title,
            description: `
📚 CONTENT INFORMATION

Category:    ${formData.content_category || 'N/A'}
Module:      ${formData.module_name || 'N/A'}
Topic:       ${formData.topics_covered || 'N/A'}
Session Type: ${formData.session_type_option === 'fresh' ? '🆕 Fresh Session' : '🔄 Revision Session'}

📎 RESOURCES

${formData.videos ? `📹 Videos: ${formData.videos}` : ''}
${formData.quiz_content_ppt ? `📊 PPT/Quiz: ${formData.quiz_content_ppt}` : ''}

Session updated with new details.
            `.trim(),
            startDateTime: startDateTime.toISOString(),
            endDateTime: endDateTime.toISOString(),
            volunteerEmails: [
              volunteerData?.personal_email,
              volunteerData?.work_email
            ].filter(email => email && email.trim()),
            facilitatorEmail: facilitatorData?.email || '',
            coordinatorEmail: coordinatorData?.email || '',
          }),
        });
      } catch (calendarError) {
        console.warn('Could not update Google Calendar:', calendarError);
      }

      toast({
        title: 'Success',
        description: 'Session updated successfully',
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error updating session:', error);
      toast({
        title: 'Error',
        description: 'Failed to update session',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!formData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[600px] md:max-w-[700px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-lg sm:text-xl">
            <GraduationCap className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span className="break-words">Edit Session</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="session_date" className="text-sm sm:text-base">Session Date *</Label>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <Input
                id="session_date"
                type="date"
                value={formData.session_date}
                onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                className="text-sm sm:text-base"
                required
              />
            </div>
          </div>

          {/* Volunteer Selection */}
          <div className="space-y-2">
            <Label htmlFor="volunteer" className="text-sm sm:text-base">Select Volunteer *</Label>
            {volunteers.length === 0 ? (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs sm:text-sm text-yellow-800">
                No active volunteers available.
              </div>
            ) : (
              <VolunteerSelector
                volunteers={volunteers}
                selectedVolunteer={formData.volunteer_id || ''}
                onSelectVolunteer={(volunteerId, volunteerName) => {
                  setFormData({ ...formData, volunteer_id: volunteerId, volunteer_name: volunteerName });
                }}
                placeholder="Choose a volunteer..."
              />
            )}
          </div>

          {/* Facilitator Selection */}
          <div className="space-y-2">
            <Label htmlFor="facilitator" className="text-sm sm:text-base">Select Facilitator *</Label>
            <Select value={formData.facilitator_name || ''} onValueChange={(value) => {
              const facilitator = facilitators.find(f => f.name === value);
              if (facilitator) {
                setFormData({ ...formData, facilitator_name: facilitator.name });
              }
            }}>
              <SelectTrigger className="text-sm sm:text-base">
                <SelectValue placeholder="Choose a facilitator" />
              </SelectTrigger>
              <SelectContent>
                {facilitators.map((facilitator) => (
                  <SelectItem key={facilitator.id} value={facilitator.name}>
                    {facilitator.name} ({facilitator.location})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Coordinator Selection */}
          <div className="space-y-2">
            <Label htmlFor="coordinator" className="text-sm sm:text-base">Select Coordinator *</Label>
            <Select value={formData.coordinator_id || ''} onValueChange={(value) => {
              const coordinator = coordinators.find(c => c.id === value);
              if (coordinator) {
                setFormData({ ...formData, coordinator_id: value, coordinator_name: coordinator.name });
              }
            }}>
              <SelectTrigger className="text-sm sm:text-base">
                <SelectValue placeholder="Choose a coordinator" />
              </SelectTrigger>
              <SelectContent>
                {coordinators.map((coordinator) => (
                  <SelectItem key={coordinator.id} value={coordinator.id}>
                    {coordinator.name} ({coordinator.location})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Class Selection - FIRST */}
          <div className="border-t border-border pt-4">
            <h4 className="font-medium text-sm sm:text-base text-foreground mb-3">Select Class & Content</h4>
            
            <div className="space-y-2 mb-4">
              <Label htmlFor="class_batch" className="text-sm sm:text-base">Class *</Label>
              <Select value={formData.class_batch || ''} onValueChange={(value) => setFormData({ ...formData, class_batch: value })}>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.name}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Content Selection */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="category" className="text-sm sm:text-base">Content Category *</Label>
              <Select value={formData.content_category || ''} onValueChange={(value) => {
                setFormData({ ...formData, content_category: value, module_name: '', topics_covered: '' });
                setSelectedTopic(null);
              }}>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="Select a content category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.content_category && modules.length > 0 && (
              <div className="space-y-2 mb-4">
                <Label htmlFor="module" className="text-sm sm:text-base">Module Name *</Label>
                <Select value={formData.module_name || ''} onValueChange={(value) => {
                  setFormData({ ...formData, module_name: value, topics_covered: '' });
                  setSelectedTopic(null);
                }}>
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Select a module" />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((module) => (
                      <SelectItem key={module} value={module}>
                        {module}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.module_name && topics.length > 0 && (
              <div className="space-y-2 mb-4">
                <Label htmlFor="topic" className="text-sm sm:text-base">Select Topic *</Label>
                <Select value={selectedTopic?.id || ''} onValueChange={handleTopicSelect}>
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Choose a topic to auto-fill fields" />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.topics_covered}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Content Details */}
          <div className="border-t border-border pt-4">
            <h4 className="font-medium text-sm sm:text-base text-foreground mb-3">Content Details {selectedTopic && '(Auto-filled)'}</h4>
            
            <div className="space-y-2 mb-4">
              <Label htmlFor="session_type_option" className="text-sm sm:text-base">Session Type Option *</Label>
              <Select value={formData.session_type_option || 'fresh'} onValueChange={(value) => setFormData({ ...formData, session_type_option: value })}>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="Select session type option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fresh">Fresh</SelectItem>
                  <SelectItem value="revision">Revision</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 mb-4">
              <Label htmlFor="title" className="text-sm sm:text-base">Title *</Label>
              <Input
                id="title"
                placeholder="Session title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="text-sm sm:text-base"
                required
              />
            </div>

            <div className="space-y-2 mb-4">
              <Label htmlFor="videos" className="text-sm sm:text-base">Videos</Label>
              <Input
                id="videos"
                placeholder="Video links or references"
                value={formData.videos || ''}
                onChange={(e) => setFormData({ ...formData, videos: e.target.value })}
                disabled={!!selectedTopic}
                className="text-sm sm:text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quiz_content_ppt" className="text-sm sm:text-base">Quiz/Content PPT</Label>
              <Input
                id="quiz_content_ppt"
                placeholder="Quiz or content PPT link"
                value={formData.quiz_content_ppt || ''}
                onChange={(e) => setFormData({ ...formData, quiz_content_ppt: e.target.value })}
                disabled={!!selectedTopic}
                className="text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Centre & Time Slot Selection */}
          <div className="border-t border-border pt-4">
            <h4 className="font-medium text-sm sm:text-base text-foreground mb-3">Select Centre & Time Slot</h4>
            
            <div className="space-y-2 mb-4">
              <Label htmlFor="centre" className="text-sm sm:text-base">Centre *</Label>
              <Select value={formData.centre_id || ''} onValueChange={(value) => {
                setFormData({ ...formData, centre_id: value, centre_time_slot_id: '' });
              }}>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="Choose a centre" />
                </SelectTrigger>
                <SelectContent>
                  {centres.map((centre) => (
                    <SelectItem key={centre.id} value={centre.id}>
                      {centre.name} ({centre.location})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.centre_id && centreSlots.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="slot" className="text-sm sm:text-base">Time Slot *</Label>
                <Select value={formData.centre_time_slot_id || ''} onValueChange={(value) => setFormData({ ...formData, centre_time_slot_id: value })}>
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Choose a time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {centreSlots.map((slot) => (
                      <SelectItem key={slot.id} value={slot.id}>
                        {slot.start_time} to {slot.end_time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto text-sm sm:text-base">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto text-sm sm:text-base">
              {isLoading ? 'Updating...' : 'Update Session'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
