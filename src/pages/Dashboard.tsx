import { useEffect, useState } from 'react';
import { Users, Calendar } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  totalVolunteers: number;
  totalSessions: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ totalVolunteers: 0, totalSessions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [volunteersResult, sessionsResult] = await Promise.all([
          supabase.from('volunteers').select('id', { count: 'exact', head: true }),
          supabase.from('sessions').select('id', { count: 'exact', head: true }),
        ]);

        setStats({
          totalVolunteers: volunteersResult.count || 0,
          totalSessions: sessionsResult.count || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome to Volunteer Management System
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          {/* Total Volunteers Card */}
          <div className="stat-card">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Volunteers</p>
                <p className="text-3xl font-bold text-foreground">
                  {loading ? '—' : stats.totalVolunteers}
                </p>
              </div>
            </div>
          </div>

          {/* Total Sessions Card */}
          <div className="stat-card">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Sessions</p>
                <p className="text-3xl font-bold text-foreground">
                  {loading ? '—' : stats.totalSessions}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
