import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { GraduationCap } from 'lucide-react';
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

interface AddSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  sessionType: 'guest_teacher' | 'guest_speaker' | null;
  onSuccess: () => void;
}

export function AddSessionDialog({ 
  open, 
  onOpenChange, 
  selectedDate,
  sessionType,
  onSuccess 
}: AddSessionDialogProps) {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [facilitators, setFacilitators] = useState<Facilitator[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [topics, setTopics] = useState<CurriculumItem[]>([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<CurriculumItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    session_time: '09:00',
    content_category: '',
    module_name: '',
    topics_covered: '',
    videos: '',
    quiz_content_ppt: '',
    status: 'pending',
    guest_speaker: '',
    guest_teacher: '',
  });
  const { user } = useAuth();
  const { toast } = useToast();

  // Load volunteers and categories on open
  useEffect(() => {
    if (open) {
      fetchVolunteers();
      fetchFacilitators();
      fetchCategories();
    }
  }, [open]);

  // Load modules when category changes
  useEffect(() => {
    if (selectedCategory) {
      fetchModules(selectedCategory);
      setSelectedModule('');
      setTopics([]);
    }
  }, [selectedCategory]);

  // Load topics when module changes
  useEffect(() => {
    if (selectedCategory && selectedModule) {
      fetchTopics(selectedCategory, selectedModule);
    }
  }, [selectedCategory, selectedModule]);

  const fetchVolunteers = async () => {
    try {
      console.log('Fetching volunteers...');
      const { data, error } = await supabase
        .from('volunteers')
        .select('id, name, personal_email, work_email, phone_number, organization_name')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Volunteers loaded successfully:', data);
      setVolunteers(data || []);
      
      if (!data || data.length === 0) {
        console.warn('No active volunteers found in database');
      }
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

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('curriculum')
        .select('content_category')
        .not('content_category', 'is', null);

      if (error) throw error;
      
      const uniqueCategories = [...new Set(data?.map(item => item.content_category) || [])];
      setCategories(uniqueCategories as string[]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchModules = async (category: string) => {
    try {
      const { data, error } = await supabase
        .from('curriculum')
        .select('module_name')
        .eq('content_category', category)
        .not('module_name', 'is', null);

      if (error) throw error;
      
      const uniqueModules = [...new Set(data?.map(item => item.module_name) || [])];
      setModules(uniqueModules as string[]);
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const fetchTopics = async (category: string, moduleName: string) => {
    try {
      const { data, error } = await supabase
        .from('curriculum')
        .select('*')
        .eq('content_category', category)
        .eq('module_name', moduleName)
        .order('topics_covered', { ascending: true });

      if (error) throw error;
      setTopics(data || []);
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

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
    }));
  };

  const handleTopicSelect = (topicId: string) => {
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
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !user) return;

    if (!selectedTopic) {
      toast({
        title: 'Error',
        description: 'Please select a topic',
        variant: 'destructive',
      });
      return;
    }

    const volunteer = volunteers.find(v => v.id === selectedVolunteer);

    const sessionData = {
      title: formData.title,
      session_date: format(selectedDate, 'yyyy-MM-dd'),
      session_time: formData.session_time,
      session_type: 'guest_teacher',
      status: formData.status,
      content_category: formData.content_category,
      module_name: formData.module_name,
      topics_covered: formData.topics_covered,
      videos: formData.videos,
      quiz_content_ppt: formData.quiz_content_ppt,
      guest_speaker: formData.guest_speaker,
      guest_teacher: formData.guest_teacher,
      volunteer_name: volunteer?.name || '',
      mentor_email: volunteer?.work_email || volunteer?.personal_email || '',
    };

    const { error } = await supabase.from('sessions').insert([sessionData]);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create session. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Session Created',
        description: `Session "${formData.title}" has been scheduled for ${format(selectedDate, 'MMMM d, yyyy')}`,
      });
      handleClose();
      onSuccess();
    }
  };

  const handleClose = () => {
    setSelectedVolunteer('');
    setSelectedCategory('');
    setSelectedModule('');
    setSelectedTopic(null);
    setFormData({
      title: '',
      session_time: '09:00',
      content_category: '',
      module_name: '',
      topics_covered: '',
      videos: '',
      quiz_content_ppt: '',
      status: 'pending',
      guest_speaker: '',
      guest_teacher: '',
    });
    onOpenChange(false);
  };

  // Main Session Form
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[600px] md:max-w-[700px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
      <DialogHeader className="mb-4">
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-lg sm:text-xl">
            <GraduationCap className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span className="break-words">New {sessionType === 'guest_teacher' ? 'Guest Teacher' : 'Guest Speaker'} Session - {selectedDate && format(selectedDate, 'MMM d, yyyy')}</span>
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Volunteer Selection */}
          <div className="space-y-2">
            <Label htmlFor="volunteer" className="text-sm sm:text-base">Select Volunteer *</Label>
            {volunteers.length === 0 ? (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs sm:text-sm text-yellow-800">
                No active volunteers available. Please add volunteers first.
              </div>
            ) : (
              <Select value={selectedVolunteer} onValueChange={setSelectedVolunteer}>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="Choose a volunteer" />
                </SelectTrigger>
                <SelectContent>
                  {volunteers.map((volunteer) => (
                    <SelectItem key={volunteer.id} value={volunteer.id}>
                      {volunteer.name} ({volunteer.organization_name || 'N/A'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Guest Speaker & Guest Teacher */}
          <div className="border-t border-border pt-4">
            <h4 className="font-medium text-sm sm:text-base text-foreground mb-3">
              {sessionType === 'guest_teacher' ? 'Guest Teacher' : 'Guest Speaker'} Information
            </h4>
            
            <div className="space-y-2 mb-4">
              <Label htmlFor="guest_person" className="text-sm sm:text-base">
                {sessionType === 'guest_teacher' ? 'Select Guest Teacher' : 'Select Guest Speaker'} *
              </Label>
              <Select value={formData.guest_teacher} onValueChange={(value) => setFormData({ ...formData, guest_teacher: value })}>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder={`Choose a ${sessionType === 'guest_teacher' ? 'teacher' : 'speaker'}`} />
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
          </div>

          {/* Content Selection */}
          <div className="border-t border-border pt-4">
            <h4 className="font-medium text-sm sm:text-base text-foreground mb-3">Select Content & Topic</h4>
            
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

            {selectedCategory && modules.length > 0 && (
              <div className="space-y-2 mb-4">
                <Label htmlFor="module" className="text-sm sm:text-base">Module Name *</Label>
                <Select value={selectedModule} onValueChange={handleModuleChange}>
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
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Content Details */}
          <div className="border-t border-border pt-4">
            <h4 className="font-medium text-sm sm:text-base text-foreground mb-3">Content Details {selectedTopic && '(Auto-filled)'}</h4>
            
            <div className="space-y-2 mb-4">
              <Label htmlFor="status" className="text-sm sm:text-base">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="committed">Committed</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 mt-4">
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

            <div className="space-y-2 mt-4">
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

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="w-full sm:w-auto text-sm sm:text-base">
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto text-sm sm:text-base">Create Session</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
