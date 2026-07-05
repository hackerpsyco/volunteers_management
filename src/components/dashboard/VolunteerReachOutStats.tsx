import { useState, useEffect } from 'react';
import { MessageSquare, Search, Eye } from 'lucide-react';
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
  const [remarksLimit, setRemarksLimit] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReachOut, setSelectedReachOut] = useState<RecentReachOut | null>(null);

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

      setRecentReachOuts(allRemarks);
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

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  };

  const filteredReachOuts = recentReachOuts.filter(item => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      item.volunteerName.toLowerCase().includes(query) ||
      stripHtml(item.remarkText).toLowerCase().includes(query)
    );
  });

  return (
    <div className="bg-card border border-border rounded-lg p-3 md:p-4 h-full flex flex-col">
      <div className="flex flex-col gap-2 mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          <h2 className="text-base md:text-lg font-bold text-foreground">Volunteer Reach Out</h2>
        </div>
        
        {/* Search Bar */}
        <div className="relative mt-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search name or remark..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          />
        </div>
      </div>

      <div className="space-y-2 flex-grow overflow-y-auto pr-1">
        <p className="text-[10px] md:text-xs font-bold text-muted-foreground mb-2 px-1 uppercase tracking-wider">Recent Remarks</p>
        
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        ) : filteredReachOuts.length > 0 ? (
          filteredReachOuts.slice(0, remarksLimit).map((item, index) => {
            const key = `${item.volunteerId}-${index}`;
            return (
              <div
                key={key}
                onClick={() => setSelectedReachOut(item)}
                className="bg-muted/20 border border-border/50 rounded-lg p-2 flex flex-col justify-center hover:bg-muted/30 transition-colors cursor-pointer group"
                title="Click to view full remark"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-[10px] md:text-xs text-foreground truncate max-w-[150px] group-hover:text-primary transition-colors">
                    {item.volunteerName}
                  </span>
                  <div className="flex items-center gap-1 ml-2">
                    <span className="text-[9px] md:text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDate(item.timestamp)}
                    </span>
                    <Eye className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
                <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-2">
                  {stripHtml(item.remarkText)}
                </p>
              </div>
            );
          })
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground text-[10px] md:text-xs">
              {searchQuery ? 'No matching remarks found' : 'No recent reach outs available'}
            </p>
          </div>
        )}

        {filteredReachOuts.length > 5 && (
          <div className="flex gap-2 mt-2">
            {remarksLimit < filteredReachOuts.length && (
              <button 
                onClick={() => setRemarksLimit(prev => prev + 5)}
                className="flex-1 py-1 text-[10px] md:text-xs text-primary font-bold hover:bg-primary/5 border border-primary/20 rounded-md transition-colors text-center"
              >
                See More
              </button>
            )}
            {remarksLimit > 5 && (
              <button 
                onClick={() => setRemarksLimit(prev => Math.max(5, prev - 5))}
                className="flex-1 py-1 text-[10px] md:text-xs text-muted-foreground font-bold hover:bg-muted/10 border border-border rounded-md transition-colors text-center"
              >
                See Less
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      {selectedReachOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-lg max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">{selectedReachOut.volunteerName}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{formatDate(selectedReachOut.timestamp)}</p>
              </div>
              <button 
                onClick={() => setSelectedReachOut(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1 rounded-md hover:bg-muted"
              >
                ✕
              </button>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 border border-border/50 max-h-60 overflow-y-auto prose prose-sm max-w-none">
              <div 
                className="text-sm text-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: selectedReachOut.remarkText }}
              />
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedReachOut(null)}
                className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-md hover:bg-primary/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
