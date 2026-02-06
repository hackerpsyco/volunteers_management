import { useState, useEffect } from 'react';
import { Users, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

interface Volunteer {
  id: string;
  name: string;
}

interface VolunteerStats {
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
  const [stats, setStats] = useState<VolunteerStats>({
    totalSessions: 0,
    completedSessions: 0,
    committedSessions: 0,
    pendingSessions: 0,
    availableSessions: 0,
  });
  const [loading, setLoading] = useState(false);

  // Fetch volunteers on mount
  useEffect(() => {
    fetchVolunteers();
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

  // Fetch stats when volunteer is selected
  useEffect(() => {
    if (selectedVolunteer) {
      fetchVolunteerStats(selectedVolunteer.id);
    } else {
      setStats({
        totalSessions: 0,
        completedSessions: 0,
        committedSessions: 0,
        pendingSessions: 0,
        availableSessions: 0,
      });
    }
  }, [selectedVolunteer]);

  const fetchVolunteers = async () => {
    try {
      const { data, error } = await supabase
        .from('volunteers')
        .select('id, name')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setVolunteers(data || []);
      setFilteredVolunteers(data || []);
    } catch (error) {
      console.error('Error fetching volunteers:', error);
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

      const newStats: VolunteerStats = {
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
    { label: 'Total Sessions', value: stats.totalSessions, color: 'bg-blue-100', textColor: 'text-blue-800' },
    { label: 'Completed', value: stats.completedSessions, color: 'bg-green-100', textColor: 'text-green-800' },
    { label: 'Committed', value: stats.committedSessions, color: 'bg-purple-100', textColor: 'text-purple-800' },
    { label: 'Pending', value: stats.pendingSessions, color: 'bg-yellow-100', textColor: 'text-yellow-800' },
    { label: 'Available', value: stats.availableSessions, color: 'bg-cyan-100', textColor: 'text-cyan-800' },
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="text-lg md:text-xl font-bold text-foreground">Volunteer by total sessions</h2>
      </div>

      {/* Searchable Volunteer Selector */}
      <div className="mb-6 relative">
        <label className="text-sm font-medium text-foreground block mb-2">
          Select Volunteer
        </label>
        
        <div className="relative">
          {/* Search Input */}
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search volunteer..."
              value={selectedVolunteer ? selectedVolunteer.name : searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              className="pl-10 pr-10"
            />
            {selectedVolunteer && (
              <button
                onClick={handleClearSelection}
                className="absolute right-3 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Dropdown List */}
          {isDropdownOpen && !selectedVolunteer && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
              {filteredVolunteers.length > 0 ? (
                filteredVolunteers.map((volunteer) => (
                  <button
                    key={volunteer.id}
                    onClick={() => handleSelectVolunteer(volunteer)}
                    className="w-full text-left px-4 py-2 hover:bg-accent transition-colors text-sm"
                  >
                    {volunteer.name}
                  </button>
                ))
              ) : (
                <div className="px-4 py-2 text-sm text-muted-foreground">
                  No volunteers found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats Display */}
      {selectedVolunteer ? (
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            statItems.map((item, index) => (
              <div key={index} className={`${item.color} rounded-lg p-3 md:p-4 flex justify-between items-center`}>
                <span className={`font-medium text-sm md:text-base ${item.textColor}`}>{item.label}</span>
                <span className={`font-bold text-lg md:text-xl ${item.textColor}`}>{item.value}</span>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">Search and select a volunteer to view their session statistics</p>
        </div>
      )}
    </div>
  );
}
