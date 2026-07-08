import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Plus, Send, ChevronDown, ChevronUp, Search, Filter, MoreVertical, Pencil, Trash2, EyeOff } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  created_at: string;
  updated_at: string;
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

interface StudentInfo {
  id: string;
  name: string;
  email: string;
  class_id: string | null;
  class_name: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getAutoPriority = (createdAt: string, savedPriority: string): string => {
  const days = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (savedPriority === 'high') return 'high';
  if (days >= 6) return 'high';
  if (days >= 3) return 'medium';
  return 'low';
};

const priorityEmoji: Record<string, string> = {
  high: '🔴',
  medium: '🟡',
  low: '🟢',
};

const supportTypeColors: Record<string, string> = {
  task: 'bg-blue-100 text-blue-700 border-blue-200',
  session: 'bg-purple-100 text-purple-700 border-purple-200',
  earning: 'bg-green-100 text-green-700 border-green-200',
  help: 'bg-orange-100 text-orange-700 border-orange-200',
  feedback: 'bg-pink-100 text-pink-700 border-pink-200',
};

const statusColors: Record<string, string> = {
  requested: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
  complete: 'bg-green-100 text-green-700 border-green-200',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
};

const statusLabel: Record<string, string> = {
  requested: 'Requested',
  in_progress: 'In Progress',
  complete: 'Complete',
  closed: 'Closed',
};

const priorityBorderColor: Record<string, string> = {
  high: 'border-l-red-500',
  medium: 'border-l-yellow-400',
  low: 'border-l-green-500',
};

const statusGradients: Record<string, string> = {
  requested: 'from-blue-500 to-blue-400',
  in_progress: 'from-amber-500 to-amber-400',
  complete: 'from-green-500 to-green-400',
  closed: 'from-gray-400 to-gray-300',
};

const supportTypeOptions = [
  { value: 'task', label: 'Task' },
  { value: 'session', label: 'Session' },
  { value: 'earning', label: 'Earning' },
  { value: 'help', label: 'I Need Help' },
  { value: 'feedback', label: 'Feedback' },
];

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudentSupport() {
  const { user } = useAuth();

  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [messages, setMessages] = useState<Record<string, SupportMessage[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);
  
  // Message edit/delete state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Create dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newType, setNewType] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newRefId, setNewRefId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [loading, setLoading] = useState(true);

  // ── Fetch student info ──
  useEffect(() => {
    if (!user?.email) return;
    const fetchStudent = async () => {
      const { data, error } = await (supabase as any)
        .from('students')
        .select('id, name, email, class_id, classes(name)')
        .ilike('email', user.email)
        .limit(1)
        .maybeSingle();
      if (error || !data) {
        // Try without class join
        const { data: d2 } = await (supabase as any)
          .from('students')
          .select('id, name, email, class_id')
          .ilike('email', user.email)
          .limit(1)
          .maybeSingle();
        if (d2) setStudentInfo({ ...d2, class_name: null });
        return;
      }
      setStudentInfo({
        ...data,
        class_name: data.classes?.name || null,
      });
    };
    fetchStudent();
  }, [user?.email]);

  // ── Fetch requests ──
  useEffect(() => {
    if (!studentInfo) return;
    const fetchRequests = async (showLoading = true) => {
      if (showLoading) setLoading(true);
      const { data, error } = await (supabase as any)
        .from('support_requests')
        .select('*')
        .eq('student_id', studentInfo.id)
        .order('created_at', { ascending: false });
      if (error) {
        toast.error('Failed to load support requests');
      } else {
        setRequests(data || []);
      }
      if (showLoading) setLoading(false);
    };
    fetchRequests(true);

    const interval = setInterval(() => {
      fetchRequests(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [studentInfo]);

  // ── Fetch messages for expanded card ──
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const fetchMessages = useCallback(async (reqId: string) => {
    const { data } = await (supabase as any)
      .from('support_messages')
      .select('*')
      .eq('request_id', reqId)
      .order('created_at', { ascending: true });
    setMessages(prev => ({ ...prev, [reqId]: data || [] }));
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  useEffect(() => {
    if (!expandedId) return;
    fetchMessages(expandedId);

    const interval = setInterval(() => {
      fetchMessages(expandedId);
    }, 5000);

    return () => clearInterval(interval);
  }, [expandedId, fetchMessages]);

  // ── Realtime: new messages ──
  useEffect(() => {
    const channel = (supabase as any)
      .channel('support-messages-rt')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
      }, (payload: any) => {
        const newMsg: SupportMessage = payload.new;
        setMessages(prev => {
          const existing = prev[newMsg.request_id] || [];
          // avoid duplicate if we just inserted it ourselves
          if (existing.find(m => m.id === newMsg.id)) return prev;
          return { ...prev, [newMsg.request_id]: [...existing, newMsg] };
        });
        setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .subscribe();
    return () => { (supabase as any).removeChannel(channel); };
  }, []);

  // ── Realtime: request status/priority updates ──
  useEffect(() => {
    if (!studentInfo) return;
    const channel = (supabase as any)
      .channel('support-requests-student-rt')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'support_requests',
        filter: 'student_id=eq.' + studentInfo.id,
      }, (payload: any) => {
        setRequests(prev => prev.map(r => r.id === payload.new.id ? { ...r, ...payload.new } : r));
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_requests',
        filter: 'student_id=eq.' + studentInfo.id,
      }, (payload: any) => {
        setRequests(prev => [payload.new, ...prev]);
      })
      .subscribe();
    return () => { (supabase as any).removeChannel(channel); };
  }, [studentInfo]);

  // ── Status counts ──
  const statusKeys = ['requested', 'in_progress', 'complete', 'closed'];
  const statusCounts: Record<string, number> = {};
  statusKeys.forEach(s => {
    statusCounts[s] = requests.filter(r => r.status === s).length;
  });

  // ── Filter requests ──
  const filteredRequests = requests.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || r.support_type === filterType;
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // ── Toggle expand ──
  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  // ── Send reply ──
  const handleReply = async (requestId: string) => {
    const text = (replyText[requestId] || '').trim();
    if (!text) return;
    if (!studentInfo) return;
    setSendingReply(requestId);
    const { data, error } = await (supabase as any)
      .from('support_messages')
      .insert({
        request_id: requestId,
        sender_name: studentInfo.name,
        sender_role: 'student',
        sender_email: studentInfo.email,
        message: text,
      })
      .select()
      .single();
    setSendingReply(null);
    if (error) {
      toast.error('Failed to send reply');
      return;
    }
    setMessages(prev => ({
      ...prev,
      [requestId]: [...(prev[requestId] || []), data],
    }));
    setReplyText(prev => ({ ...prev, [requestId]: '' }));
    toast.success('Reply sent');
  };

  // ── Edit & Delete Message Handlers ──
  const handleEditMessage = (msgId: string, currentText: string) => {
    setEditingMessageId(msgId);
    setEditText(currentText);
  };

  const handleSaveEdit = async (msgId: string, reqId: string) => {
    const msg = (messages[reqId] || []).find(m => m.id === msgId);
    if (!msg) return;

    const elapsed = Date.now() - new Date(msg.created_at).getTime();
    if (elapsed > 3 * 60 * 1000) {
      toast.error('Messages can only be edited within 3 minutes of sending');
      setEditingMessageId(null);
      return;
    }

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

  // ── Create request ──
  const handleCreate = async () => {
    if (!newType || !newTitle.trim() || !newDesc.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!studentInfo) return;
    setSubmitting(true);

    const insertPayload: Record<string, any> = {
      student_id: studentInfo.id,
      student_name: studentInfo.name,
      class_id: studentInfo.class_id || null,
      class_name: studentInfo.class_name || null,
      support_type: newType,
      title: newTitle.trim(),
      description: newDesc.trim(),
      status: 'requested',
      priority: 'low',
    };
    if ((newType === 'task' || newType === 'session') && newRefId.trim()) {
      insertPayload.reference_id = newRefId.trim();
    }

    const { data: reqData, error: reqError } = await (supabase as any)
      .from('support_requests')
      .insert(insertPayload)
      .select()
      .single();

    if (reqError) {
      toast.error('Failed to create request');
      setSubmitting(false);
      return;
    }

    // Insert first message
    await (supabase as any).from('support_messages').insert({
      request_id: reqData.id,
      sender_name: studentInfo.name,
      sender_role: 'student',
      sender_email: studentInfo.email,
      message: newDesc.trim(),
    });

    setRequests(prev => [reqData, ...prev]);
    toast.success('Support request created!');
    setDialogOpen(false);
    setNewType('');
    setNewTitle('');
    setNewDesc('');
    setNewRefId('');
    setSubmitting(false);
  };

  const refIdLabel = newType === 'task' ? 'Task ID' : newType === 'session' ? 'Session ID' : 'Reference ID';

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                Request Support
              </h1>
            </div>
            <p className="text-slate-500 ml-1">
              Raise a request and get help from your teacher or coordinator
            </p>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-200 flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            New Request
          </Button>
        </div>

        {/* ── Status Count Bar ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {statusKeys.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(prev => (prev === s ? 'all' : s))}
              className={
                'rounded-2xl p-4 text-left transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 ' +
                (filterStatus === s ? 'ring-2 ring-offset-2 ring-blue-400' : '')
              }
              style={{
                background: 'linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))',
              }}
            >
              <div className={'rounded-2xl p-4 text-left bg-gradient-to-br ' + statusGradients[s]}>
                <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">
                  {statusLabel[s]}
                </p>
                <p className="text-white text-3xl font-bold">{statusCounts[s] || 0}</p>
              </div>
            </button>
          ))}
        </div>

        {/* ── Filter Bar ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by title…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 bg-white border-slate-200 rounded-xl shadow-sm"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="bg-white border-slate-200 rounded-xl shadow-sm">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {supportTypeOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-48">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="bg-white border-slate-200 rounded-xl shadow-sm">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statusKeys.map(s => (
                  <SelectItem key={s} value={s}>{statusLabel[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Request Cards ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin mr-3" />
            Loading your requests…
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <MessageCircle className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">No requests found</p>
            <p className="text-sm">Create your first support request above</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map(req => {
              const priority = getAutoPriority(req.created_at, req.priority);
              const isExpanded = expandedId === req.id;
              const threadMessages = (messages[req.id] || []).filter(msg => !msg.deleted_for_student);

              return (
                <Card
                  key={req.id}
                  className={'border-l-4 shadow-md hover:shadow-lg transition-all rounded-2xl overflow-hidden bg-white ' + priorityBorderColor[priority]}
                >
                  <CardContent className="p-0">
                    {/* Card Header — clickable */}
                    <button
                      className="w-full text-left p-5 focus:outline-none"
                      onClick={() => toggleExpand(req.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-semibold text-slate-800 text-base truncate">
                              {req.title}
                            </span>
                            <Badge
                              className={'text-xs border px-2 py-0.5 rounded-full font-medium ' + (supportTypeColors[req.support_type] || 'bg-slate-100 text-slate-600')}
                              variant="outline"
                            >
                              {supportTypeOptions.find(o => o.value === req.support_type)?.label || req.support_type}
                            </Badge>
                          </div>
                          <p className="text-slate-500 text-sm line-clamp-2">{req.description}</p>
                        </div>

                        {/* Right side metadata */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center gap-2">
                            <span className="text-base" title={priority + ' priority'}>{priorityEmoji[priority]}</span>
                            <Badge
                              className={'text-xs border px-2.5 py-0.5 rounded-full font-medium ' + (statusColors[req.status] || 'bg-slate-100 text-slate-600')}
                              variant="outline"
                            >
                              {statusLabel[req.status] || req.status}
                            </Badge>
                          </div>
                          <span className="text-xs text-slate-400">{formatDate(req.created_at)}</span>
                          <span className="text-slate-400">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Expanded Thread */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/70 px-5 pt-4 pb-5">
                        {/* Messages */}
                        {threadMessages.length === 0 ? (
                          <p className="text-sm text-slate-400 text-center py-4">No messages yet.</p>
                        ) : (
                          <div className="space-y-3 mb-4 max-h-80 overflow-y-auto pr-1">
                            {threadMessages.map(msg => {
                              const isStudent = msg.sender_role === 'student';
                              const isEditing = editingMessageId === msg.id;
                              const canEdit = isStudent && (Date.now() - new Date(msg.created_at).getTime()) <= 3 * 60 * 1000;

                              return (
                                <div
                                  key={msg.id}
                                  className={'flex ' + (isStudent ? 'justify-end' : 'justify-start')}
                                >
                                  <div className="relative group max-w-[75%]">
                                    <div
                                      className={
                                        'rounded-2xl px-4 py-2.5 shadow-sm ' +
                                        (isStudent
                                          ? 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-br-sm'
                                          : 'bg-white text-slate-700 border border-slate-200 rounded-bl-sm')
                                      }
                                    >
                                      <p className={'text-xs font-semibold mb-0.5 ' + (isStudent ? 'text-blue-100' : 'text-slate-400')}>
                                        {msg.sender_name}
                                        {msg.sender_role !== 'student' && (
                                          <span className="ml-1 opacity-70">· {msg.sender_role}</span>
                                        )}
                                      </p>
                                      {isEditing ? (
                                        <div className="flex flex-col gap-2 mt-1">
                                          <Textarea
                                            value={editText}
                                            onChange={e => setEditText(e.target.value)}
                                            className="text-sm bg-white text-slate-800 border-slate-300 rounded-xl resize-none min-h-[60px]"
                                            onKeyDown={e => {
                                              if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSaveEdit(msg.id, req.id);
                                              }
                                            }}
                                            rows={2}
                                          />
                                          <div className="flex justify-end gap-1.5">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-7 text-xs px-2.5 rounded-lg text-slate-500 hover:text-slate-700"
                                              onClick={() => setEditingMessageId(null)}
                                            >
                                              Cancel
                                            </Button>
                                            <Button
                                              size="sm"
                                              className="h-7 text-xs px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                                              onClick={() => handleSaveEdit(msg.id, req.id)}
                                            >
                                              Save
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                          {!isEditing && canEdit && (
                                            <div className={'absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 ' + (isStudent ? '-left-8' : '-right-8')}>
                                              <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6 rounded-full hover:bg-slate-200/50 p-0 text-slate-400 hover:text-slate-600"
                                                  >
                                                    <MoreVertical className="w-4 h-4" />
                                                  </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align={isStudent ? 'end' : 'start'} className="w-40 rounded-xl shadow-lg border border-slate-100">
                                                  <DropdownMenuItem
                                                    onClick={() => handleEditMessage(msg.id, msg.message)}
                                                    className="cursor-pointer text-sm py-2 px-3 flex items-center gap-2 hover:bg-slate-50"
                                                  >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                    Edit Message
                                                  </DropdownMenuItem>
                                                </DropdownMenuContent>
                                              </DropdownMenu>
                                            </div>
                                          )}
                                          <p className={'text-xs mt-1 flex items-center gap-1 ' + (isStudent ? 'text-blue-200 justify-end' : 'text-slate-400 justify-start')}>
                                            {formatDate(msg.created_at)} {formatTime(msg.created_at)}
                                            {msg.edited_at && (
                                              <span className="text-[10px] italic opacity-85">(edited)</span>
                                            )}
                                          </p>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            <div ref={chatBottomRef} />
                          </div>
                        )}


                        {/* Reply input — only if not closed */}
                        {req.status !== 'closed' && (
                          <div className="flex gap-2 mt-2">
                            <Textarea
                              placeholder="Write a reply…"
                              value={replyText[req.id] || ''}
                              onChange={e =>
                                setReplyText(prev => ({ ...prev, [req.id]: e.target.value }))
                              }
                              onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleReply(req.id);
                                }
                              }}
                              rows={2}
                              className="flex-1 resize-none bg-white border-slate-200 rounded-xl text-sm"
                            />
                            <Button
                              onClick={() => handleReply(req.id)}
                              disabled={sendingReply === req.id || !(replyText[req.id] || '').trim()}
                              className="self-end bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl px-4 shadow-sm"
                            >
                              {sendingReply === req.id ? (
                                <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        )}
                        {req.status === 'closed' && (
                          <p className="text-center text-xs text-slate-400 pt-2">This request is closed. Open a new request if you need further help.</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* ── Create Request Dialog ── */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                New Support Request
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Support Type */}
              <div className="space-y-1.5">
                <Label htmlFor="support-type" className="text-sm font-medium text-slate-700">
                  Support Type <span className="text-red-500">*</span>
                </Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger id="support-type" className="rounded-xl">
                    <SelectValue placeholder="Select type…" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportTypeOptions.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="support-title" className="text-sm font-medium text-slate-700">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="support-title"
                  placeholder="Brief summary of your issue…"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="support-desc" className="text-sm font-medium text-slate-700">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="support-desc"
                  placeholder="Describe your issue in detail…"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  rows={4}
                  className="rounded-xl resize-none"
                />
              </div>

              {/* Reference ID — only for task / session */}
              {(newType === 'task' || newType === 'session') && (
                <div className="space-y-1.5">
                  <Label htmlFor="support-refid" className="text-sm font-medium text-slate-700">
                    {refIdLabel} <span className="text-slate-400 font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="support-refid"
                    placeholder={'Enter ' + refIdLabel + '…'}
                    value={newRefId}
                    onChange={e => setNewRefId(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={submitting || !newType || !newTitle.trim() || !newDesc.trim()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    Submitting…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Submit Request
                  </span>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
