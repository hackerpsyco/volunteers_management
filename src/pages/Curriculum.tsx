import { useState, useEffect } from 'react';
import { Trash2, Upload, MoreVertical, Plus, Search } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UnifiedImportDialog } from '@/components/sessions/UnifiedImportDialog';
import { Input } from '@/components/ui/input';
import { EditCurriculumDialog } from '@/components/curriculum/EditCurriculumDialog';
import { AddTopicDialog } from '@/components/curriculum/AddTopicDialog';
import { Badge } from '@/components/ui/badge';

interface RawCurriculumData {
  id: string;
  content_category: string;
  module_no: number;
  module_name: string;
  topics_covered: string;
  videos: string;
  quiz_content_ppt: string;
  fresh_session?: string;
  revision_session?: string;
  created_at?: string;
  updated_at?: string;
}

interface CurriculumItem {
  id: string;
  content_category: string;
  module_code: string;
  module_title: string;
  topic_title: string;
  videos: string;
  quiz_content_ppt: string;
  fresh_session?: string;
  revision_session?: string;
  created_at?: string;
  updated_at?: string;
  class_id?: string;
  subject_id?: string;
  subject_name?: string;
}

interface ExpandedSession {
  itemId: string;
  type: 'fresh' | 'revision';
}

interface Class {
  id: string;
  name: string;
}

interface SessionInfo {
  fresh_count: number;
  revision_count: number;
  fresh_status?: string;
  revision_status?: string;
  session_date?: string;
  volunteer_name?: string;
  fresh_sessions?: Array<{ id: string; date: string; volunteer: string; status: string }>;
  revision_sessions?: Array<{ id: string; date: string; volunteer: string; status: string }>;
}

