import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { GraduationCap, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { VolunteerSelector } from './VolunteerSelector';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CurriculumItem {
  id: string;
  content_category: string;
  module_no: number;
  module_name: string;
  topics_covered: string;
  videos: string;
  quiz_content_ppt: string;
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

interface Centre {
  id: string;
  name: string;
  location: string;
  email: string | null;     // ✅ ADDED
}

interface Class {
  id: string;
  name: string;
  email: string | null;     // ✅ ADDED
}

interface CentreTimeSlot {
  id: string;
  centre_id: string;
  day: string;
  start_time: string;
  end_time: string;
}

interface AddSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date | null;
  onSuccess: () => void;
  sessionType?: 'guest_teacher' | 'guest_speaker';
}

export function AddSessionDialog({ 
  open, 
  onOpenChange, 
  selectedDate: propSelectedDate,
  onSuccess,
  sessionType = 'guest_teacher'
}: AddSessionDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(propSelectedDate || null);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [facilitators, setFacilitators] = useState<Facilitator[]>([]);
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [modules, setModules] = useState<Array<{ no: number; name: string }>>([]);
  const [topics, setTopics] = useState<CurriculumItem[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [centreSlots, setCentreSlots] = useState<CentreTimeSlot[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState<string>('');
  const [selectedFacilitator, setSelectedFacilitator] = useState<string>('');
  const [selectedCoordinator, setSelectedCoordinator] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<CurriculumItem | null>(null);
  const [selectedCentre, setSelectedCentre] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    custom_title: '',
    content_category: '',
    module_name: '',
    topics_covered: '',
    videos: '',
    quiz_content_ppt: '',
    volunteer_name: '',
    facilitator_name: '',
    coordinator_name: '',
    session_type_option: 'fresh',
    class_batch: '',
  });
  const { user } = useAuth();
  const { toast } = useToast();

  // Update selected date when prop changes
  useEffect(() => {
    if (propSelectedDate) {
      setSelectedDate(propSelectedDate);
    }
  }, [propSelectedDate, open]);

  // Load data on open
  useEffect(() => {
    if (open) {
      fetchVolunteers();
      fetchFacilitators();
      fetchCoordinators();
      fetchClasses();
      fetchCentres();
    }
  }, [open]);

  // Load categories when class changes
  useEffect(() => {
    console.log('useEffect: selectedClass changed to:', selectedClass);
    if (selectedClass) {
      console.log('Calling fetchCategories with:', selectedClass);
      fetchCategories(selectedClass);
      setSelectedCategory('');
      setSelectedModule('');
      setTopics([]);
    }
  }, [selectedClass]);

  // Load modules when category changes
  useEffect(() => {
    console.log('useEffect: selectedCategory changed to:', selectedCategory, 'selectedClass:', selectedClass);
    if (selectedCategory && selectedClass) {
      console.log('Calling fetchModules with:', selectedCategory, selectedClass);
      fetchModules(selectedCategory, selectedClass);
      setSelectedModule('');
      setTopics([]);
    }
  }, [selectedCategory, selectedClass]);

  // Load topics when module changes
  useEffect(() => {
    console.log('useEffect: selectedModule changed to:', selectedModule, 'selectedCategory:', selectedCategory, 'selectedClass:', selectedClass);
    if (selectedCategory && selectedModule && selectedClass) {
      console.log('Calling fetchTopics with:', selectedCategory, selectedModule, selectedClass);
      fetchTopics(selectedCategory, selectedModule, selectedClass);
    }
  }, [selectedCategory, selectedModule, selectedClass]);

  // Load centre slots when centre changes
  useEffect(() => {
    if (selectedCentre) {
      fetchCentreSlots(selectedCentre);
      setSelectedSlot('');
    }
  }, [selectedCentre]);

  const fetchVolunteers = async () => {
    try {
      const { data, error } = await supabase
        .from('volunteers')
        .select('id, name, personal_email, work_email, phone_number, organization_name')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setVolunteers(data || []);
    } catch (error) {
      console.error('Error fetching volunteers:', error);
      setVolunteers([]);
    }
  };

  const fetchFacilitators = async () => {
    try {
      const { data, error } = await supabase
        .from('facilitators')
        .select('id, name, email, phone, location, status')
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (error) throw error;
      setFacilitators(data || []);
    } catch (error) {
      console.error('Error fetching facilitators:', error);
      setFacilitators([]);
    }
  };

  const fetchCoordinators = async () => {
    try {
      const { data, error } = await supabase
        .from('coordinators')
        .select('id, name, email, phone, location, status')
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (error) throw error;
      setCoordinators(data || []);
    } catch (error) {
      console.error('Error fetching coordinators:', error);
      setCoordinators([]);
    }
  };

  const fetchCategories = async (classId?: string) => {
    try {
      console.log('fetchCategories called with classId:', classId);
      // Fetch categories for the selected class
      let query: any = supabase
        .from('curriculum')
        .select('content_category')
        .not('content_category', 'is', null);

      // Filter by class if provided
      if (classId) {
        query = query.eq('class_id', classId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('fetchCategories error:', error);
        throw error;
      }
      console.log('fetchCategories data length:', data?.length);
      const uniqueCategories = [...new Set(data?.map(item => item.content_category) || [])];
      console.log('uniqueCategories:', uniqueCategories);
      setCategories(uniqueCategories as string[]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name,email')
        .order('name', { ascending: true });

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setClasses([]);
    }
  };

  const fetchModules = async (category: string, classId?: string) => {
    try {
      console.log('fetchModules called with category:', category, 'classId:', classId);
      // Fetch modules for the selected category and class
      let query: any = supabase
        .from('curriculum')
        .select('module_name')
        .eq('content_category', category)
        .not('module_name', 'is', null);

      // Filter by class if provided AND class_id is not null in database
      if (classId) {
        console.log('Adding class_id filter:', classId);
        query = query.eq('class_id', classId);
      }

      let { data, error } = await query;

      if (error) {
        console.error('fetchModules error:', error);
        throw error;
      }
      
      console.log('fetchModules data length:', data?.length, 'data:', data);
      
      // If no data with class_id filter, try without it (fallback for NULL class_id)
      if ((!data || data.length === 0) && classId) {
        console.log('No data with class_id filter, trying without class_id filter...');
        const fallbackQuery = supabase
          .from('curriculum')
          .select('module_no, module_name')
          .eq('content_category', category)
          .not('module_name', 'is', null);
        
        const { data: fallbackData, error: fallbackError } = await fallbackQuery;
        if (fallbackError) throw fallbackError;
        data = fallbackData;
        console.log('Fallback data length:', data?.length);
      }
      
      // Create unique modules with module_no and module_name
      const uniqueModulesMap = new Map();
      data?.forEach((item: any) => {
        // Extract module number from module_name if module_no is NULL
        // module_name format: "66. Project: Design A Product - Launch Box"
        let moduleNo = item.module_no;
        let moduleName = item.module_name;
        
        if (!moduleNo && moduleName) {
          // Extract number from start of module_name
          const match = moduleName.match(/^(\d+)\./);
          if (match) {
            moduleNo = parseInt(match[1]);
          }
        }
        
        const key = `${moduleNo}`;
        if (!uniqueModulesMap.has(key)) {
          uniqueModulesMap.set(key, { no: moduleNo, name: moduleName });
        }
      });
      const uniqueModules = Array.from(uniqueModulesMap.values()).sort((a, b) => (a.no || 0) - (b.no || 0));
      console.log('uniqueModules:', uniqueModules);
      setModules(uniqueModules as any);
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const fetchTopics = async (category: string, moduleName: string, classId?: string) => {
    try {
      console.log('fetchTopics called with category:', category, 'moduleName:', moduleName, 'classId:', classId);
      // Fetch topics for the selected category, module_name, and class
      let query: any = supabase
        .from('curriculum')
        .select('*')
        .eq('content_category', category)
        .eq('module_name', moduleName)
        .order('topics_covered', { ascending: true });

      // Filter by class if provided
      if (classId) {
        query = query.eq('class_id', classId);
      }

      let { data, error } = await query;

      if (error) {
        console.error('fetchTopics error:', error);
        throw error;
      }
      
      console.log('fetchTopics data length:', data?.length);
      
      // If no data with class_id filter, try without it (fallback for NULL class_id)
      if ((!data || data.length === 0) && classId) {
        console.log('No topics with class_id filter, trying without class_id filter...');
        const fallbackQuery = supabase
          .from('curriculum')
          .select('*')
          .eq('content_category', category)
          .eq('module_name', moduleName)
          .order('topics_covered', { ascending: true });
        
        const { data: fallbackData, error: fallbackError } = await fallbackQuery;
        if (fallbackError) throw fallbackError;
        data = fallbackData;
        console.log('Fallback topics data length:', data?.length);
      }
      
      // Remove duplicates by topics_covered
      const uniqueTopicsMap = new Map();
      data?.forEach((item: any) => {
        if (item.topics_covered && !uniqueTopicsMap.has(item.topics_covered)) {
          uniqueTopicsMap.set(item.topics_covered, item);
        }
      });
      const uniqueTopics = Array.from(uniqueTopicsMap.values());
      
      console.log('fetchTopics unique data:', uniqueTopics);
      setTopics(uniqueTopics);
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  // Auto-detect session type based on completed sessions for the topic
  const detectSessionType = async (topicName: string, category: string) => {
    try {
      // Check if there are any completed sessions for this topic in this category
      const { data: completedSessions, error } = await supabase
        .from('sessions')
        .select('id, status')
        .eq('topics_covered', topicName)
        .eq('content_category', category)
        .eq('status', 'completed')
        .limit(1);

      if (error) throw error;

      // If completed sessions exist, suggest revision; otherwise suggest fresh
      const suggestedType = (completedSessions && completedSessions.length > 0) ? 'revision' : 'fresh';
      setFormData(prev => ({ ...prev, session_type_option: suggestedType }));
    } catch (error) {
      console.error('Error detecting session type:', error);
      // Default to fresh if detection fails
      setFormData(prev => ({ ...prev, session_type_option: 'fresh' }));
    }
  };

  const fetchCentres = async () => {
    try {
      const { data, error } = await supabase
        .from('centres')
        .select('id, name, location,email')
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (error) throw error;
      setCentres(data || []);
    } catch (error) {
      console.error('Error fetching centres:', error);
    }
  };

  const fetchCentreSlots = async (centreId: string) => {
    try {
      const { data, error } = await supabase
        .from('centre_time_slots')
        .select('id, centre_id, day, start_time, end_time')
        .eq('centre_id', centreId)
        .order('day', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setCentreSlots(data || []);
    } catch (error) {
      console.error('Error fetching centre slots:', error);
    }
  };

  // Auto-generate title based on session type and selected fields
  const generateAutoTitle = () => {
    if (sessionType === 'guest_teacher') {
      // Format: WES GT Session - Class + Volunteer Name + Module + Topic
      const parts = ['WES GT Session'];
      if (formData.class_batch) parts.push(formData.class_batch);
      if (formData.volunteer_name) parts.push(`by ${formData.volunteer_name}`);
      if (formData.module_name) parts.push(formData.module_name);
      if (formData.topics_covered) parts.push(formData.topics_covered);
      return parts.join(' - ');
    } else if (sessionType === 'guest_speaker') {
      // Format: SVC WES Academy by Volunteer Name - Topic
      const parts = ['SVC WES Academy'];
      if (formData.volunteer_name) parts.push(`by ${formData.volunteer_name}`);
      if (formData.topics_covered) parts.push(formData.topics_covered);
      return parts.join(' - ');
    }
    return '';
  };

  // Auto-setup for guest speaker sessions
  useEffect(() => {
    if (sessionType === 'guest_speaker' && open) {
      // Auto-select "Life and Academic Journey" category and topic
      setSelectedCategory('Life and Academic Journey');
      setFormData(prev => ({
        ...prev,
        content_category: 'Life and Academic Journey',
      }));
    }
  }, [sessionType, open]);

  // Update custom_title whenever relevant fields change
  useEffect(() => {
    const autoTitle = generateAutoTitle();
    if (autoTitle) {
      setFormData(prev => ({ ...prev, custom_title: autoTitle }));
    }
  }, [sessionType, formData.class_batch, formData.volunteer_name, formData.module_name, formData.topics_covered]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedModule('');
    setSelectedTopic(null);
    setFormData(prev => ({
      ...prev,
      content_category: category,
      module_name: '',
      topics_covered: '',
      videos: '',
      quiz_content_ppt: '',
      custom_title: '',
    }));
  };

  const handleModuleChange = (moduleName: string) => {
    setSelectedModule(moduleName);
    setSelectedTopic(null);
    setFormData(prev => ({
      ...prev,
      module_name: moduleName,
      topics_covered: '',
      videos: '',
      quiz_content_ppt: '',
      custom_title: '',
    }));
  };

  const handleTopicSelect = (topicId: string) => {
    if (topicId === 'custom') {
      // Handle custom topic selection
      setSelectedTopic({ id: 'custom' } as any);
      setFormData(prev => ({
        ...prev,
        topics_covered: '',
        videos: '',
        quiz_content_ppt: '',
        custom_title: '',
        session_type_option: 'fresh', // Default to fresh for custom topics
      }));
    } else {
      const topic = topics.find(t => t.id === topicId);
      if (topic) {
        setSelectedTopic(topic);
        setFormData(prev => ({
          ...prev,
          module_name: topic.module_name || '',
          topics_covered: topic.topics_covered || '',
          videos: topic.videos || '',
          quiz_content_ppt: topic.quiz_content_ppt || '',
          title: topic.topics_covered || '',
          custom_title: '',
        }));
        // Auto-detect session type based on completed sessions
        detectSessionType(topic.topics_covered || '', selectedCategory);
      }
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateString = e.target.value;
    if (dateString) {
      // Parse date string as local date to avoid timezone conversion
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      setSelectedDate(date);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !user) return;

    if (!selectedVolunteer) {
      toast({
        title: 'Error',
        description: 'Please select a volunteer',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedFacilitator) {
      toast({
        title: 'Error',
        description: 'Please select a facilitator',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedCoordinator) {
      toast({
        title: 'Error',
        description: 'Please select a coordinator',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedTopic) {
      toast({
        title: 'Error',
        description: 'Please select a topic',
        variant: 'destructive',
      });
      return;
    }

    // Validate custom topic if selected
    if (selectedTopic.id === 'custom' && !formData.topics_covered.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a custom topic',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedSlot) {
      toast({
        title: 'Error',
        description: 'Please select a centre time slot',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.custom_title.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a custom meeting title',
        variant: 'destructive',
      });
      return;
    }

    const slot = centreSlots.find(s => s.id === selectedSlot);
    const selectedVolunteerData = volunteers.find(v => v.id === selectedVolunteer);
    const selectedFacilitatorData = facilitators.find(f => f.id === selectedFacilitator);
    const selectedCoordinatorData = coordinators.find(c => c.id === selectedCoordinator);
      const selectedClassData = classes.find(c => c.id === selectedClass);     // ✅ NEW
    const selectedCentreData = centres.find(c => c.id === selectedCentre);   // ✅ NEW

    // Generate meeting link
    const meetingLink = `https://meet.google.com/${selectedDate.getTime()}-${selectedVolunteer}`;

    const sessionData = {
      title: formData.title,
      session_date: format(selectedDate, 'yyyy-MM-dd'),
      session_time: slot?.start_time || '09:00',
      session_type_option: formData.session_type_option,
      content_category: formData.content_category,
      module_name: formData.module_name,
      topics_covered: formData.topics_covered,
      videos: formData.videos,
      quiz_content_ppt: formData.quiz_content_ppt,
      facilitator_name: selectedFacilitatorData?.name || '',
      coordinator_id: selectedCoordinator,
      volunteer_id: selectedVolunteer,
      volunteer_name: formData.volunteer_name,
      meeting_link: meetingLink,
      centre_id: selectedCentre,
      centre_time_slot_id: selectedSlot,
      class_batch: formData.class_batch,
      status: 'committed',
    };

    const { data: insertedSession, error } = await supabase
      .from('sessions')
      .insert([sessionData])
      .select();

    if (error) {
      console.error('Session insert error:', error);
      toast({
        title: 'Error',
        description: 'Failed to create session. Please try again.',
        variant: 'destructive',
      });
    } else {
      const sessionId = insertedSession?.[0]?.id;

      // Add to Google Calendar for volunteer and facilitator
      if (sessionId) {
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          
          // Format session data for calendar
          const startDateTime = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${slot?.start_time || '09:00'}`);
          const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour
          
          const calendarEventData = {
            sessionId,
            title: formData.custom_title,
            description: `

                   SESSION DETAILS                           


📚 CONTENT INFORMATION

Category:    ${formData.content_category}
Module:      ${formData.module_name}
Topic:       ${formData.topics_covered}
Session Type: ${formData.session_type_option === 'fresh' ? '🆕 Fresh Session' : '🔄 Revision Session'}

👥 Volunteer, Facilitator & Coordinator 

Volunteer:   ${formData.volunteer_name}
Facilitator: ${selectedFacilitatorData?.name || 'N/A'}
Coordinator: ${selectedCoordinatorData?.name || 'N/A'}

📎 RESOURCES

${formData.videos ? `📹 Videos: ${formData.videos}` : ''}
${formData.quiz_content_ppt ? `📊 PPT/Quiz: ${formData.quiz_content_ppt}` : ''}

� SEESSION TEMPLATE

Use this template to prepare your session:
https://docs.google.com/presentation/d/1xd5BC2fBf-OM0bCwiyZJwrkn4WBjfRrGz84HNaO-5Yc/edit?usp=sharing

🔗 MEETING LINK

Google Meet link will be added to the calendar event.

Please accept this invitation to confirm your participation.
For any questions, contact the coordinator.
            `.trim(),
            startDateTime: startDateTime.toISOString(),
            endDateTime: endDateTime.toISOString(),
            volunteerEmails: [
              selectedVolunteerData?.personal_email,
              selectedVolunteerData?.work_email
            ].filter(email => email && email.trim()),
            volunteerName: selectedVolunteerData?.name || '',
            facilitatorEmail: selectedFacilitatorData?.email || '',
            facilitatorName: selectedFacilitatorData?.name || '',
             classEmail: selectedClassData?.email,     // ✅ NEW
        centreEmail: selectedCentreData?.email,   // ✅ NEW
            coordinatorEmail: selectedCoordinatorData?.email || '',
            coordinatorName: selectedCoordinatorData?.name || '',
            meetingLink: meetingLink,
          };

          // Try to sync with Google Calendar
          try {
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            
            console.log('Attempting calendar sync with eventId:', calendarEventData.sessionId);
            
            const response = await fetch(`${supabaseUrl}/functions/v1/sync-google-calendar`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`,
              },
              body: JSON.stringify(calendarEventData),
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.warn('Calendar sync error:', errorData);
              toast({
                title: 'Warning',
                description: 'Session created but calendar sync failed. Recording webhook may not work.',
                variant: 'destructive',
              });
            } else {
              const result = await response.json();
              console.log('Calendar sync result:', result);
              
              // Store google_event_id in session for recording webhook matching
              if (result.eventId && sessionId) {
                const { error: updateError } = await supabase
                  .from('sessions')
                  .update({ google_event_id: result.eventId })
                  .eq('id', sessionId);
                
                if (updateError) {
                  console.error('Error storing google_event_id:', updateError);
                } else {
                  console.log('Successfully stored google_event_id:', result.eventId);
                }
              }
            }
          } catch (calendarError) {
            console.warn('Calendar sync not available:', calendarError);
          }
          
          toast({
            title: 'Session Scheduled',
            description: `Session "${formData.title}" has been scheduled successfully.`,
          });
        } catch (notificationError) {
          console.error('Error with calendar sync:', notificationError);
          toast({
            title: 'Session Scheduled',
            description: `Session created successfully`,
          });
        }
      }

      handleClose();
      onSuccess();
    }
  };

  const handleClose = () => {
    setSelectedDate(null);
    setSelectedVolunteer('');
    setSelectedFacilitator('');
    setSelectedCoordinator('');
    setSelectedCategory('');
    setSelectedModule('');
    setSelectedTopic(null);
    setSelectedCentre('');
    setSelectedSlot('');
    setSelectedClass('');
    setFormData({
      title: '',
      custom_title: '',
      content_category: '',
      module_name: '',
      topics_covered: '',
      videos: '',
      quiz_content_ppt: '',
      volunteer_name: '',
      facilitator_name: '',
      coordinator_name: '',
      session_type_option: 'fresh',
      class_batch: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[600px] md:max-w-[700px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-lg sm:text-xl">
            <GraduationCap className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span className="break-words">Schedule New Session</span>
          </DialogTitle>
          <DialogDescription>
            Create a new volunteer training session with curriculum details and participant information
          </DialogDescription>
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
                value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                onChange={handleDateChange}
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
                No active volunteers available. Please add volunteers first.
              </div>
            ) : (
              <VolunteerSelector
                volunteers={volunteers}
                selectedVolunteer={selectedVolunteer}
                onSelectVolunteer={(volunteerId, volunteerName) => {
                  setSelectedVolunteer(volunteerId);
                  setFormData(prev => ({ ...prev, volunteer_name: volunteerName }));
                }}
                placeholder="Choose a volunteer..."
              />
            )}
          </div>

          {/* Facilitator Selection */}
          <div className="space-y-2">
            <Label htmlFor="facilitator" className="text-sm sm:text-base">Select Facilitator *</Label>
            <Select value={selectedFacilitator} onValueChange={(value) => {
              setSelectedFacilitator(value);
              const facilitator = facilitators.find(f => f.id === value);
              if (facilitator) {
                setFormData(prev => ({ ...prev, facilitator_name: facilitator.name }));
              }
            }}>
              <SelectTrigger className="text-sm sm:text-base">
                <SelectValue placeholder="Choose a facilitator" />
              </SelectTrigger>
              <SelectContent>
                {facilitators.map((facilitator) => (
                  <SelectItem key={facilitator.id} value={facilitator.id}>
                    {facilitator.name} ({facilitator.location})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Coordinator Selection */}
          <div className="space-y-2">
            <Label htmlFor="coordinator" className="text-sm sm:text-base">Select Coordinator *</Label>
            <Select value={selectedCoordinator} onValueChange={(value) => {
              setSelectedCoordinator(value);
              const coordinator = coordinators.find(c => c.id === value);
              if (coordinator) {
                setFormData(prev => ({ ...prev, coordinator_name: coordinator.name }));
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

          {/* Content Selection - Only for Guest Teacher */}
          {sessionType === 'guest_teacher' && (
            <div className="border-t border-border pt-4">
              <h4 className="font-medium text-sm sm:text-base text-foreground mb-3">Select Class & Content</h4>
              
              {/* Class Selection - FIRST */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="class_batch" className="text-sm sm:text-base">Class *</Label>
                <Select value={selectedClass} onValueChange={(value) => {
                  setSelectedClass(value);
                  const classObj = classes.find(c => c.id === value);
                  setFormData({ ...formData, class_batch: classObj?.name || '' });
                }}>
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Category Selection */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="category" className="text-sm sm:text-base">Content Category *</Label>
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
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

              {/* Module Selection */}
              {selectedCategory && modules.length > 0 && (
                <div className="space-y-2 mb-4">
                  <Label htmlFor="module" className="text-sm sm:text-base">Module Name *</Label>
                  <Select value={selectedModule} onValueChange={handleModuleChange}>
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue placeholder="Select a module" />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map((module) => (
                        <SelectItem key={`${module.name}`} value={module.name}>
                           {module.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Topic Selection */}
              {selectedModule && topics.length > 0 && (
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
                      <SelectItem value="custom">Other (Custom Topic)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Custom Topic Input */}
              {selectedTopic?.id === 'custom' && (
                <div className="space-y-2 mb-4">
                  <Label htmlFor="custom_topic_input" className="text-sm sm:text-base">Enter Custom Topic *</Label>
                  <Input
                    id="custom_topic_input"
                    placeholder="Enter your custom topic"
                    value={formData.topics_covered}
                    onChange={(e) => setFormData({ ...formData, topics_covered: e.target.value })}
                    className="text-sm sm:text-base"
                    required
                  />
                </div>
              )}
            </div>
          )}

          {/* Content Details - Only for Guest Teacher */}
          {sessionType === 'guest_teacher' && (
            <div className="border-t border-border pt-4">
              <h4 className="font-medium text-sm sm:text-base text-foreground mb-3">Content Details {selectedTopic && '(Auto-filled)'}</h4>
              
              <div className="space-y-2 mb-4">
                <Label htmlFor="session_type_option" className="text-sm sm:text-base">Session Type Option *</Label>
                <div className="flex items-center gap-2">
                  <Select value={formData.session_type_option} onValueChange={(value) => setFormData({ ...formData, session_type_option: value })}>
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue placeholder="Select session type option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fresh">🆕 Fresh</SelectItem>
                      <SelectItem value="revision">🔄 Revision</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedTopic && selectedTopic.id !== 'custom' && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      (Auto-detected)
                    </span>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <Label htmlFor="videos" className="text-sm sm:text-base">Videos</Label>
                <Input
                  id="videos"
                  placeholder="Video links or references"
                  value={formData.videos}
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
                  value={formData.quiz_content_ppt}
                  onChange={(e) => setFormData({ ...formData, quiz_content_ppt: e.target.value })}
                  disabled={!!selectedTopic}
                  className="text-sm sm:text-base"
                />
              </div>
            </div>
          )}

          {/* Guest Speaker Topic Selection */}
          {sessionType === 'guest_speaker' && (
            <div className="border-t border-border pt-4">
              <h4 className="font-medium text-sm sm:text-base text-foreground mb-3">Select Topic</h4>
              
              <div className="space-y-2 mb-4">
                <Label htmlFor="speaker_topic" className="text-sm sm:text-base">Topic *</Label>
                <Input
                  id="speaker_topic"
                  placeholder="Enter the topic for this speaker session"
                  value={formData.topics_covered}
                  onChange={(e) => setFormData({ ...formData, topics_covered: e.target.value })}
                  className="text-sm sm:text-base"
                  required
                />
              </div>
            </div>
          )}

          {/* Custom Meeting Title */}
          <div className="border-t border-border pt-4">
            <div className="space-y-2">
              <Label htmlFor="custom_title" className="text-sm sm:text-base">Meeting Title (Custom) *</Label>
              <Input
                id="custom_title"
                placeholder="Enter custom title for the meeting"
                value={formData.custom_title}
                onChange={(e) => setFormData({ ...formData, custom_title: e.target.value })}
                className="text-sm sm:text-base"
                required
              />
              <p className="text-xs text-muted-foreground">This title will be used for the Google Calendar meeting</p>
            </div>
          </div>

          {/* Centre & Time Slot Selection - Only for Guest Teacher */}
          {sessionType === 'guest_teacher' && (
            <div className="border-t border-border pt-4">
              <h4 className="font-medium text-sm sm:text-base text-foreground mb-3">Select Centre & Time Slot</h4>
              
              <div className="space-y-2 mb-4">
                <Label htmlFor="centre" className="text-sm sm:text-base">Centre *</Label>
                {centres.length === 0 ? (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs sm:text-sm text-yellow-800">
                    No active centres available. Please add centres first.
                  </div>
                ) : (
                  <Select value={selectedCentre} onValueChange={setSelectedCentre}>
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
                )}
              </div>

              {selectedCentre && centreSlots.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="slot" className="text-sm sm:text-base">Time Slot *</Label>
                  <Select value={selectedSlot} onValueChange={setSelectedSlot}>
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

              {selectedCentre && centreSlots.length === 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs sm:text-sm text-yellow-800">
                  No time slots available for this centre.
                </div>
              )}
            </div>
          )}

          {/* Session Template */}
          <div className="border-t border-border pt-4">
            <h4 className="font-medium text-sm sm:text-base text-foreground mb-3">Session Template</h4>
            
            <div className="space-y-2">
              <a 
                href="https://docs.google.com/presentation/d/1xd5BC2fBf-OM0bCwiyZJwrkn4WBjfRrGz84HNaO-5Yc/edit?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-600 hover:bg-blue-100 transition-colors"
              >
                📄 Open Session Template
              </a>
              <p className="text-xs text-muted-foreground mt-2">
                Use this template to prepare your session content
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="w-full sm:w-auto text-sm sm:text-base">
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto text-sm sm:text-base">Schedule Session</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
