import { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RecentReachOut {
  volunteerId: string;
  volunteerName: string;
  remarkText: string;
  timestamp: string;
}

export function VolunteerReachOutStats() {
  const [recentReachOuts, setRecentReachOuts] = useState<RecentReachOut[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRecentReachOuts();
  }, []);

  const fetchRecentReachOuts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('volunteers')
        .select('id, name, remarks, created_at')
        .not('remarks', 'is', null);

      if (error) throw error;

      const allRemarks: RecentReachOut[] = [];

      data?.forEach(v => {
        if (!v.remarks) return;
        
        // Use created_at as a fallback if available, otherwise current date
        const fallbackDate = v.created_at || new Date().toISOString();
        
        try {
          const parsed = JSON.parse(v.remarks);
          if (Array.isArray(parsed)) {
            parsed.forEach((r: any) => {
              allRemarks.push({
                volunteerId: v.id,
                volunteerName: v.name,
                remarkText: r.text || '',
                timestamp: r.timestamp || fallbackDate
              });
            });
          } else if (typeof v.remarks === 'string' && v.remarks.trim()) {
            allRemarks.push({
              volunteerId: v.id,
              volunteerName: v.name,
              remarkText: v.remarks,
              timestamp: fallbackDate
            });
          }
        } catch (e) {
          if (typeof v.remarks === 'string' && v.remarks.trim()) {
             allRemarks.push({
              volunteerId: v.id,
              volunteerName: v.name,
              remarkText: v.remarks,
              timestamp: fallbackDate
            });
          }
        }
      });

      allRemarks.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setRecentReachOuts(allRemarks.slice(0, 5));
    } catch (error) {
      console.error('Error fetching reach outs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-3 md:p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="h-4 w-4 md:h-5 md:w-5 text-primary" />
        <h2 className="text-base md:text-lg font-bold text-foreground">Volunteer Reach Out</h2>
      </div>

      <div className="space-y-2 flex-grow overflow-y-auto pr-1">
        <p className="text-[10px] md:text-xs font-bold text-muted-foreground mb-2 px-1 uppercase tracking-wider">Recent Remarks</p>
        
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        ) : recentReachOuts.length > 0 ? (
          recentReachOuts.map((item, index) => (
            <div
              key={`${item.volunteerId}-${index}`}
              className="bg-muted/20 border border-border/50 rounded-lg p-2 flex flex-col justify-center hover:bg-muted/30 transition-colors"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-[10px] md:text-xs text-foreground truncate max-w-[150px]">
                  {item.volunteerName}
                </span>
                <span className="text-[9px] md:text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                  {formatDate(item.timestamp)}
                </span>
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-2" title={item.remarkText}>
                {item.remarkText}
              </p>
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground text-[10px] md:text-xs">No recent reach outs available</p>
          </div>
        )}
      </div>
    </div>
  );
}
