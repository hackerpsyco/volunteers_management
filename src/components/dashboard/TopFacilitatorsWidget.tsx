import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Medal, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TopFacilitatorsWidgetProps {
  startDate: Date | null;
  endDate: Date | null;
}

interface FacilitatorStat {
  id: string;
  name: string;
  sessionsDone: number;
  tasksCreated: number;
  feedbackDone: number;
}

export function TopFacilitatorsWidget({ startDate, endDate }: TopFacilitatorsWidgetProps) {
  const [facilitators, setFacilitators] = useState<FacilitatorStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTopFacilitators() {
      setLoading(true);
      try {
        const statsMap = new Map<string, FacilitatorStat>();

        // Query 1: Sessions Done
        let sessionsQuery = supabase
          .from('sessions')
          .select(`
            id,
            volunteer_id,
            session_date,
            volunteers(name)
          `)
          .in('status', ['completed', 'Completed']);
          
        if (startDate) {
          sessionsQuery = sessionsQuery.gte('session_date', startDate.toISOString().split('T')[0]);
        }
        if (endDate) {
          sessionsQuery = sessionsQuery.lte('session_date', endDate.toISOString().split('T')[0]);
        }

        const { data: sessionsData, error: sessionsError } = await sessionsQuery;
        
        if (sessionsError) {
          console.error('Error fetching sessions:', sessionsError);
        } else {
          sessionsData?.forEach((record: any) => {
            if (!record.volunteer_id || !record.volunteers) return;
            const vId = record.volunteer_id;
            if (!statsMap.has(vId)) {
              statsMap.set(vId, { id: vId, name: record.volunteers.name, sessionsDone: 0, tasksCreated: 0, feedbackDone: 0 });
            }
            statsMap.get(vId)!.sessionsDone += 1;
          });
        }

        // Fetch Facilitator Profiles mapping (to map user.id to volunteer.id)
        // because created_by and verified_by use auth.users(id)
        const { data: profilesData } = await supabase
          .from('user_profiles')
          .select('id, full_name, email');
          
        // Map of auth.user.id -> user_profile data
        const profileMap = new Map();
        profilesData?.forEach(p => profileMap.set(p.id, p));

        // Attempt Query 2 & 3: Tasks Created and Feedback Done
        // We wrap in try-catch in case the DB columns aren't added yet
        try {
          let tasksQuery = supabase
            .from('student_task_feedback')
            .select(`
              created_by,
              verified_by,
              created_at,
              updated_at
            `);

          // Start Date filter
          if (startDate) {
            tasksQuery = tasksQuery.gte('updated_at', startDate.toISOString());
          }
          // End Date filter
          if (endDate) {
            const end = new Date(endDate);
            end.setDate(end.getDate() + 1);
            tasksQuery = tasksQuery.lt('updated_at', end.toISOString());
          }

          const { data: tasksData, error: tasksError } = await tasksQuery;

          if (!tasksError && tasksData) {
            tasksData.forEach((record: any) => {
              // Tasks Created
              if (record.created_by) {
                const p = profileMap.get(record.created_by);
                if (p) {
                  // We use email or name to match with volunteer... or just treat profiles as their own id
                  // For simplicity, we just use the user profile ID as the identifier
                  const vId = record.created_by;
                  if (!statsMap.has(vId)) {
                    statsMap.set(vId, { id: vId, name: p.full_name || 'Unknown User', sessionsDone: 0, tasksCreated: 0, feedbackDone: 0 });
                  }
                  statsMap.get(vId)!.tasksCreated += 1;
                }
              }

              // Feedback Done
              if (record.verified_by) {
                const p = profileMap.get(record.verified_by);
                if (p) {
                  const vId = record.verified_by;
                  if (!statsMap.has(vId)) {
                    statsMap.set(vId, { id: vId, name: p.full_name || 'Unknown User', sessionsDone: 0, tasksCreated: 0, feedbackDone: 0 });
                  }
                  statsMap.get(vId)!.feedbackDone += 1;
                }
              }
            });
          }
        } catch (colError) {
          console.log('created_by or verified_by columns might not exist yet:', colError);
        }

        setFacilitators(Array.from(statsMap.values()));
      } catch (e) {
        console.error('Error in fetchTopFacilitators:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchTopFacilitators();
  }, [startDate, endDate]);

  const topSessions = [...facilitators].sort((a, b) => b.sessionsDone - a.sessionsDone).filter(f => f.sessionsDone > 0).slice(0, 5);
  const topTasks = [...facilitators].sort((a, b) => b.tasksCreated - a.tasksCreated).filter(f => f.tasksCreated > 0).slice(0, 5);
  const topFeedback = [...facilitators].sort((a, b) => b.feedbackDone - a.feedbackDone).filter(f => f.feedbackDone > 0).slice(0, 5);

  return (
    <Card className="col-span-1 border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Medal className="h-5 w-5 text-indigo-500" />
          Top Facilitators
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : facilitators.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">No facilitator data found for this period.</p>
        ) : (
          <Tabs defaultValue="sessions" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 h-auto">
              <TabsTrigger value="sessions" className="text-[10px] md:text-xs py-1.5">Sessions</TabsTrigger>
              <TabsTrigger value="created" className="text-[10px] md:text-xs py-1.5">Created</TabsTrigger>
              <TabsTrigger value="reviewed" className="text-[10px] md:text-xs py-1.5">Reviewed</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sessions" className="space-y-4">
              {topSessions.length > 0 ? topSessions.map((fac, i) => (
                <div key={`ses-${fac.id}`} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="font-medium text-sm group-hover:text-primary transition-colors">{fac.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-sm bg-indigo-50 px-2.5 py-0.5 rounded-full">
                    <span>{fac.sessionsDone}</span>
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground text-center py-4">No sessions found.</p>}
            </TabsContent>
            
            <TabsContent value="created" className="space-y-4">
              {topTasks.length > 0 ? topTasks.map((fac, i) => (
                <div key={`crt-${fac.id}`} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="font-medium text-sm group-hover:text-primary transition-colors">{fac.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-blue-600 font-bold text-sm bg-blue-50 px-2.5 py-0.5 rounded-full">
                    <span>{fac.tasksCreated}</span>
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground text-center py-4">Wait for DB updates.</p>}
            </TabsContent>

            <TabsContent value="reviewed" className="space-y-4">
              {topFeedback.length > 0 ? topFeedback.map((fac, i) => (
                <div key={`rev-${fac.id}`} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="font-medium text-sm group-hover:text-primary transition-colors">{fac.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-green-600 font-bold text-sm bg-green-50 px-2.5 py-0.5 rounded-full">
                    <span>{fac.feedbackDone}</span>
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground text-center py-4">Wait for DB updates.</p>}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
