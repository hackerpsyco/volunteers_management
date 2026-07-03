import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Medal, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TopFacilitatorsWidgetProps {
  startDate?: Date | null;
  endDate?: Date | null;
  academicYear?: string;
  sessionType?: string;
}

interface FacilitatorStat {
  id: string;
  name: string;
  sessionsDone: number;
  tasksCreated: number;
  feedbackDone: number;
}

export function TopFacilitatorsWidget({ startDate, endDate, academicYear, sessionType }: TopFacilitatorsWidgetProps) {
  const [facilitators, setFacilitators] = useState<FacilitatorStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTopFacilitators() {
      setLoading(true);
      try {
        const statsMap = new Map<string, FacilitatorStat>();

        // Fetch Facilitators to map id -> email & name
        const { data: facilitatorsData } = await supabase
          .from('facilitators')
          .select('id, name, email');

        const facIdToEmail = new Map<string, string>();
        facilitatorsData?.forEach(f => {
          if (f.email) {
            facIdToEmail.set(f.id, f.email.toLowerCase());
            // Pre-initialize stats map just in case
            if (!statsMap.has(f.email.toLowerCase())) {
              statsMap.set(f.email.toLowerCase(), { id: f.id, name: f.name, sessionsDone: 0, tasksCreated: 0, feedbackDone: 0 });
            }
          }
        });

        // Query 1: Sessions Done
        let sessionsQuery = supabase
          .from('sessions')
          .select(`
            id,
            facilitator_name,
            session_date,
            session_type
          `)
          .in('status', ['completed', 'Completed']);
          
        if (startDate) {
          sessionsQuery = sessionsQuery.gte('session_date', startDate.toISOString().split('T')[0]);
        }
        if (endDate) {
          sessionsQuery = sessionsQuery.lte('session_date', endDate.toISOString().split('T')[0]);
        }
        if (sessionType && sessionType !== 'all') {
          sessionsQuery = sessionsQuery.eq('session_type', sessionType);
        }

        const { data: sessionsData, error: sessionsError } = await sessionsQuery;
        
        const facNameToEmail = new Map<string, string>();
        facilitatorsData?.forEach(f => {
          if (f.name && f.email) facNameToEmail.set(f.name, f.email.toLowerCase());
        });

        if (sessionsError) {
          console.error('Error fetching sessions:', sessionsError);
        } else {
          sessionsData?.forEach((record: any) => {
            if (!record.facilitator_name) return;
            const email = facNameToEmail.get(record.facilitator_name);
            if (!email) return;

            if (!statsMap.has(email)) {
              statsMap.set(email, { id: record.facilitator_name, name: record.facilitator_name, sessionsDone: 0, tasksCreated: 0, feedbackDone: 0 });
            }
            statsMap.get(email)!.sessionsDone += 1;
          });
        }

        // Fetch User Profiles to map user.id -> email
        const { data: profilesData } = await supabase
          .from('user_profiles')
          .select('id, full_name, email');
          
        const userIdToEmail = new Map<string, string>();
        const profileMap = new Map();
        
        profilesData?.forEach(p => {
          profileMap.set(p.id, p);
          let identifier = p.id;
          if (p.email) {
            identifier = p.email.toLowerCase();
          } else if (p.full_name) {
            const facEmail = facNameToEmail.get(p.full_name);
            identifier = facEmail || p.full_name;
          }
          userIdToEmail.set(p.id, identifier);
        });

        // Query 2: Tasks Created
        try {
          let createdQuery = supabase
            .from('student_task_feedback')
            .select('created_by, created_at, sessions!inner(session_type)');

          if (academicYear) {
            createdQuery = createdQuery.eq('academic_year', academicYear);
          }
          if (startDate) {
            createdQuery = createdQuery.gte('created_at', startDate.toISOString());
          }
          if (endDate) {
            const end = new Date(endDate);
            end.setDate(end.getDate() + 1);
            createdQuery = createdQuery.lt('created_at', end.toISOString());
          }
          if (sessionType && sessionType !== 'all') {
            createdQuery = createdQuery.eq('sessions.session_type', sessionType);
          }

          const { data: createdData, error: createdError } = await createdQuery;

          if (!createdError && createdData) {
            createdData.forEach((record: any) => {
              if (record.created_by) {
                const email = userIdToEmail.get(record.created_by);
                if (email) {
                  if (!statsMap.has(email)) {
                    const p = profileMap.get(record.created_by);
                    statsMap.set(email, { id: record.created_by, name: p?.full_name || 'Unknown', sessionsDone: 0, tasksCreated: 0, feedbackDone: 0 });
                  }
                  statsMap.get(email)!.tasksCreated += 1;
                }
              }
            });
          }
        } catch (colError) {
          console.log('created_by column might not exist yet:', colError);
        }

        // Query 3: Feedback Done
        try {
          let reviewedQuery = supabase
            .from('student_task_feedback')
            .select('verified_by, updated_at, sessions!inner(session_type)')
            .not('verified_by', 'is', null);

          if (academicYear) {
            reviewedQuery = reviewedQuery.eq('academic_year', academicYear);
          }
          if (startDate) {
            reviewedQuery = reviewedQuery.gte('updated_at', startDate.toISOString());
          }
          if (endDate) {
            const end = new Date(endDate);
            end.setDate(end.getDate() + 1);
            reviewedQuery = reviewedQuery.lt('updated_at', end.toISOString());
          }
          if (sessionType && sessionType !== 'all') {
            reviewedQuery = reviewedQuery.eq('sessions.session_type', sessionType);
          }

          const { data: reviewedData, error: reviewedError } = await reviewedQuery;

          if (!reviewedError && reviewedData) {
            reviewedData.forEach((record: any) => {
              if (record.verified_by) {
                const email = userIdToEmail.get(record.verified_by);
                if (email) {
                  if (!statsMap.has(email)) {
                    const p = profileMap.get(record.verified_by);
                    statsMap.set(email, { id: record.verified_by, name: p?.full_name || 'Unknown', sessionsDone: 0, tasksCreated: 0, feedbackDone: 0 });
                  }
                  statsMap.get(email)!.feedbackDone += 1;
                }
              }
            });
          }
        } catch (colError) {
          console.log('verified_by column might not exist yet:', colError);
        }

        setFacilitators(Array.from(statsMap.values()));
      } catch (e) {
        console.error('Error in fetchTopFacilitators:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchTopFacilitators();
  }, [startDate, endDate, academicYear, sessionType]);

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
              )) : <p className="text-sm text-muted-foreground text-center py-4">No tasks created found.</p>}
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
              )) : <p className="text-sm text-muted-foreground text-center py-4">No reviews found.</p>}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
