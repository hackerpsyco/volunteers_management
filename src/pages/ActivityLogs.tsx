import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClipboardList, Search, RefreshCw, AlertTriangle, Terminal, Info } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ActivityLog {
  id: string;
  user_email: string;
  user_name: string | null;
  action: string;
  module: string;
  details: string | null;
  created_at: string;
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModule, setFilterModule] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [errorNotice, setErrorNotice] = useState(false);
  const [limit, setLimit] = useState(50);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setErrorNotice(false);
      
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('relation "public.activity_logs" does not exist')) {
          setErrorNotice(true);
        } else {
          throw error;
        }
      } else {
        setLogs(data || []);
      }
    } catch (error: any) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [limit]);

  // Unique modules and actions for filter dropdowns
  const modules = ['Classes', 'Students', 'Tasks', 'Sessions', 'Earnings'];
  const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOCK', 'UNLOCK', 'VERIFY', 'REJECT'];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.user_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.user_email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesModule = filterModule === 'all' || log.module === filterModule;
    const matchesAction = filterAction === 'all' || log.action === filterAction;

    return matchesSearch && matchesModule && matchesAction;
  });

  const getActionBadgeVariant = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATE':
        return 'default';
      case 'UPDATE':
        return 'secondary';
      case 'DELETE':
        return 'destructive';
      case 'LOCK':
        return 'outline';
      case 'UNLOCK':
        return 'outline';
      case 'VERIFY':
        return 'default';
      case 'REJECT':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getActionBadgeClass = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATE':
        return 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200';
      case 'VERIFY':
        return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200';
      case 'DELETE':
      case 'REJECT':
        return 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200';
      case 'LOCK':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200';
      case 'UNLOCK':
        return 'bg-teal-100 text-teal-800 hover:bg-teal-100 border-teal-200';
      default:
        return '';
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Activity Logs</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Audit trails of all administrator actions across the platform
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchLogs} 
            disabled={loading}
            className="self-start md:self-auto gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Logs
          </Button>
        </div>

        {/* Database Migration Alert Notice if Table doesn't exist */}
        {errorNotice && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-amber-800 flex items-center gap-2 text-base">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Database Migration Required
              </CardTitle>
              <CardDescription className="text-amber-700 text-xs">
                The <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900">activity_logs</code> database table needs to be created. Please run the migration SQL below inside your Supabase console SQL Editor to activate logging.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto relative group">
                <Button 
                  size="xs" 
                  variant="ghost" 
                  className="absolute right-2 top-2 text-[10px] text-slate-400 hover:text-slate-100 h-6 bg-slate-800"
                  onClick={() => {
                    navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    user_name TEXT,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to insert activity logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to select activity logs" ON public.activity_logs FOR SELECT TO authenticated USING (true);`);
                    toast.success('SQL migration script copied to clipboard!');
                  }}
                >
                  Copy SQL
                </Button>
                <span className="text-slate-400">-- 1. Create table</span>
                <br />
                CREATE TABLE IF NOT EXISTS public.activity_logs (
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;user_email TEXT NOT NULL,
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;user_name TEXT,
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;action TEXT NOT NULL,
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;module TEXT NOT NULL,
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;details TEXT,
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
                <br />
                );
                <br />
                <span className="text-slate-400">-- 2. Enable RLS and setup policies</span>
                <br />
                ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
                <br />
                CREATE POLICY "Allow authenticated users to insert activity logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (true);
                <br />
                CREATE POLICY "Allow authenticated users to select activity logs" ON public.activity_logs FOR SELECT TO authenticated USING (true);
              </div>
              <div className="flex items-start gap-2 text-xs text-amber-700">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Once the database migration is executed, refresh this page to view activity logs.</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Controls */}
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="w-full md:w-1/3 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user or details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-sm border-border h-9"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap w-full md:w-auto items-center gap-3 justify-end">
              <Select value={filterModule} onValueChange={setFilterModule}>
                <SelectTrigger className="w-[150px] text-sm h-9 border-border">
                  <SelectValue placeholder="All Modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {modules.map(mod => (
                    <SelectItem key={mod} value={mod}>{mod}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="w-[150px] text-sm h-9 border-border">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actions.map(act => (
                    <SelectItem key={act} value={act}>{act}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs Table */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Audit logs
                </CardTitle>
                <CardDescription>
                  Showing {filteredLogs.length} of the latest actions recorded
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground border-t">
                No activity logs found matching the selected filters.
              </div>
            ) : (
              <div className="overflow-x-auto border-t">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[200px]">Date & Time</TableHead>
                      <TableHead className="w-[220px]">User</TableHead>
                      <TableHead className="w-[110px]">Action</TableHead>
                      <TableHead className="w-[120px]">Module</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-sm text-foreground">
                            {log.user_name || 'System User'}
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={log.user_email}>
                            {log.user_email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={getActionBadgeVariant(log.action)}
                            className={cn("text-[10px] uppercase font-bold", getActionBadgeClass(log.action))}
                          >
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-normal whitespace-nowrap">
                            {log.module}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.details || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {logs.length >= limit && (
              <div className="flex justify-center p-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setLimit(prev => prev + 50)}
                  disabled={loading}
                >
                  Load More Logs
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
