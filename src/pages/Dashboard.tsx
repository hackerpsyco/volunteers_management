import { useEffect, useState } from 'react';
import { Users, Calendar, BookOpen, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { VolunteerSessionStats } from '@/components/dashboard/VolunteerSessionStats';

interface Stats {
  totalVolunteers: number;
  totalSessions: number;
  totalCentres: number;
  totalFacilitators: number;
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

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ 
    totalVolunteers: 0, 
    totalSessions: 0,
    totalCentres: 0,
    totalFacilitators: 0
  });
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>({
    pending: 0,
    committed: 0,
    available: 0,
    completed: 0,
  });
  const [curriculumCategories, setCurriculumCategories] = useState<CurriculumCategory[]>([]);
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
    async function fetchDashboardData() {
      try {
        // Fetch stats
        const volunteersResult = await supabase.from('volunteers').select('id', { count: 'exact', head: true });
        const sessionsResult = await supabase.from('sessions').select('id', { count: 'exact', head: true });
        const centresResult = await supabase.from('centres').select('id', { count: 'exact', head: true });
        const facilitatorsResult = await supabase.from('facilitators').select('id', { count: 'exact', head: true });
        const slotsResult = await supabase.from('centre_time_slots').select('id', { count: 'exact', head: true });

        setStats({
          totalVolunteers: volunteersResult.count || 0,
          totalSessions: sessionsResult.count || 0,
          totalCentres: (centresResult.count || 0) + (slotsResult.count || 0),
          totalFacilitators: facilitatorsResult.count || 0,
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

        // Fetch curriculum categories
        const { data: curriculumData, error: curriculumError } = await supabase
          .from('curriculum')
          .select('content_category');

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

        const colors = ['bg-blue-100', 'bg-yellow-100', 'bg-pink-100', 'bg-green-100'];
        const categories = Array.from(categoryMap.entries()).map(([name, count], index) => ({
          name,
          count,
          color: colors[index % colors.length],
        }));

        setCurriculumCategories(categories);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const statCards = [
    { label: 'Total Volunteers', value: stats.totalVolunteers, icon: Users, color: 'text-blue-600' },
    { label: 'Total Sessions', value: stats.totalSessions, icon: Calendar, color: 'text-green-600' },
    { label: 'Centres & Slots', value: `${stats.totalCentres}+${stats.totalFacilitators}`, icon: BookOpen, color: 'text-purple-600' },
    { label: 'Facilitator', value: stats.totalFacilitators, icon: Users, color: 'text-orange-600' },
  ];

  const sessionStatusItems = [
    { label: 'Pending', value: sessionStatus.pending, color: 'bg-yellow-100', textColor: 'text-yellow-800' },
    { label: 'Committed', value: sessionStatus.committed, color: 'bg-purple-100', textColor: 'text-purple-800' },
    { label: 'Available', value: sessionStatus.available, color: 'bg-blue-100', textColor: 'text-blue-800' },
    { label: 'Completed', value: sessionStatus.completed, color: 'bg-green-100', textColor: 'text-green-800' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Welcome to Volunteer Management System
          </p>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Session Status */}
          <div className="bg-card border border-border rounded-lg p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-bold text-foreground mb-4">Session</h2>
            <div className="space-y-3">
              {sessionStatusItems.map((item, index) => (
                <div key={index} className={`${item.color} rounded-lg p-3 md:p-4 flex justify-between items-center`}>
                  <span className={`font-medium text-sm md:text-base ${item.textColor}`}>{item.label}</span>
                  <span className={`font-bold text-lg md:text-xl ${item.textColor}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Volunteer Session Stats - Middle */}
          <VolunteerSessionStats />

          {/* Curriculum Categories */}
          <div className="bg-card border border-border rounded-lg p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-bold text-foreground mb-4">Curriculum</h2>
            <div className="space-y-3">
              {curriculumCategories.length > 0 ? (
                curriculumCategories.map((category, index) => (
                  <div key={index} className={`${category.color} rounded-lg p-3 md:p-4 flex justify-between items-center`}>
                    <span className="font-medium text-sm md:text-base text-gray-800">{category.name}</span>
                    <span className="font-bold text-lg md:text-xl text-gray-800">{category.count}</span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No curriculum data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="bg-card border border-border rounded-lg p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-foreground mb-4">Quick Action</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            <Button 
              onClick={() => navigate('/calendar')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm py-2 md:py-3"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Session
            </Button>
            <Button 
              onClick={() => navigate('/curriculum')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs md:text-sm py-2 md:py-3"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Topic
            </Button>
            <Button 
              onClick={() => navigate('/facilitators')}
              className="bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm py-2 md:py-3"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Facilitator
            </Button>
            <Button 
              onClick={() => navigate('/volunteers')}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs md:text-sm py-2 md:py-3"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Volunteer
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
