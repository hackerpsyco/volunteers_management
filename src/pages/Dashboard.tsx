import { useEffect, useState } from 'react';
import { Users, Calendar, BookOpen, Plus, Filter, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { VolunteerSessionStats } from '@/components/dashboard/VolunteerSessionStats';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Stats {
  totalVolunteers: number;
  totalSessions: number;
  totalStudents: number;
  totalFacilitators: number;
  totalFeedback: number;
}

interface SessionStatus {
  pending: number;
  committed: number;
  available: number;
  completed: number;
}

interface CurriculumCategory {
  name: string;
  count: number;
  color: string;
}

interface Subject {
  id: string;
  name: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalVolunteers: 0,
    totalSessions: 0,
    totalStudents: 0,
    totalFacilitators: 0,
    totalFeedback: 0,
  });
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>({
    pending: 0,
    committed: 0,
    available: 0,
    completed: 0,
  });
  const [curriculumCategories, setCurriculumCategories] = useState<CurriculumCategory[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUserRole() {
      if (!user?.id) return;

      try {
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('role_id')
          .eq('id', user.id)
          .single();

        // Redirect students to their dashboard
        if (profileData?.role_id === 5) {
          navigate('/student-dashboard', { replace: true });
          return;
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      }
    }

    checkUserRole();
  }, [user?.id, navigate]);

  useEffect(() => {
    async function fetchSubjects() {
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select('id, name')
          .order('name', { ascending: true });

        if (error) throw error;
        setSubjects(data || []);

        // Find "AI" or "Artificial Intelligence" to set as default
        const aiSubject = data?.find(s =>
          s.name.toLowerCase() === 'ai' ||
          s.name.toLowerCase().includes('artificial intelligence')
        );
        if (aiSubject) {
          setSelectedSubject(aiSubject.id);
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
      }
    }
    fetchSubjects();
  }, []);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        // Fetch stats
        const volunteersResult = await supabase.from('volunteers').select('id', { count: 'exact', head: true });
        const sessionsResult = await supabase.from('sessions').select('id', { count: 'exact', head: true });
        const studentsResult = await supabase.from('students').select('id', { count: 'exact', head: true });
        const facilitatorsResult = await supabase.from('facilitators').select('id', { count: 'exact', head: true });
        const feedbackResult = await supabase.from('sessions').select('id', { count: 'exact', head: true }).not('recorded_at', 'is', null);

        setStats({
          totalVolunteers: volunteersResult.count || 0,
          totalSessions: sessionsResult.count || 0,
          totalStudents: studentsResult.count || 0,
          totalFacilitators: facilitatorsResult.count || 0,
          totalFeedback: feedbackResult.count || 0,
        });

        // Fetch session status breakdown
        const { data: sessionsData } = await supabase
          .from('sessions')
          .select('status');

        const statusCounts = {
          pending: 0,
          committed: 0,
          available: 0,
          completed: 0,
        };

        sessionsData?.forEach((session: any) => {
          const status = session.status as keyof typeof statusCounts;
          if (status in statusCounts) {
            statusCounts[status]++;
          }
        });

        setSessionStatus(statusCounts);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  useEffect(() => {
    async function fetchCurriculumData() {
      try {
        // Fetch curriculum categories filtered by subject
        let query = supabase
          .from('curriculum')
          .select('content_category');

        if (selectedSubject !== 'all') {
          query = query.eq('subject_id', selectedSubject);
        }

        const { data: curriculumData, error: curriculumError } = await query;

        if (curriculumError) {
          console.warn('Error fetching curriculum:', curriculumError);
        }

        const categoryMap = new Map<string, number>();
        curriculumData?.forEach((item: any) => {
          const category = item.content_category;
          if (category) {
            categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
          }
        });

        const categories = Array.from(categoryMap.entries()).map(([name, count]) => ({
          name,
          count,
          color: 'bg-muted/30', // More subtle color
        }));

        setCurriculumCategories(categories);
      } catch (error) {
        console.error('Error fetching curriculum data:', error);
      }
    }

    fetchCurriculumData();
  }, [selectedSubject]);

  const statCards = [
    { label: 'Total Volunteers', value: stats.totalVolunteers, icon: Users, color: 'text-blue-600' },
    { label: 'Total Sessions', value: stats.totalSessions, icon: Calendar, color: 'text-green-600' },
    { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-purple-600' },
    { label: 'Facilitator', value: stats.totalFacilitators, icon: Users, color: 'text-orange-600' },
    { label: 'Total Feedback', value: stats.totalFeedback, icon: FileText, color: 'text-pink-600' },
  ];

  const sessionStatusItems = [
    { label: 'Pending', value: sessionStatus.pending, color: 'bg-muted/30', textColor: 'text-yellow-700' },
    { label: 'Committed', value: sessionStatus.committed, color: 'bg-muted/30', textColor: 'text-purple-700' },
    { label: 'Available', value: sessionStatus.available, color: 'bg-muted/30', textColor: 'text-blue-700' },
    { label: 'Completed', value: sessionStatus.completed, color: 'bg-muted/30', textColor: 'text-green-700' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Welcome to WesFellow Hub
          </p>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="bg-card border border-border rounded-lg p-3 md:p-4">
                <p className="text-xs md:text-sm text-muted-foreground font-medium mb-2">{card.label}</p>
                <p className={`text-xl md:text-2xl font-bold ${card.color}`}>
                  {loading ? '—' : card.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Session Status, Volunteer Stats, and Curriculum Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Session Status */}
          <div className="bg-card border border-border rounded-lg p-3 md:p-4">
            <h2 className="text-base md:text-lg font-bold text-foreground mb-3">Session</h2>
            <div className="space-y-2">
              {sessionStatusItems.map((item, index) => (
                <div key={index} className={`${item.color} rounded-lg p-2 md:p-3 flex justify-between items-center`}>
                  <span className={`font-medium text-xs md:text-sm ${item.textColor}`}>{item.label}</span>
                  <span className={`font-bold text-base md:text-lg ${item.textColor}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Volunteer Session Stats - Middle */}
          <VolunteerSessionStats />

          {/* Curriculum Categories */}
          <div className="bg-card border border-border rounded-lg p-3 md:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <h2 className="text-base md:text-lg font-bold text-foreground">Curriculum</h2>
              <div className="w-full sm:w-32">
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="h-8 text-[10px] md:text-xs">
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id} className="text-[10px] md:text-xs">
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {curriculumCategories.length > 0 ? (
                curriculumCategories.map((category, index) => (
                  <div key={index} className={`${category.color} rounded-lg p-2 md:p-3 flex justify-between items-center`}>
                    <span className="font-medium text-xs md:text-sm text-muted-foreground">{category.name}</span>
                    <span className="font-bold text-base md:text-lg text-muted-foreground">{category.count}</span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-muted-foreground text-[10px] md:text-xs">No curriculum data for this subject</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="bg-card border border-border rounded-lg p-3 md:p-4">
          <h2 className="text-base md:text-lg font-bold text-foreground mb-3">Quick Action</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              onClick={() => navigate('/calendar')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] md:text-xs py-1.5 md:py-2"
            >
              <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              New Session
            </Button>
            <Button
              onClick={() => navigate('/curriculum')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white text-[10px] md:text-xs py-1.5 md:py-2"
            >
              <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              New Topic
            </Button>
            <Button
              onClick={() => navigate('/facilitators')}
              className="bg-green-600 hover:bg-green-700 text-white text-[10px] md:text-xs py-1.5 md:py-2"
            >
              <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              New Facilitator
            </Button>
            <Button
              onClick={() => navigate('/volunteers')}
              className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] md:text-xs py-1.5 md:py-2"
            >
              <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              New Volunteer
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
