import { useState, useEffect } from 'react';
import { Wallet, Search, TrendingUp, Settings, CheckCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FacilitatorEarning {
  id: string;
  name: string;
  location: string;
  phone: string;
  total_approved: number;
  total_pending: number;
  last_earned_at: string | null;
}

interface EarningRecord {
  id: string;
  facilitator_id: string;
  session_id: string;
  amount: number;
  status: string;
  created_at: string;
  approved_at: string | null;
  sessions?: {
    title: string;
    session_date: string;
  };
}

export default function AdminFacilitatorEarnings() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [earningsData, setEarningsData] = useState<FacilitatorEarning[]>([]);
  const [selectedFacilitator, setSelectedFacilitator] = useState<FacilitatorEarning | null>(null);
  const [records, setRecords] = useState<EarningRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [perSessionAmount, setPerSessionAmount] = useState<number>(0);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  // Pending unrecorded sessions
  const [pendingSessions, setPendingSessions] = useState<any[]>([]);
  const { selectedYear, getDateRange } = useAcademicYear();
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth().toString());
  
  // Editing state
  const [editingEarningId, setEditingEarningId] = useState<string | null>(null);
  const [editEarningAmount, setEditEarningAmount] = useState<string>('');

  useEffect(() => {
    fetchEarnings();
    fetchSettings();
  }, [selectedYear, selectedMonth]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('facilitator_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      if (data) setPerSessionAmount(data.per_session_amount);
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSavingSettings(true);
      const { data: existingData } = await supabase
        .from('facilitator_settings')
        .select('id')
        .limit(1)
        .single();
        
      let error;
      if (existingData) {
        ({ error } = await supabase
          .from('facilitator_settings')
          .update({ per_session_amount: perSessionAmount })
          .eq('id', existingData.id));
      } else {
        ({ error } = await supabase
          .from('facilitator_settings')
          .insert({ per_session_amount: perSessionAmount }));
      }
      
      if (error) throw error;
      toast.success('Settings saved successfully');
      setIsSettingsOpen(false);
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Failed to save settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      
      const { data: facilitators, error: facError } = await supabase
        .from('facilitators')
        .select(`
          id,
          name,
          location,
          phone,
          facilitator_earnings (
            amount,
            status,
            created_at
          )
        `);

      if (facError) throw facError;

      const { startDate, endDate } = getDateRange();

      const aggregated = (facilitators || []).map((f: any) => {
        const earnings = (f.facilitator_earnings || []).filter((e: any) => {
          const earnedAt = new Date(e.created_at);
          const matchesAcademicYear = earnedAt >= startDate && earnedAt <= endDate;
          const matchesMonth = selectedMonth === 'all' || earnedAt.getMonth().toString() === selectedMonth;
          return matchesAcademicYear && matchesMonth;
        });
        const approved = earnings.filter((e: any) => e.status === 'approved');
        const pending = earnings.filter((e: any) => e.status === 'pending');
        
        const totalApproved = approved.reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0);
        const totalPending = pending.reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0);
        
        const lastRecord = earnings.length > 0 
          ? [...earnings].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
          : null;

        return {
          id: f.id,
          name: f.name,
          location: f.location || '-',
          phone: f.phone || '-',
          total_approved: totalApproved,
          total_pending: totalPending,
          last_earned_at: lastRecord?.created_at || null
        };
      });

      setEarningsData(aggregated);
    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const fetchFacilitatorRecords = async (facilitatorId: string, facilitatorName: string) => {
    try {
      setLoadingRecords(true);
      const { data, error } = await supabase
        .from('facilitator_earnings')
        .select(`
          *,
          sessions!inner (
            title,
            session_date
          )
        `)
        .eq('facilitator_id', facilitatorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const { startDate, endDate } = getDateRange();
      
      // Filter records by academic year
      const filteredRecords = (data || []).filter(r => {
        const earnedAt = new Date(r.created_at);
        return earnedAt >= startDate && earnedAt <= endDate;
      });
      setRecords(filteredRecords);
      
      // Also fetch completed sessions that haven't been added to earnings yet
      const { data: completedSessions, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .ilike('status', 'completed')
        .ilike('facilitator_name', `%${facilitatorName}%`)
        .gte('session_date', startDate.toISOString())
        .lte('session_date', endDate.toISOString());
        
      if (sessionError) throw sessionError;
      
      // Filter out sessions that already have an earning record
      const existingSessionIds = (data || []).map((r: any) => r.session_id);
      const pendingUnrecorded = (completedSessions || []).filter(s => !existingSessionIds.includes(s.id));
      
      setPendingSessions(pendingUnrecorded);
      
    } catch (error) {
      console.error('Error fetching records:', error);
      toast.error('Failed to load records');
    } finally {
      setLoadingRecords(false);
    }
  };

  const approveEarning = async (earningId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('facilitator_earnings')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id
        })
        .eq('id', earningId);

      if (error) throw error;
      toast.success('Earning approved successfully');
      
      if (selectedFacilitator) {
        fetchFacilitatorRecords(selectedFacilitator.id, selectedFacilitator.name);
      }
      fetchEarnings();
    } catch (error) {
      console.error('Error approving earning:', error);
      toast.error('Failed to approve earning');
    }
  };
  
  const updateEarningAmount = async (id: string) => {
    try {
      const amount = parseFloat(editEarningAmount);
      if (isNaN(amount) || amount < 0) {
        toast.error('Invalid amount');
        return;
      }
      
      const { error } = await supabase
        .from('facilitator_earnings')
        .update({ amount })
        .eq('id', id);

      if (error) throw error;
      toast.success('Earning updated successfully');
      
      if (selectedFacilitator) {
        fetchFacilitatorRecords(selectedFacilitator.id, selectedFacilitator.name);
      }
      fetchEarnings();
      setEditingEarningId(null);
    } catch (error) {
      console.error('Error updating earning:', error);
      toast.error('Failed to update earning');
    }
  };
  
  const createEarning = async (sessionId: string) => {
    try {
      if (!selectedFacilitator) return;
      
      // Auto-approve if they are just creating it from pending list
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('facilitator_earnings')
        .insert({
          facilitator_id: selectedFacilitator.id,
          session_id: sessionId,
          amount: perSessionAmount,
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id
        });

      if (error) throw error;
      toast.success('Earning added and approved successfully');
      
      fetchFacilitatorRecords(selectedFacilitator.id, selectedFacilitator.name);
      fetchEarnings();
    } catch (error) {
      console.error('Error creating earning:', error);
      toast.error('Failed to add earning');
    }
  };

  const handleExportBankFormat = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthLabel = selectedMonth === 'all' ? 'All_Months' : monthNames[parseInt(selectedMonth)];

    const headers = [
      'Facilitator Name',
      'Location',
      'Phone Number',
      `Total Approved (₹) - ${monthLabel} ${selectedYear}`,
      `Total Pending (₹) - ${monthLabel} ${selectedYear}`
    ];

    const csvRows = [headers.join(',')];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    let count = 0;
    filteredData.forEach((f) => {
      if (f.total_approved <= 0 && f.total_pending <= 0) return;
      count++;
      const row = [
        f.name,
        f.location,
        f.phone,
        f.total_approved,
        f.total_pending
      ];
      csvRows.push(row.map(escapeCsv).join(','));
    });

    if (count === 0) {
      toast.error('No earnings found to export.');
      return;
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Facilitator_Earnings_${monthLabel}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Successfully exported earnings for ${count} facilitators`);
  };

  const filteredData = earningsData.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Facilitator Earnings</h1>
            <p className="text-muted-foreground">Manage and approve earnings for facilitators</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsSettingsOpen(true)} className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button onClick={handleExportBankFormat} className="gap-2 bg-green-600 hover:bg-green-700 text-white border-0">
              <Wallet className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Approved Payouts</p>
                  <h3 className="text-2xl font-bold mt-2">
                    ₹{earningsData.reduce((acc, curr) => acc + curr.total_approved, 0).toLocaleString('en-IN')}
                  </h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Pending Payouts</p>
                  <h3 className="text-2xl font-bold mt-2 text-yellow-600">
                    ₹{earningsData.reduce((acc, curr) => acc + curr.total_pending, 0).toLocaleString('en-IN')}
                  </h3>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <TrendingUp className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Facilitator Earnings List</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search facilitators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  <SelectItem value="5">June</SelectItem>
                  <SelectItem value="6">July</SelectItem>
                  <SelectItem value="7">August</SelectItem>
                  <SelectItem value="8">September</SelectItem>
                  <SelectItem value="9">October</SelectItem>
                  <SelectItem value="10">November</SelectItem>
                  <SelectItem value="11">December</SelectItem>
                  <SelectItem value="0">January</SelectItem>
                  <SelectItem value="1">February</SelectItem>
                  <SelectItem value="2">March</SelectItem>
                  <SelectItem value="3">April</SelectItem>
                  <SelectItem value="4">May</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Facilitator Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Total Approved</TableHead>
                    <TableHead className="text-right">Total Pending</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                    </TableRow>
                  ) : filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No facilitators found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((f) => (
                      <TableRow key={f.id} className="cursor-pointer hover:bg-muted/50" onClick={() => {
                        setSelectedFacilitator(f);
                        fetchFacilitatorRecords(f.id, f.name);
                      }}>
                        <TableCell className="font-medium">{f.name}</TableCell>
                        <TableCell>{f.location}</TableCell>
                        <TableCell>{f.phone}</TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          ₹{f.total_approved.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-right text-yellow-600 font-medium">
                          ₹{f.total_pending.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">View Details</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Details Dialog */}
        <Dialog open={!!selectedFacilitator} onOpenChange={(open) => !open && setSelectedFacilitator(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Earnings Details: {selectedFacilitator?.name}</DialogTitle>
              <DialogDescription>
                Review and approve session earnings for this facilitator. Note: Only 'Completed' sessions appear here.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Completed but Unrecorded Sessions */}
              {pendingSessions.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Completed Sessions (Pending Earning Record)</h4>
                  <div className="rounded-md border bg-yellow-50/50">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Session</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingSessions.map(session => (
                          <TableRow key={session.id}>
                            <TableCell className="font-medium">{session.title}</TableCell>
                            <TableCell>{session.session_date}</TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" onClick={() => createEarning(session.id)} className="gap-2">
                                <CheckCircle className="h-3 w-3" />
                                Approve Earning (₹{perSessionAmount})
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            
              {/* Existing Earning Records */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Earnings History</h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Session</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingRecords ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-4">Loading...</TableCell></TableRow>
                      ) : records.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground">No earnings recorded yet</TableCell></TableRow>
                      ) : (
                        records.map(record => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">{record.sessions?.title || 'Unknown Session'}</TableCell>
                            <TableCell>{record.sessions?.session_date ? new Date(record.sessions.session_date).toLocaleDateString() : '-'}</TableCell>
                            <TableCell>
                              <Badge variant={record.status === 'approved' ? 'default' : 'secondary'}>
                                {record.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium text-green-600">
                              {editingEarningId === record.id ? (
                                <Input 
                                  type="number" 
                                  value={editEarningAmount}
                                  onChange={(e) => setEditEarningAmount(e.target.value)}
                                  className="w-24 ml-auto text-right"
                                />
                              ) : (
                                `₹${record.amount.toLocaleString('en-IN')}`
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {editingEarningId === record.id ? (
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" onClick={() => updateEarningAmount(record.id)}>Save</Button>
                                  <Button size="sm" variant="ghost" onClick={() => setEditingEarningId(null)}>Cancel</Button>
                                </div>
                              ) : (
                                <div className="flex justify-end gap-2">
                                  {record.status === 'pending' && (
                                    <Button size="sm" onClick={() => approveEarning(record.id)}>
                                      Approve
                                    </Button>
                                  )}
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => {
                                      setEditingEarningId(record.id);
                                      setEditEarningAmount(record.amount.toString());
                                    }}
                                  >
                                    Edit
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Settings Dialog */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Facilitator Earnings Settings</DialogTitle>
              <DialogDescription>
                Configure the global per-session amount paid to facilitators.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label>Per Session Amount (₹)</Label>
                <Input 
                  type="number" 
                  value={perSessionAmount} 
                  onChange={(e) => setPerSessionAmount(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">This amount will be used by default when approving new session earnings.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
              <Button onClick={saveSettings} disabled={isSavingSettings}>Save Settings</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
