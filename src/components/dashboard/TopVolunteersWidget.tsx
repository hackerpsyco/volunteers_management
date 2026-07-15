import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TopVolunteersWidgetProps {
  startDate: Date | null;
  endDate: Date | null;
}

interface SessionDetail {
  id: string;
  title: string;
  date: string;
  hours: number;
}

interface VolunteerStat {
  name: string;
  totalTime: number;
  sessions: SessionDetail[];
}

export function TopVolunteersWidget({ startDate, endDate }: TopVolunteersWidgetProps) {
  const [volunteers, setVolunteers] = useState<VolunteerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(5);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerStat | null>(null);

  useEffect(() => {
    const fetchTopVolunteers = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);

        // Fetch sessions and their hours tracker
        let query = supabase
          .from('sessions')
          .select(`
            id,
            title,
            session_date,
            volunteer_name,
            session_hours_tracker(total_volunteering_time)
          `);

        if (startDate) {
          query = query.gte('session_date', startDate.toISOString().split('T')[0]);
        }
        if (endDate) {
          query = query.lte('session_date', endDate.toISOString().split('T')[0]);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching volunteer hours:', error);
          setErrorMessage(`Error: ${error.message || JSON.stringify(error)}`);
          return;
        }

        const statsMap = new Map<string, { totalTime: number, sessions: SessionDetail[] }>();

        data?.forEach((session: any) => {
          const vName = session.volunteer_name?.trim();
          if (!vName || vName === '-') return;

          const tracker = Array.isArray(session.session_hours_tracker) 
            ? session.session_hours_tracker[0] 
            : session.session_hours_tracker;

          const time = Number(tracker?.total_volunteering_time || 0);

          if (time > 0) {
            if (!statsMap.has(vName)) {
              statsMap.set(vName, { totalTime: 0, sessions: [] });
            }
            const stat = statsMap.get(vName)!;
            stat.totalTime += time;
            stat.sessions.push({
              id: session.id,
              title: session.title || 'Untitled Session',
              date: session.session_date,
              hours: time
            });
          }
        });

        const sortedVolunteers = Array.from(statsMap.entries())
          .map(([name, stat]) => ({ name, totalTime: stat.totalTime, sessions: stat.sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) }))
          .sort((a, b) => b.totalTime - a.totalTime);

        setVolunteers(sortedVolunteers);
      } catch (e) {
        console.error('Error in fetchTopVolunteers:', e);
        setErrorMessage('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchTopVolunteers();
  }, [startDate, endDate]);

  const topVolunteers = volunteers.slice(0, limit);

  return (
    <Card className="col-span-1 border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Award className="h-5 w-5 text-blue-500" />
          Top Volunteering Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        {errorMessage ? (
          <div className="p-4 text-sm text-red-500 bg-red-50 rounded-md">
            {errorMessage}
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : volunteers.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">No volunteer hours recorded for this period.</p>
        ) : (
          <div className="space-y-4 pt-2">
            {topVolunteers.map((volunteer, i) => (
              <div key={volunteer.name} className="flex items-center justify-between group">
                <div className="flex items-center gap-3 min-w-0">
                  {i === 0 && (
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-[11px] font-extrabold text-blue-700 border border-blue-200 shrink-0">
                      1
                    </span>
                  )}
                  {i === 1 && (
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-[11px] font-extrabold text-slate-700 border border-slate-200 shrink-0">
                      2
                    </span>
                  )}
                  {i === 2 && (
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-[11px] font-extrabold text-slate-700 border border-slate-200 shrink-0">
                      3
                    </span>
                  )}
                  {i > 2 && (
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-[11px] font-bold text-muted-foreground shrink-0">
                      {i + 1}
                    </span>
                  )}
                  <button 
                    onClick={() => setSelectedVolunteer(volunteer)}
                    className="font-medium text-sm text-left group-hover:text-primary transition-colors truncate hover:underline" 
                    title={`View ${volunteer.name}'s sessions`}
                  >
                    {volunteer.name}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs bg-blue-50/85 px-2.5 py-0.5 rounded-full border border-blue-100 shrink-0">
                  <span>{volunteer.totalTime}</span>
                  <span className="text-[9px] uppercase tracking-wider text-blue-700/80">HRS</span>
                </div>
              </div>
            ))}
            {(volunteers.length > limit || limit > 5) && (
              <div className="pt-2 flex justify-center gap-2 border-t border-dashed mt-2">
                {volunteers.length > limit && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setLimit(prev => prev + 5)}
                    className="text-xs text-primary font-semibold hover:underline h-8 flex-1"
                  >
                    See More
                  </Button>
                )}
                {limit > 5 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setLimit(5)}
                    className="text-xs text-muted-foreground font-semibold hover:underline h-8 flex-1"
                  >
                    See Less
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Volunteer Details Dialog */}
      <Dialog open={!!selectedVolunteer} onOpenChange={(open) => !open && setSelectedVolunteer(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Award className="h-5 w-5 text-blue-500" />
              {selectedVolunteer?.name}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Total Volunteering Time: <strong className="text-blue-600">{selectedVolunteer?.totalTime} Hours</strong>
            </p>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <h4 className="text-sm font-semibold mb-2">Session Breakdown</h4>
            {selectedVolunteer?.sessions.map(session => (
              <div key={session.id} className="flex flex-col p-3 rounded-lg border border-border bg-muted/30">
                <div className="flex justify-between items-start gap-2">
                  <span className="font-medium text-sm line-clamp-2">{session.title}</span>
                  <span className="font-bold text-sm text-blue-600 whitespace-nowrap">{session.hours} hrs</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(session.date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
