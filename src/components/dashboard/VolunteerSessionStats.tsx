import { useState, useEffect } from 'react';
import { Users, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

interface Volunteer {
  id: string;
  name: string;
}

interface VolunteerStats extends Volunteer {
  sessionCount: number;
}

interface VolunteerSessionStatsData {
  totalSessions: number;
  completedSessions: number;
  committedSessions: number;
  pendingSessions: number;
  availableSessions: number;
}

export function VolunteerSessionStats() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [filteredVolunteers, setFilteredVolunteers] = useState<Volunteer[]>([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [searchInput, setSearchInput] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [rankings, setRankings] = useState<VolunteerStats[]>([]);
  const [selectedVolunteerRank, setSelectedVolunteerRank] = useState<number | null>(null);
  const [stats, setStats] = useState<VolunteerSessionStatsData>({
    totalSessions: 0,
    completedSessions: 0,
    committedSessions: 0,
    pendingSessions: 0,
    availableSessions: 0,
  });
  const [loading, setLoading] = useState(false);

  // Fetch volunteers and rankings on mount
  useEffect(() => {
    fetchVolunteersAndRankings();
  }, []);

  // Filter volunteers based on search input
  useEffect(() => {
    if (searchInput.trim() === '') {
      setFilteredVolunteers(volunteers);
    } else {
      const filtered = volunteers.filter(v =>
        v.name.toLowerCase().includes(searchInput.toLowerCase())
      );
      setFilteredVolunteers(filtered);
    }
  }, [searchInput, volunteers]);

  // Fetch stats and rank when volunteer is selected
  useEffect(() => {
    if (selectedVolunteer) {
      fetchVolunteerStats(selectedVolunteer.id);
      // Calculate rank
      const rankIndex = rankings.findIndex(r => r.id === selectedVolunteer.id);
      setSelectedVolunteerRank(rankIndex !== -1 ? rankIndex + 1 : null);
    } else {
      setStats({
        totalSessions: 0,
        completedSessions: 0,
        committedSessions: 0,
        pendingSessions: 0,
        availableSessions: 0,
      });
      setSelectedVolunteerRank(null);
    }
  }, [selectedVolunteer, rankings]);

  const fetchVolunteersAndRankings = async () => {
    try {
      setLoading(true);
      const { data: volData, error: volError } = await supabase
        .from('volunteers')
        .select('id, name')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (volError) throw volError;
      setVolunteers(volData || []);
      setFilteredVolunteers(volData || []);

      // Fetch session counts for rankings
      const { data: sessData, error: sessError } = await supabase
        .from('sessions')
        .select('volunteer_id');

      if (sessError) throw sessError;

      const counts: Record<string, number> = {};
      sessData?.forEach(s => {
        if (s.volunteer_id) {
          counts[s.volunteer_id] = (counts[s.volunteer_id] || 0) + 1;
        }
      });

      const processedRankings = (volData || []).map(v => ({
        ...v,
        sessionCount: counts[v.id] || 0
      })).sort((a, b) => b.sessionCount - a.sessionCount);

      setRankings(processedRankings);
    } catch (error) {
      console.error('Error fetching volunteers and rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVolunteerStats = async (volunteerId: string) => {
    try {
      setLoading(true);

      // Fetch all sessions for this volunteer using a helper to avoid type inference issues
      // @ts-ignore - Supabase type inference issue
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select('status')
        .eq('volunteer_id', volunteerId);

      if (error) throw error;

      const sessionList = (sessions as any[]) || [];

      const newStats: VolunteerSessionStatsData = {
        totalSessions: sessionList.length,
        completedSessions: sessionList.filter((s: any) => s.status === 'completed').length,
        committedSessions: sessionList.filter((s: any) => s.status === 'committed').length,
        pendingSessions: sessionList.filter((s: any) => s.status === 'pending').length,
        availableSessions: sessionList.filter((s: any) => s.status === 'available').length,
      };

      setStats(newStats);
    } catch (error) {
      console.error('Error fetching volunteer stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVolunteer = (volunteer: Volunteer) => {
    setSelectedVolunteer(volunteer);
    setSearchInput('');
    setIsDropdownOpen(false);
  };

  const handleClearSelection = () => {
    setSelectedVolunteer(null);
    setSearchInput('');
    setIsDropdownOpen(false);
  };

  const statItems = [
    { label: 'Current Ranking', value: selectedVolunteerRank ? `#${selectedVolunteerRank}` : 'N/A', color: 'bg-yellow-50', textColor: 'text-yellow-800' },
    { label: 'Total Sessions', value: stats.totalSessions, color: 'bg-muted/30', textColor: 'text-blue-700' },
    { label: 'Completed', value: stats.completedSessions, color: 'bg-muted/30', textColor: 'text-green-700' },
    { label: 'Committed', value: stats.committedSessions, color: 'bg-muted/30', textColor: 'text-purple-700' },
    { label: 'Pending', value: stats.pendingSessions, color: 'bg-muted/30', textColor: 'text-yellow-700' },
    { label: 'Available', value: stats.availableSessions, color: 'bg-muted/30', textColor: 'text-cyan-700' },
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-3 md:p-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
        <h2 className="text-base md:text-lg font-bold text-foreground">Volunteer by total sessions</h2>
      </div>

      {/* Searchable Volunteer Selector */}
      <div className="mb-4 relative">
        <label className="text-[10px] md:text-xs font-medium text-foreground block mb-1">
          Select Volunteer
        </label>

        <div className="relative">
          {/* Search Input */}
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search volunteer..."
              value={selectedVolunteer ? selectedVolunteer.name : searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              className="pl-8 md:pl-10 pr-10 h-8 md:h-10 text-[10px] md:text-xs"
            />
            {selectedVolunteer && (
              <button
                onClick={handleClearSelection}
                className="absolute right-3 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3 md:h-4 md:w-4" />
              </button>
            )}
          </div>

          {/* Dropdown List */}
          {isDropdownOpen && !selectedVolunteer && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
              {filteredVolunteers.length > 0 ? (
                filteredVolunteers.map((volunteer) => (
                  <button
                    key={volunteer.id}
                    onClick={() => handleSelectVolunteer(volunteer)}
                    className="w-full text-left px-3 py-1.5 hover:bg-accent transition-colors text-[10px] md:text-xs"
                  >
                    {volunteer.name}
                  </button>
                ))
              ) : (
                <div className="px-3 py-1.5 text-[10px] md:text-xs text-muted-foreground">
                  No volunteers found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats/Rankings Display */}
      {loading && !rankings.length ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-4 w-4 md:h-6 md:w-6 border-b-2 border-primary"></div>
        </div>
      ) : selectedVolunteer ? (
        <div className="space-y-2">
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-4 w-4 md:h-6 md:w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            statItems.map((item, index) => (
              <div key={index} className={`${item.color} rounded-lg p-2 md:p-3 flex justify-between items-center`}>
                <span className={`font-medium text-[10px] md:text-xs ${item.textColor}`}>{item.label}</span>
                <span className={`font-bold text-sm md:text-base ${item.textColor}`}>{item.value}</span>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[10px] md:text-xs font-bold text-muted-foreground mb-2 px-1 uppercase tracking-wider">Top 5 Volunteers</p>
          {rankings.slice(0, 5).map((rank, index) => (
            <div
              key={rank.id}
              className="bg-muted/20 border border-border/50 rounded-lg p-2 flex justify-between items-center hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => handleSelectVolunteer({ id: rank.id, name: rank.name })}
            >
              <div className="flex items-center gap-2">
                <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-muted text-muted-foreground'}`}>
                  {index + 1}
                </span>
                <span className="font-medium text-[10px] md:text-xs text-foreground truncate max-w-[120px]">{rank.name}</span>
              </div>
              <span className="font-bold text-[10px] md:text-xs text-primary">{rank.sessionCount} sessions</span>
            </div>
          ))}
          {rankings.length === 0 && (
            <div className="text-center py-6">
              <p className="text-muted-foreground text-[10px] md:text-xs">No volunteer session rankings available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