export default function Curriculum() {
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [filteredCurriculum, setFilteredCurriculum] = useState<CurriculumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CurriculumItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sessionInfo, setSessionInfo] = useState<Record<string, SessionInfo>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sessionTypeFilter, setSessionTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    // When class changes, fetch subjects for that class & reset subject filter
    if (selectedClass) {
      fetchSubjects(selectedClass);
      setSelectedSubject('');
      setSelectedCategory('all');
      fetchCurriculum(selectedClass);
      fetchSessionInfo(selectedClass);
    } else {
      setCurriculum([]);
      setFilteredCurriculum([]);
      setSessionInfo({});
      setSubjects([]);
    }
  }, [selectedClass]);

  // Update categories when subject filter changes
  useEffect(() => {
    let source = curriculum;
    if (selectedSubject && selectedSubject !== 'all') {
      source = source.filter((item) => item.subject_id === selectedSubject);
    }
    const uniqueCategories = [...new Set(source.map((item) => item.content_category))].sort();
    setCategories(uniqueCategories as string[]);
    // Reset category if current selection is no longer valid
    if (selectedCategory !== 'all' && !uniqueCategories.includes(selectedCategory)) {
      setSelectedCategory('all');
    }
  }, [selectedSubject, curriculum]);

  useEffect(() => {
    let filtered = curriculum;
    
    if (selectedSubject && selectedSubject !== 'all') {
      filtered = filtered.filter((item) => item.subject_id === selectedSubject);
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((item) => item.content_category === selectedCategory);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((item) => {
        const info = sessionInfo[item.topic_title];
        if (statusFilter === 'fresh') {
          return info?.fresh_status === statusFilter || info?.fresh_count > 0;
        } else if (statusFilter === 'revision') {
          return info?.revision_status === statusFilter || info?.revision_count > 0;
        }
        return info?.fresh_status === statusFilter || info?.revision_status === statusFilter;
      });
    }

    // Filter by session type (Fresh or Revision)
    if (sessionTypeFilter !== 'all') {
      filtered = filtered.filter((item) => {
        const info = sessionInfo[item.topic_title];
        if (sessionTypeFilter === 'fresh') {
          return info?.fresh_count > 0;
        } else if (sessionTypeFilter === 'revision') {
          return info?.revision_count > 0;
        }
        return true;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        const info = sessionInfo[item.topic_title];
        return (
          item.content_category?.toLowerCase().includes(q) ||
          item.module_code?.toLowerCase().includes(q) ||
          item.module_title?.toLowerCase().includes(q) ||
          item.topic_title?.toLowerCase().includes(q) ||
          item.videos?.toLowerCase().includes(q) ||
          item.quiz_content_ppt?.toLowerCase().includes(q) ||
          item.subject_name?.toLowerCase().includes(q) ||
          info?.volunteer_name?.toLowerCase().includes(q) ||
          info?.fresh_status?.toLowerCase().includes(q) ||
          info?.revision_status?.toLowerCase().includes(q)
        );
      });
    }
    
    setFilteredCurriculum(filtered);
  }, [selectedCategory, selectedSubject, curriculum, searchQuery, sessionInfo, statusFilter, sessionTypeFilter]);

  const fetchCurriculum = async (classId?: string) => {
    try {
      setLoading(true);

      // Filter by class_id - fetch all subjects
      let query: any = supabase
        .from('curriculum')
        .select(`
          *,
          subjects:subject_id(id, name)
        `)
        .order('content_category', { ascending: true })
        .order('module_no', { ascending: true });

      if (classId) {
        query = query.eq('class_id', classId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Fetch error:', error);
        throw error;
      }

      const formattedData = (data as any[] || []).map((item) => {
        // Remove leading "- " from module_name if present
        const cleanModuleTitle = item.module_name?.replace(/^-\s+/, '') || '';
        return {
          id: item.id,
          content_category: item.content_category || '',
          module_code: item.module_no?.toString() || '',
          module_title: cleanModuleTitle,
          topic_title: item.topics_covered || '',
          videos: item.videos || '',
          quiz_content_ppt: item.quiz_content_ppt || '',
          fresh_session: item.fresh_session || '',
          revision_session: item.revision_session || '',
          created_at: item.created_at,
          updated_at: item.updated_at,
          class_id: item.class_id,
          subject_id: item.subject_id,
          subject_name: item.subjects?.name || 'AI',
        };
      });

      setCurriculum(formattedData);
    } catch (error) {
      console.error('Error fetching curriculum:', error);
      toast.error('Failed to load curriculum');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('classes')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      const classList = data || [];
      setClasses(classList);

      // Auto-select "WES Fellows" class if available
      if (!selectedClass) {
        const wesFellows = classList.find((c: Class) =>
          c.name.toLowerCase().includes('wes fellow')
        );
        if (wesFellows) {
          setSelectedClass(wesFellows.id);
        } else if (classList.length > 0) {
          setSelectedClass(classList[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
    }
  };

  const fetchSubjects = async (classId?: string) => {
    try {
      let query: any = supabase
        .from('subjects')
        .select('id, name, description')
        .order('name', { ascending: true });

      if (classId) {
        query = query.eq('class_id', classId);
      }

      const { data, error } = await query;

      if (error) {
        // Fallback: fetch all subjects if class_id filter fails
        const { data: allData } = await (supabase as any)
          .from('subjects')
          .select('id, name, description')
          .order('name', { ascending: true });
        setSubjects(allData || []);
        return;
      }
      setSubjects(data || []);
    } catch (error) {
      console.warn('Subjects table not available yet');
      setSubjects([]);
    }
  };

  const fetchSessionInfo = async (classId?: string) => {
    try {
      // Only fetch if a class is selected
      if (!classId) {
        setSessionInfo({});
        return;
      }

      // Get the class name from the selected class ID
      const selectedClassObj = classes.find(c => c.id === classId);
      if (!selectedClassObj) {
        setSessionInfo({});
        return;
      }

      // Fetch sessions filtered by class_batch (class name)
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select('id, topics_covered, session_type_option, status, session_date, volunteer_name, content_category, class_batch')
        .eq('class_batch', selectedClassObj.name);

      if (error) throw error;

      const sessionMap: Record<string, SessionInfo> = {};

      // Group sessions by topic
      (sessions as any[])?.forEach((session: any) => {
        const topic = session.topics_covered;
        if (!topic) return;

        if (!sessionMap[topic]) {
          sessionMap[topic] = {
            fresh_count: 0,
            revision_count: 0,
            fresh_sessions: [],
            revision_sessions: [],
          };
        }

        const sessionDetail = {
          id: session.id,
          date: session.session_date ? new Date(session.session_date).toLocaleDateString() : 'N/A',
          volunteer: session.volunteer_name || 'N/A',
          status: session.status || 'pending',
        };

        if (session.session_type_option === 'fresh') {
          sessionMap[topic].fresh_count += 1;
          sessionMap[topic].fresh_status = session.status;
          sessionMap[topic].fresh_sessions?.push(sessionDetail);
          if (!sessionMap[topic].session_date) {
            sessionMap[topic].session_date = session.session_date;
          }
          if (!sessionMap[topic].volunteer_name) {
            sessionMap[topic].volunteer_name = session.volunteer_name;
          }
        } else if (session.session_type_option === 'revision') {
          sessionMap[topic].revision_count += 1;
          sessionMap[topic].revision_status = session.status;
          sessionMap[topic].revision_sessions?.push(sessionDetail);
          if (!sessionMap[topic].session_date) {
            sessionMap[topic].session_date = session.session_date;
          }
          if (!sessionMap[topic].volunteer_name) {
            sessionMap[topic].volunteer_name = session.volunteer_name;
          }
        }
      });

      setSessionInfo(sessionMap);
    } catch (error) {
      console.error('Error fetching session info:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!selectedItem) return;

    try {
      const { error } = await supabase
        .from('curriculum')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Curriculum item deleted successfully');
      setCurriculum(curriculum.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error deleting curriculum:', error);
      toast.error('Failed to delete curriculum item');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedItem(null);
    }
  };

  const handleEditStatus = async () => {
    if (!selectedItem || !newStatus || !selectedClass) return;

    try {
      const selectedClassObj = classes.find(c => c.id === selectedClass);
      if (!selectedClassObj) {
        toast.error('Class not found');
        return;
      }

      // Update all sessions with matching topic and class
      const { error } = await supabase
        .from('sessions')
        .update({ status: newStatus })
        .eq('topics_covered', selectedItem.topic_title)
        .eq('class_batch', selectedClassObj.name);

      if (error) throw error;

      toast.success(`Updated status to "${newStatus}" for all sessions with this topic`);
      setStatusDialogOpen(false);
      setNewStatus('');
      setSelectedItem(null);
      
      // Refresh session info
      fetchSessionInfo(selectedClass);
    } catch (error) {
      console.error('Error updating session status:', error);
      toast.error('Failed to update session status');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">📚 Curriculum</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Manage curriculum content
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={() => setIsAddTopicOpen(true)}
              variant="outline"
              className="gap-2 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Add Topic
            </Button>
            <Button
              onClick={() => setIsImportOpen(true)}
              variant="outline"
              className="gap-2 w-full sm:w-auto"
            >
              <Upload className="h-4 w-4" />
              Import Curriculum
            </Button>
          </div>
        </div>

        {/* Filter Section */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end flex-wrap">
          <div className="w-full sm:w-64">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search all columns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="w-full sm:w-64">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Filter by Category
            </label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-64">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Filter by Class
            </label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-64">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Filter by Subject
            </label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-64">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Filter by Status
            </label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="committed">Committed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-64">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Filter by Session Type
            </label>
            <Select value={sessionTypeFilter} onValueChange={setSessionTypeFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select session type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="fresh">Fresh Sessions</SelectItem>
                <SelectItem value="revision">Revision Sessions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(selectedCategory !== 'all' || selectedClass !== '' || selectedSubject !== '' || statusFilter !== 'all' || sessionTypeFilter !== 'all' || searchQuery.trim()) && (
            <div className="text-sm text-muted-foreground">
              Showing {filteredCurriculum.length} item{filteredCurriculum.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Curriculum Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>All Curriculum Items</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : !selectedClass ? (
              <div className="text-center py-12">
                <p className="text-sm md:text-base text-muted-foreground mb-4">
                  Please select a class to view curriculum and session information.
                </p>
              </div>
            ) : curriculum.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm md:text-base text-muted-foreground mb-4">
                  No curriculum items yet. Import data to get started!
                </p>
                <Button onClick={() => setIsImportOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Curriculum
                </Button>
              </div>
            ) : filteredCurriculum.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm md:text-base text-muted-foreground mb-4">
                  No curriculum items found for the selected category.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Module No & Module Name</TableHead>
                        <TableHead>Topics Covered</TableHead>
                        <TableHead>Videos</TableHead>
                        <TableHead>PPT/Quiz</TableHead>
                        <TableHead>Fresh Session</TableHead>
                        <TableHead>Revision Session</TableHead>
                        <TableHead className="w-[60px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCurriculum.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Badge variant="secondary">{item.subject_name || 'Unassigned'}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.content_category}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{item.module_title}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{item.topic_title}</TableCell>
                          <TableCell>
                            {item.videos ? (
                              <a
                                href={item.videos}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                🎥 View
                              </a>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.quiz_content_ppt ? (
                              <a
                                href={item.quiz_content_ppt}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                📊 View
                              </a>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const info = sessionInfo[item.topic_title];
                              if (!info?.fresh_sessions || info.fresh_sessions.length === 0) {
                                return <span className="text-muted-foreground text-xs">-</span>;
                              }
                              const isExpanded = expandedSessions.has(`${item.id}-fresh`);
                              const displaySessions = isExpanded ? info.fresh_sessions : info.fresh_sessions.slice(0, 1);
                              return (
                                <div className="space-y-1">
                                  {displaySessions.map((session, idx) => (
                                    <div key={idx} className="text-xs bg-blue-50 p-1 rounded border border-blue-200">
                                      <div className="font-medium">📅 {session.date}</div>
                                      <div className="text-muted-foreground text-xs">{session.volunteer}</div>
                                      <Badge variant="outline" className="text-xs mt-1">
                                        {session.status}
                                      </Badge>
                                    </div>
                                  ))}
                                  {info.fresh_sessions.length > 1 && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-xs h-6 p-1"
                                      onClick={() => {
                                        const key = `${item.id}-fresh`;
                                        setExpandedSessions(prev => {
                                          const newSet = new Set(prev);
                                          if (newSet.has(key)) {
                                            newSet.delete(key);
                                          } else {
                                            newSet.add(key);
                                          }
                                          return newSet;
                                        });
                                      }}
                                    >
                                      {isExpanded ? 'Show Less' : `+${info.fresh_sessions.length - 1} More`}
                                    </Button>
                                  )}
                                </div>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const info = sessionInfo[item.topic_title];
                              if (!info?.revision_sessions || info.revision_sessions.length === 0) {
                                return <span className="text-muted-foreground text-xs">-</span>;
                              }
                              const isExpanded = expandedSessions.has(`${item.id}-revision`);
                              const displaySessions = isExpanded ? info.revision_sessions : info.revision_sessions.slice(0, 1);
                              return (
                                <div className="space-y-1">
                                  {displaySessions.map((session, idx) => (
                                    <div key={idx} className="text-xs bg-purple-50 p-1 rounded border border-purple-200">
                                      <div className="font-medium">📅 {session.date}</div>
                                      <div className="text-muted-foreground text-xs">{session.volunteer}</div>
                                      <Badge variant="outline" className="text-xs mt-1">
                                        {session.status}
                                      </Badge>
                                    </div>
                                  ))}
                                  {info.revision_sessions.length > 1 && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-xs h-6 p-1"
                                      onClick={() => {
                                        const key = `${item.id}-revision`;
                                        setExpandedSessions(prev => {
                                          const newSet = new Set(prev);
                                          if (newSet.has(key)) {
                                            newSet.delete(key);
                                          } else {
                                            newSet.add(key);
                                          }
                                          return newSet;
                                        });
                                      }}
                                    >
                                      {isExpanded ? 'Show Less' : `+${info.revision_sessions.length - 1} More`}
                                    </Button>
                                  )}
                                </div>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-popover">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedItem(item);
                                    setIsEditOpen(true);
                                  }}
                                >
                                  ✏️ Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedItem(item);
                                    setStatusDialogOpen(true);
                                  }}
                                >
                                  📊 Edit Status
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedItem(item);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                      {filteredCurriculum.map((item) => (
                    <div key={item.id} className="bg-muted/50 rounded-lg p-4 space-y-3 border border-border">
                      {/* Category and Module Info */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <Badge variant="outline" className="mb-2">{item.content_category}</Badge>
                          <h3 className="font-semibold text-foreground break-words">{item.module_title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">Module No & Module Name</p>
                        </div>
                      </div>

                      {/* Topics */}
                      <div className="text-xs">
                        <span className="text-muted-foreground block">Topics Covered</span>
                        <p className="font-medium text-sm mt-1">{item.topic_title}</p>
                      </div>

                      {/* Videos */}
                      {item.videos && (
                        <div className="text-xs">
                          <a
                            href={item.videos}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium"
                          >
                            🎥 View Videos →
                          </a>
                        </div>
                      )}

                      {/* PPT/Quiz */}
                      {item.quiz_content_ppt && (
                        <div className="text-xs">
                          <a
                            href={item.quiz_content_ppt}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium"
                          >
                            📊 View PPT/Quiz →
                          </a>
                        </div>
                      )}

                      {/* Fresh Session */}
                      {(() => {
                        const info = sessionInfo[item.topic_title];
                        if (!info?.fresh_sessions || info.fresh_sessions.length === 0) {
                          return null;
                        }
                        return (
                          <div className="text-xs">
                            <span className="text-muted-foreground block mb-1">🆕 Fresh Sessions</span>
                            <div className="space-y-1">
                              {info.fresh_sessions.map((session, idx) => (
                                <div key={idx} className="bg-blue-50 p-2 rounded border border-blue-200">
                                  <div className="font-medium">📅 {session.date}</div>
                                  <div className="text-muted-foreground">{session.volunteer}</div>
                                  <Badge variant="outline" className="text-xs mt-1">
                                    {session.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Revision Session */}
                      {(() => {
                        const info = sessionInfo[item.topic_title];
                        if (!info?.revision_sessions || info.revision_sessions.length === 0) {
                          return null;
                        }
                        return (
                          <div className="text-xs">
                            <span className="text-muted-foreground block mb-1">🔄 Revision Sessions</span>
                            <div className="space-y-1">
                              {info.revision_sessions.map((session, idx) => (
                                <div key={idx} className="bg-purple-50 p-2 rounded border border-purple-200">
                                  <div className="font-medium">📅 {session.date}</div>
                                  <div className="text-muted-foreground">{session.volunteer}</div>
                                  <Badge variant="outline" className="text-xs mt-1">
                                    {session.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Session Status */}
                      <div className="border-t border-border pt-2">
                        <p className="text-xs text-muted-foreground mb-2">Session Status</p>
                        {(() => {
                          const info = sessionInfo[item.topic_title];
                          if (!info || (info.fresh_count === 0 && info.revision_count === 0)) {
                            return <span className="text-xs text-muted-foreground">No sessions created</span>;
                          }
                          return (
                            <div className="space-y-1">
                              {info.fresh_count > 0 && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                  🆕 Fresh: {info.fresh_count} ({info.fresh_status || 'pending'})
                                </Badge>
                              )}
                              {info.revision_count > 0 && (
                                <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                                  🔄 Revision: {info.revision_count} ({info.revision_status || 'pending'})
                                </Badge>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-border">
                          <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1">
                              <MoreVertical className="h-4 w-4 mr-2" />
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedItem(item);
                                setIsEditOpen(true);
                              }}
                            >
                              ✏️ Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedItem(item);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Curriculum Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedItem?.module_title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedItem && handleDelete(selectedItem.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <UnifiedImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={fetchCurriculum}
      />

      {/* Add Topic Dialog */}
      <AddTopicDialog
        open={isAddTopicOpen}
        onOpenChange={setIsAddTopicOpen}
        onSuccess={fetchCurriculum}
      />

      {/* Edit Dialog */}
      <EditCurriculumDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        item={selectedItem}
        onSuccess={fetchCurriculum}
      />

      {/* Edit Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Session Status</DialogTitle>
            <DialogDescription>
              Update the status for all sessions with topic "{selectedItem?.topic_title}" in {classes.find(c => c.id === selectedClass)?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                New Status
              </label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="committed">Committed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditStatus} disabled={!newStatus}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
