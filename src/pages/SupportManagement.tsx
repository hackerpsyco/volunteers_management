import { useState, useEffect, useRef, useCallback } from 'react';
import { LifeBuoy, Search, ChevronDown, ChevronUp, Send, AlertTriangle, Clock, CheckCircle2, XCircle, Loader2, Flag, RotateCcw, MoreVertical, Pencil, Trash2, EyeOff } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SupportRequest {
  id: string;
  student_id: string;
  student_name: string;
  class_id: string | null;
  class_name: string | null;
  support_type: string;
  title: string;
  description: string;
  reference_id: string | null;
  status: string;
  priority: string;
  priority_updated_at: string | null;
  priority_updated_by: string | null;
  created_at: string;
  updated_at: string;
  students?: {
    student_id: string | null;
    designation: string | null;
    roll_number: string | null;
  } | null;
}

interface SupportMessage {
  id: string;
  request_id: string;
  sender_name: string;
  sender_role: string;
  sender_email: string | null;
  message: string;
  created_at: string;
  edited_at?: string;
  deleted_for_student?: boolean;
  deleted_for_admin?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getEffectivePriority = (req: SupportRequest): string => {
  if (req.priority_updated_by) return req.priority;
  const days = (Date.now() - new Date(req.created_at).getTime()) / (1000 * 60 * 60 * 24);
  if (days >= 6) return 'high';
  if (days >= 3) return 'medium';
  return 'low';
};

const priorityConfig: Record<string, { emoji: string; label: string; bg: string; text: string; border: string }> = {
  high:   { emoji: '🔴', label: 'High',   bg: 'bg-red-50',    text: 'text-red-700',   border: 'border-red-200' },
  medium: { emoji: '🟡', label: 'Medium', bg: 'bg-amber-50',  text: 'text-amber-700', border: 'border-amber-200' },
  low:    { emoji: '🟢', label: 'Low',    bg: 'bg-green-50',  text: 'text-green-700', border: 'border-green-200' },
};

const priorityBorder: Record<string, string> = {
  high: 'border-l-red-500',
  medium: 'border-l-amber-400',
  low: 'border-l-green-500',
};

const statusConfig: Record<string, { label: string; bg: string; text: string; border: string; icon: string }> = {
  requested:   { label: 'Requested',   bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   icon: '📋' },
  in_progress: { label: 'In Progress', bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  icon: '⚡' },
  complete:    { label: 'Complete',    bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  icon: '✅' },
  closed:      { label: 'Closed',      bg: 'bg-gray-100',  text: 'text-gray-600',   border: 'border-gray-200',   icon: '🔒' },
};

const statCardConfig = [
  { key: 'requested',   label: 'Requested',   icon: '📋', bg: 'from-blue-500 to-blue-600' },
  { key: 'in_progress', label: 'In Progress', icon: '⚡', bg: 'from-amber-500 to-amber-600' },
  { key: 'complete',    label: 'Complete',    icon: '✅', bg: 'from-green-500 to-green-600' },
  { key: 'closed',      label: 'Closed',      icon: '🔒', bg: 'from-gray-400 to-gray-500' },
];

const typeColors: Record<string, string> = {
  task:     'bg-blue-100 text-blue-700',
  session:  'bg-purple-100 text-purple-700',
  earning:  'bg-green-100 text-green-700',
  help:     'bg-orange-100 text-orange-700',
  feedback: 'bg-pink-100 text-pink-700',
};

const typeLabel: Record<string, string> = {
  task: 'Task', session: 'Session', earning: 'Earning', help: 'I Need Help', feedback: 'Feedback',
};

const formatDateTime = (s: string) => {
  const d = new Date(s);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const getMonthOptions = () => {
  const opts: { val: string; lbl: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    const lbl = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    opts.push({ val, lbl });
  }
  return opts;
};

// ─── Status Action Buttons Component ─────────────────────────────────────────
function StatusActions({ req, userRole, onStatusChange }: {
  req: SupportRequest;
  userRole: number | null;
  onStatusChange: (id: string, status: string) => void;
}) {
  const s = req.status;

  // Admin & Coordinator: full control — show dropdown with all statuses
  if (userRole === 1 || userRole === 3) {
    return (
      <div className="w-48">
        <Select value={s} onValueChange={(val) => onStatusChange(req.id, val)}>
          <SelectTrigger className="h-9 rounded-xl border border-input bg-background">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="requested">📋 Requested</SelectItem>
            <SelectItem value="in_progress">⚡ In Progress</SelectItem>
            <SelectItem value="complete">✅ Complete</SelectItem>
            <SelectItem value="closed">🔒 Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Teacher (role 4): limited transitions
  if (userRole === 4) {
    const isAllowed = s === 'requested' || s === 'in_progress';
    return (
      <div className="w-48">
        <Select value={s} onValueChange={(val) => onStatusChange(req.id, val)} disabled={!isAllowed}>
          <SelectTrigger className="h-9 rounded-xl border border-input bg-background">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {s === 'requested' && (
              <>
                <SelectItem value="requested">📋 Requested</SelectItem>
                <SelectItem value="in_progress">⚡ In Progress</SelectItem>
              </>
            )}
            {s === 'in_progress' && (
              <>
                <SelectItem value="in_progress">⚡ In Progress</SelectItem>
                <SelectItem value="complete">✅ Complete</SelectItem>
              </>
            )}
            {s !== 'requested' && s !== 'in_progress' && (
              <SelectItem value={s}>
                {s === 'complete' ? '✅ Complete' : '🔒 Closed'}
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return null;
}

// ─── Priority Control Component ───────────────────────────────────────────────
function PriorityControl({ req, canChange, onPriorityChange }: {
  req: SupportRequest;
  canChange: boolean;
  onPriorityChange: (id: string, priority: string) => void;
}) {
  const effectivePriority = getEffectivePriority(req);
  const cfg = priorityConfig[effectivePriority];

  if (!canChange) {
    return (
      <span className={'text-xs font-medium px-2.5 py-1 rounded-full border ' + cfg.bg + ' ' + cfg.text + ' ' + cfg.border}>
        {cfg.emoji} {cfg.label}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Flag className="h-3 w-3 text-muted-foreground" />
      <span className="text-xs text-muted-foreground mr-1">Priority:</span>
      {['high', 'medium', 'low'].map(p => {
        const pc = priorityConfig[p];
        const isActive = effectivePriority === p;
        return (
          <button
            key={p}
            onClick={() => !isActive && onPriorityChange(req.id, p)}
            title={'Set ' + pc.label + ' priority'}
            className={'text-xs px-2.5 py-1 rounded-full border font-medium transition-all ' +
              (isActive
                ? pc.bg + ' ' + pc.text + ' ' + pc.border + ' ring-1 ring-offset-1 ' + pc.border
                : 'bg-muted/40 text-muted-foreground border-border hover:' + pc.bg + ' hover:' + pc.text)
            }
          >
            {pc.emoji} {pc.label}
          </button>
        );
      })}
      {req.priority_updated_by && (
        <span className="text-[10px] text-muted-foreground ml-1">(manual)</span>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SupportManagement() {
  const { user } = useAuth();

  const [userRole, setUserRole] = useState<number | null>(null);
  const [userName, setUserName] = useState('');
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [messages, setMessages] = useState<Record<string, SupportMessage[]>>({});
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Message edit/delete state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterMonths, setFilterMonths] = useState<string[]>([]);   // multi-select
  const [filterClass, setFilterClass] = useState('all');
  const [filterStudent, setFilterStudent] = useState('all');
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const monthDropdownRef = useRef<HTMLDivElement>(null);

  // Close month dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(e.target as Node)) {
        setShowMonthDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Fetch user role ──
  useEffect(() => {
    if (!user?.email) return;
    const fetchRole = async () => {
      const { data } = await (supabase as any)
        .from('user_profiles')
        .select('role_id, full_name')
        .ilike('email', user.email)
        .limit(1)
        .maybeSingle();
      if (data) {
        setUserRole(data.role_id);
        setUserName(data.full_name || user.email || '');
      }
    };
    fetchRole();
  }, [user?.email]);

  // ── Fetch all support requests ──
  const fetchRequests = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const { data, error } = await (supabase as any)
      .from('support_requests')
      .select('*, students(roll_number, student_id, designation)')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Failed to load support requests');
    } else {
      setRequests(data || []);
    }
    if (showLoading) setLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests(true);
    const interval = setInterval(() => {
      fetchRequests(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  // ── Fetch messages for selected request ──
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const fetchMsgs = useCallback(async (reqId: string) => {
    const { data } = await (supabase as any)
      .from('support_messages')
      .select('*')
      .eq('request_id', reqId)
      .order('created_at', { ascending: true });
    setMessages(prev => ({ ...prev, [reqId]: data || [] }));
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  useEffect(() => {
    if (!selectedRequest?.id) return;
    fetchMsgs(selectedRequest.id);

    const interval = setInterval(() => {
      fetchMsgs(selectedRequest.id);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedRequest?.id, fetchMsgs]);

  // ── Realtime: new messages ──
  useEffect(() => {
    const channel = (supabase as any)
      .channel('admin-support-messages-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' },
        (payload: any) => {
          const newMsg: SupportMessage = payload.new;
          setMessages(prev => {
            const existing = prev[newMsg.request_id] || [];
            if (existing.find((m: SupportMessage) => m.id === newMsg.id)) return prev;
            return { ...prev, [newMsg.request_id]: [...existing, newMsg] };
          });
          setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        })
      .subscribe();
    return () => { (supabase as any).removeChannel(channel); };
  }, []);

  // ── Realtime: request inserts & updates ──
  useEffect(() => {
    const channel = (supabase as any)
      .channel('admin-support-requests-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_requests' },
        async (payload: any) => {
          await fetchRequests();
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'support_requests' },
        (payload: any) => {
          setRequests(prev => prev.map(r => r.id === payload.new.id ? { ...r, ...payload.new } : r));
          setSelectedRequest(prev => {
            if (prev && prev.id === payload.new.id) {
              return { ...prev, ...payload.new };
            }
            return prev;
          });
        })
      .subscribe();
    return () => { (supabase as any).removeChannel(channel); };
  }, [fetchRequests]);

  // ── Counts ──
  const statusCounts: Record<string, number> = {};
  statCardConfig.forEach(s => { statusCounts[s.key] = requests.filter(r => r.status === s.key).length; });

  // ── Previous month pending ──
  const now = new Date();
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const prevMonthPending = requests.filter(r => {
    const d = new Date(r.created_at);
    return d >= prevMonthStart && d <= prevMonthEnd && (r.status === 'requested' || r.status === 'in_progress');
  });

  // ── Unique values for filters ──
  const classNames = [...new Set(requests.map(r => r.class_name).filter(Boolean))] as string[];
  const studentNames = [...new Set(requests.map(r => r.student_name).filter(Boolean))] as string[];

  // ── Filter ──
  const filteredRequests = requests.filter(r => {
    const effectivePriority = getEffectivePriority(r);
    const matchSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.student_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchType = filterType === 'all' || r.support_type === filterType;
    const matchPriority = filterPriority === 'all' || effectivePriority === filterPriority;
    const matchClass = filterClass === 'all' || r.class_name === filterClass;
    const matchStudent = filterStudent === 'all' || r.student_name === filterStudent;
    let matchMonth = true;
    if (filterMonths.length > 0) {
      const d = new Date(r.created_at);
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      matchMonth = filterMonths.includes(key);
    }
    return matchSearch && matchStatus && matchType && matchPriority && matchClass && matchStudent && matchMonth;
  });

  const [groupBy, setGroupBy] = useState<'none' | 'status' | 'student' | 'month'>('none');

  const getGroupedRequests = () => {
    if (groupBy === 'none') {
      return [{ title: 'All Requests', list: filteredRequests }];
    }
    if (groupBy === 'status') {
      const groups = [
        { key: 'requested', title: '📋 Requested', list: [] as SupportRequest[] },
        { key: 'in_progress', title: '⚡ In Progress', list: [] as SupportRequest[] },
        { key: 'complete', title: '✅ Complete', list: [] as SupportRequest[] },
        { key: 'closed', title: '🔒 Closed', list: [] as SupportRequest[] },
      ];
      filteredRequests.forEach(r => {
        const g = groups.find(x => x.key === r.status);
        if (g) g.list.push(r);
      });
      return groups.filter(g => g.list.length > 0);
    }
    if (groupBy === 'student') {
      const map: Record<string, SupportRequest[]> = {};
      filteredRequests.forEach(r => {
        if (!map[r.student_name]) map[r.student_name] = [];
        map[r.student_name].push(r);
      });
      return Object.entries(map).map(([name, list]) => ({
        title: '👤 ' + name + ' (' + (list[0]?.class_name || 'No Class') + ')',
        list,
      }));
    }
    if (groupBy === 'month') {
      const map: Record<string, SupportRequest[]> = {};
      filteredRequests.forEach(r => {
        const d = new Date(r.created_at);
        const label = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
        if (!map[label]) map[label] = [];
        map[label].push(r);
      });
      return Object.entries(map).map(([monthLabel, list]) => ({
        title: '📅 ' + monthLabel,
        list,
      }));
    }
    return [];
  };

  // ── Update status ──
  const handleStatusChange = async (reqId: string, newStatus: string) => {
    const { error } = await (supabase as any)
      .from('support_requests')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', reqId);
    if (error) { toast.error('Failed to update status'); return; }
    setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: newStatus } : r));
    setSelectedRequest(prev => prev && prev.id === reqId ? { ...prev, status: newStatus } : prev);
    toast.success('Status → ' + statusConfig[newStatus]?.label);
  };

  // ── Update priority ──
  const handlePriorityChange = async (reqId: string, newPriority: string) => {
    const { error } = await (supabase as any)
      .from('support_requests')
      .update({
        priority: newPriority,
        priority_updated_by: userName || user?.email || 'admin',
        priority_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reqId);
    if (error) { toast.error('Failed to update priority'); return; }
    setRequests(prev => prev.map(r => r.id === reqId ? { ...r, priority: newPriority, priority_updated_by: userName } : r));
    setSelectedRequest(prev => prev && prev.id === reqId ? { ...prev, priority: newPriority, priority_updated_by: userName } : prev);
    toast.success('Priority → ' + priorityConfig[newPriority]?.label);
  };

  // ── Send reply ──
  const handleReply = async (requestId: string) => {
    const text = (replyText[requestId] || '').trim();
    if (!text) return;
    setSendingReply(requestId);
    const senderRoleStr = userRole === 1 ? 'admin' : userRole === 3 ? 'coordinator' : userRole === 4 ? 'teacher' : 'staff';
    const { data, error } = await (supabase as any)
      .from('support_messages')
      .insert({
        request_id: requestId,
        sender_name: userName || user?.email || 'Staff',
        sender_role: senderRoleStr,
        sender_email: user?.email || '',
        message: text,
      })
      .select()
      .single();
    setSendingReply(null);
    if (error) { toast.error('Failed to send reply'); return; }
    setMessages(prev => ({ ...prev, [requestId]: [...(prev[requestId] || []), data] }));
    setReplyText(prev => ({ ...prev, [requestId]: '' }));
    
    // Auto-scroll chat inside modal
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    const req = requests.find(r => r.id === requestId);
    if (req && req.status === 'requested') {
      await handleStatusChange(requestId, 'in_progress');
    }
  };

  // ── Edit & Delete Message Handlers ──
  const handleEditMessage = (msgId: string, currentText: string) => {
    setEditingMessageId(msgId);
    setEditText(currentText);
  };

  const handleSaveEdit = async (msgId: string, reqId: string) => {
    const trimmed = editText.trim();
    if (!trimmed) return;
    const { error } = await (supabase as any)
      .from('support_messages')
      .update({
        message: trimmed,
        edited_at: new Date().toISOString()
      })
      .eq('id', msgId);

    if (error) {
      toast.error('Failed to save message edits');
      return;
    }

    setMessages(prev => ({
      ...prev,
      [reqId]: (prev[reqId] || []).map(m => m.id === msgId ? { ...m, message: trimmed, edited_at: new Date().toISOString() } : m)
    }));
    setEditingMessageId(null);
    setEditText('');
    toast.success('Message updated');
  };

  const handleDeleteForMe = async (msgId: string, reqId: string) => {
    const { error } = await (supabase as any)
      .from('support_messages')
      .update({ deleted_for_admin: true })
      .eq('id', msgId);

    if (error) {
      toast.error('Failed to delete message');
      return;
    }

    setMessages(prev => ({
      ...prev,
      [reqId]: (prev[reqId] || []).map(m => m.id === msgId ? { ...m, deleted_for_admin: true } : m)
    }));
    toast.success('Message deleted for you');
  };

  const handleDeleteForEveryone = async (msgId: string, reqId: string) => {
    const { error } = await (supabase as any)
      .from('support_messages')
      .delete()
      .eq('id', msgId);

    if (error) {
      toast.error('Failed to delete message for everyone');
      return;
    }

    setMessages(prev => ({
      ...prev,
      [reqId]: (prev[reqId] || []).filter(m => m.id !== msgId)
    }));
    toast.success('Message deleted for everyone');
  };

  const canChangePriority = userRole === 1 || userRole === 3;
  const monthOptions = getMonthOptions();

  const toggleMonth = (val: string) => {
    setFilterMonths(prev => prev.includes(val) ? prev.filter(m => m !== val) : [...prev, val]);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <LifeBuoy className="h-6 w-6 text-primary" />
              Support Requests
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {userRole === 1 ? 'Admin — full control over all requests' :
               userRole === 3 ? 'Coordinator — can close & change priority' :
               userRole === 4 ? 'Teacher — can move to In Progress & Complete' :
               'View support requests'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchRequests} className="gap-2">
            Refresh
          </Button>
        </div>

        {/* Previous month pending alert */}
        {prevMonthPending.length > 0 && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-800">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <span className="text-sm font-semibold">
                ⚠️ {prevMonthPending.length} request{prevMonthPending.length > 1 ? 's' : ''} from last month still pending
              </span>
              <p className="text-xs text-amber-700 mt-0.5">
                {prevMonthPending.map(r => r.student_name).join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Status Count Bar — clickable to filter */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statCardConfig.map(s => (
            <button
              key={s.key}
              onClick={() => setFilterStatus(filterStatus === s.key ? 'all' : s.key)}
              className={'rounded-xl overflow-hidden text-left transition-all hover:scale-[1.02] active:scale-100 ' +
                (filterStatus === s.key ? 'ring-2 ring-offset-2 ring-primary' : '')}
            >
              <div className={'bg-gradient-to-br ' + s.bg + ' text-white p-4'}>
                <div className="text-3xl font-black">{statusCounts[s.key] || 0}</div>
                <div className="text-xs font-semibold opacity-90 mt-1">{s.icon} {s.label}</div>
                {filterStatus === s.key && (
                  <div className="text-[10px] opacity-75 mt-0.5">● Filtered</div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filters</p>
          <div className="flex flex-wrap gap-3 items-center">

            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search title or student..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Status */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36 h-9"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="requested">📋 Requested</SelectItem>
                <SelectItem value="in_progress">⚡ In Progress</SelectItem>
                <SelectItem value="complete">✅ Complete</SelectItem>
                <SelectItem value="closed">🔒 Closed</SelectItem>
              </SelectContent>
            </Select>

            {/* Type */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-36 h-9"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="task">Task</SelectItem>
                <SelectItem value="session">Session</SelectItem>
                <SelectItem value="earning">Earning</SelectItem>
                <SelectItem value="help">I Need Help</SelectItem>
                <SelectItem value="feedback">Feedback</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority */}
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-36 h-9"><SelectValue placeholder="All Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">🔴 High</SelectItem>
                <SelectItem value="medium">🟡 Medium</SelectItem>
                <SelectItem value="low">🟢 Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Student */}
            {studentNames.length > 0 && (
              <Select value={filterStudent} onValueChange={setFilterStudent}>
                <SelectTrigger className="w-40 h-9"><SelectValue placeholder="All Students" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {studentNames.map(n => (<SelectItem key={n} value={n}>{n}</SelectItem>))}
                </SelectContent>
              </Select>
            )}

            {/* Class */}
            {classNames.length > 0 && (
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="w-36 h-9"><SelectValue placeholder="All Classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classNames.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            )}

            {/* Multi-select Month */}
            <div className="relative" ref={monthDropdownRef}>
              <button
                onClick={() => setShowMonthDropdown(p => !p)}
                className={'flex items-center gap-2 h-9 px-3 rounded-md border text-sm font-medium transition-colors ' +
                  (filterMonths.length > 0
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-input bg-background text-foreground hover:bg-accent')}
              >
                📅 {filterMonths.length === 0 ? 'All Months' : filterMonths.length + ' Month' + (filterMonths.length > 1 ? 's' : '')}
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>
              {showMonthDropdown && (
                <div className="absolute top-full mt-1 left-0 z-50 w-52 bg-popover border border-border rounded-xl shadow-lg p-2 space-y-0.5 max-h-64 overflow-y-auto">
                  <button
                    onClick={() => setFilterMonths([])}
                    className={'w-full text-left text-xs px-2.5 py-1.5 rounded-lg hover:bg-accent transition-colors ' +
                      (filterMonths.length === 0 ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground')}
                  >
                    All Months
                  </button>
                  {monthOptions.map(m => (
                    <button
                      key={m.val}
                      onClick={() => toggleMonth(m.val)}
                      className={'w-full text-left text-xs px-2.5 py-1.5 rounded-lg hover:bg-accent transition-colors flex items-center gap-2 ' +
                        (filterMonths.includes(m.val) ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground')}
                    >
                      <span className={'w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center text-[10px] ' +
                        (filterMonths.includes(m.val) ? 'bg-primary border-primary text-white' : 'border-border')}>
                        {filterMonths.includes(m.val) && '✓'}
                      </span>
                      {m.lbl}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clear filters */}
            {(filterStatus !== 'all' || filterType !== 'all' || filterPriority !== 'all' || filterMonths.length > 0 || filterClass !== 'all' || filterStudent !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setFilterStatus('all'); setFilterType('all'); setFilterPriority('all');
                  setFilterMonths([]); setFilterClass('all'); setFilterStudent('all'); setSearchQuery('');
                }}
                className="text-xs text-muted-foreground hover:text-destructive underline underline-offset-2 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Results count & Group By */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredRequests.length}</span> of {requests.length} requests
            {filterMonths.length > 0 && <span> · Months: {filterMonths.map(m => monthOptions.find(o => o.val === m)?.lbl).join(', ')}</span>}
          </p>
          <div className="flex items-center gap-1.5 bg-muted p-1 rounded-lg self-start">
            <span className="text-xs text-muted-foreground px-2 font-medium">Group By:</span>
            {[
              { val: 'none', label: 'None' },
              { val: 'status', label: 'Status' },
              { val: 'student', label: 'Student' },
              { val: 'month', label: 'Month' }
            ].map(g => (
              <button
                key={g.val}
                onClick={() => setGroupBy(g.val as any)}
                className={'text-xs px-2.5 py-1 rounded-md font-medium transition-colors ' +
                  (groupBy === g.val
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-foreground hover:bg-background/50')}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Request List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Loading requests...</p>
            </div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed rounded-2xl">
            <LifeBuoy className="h-12 w-12 opacity-30 mb-3" />
            <p className="font-medium">No support requests found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-6">
            {getGroupedRequests().map(group => (
              <div key={group.title} className="space-y-3 bg-card border border-border rounded-xl p-4 shadow-sm">
                {groupBy !== 'none' && (
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <span className="font-bold text-sm text-foreground">{group.title}</span>
                    <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5">
                      {group.list.length}
                    </Badge>
                  </div>
                )}
                
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="font-semibold text-xs">Roll Number</TableHead>
                        <TableHead className="font-semibold text-xs">Class</TableHead>
                        <TableHead className="font-semibold text-xs">Student Name</TableHead>
                        <TableHead className="font-semibold text-xs">Title</TableHead>
                        <TableHead className="font-semibold text-xs">Designation</TableHead>
                        <TableHead className="font-semibold text-xs">Priority</TableHead>
                        <TableHead className="font-semibold text-xs">Status</TableHead>
                        <TableHead className="font-semibold text-xs text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.list.map(req => {
                        const effectivePriority = getEffectivePriority(req);
                        const rollNo = req.students?.roll_number || req.students?.student_id || '-';
                        const designation = req.students?.designation || '-';
                        const pCfg = priorityConfig[effectivePriority];

                        return (
                          <TableRow key={req.id} className="hover:bg-muted/10 transition-colors">
                            <TableCell className="font-mono text-xs text-muted-foreground">{rollNo}</TableCell>
                            <TableCell className="text-sm font-medium text-muted-foreground">{req.class_name || '-'}</TableCell>
                            <TableCell className="text-sm font-semibold">{req.student_name}</TableCell>
                            <TableCell className="text-sm max-w-[200px] truncate" title={req.title}>{req.title}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{designation}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-xs gap-1 py-0.5 font-medium border ${pCfg.bg} ${pCfg.text} ${pCfg.border}`}>
                                <span>{pCfg.emoji}</span>
                                <span>{pCfg.label}</span>
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <StatusActions req={req} userRole={userRole} onStatusChange={handleStatusChange} />
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs font-semibold gap-1"
                                onClick={() => setSelectedRequest(req)}
                              >
                                View & Chat
                                <span className="ml-1 bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                                  {(messages[req.id] || []).length}
                                </span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}

            {/* Request Detail & Chat Dialog */}
            <Dialog open={selectedRequest !== null} onOpenChange={(open) => !open && setSelectedRequest(null)}>
              <DialogContent className="max-w-2xl rounded-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
                {selectedRequest && (
                  <>
                    <DialogHeader className="p-5 border-b border-border bg-muted/20">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <Badge variant="outline" className={typeColors[selectedRequest.support_type] || 'bg-gray-100 text-gray-700'}>
                          {typeLabel[selectedRequest.support_type] || selectedRequest.support_type}
                        </Badge>
                        <span className={'text-xs font-semibold px-2.5 py-1 rounded-full border ' + statusConfig[selectedRequest.status]?.bg + ' ' + statusConfig[selectedRequest.status]?.text + ' ' + statusConfig[selectedRequest.status]?.border}>
                          {statusConfig[selectedRequest.status]?.icon} {statusConfig[selectedRequest.status]?.label}
                        </span>
                        {selectedRequest.reference_id && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded font-mono">
                            Ref: {selectedRequest.reference_id}
                          </span>
                        )}
                      </div>
                      <DialogTitle className="text-lg font-bold text-foreground">
                        {selectedRequest.title}
                      </DialogTitle>
                      <div className="text-xs text-muted-foreground mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                        <span>Student: <strong>{selectedRequest.student_name}</strong></span>
                        <span>Class: <strong>{selectedRequest.class_name || '-'}</strong></span>
                        <span>ID/Roll: <strong>{selectedRequest.students?.roll_number || selectedRequest.students?.student_id || '-'}</strong></span>
                      </div>
                    </DialogHeader>

                    {/* Dialog body */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                      {/* Description */}
                      <div className="bg-muted/30 border border-border/40 rounded-xl p-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Description</h4>
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{selectedRequest.description}</p>
                      </div>

                      {/* Quick controls inside dialog */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-b border-border py-4">
                        {/* Priority Control */}
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Priority</p>
                          <PriorityControl
                            req={selectedRequest}
                            canChange={canChangePriority}
                            onPriorityChange={handlePriorityChange}
                          />
                        </div>

                        {/* Status Control */}
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Change Status</p>
                          <StatusActions
                            req={selectedRequest}
                            userRole={userRole}
                            onStatusChange={handleStatusChange}
                          />
                        </div>
                      </div>

                      {/* Chat thread */}
                      <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Conversation Thread</h4>
                        
                        {/* Message list */}
                        <div className="bg-muted/15 border border-border rounded-xl p-4">
                          {(() => {
                            const filteredThreadMsgs = (messages[selectedRequest.id] || []).filter(msg => !msg.deleted_for_admin);
                            return filteredThreadMsgs.length === 0 ? (
                              <p className="text-xs text-center text-muted-foreground py-6">No messages yet — reply below to start the conversation</p>
                            ) : (
                              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                                {filteredThreadMsgs.map(msg => {
                                  const isStaff = msg.sender_role !== 'student';
                                  const isEditing = editingMessageId === msg.id;
                                  return (
                                    <div key={msg.id} className={'flex ' + (isStaff ? 'justify-end' : 'justify-start')}>
                                      <div className="relative group max-w-[80%]">
                                        <div className={'rounded-2xl px-3.5 py-2 text-sm ' +
                                          (isStaff
                                            ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                            : 'bg-background border border-border rounded-tl-sm')}>
                                          <div className={'flex items-center gap-2 mb-1 ' + (isStaff ? 'justify-end' : 'justify-start')}>
                                            <span className="text-[10px] font-semibold opacity-75">{msg.sender_name}</span>
                                            <span className={'text-[10px] opacity-60 uppercase tracking-wide px-1.5 py-0.5 rounded ' +
                                              (isStaff ? 'bg-white/20' : 'bg-muted')}>
                                              {msg.sender_role}
                                            </span>
                                          </div>
                                          
                                          {isEditing ? (
                                            <div className="flex flex-col gap-2 mt-1">
                                              <Textarea
                                                value={editText}
                                                onChange={e => setEditText(e.target.value)}
                                                className="text-xs bg-background text-foreground border-border rounded-xl resize-none min-h-[50px] min-w-[200px]"
                                                onKeyDown={e => {
                                                  if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSaveEdit(msg.id, selectedRequest.id);
                                                  }
                                                }}
                                                rows={2}
                                              />
                                              <div className="flex justify-end gap-1.5">
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  className="h-6 text-[10px] px-2 rounded-lg text-muted-foreground hover:text-foreground"
                                                  onClick={() => setEditingMessageId(null)}
                                                >
                                                  Cancel
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  className="h-6 text-[10px] px-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground"
                                                  onClick={() => handleSaveEdit(msg.id, selectedRequest.id)}
                                                >
                                                  Save
                                                </Button>
                                              </div>
                                            </div>
                                          ) : (
                                            <>
                                              <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                              <p className={'text-[10px] opacity-60 mt-1 flex items-center gap-1 ' + (isStaff ? 'justify-end' : 'justify-start')}>
                                                {formatDateTime(msg.created_at)}
                                                {msg.edited_at && (
                                                  <span className="text-[9px] italic opacity-85">(edited)</span>
                                                )}
                                              </p>
                                            </>
                                          )}
                                        </div>

                                        {/* Actions menu on hover */}
                                        {!isEditing && (
                                          <div className={'absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 ' + (isStaff ? '-left-8' : '-right-8')}>
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <Button
                                                  size="icon"
                                                  variant="ghost"
                                                  className="h-6 w-6 rounded-full hover:bg-muted p-0 text-muted-foreground hover:text-foreground"
                                                >
                                                  <MoreVertical className="w-4 h-4" />
                                                </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align={isStaff ? 'end' : 'start'} className="w-40 rounded-xl shadow-lg border border-border">
                                                {isStaff && (
                                                  <DropdownMenuItem
                                                    onClick={() => handleEditMessage(msg.id, msg.message)}
                                                    className="cursor-pointer text-xs py-1.5 px-2.5 flex items-center gap-2 hover:bg-muted"
                                                  >
                                                    <Pencil className="w-3 h-3" />
                                                    Edit Message
                                                  </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem
                                                  onClick={() => handleDeleteForMe(msg.id, selectedRequest.id)}
                                                  className="cursor-pointer text-xs py-1.5 px-2.5 flex items-center gap-2 hover:bg-muted"
                                                >
                                                  <EyeOff className="w-3 h-3" />
                                                  Delete for Me
                                                </DropdownMenuItem>
                                                {isStaff && (
                                                  <DropdownMenuItem
                                                    onClick={() => handleDeleteForEveryone(msg.id, selectedRequest.id)}
                                                    className="cursor-pointer text-xs text-destructive py-1.5 px-2.5 flex items-center gap-2 hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
                                                  >
                                                    <Trash2 className="w-3 h-3" />
                                                    Delete for Both
                                                  </DropdownMenuItem>
                                                )}
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                                <div ref={chatBottomRef} />
                              </div>
                            );
                          })()}

                          {/* Chat Input */}
                          {selectedRequest.status !== 'closed' ? (
                            <div className="flex gap-2 pt-3 border-t border-border mt-3">
                              <Textarea
                                rows={2}
                                placeholder="Type your reply... (Enter to send)"
                                value={replyText[selectedRequest.id] || ''}
                                onChange={e => setReplyText(prev => ({ ...prev, [selectedRequest.id]: e.target.value }))}
                                className="flex-1 text-sm resize-none"
                                onKeyDown={e => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleReply(selectedRequest.id);
                                  }
                                }}
                              />
                              <Button
                                size="icon"
                                onClick={() => handleReply(selectedRequest.id)}
                                disabled={sendingReply === selectedRequest.id || !(replyText[selectedRequest.id] || '').trim()}
                                className="h-auto self-end px-3"
                              >
                                {sendingReply === selectedRequest.id
                                  ? <Loader2 className="h-4 w-4 animate-spin" />
                                  : <Send className="h-4 w-4" />}
                              </Button>
                            </div>
                          ) : (
                            <p className="text-xs text-center text-muted-foreground py-2 border-t border-border mt-3">
                              🔒 This request is closed — reopen to reply
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
