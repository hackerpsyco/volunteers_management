import { useState, useEffect } from 'react';
import { Trash2, Upload, MoreVertical } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UnifiedImportDialog } from '@/components/sessions/UnifiedImportDialog';
import { EditCurriculumDialog } from '@/components/curriculum/EditCurriculumDialog';
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
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CurriculumItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sessionInfo, setSessionInfo] = useState<Record<string, SessionInfo>>({});

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    // Fetch curriculum and session info when class is selected
    if (selectedClass) {
      fetchCurriculum(selectedClass);
      fetchSessionInfo(selectedClass);
    } else {
      setCurriculum([]);
      setFilteredCurriculum([]);
      setSessionInfo({});
    }
  }, [selectedClass]);

  useEffect(() => {
    // Filter curriculum based on selected category
    let filtered = curriculum;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((item) => item.content_category === selectedCategory);
    }
    
    setFilteredCurriculum(filtered);
  }, [selectedCategory, curriculum]);

  const fetchCurriculum = async (classId?: string) => {
    try {
      setLoading(true);

      // Filter by class_id if provided
      let query: any = supabase
        .from('curriculum')
        .select('*')
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

      const formattedData = (data as RawCurriculumData[] || []).map((item) => ({
        id: item.id,
        content_category: item.content_category || '',
        module_code: item.module_no?.toString() || '',
        module_title: item.module_name || '',
        topic_title: item.topics_covered || '',
        videos: item.videos || '',
        quiz_content_ppt: item.quiz_content_ppt || '',
        fresh_session: item.fresh_session || '',
        revision_session: item.revision_session || '',
        created_at: item.created_at,
        updated_at: item.updated_at,
        class_id: (item as any).class_id,
      }));

      setCurriculum(formattedData);

      // Extract unique categories
      const uniqueCategories = [...new Set(formattedData.map((item) => item.content_category))].sort();
      setCategories(uniqueCategories as string[]);
    } catch (error) {
      console.error('Error fetching curriculum:', error);
      toast.error('Failed to load curriculum');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
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
          <Button
            onClick={() => setIsImportOpen(true)}
            variant="outline"
            className="gap-2 w-full sm:w-auto"
          >
            <Upload className="h-4 w-4" />
            Import Curriculum
          </Button>
        </div>

        {/* Filter Section */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
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

          {(selectedCategory !== 'all' || selectedClass !== '') && (
            <div className="text-sm text-muted-foreground mt-2 sm:mt-0">
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
                        <TableHead>Category</TableHead>
                        <TableHead>Module No & Module Name</TableHead>
                        <TableHead>Topics Covered</TableHead>
                        <TableHead>Videos</TableHead>
                        <TableHead>PPT/Quiz</TableHead>
                        <TableHead>Fresh Session</TableHead>
                        <TableHead>Revision Session</TableHead>
                        <TableHead>Session Date</TableHead>
                        <TableHead>Volunteer Name</TableHead>
                        <TableHead>Session Status</TableHead>
                        <TableHead className="w-[60px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCurriculum.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Badge variant="outline">{item.content_category}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{item.module_code} - {item.module_title}</TableCell>
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
                              return (
                                <div className="space-y-1">
                                  {info.fresh_sessions.map((session, idx) => (
                                    <div key={idx} className="text-xs bg-blue-50 p-1 rounded border border-blue-200">
                                      <div className="font-medium">📅 {session.date}</div>
                                      <div className="text-muted-foreground">{session.volunteer}</div>
                                      <Badge variant="outline" className="text-xs mt-1">
                                        {session.status}
                                      </Badge>
                                    </div>
                                  ))}
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
                              return (
                                <div className="space-y-1">
                                  {info.revision_sessions.map((session, idx) => (
                                    <div key={idx} className="text-xs bg-purple-50 p-1 rounded border border-purple-200">
                                      <div className="font-medium">📅 {session.date}</div>
                                      <div className="text-muted-foreground">{session.volunteer}</div>
                                      <Badge variant="outline" className="text-xs mt-1">
                                        {session.status}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const info = sessionInfo[item.topic_title];
                              if (!info?.session_date) {
                                return <span className="text-muted-foreground text-xs">-</span>;
                              }
                              return (
                                <span className="text-sm">
                                  {new Date(info.session_date).toLocaleDateString()}
                                </span>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const info = sessionInfo[item.topic_title];
                              if (!info?.volunteer_name) {
                                return <span className="text-muted-foreground text-xs">-</span>;
                              }
                              return <span className="text-sm">{info.volunteer_name}</span>;
                            })()}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const info = sessionInfo[item.topic_title];
                              if (!info || (info.fresh_count === 0 && info.revision_count === 0)) {
                                return <span className="text-muted-foreground text-xs">No sessions</span>;
                              }
                              return (
                                <div className="space-y-1">
                                  {info.fresh_count > 0 && (
                                    <div className="text-xs">
                                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                        🆕 Fresh: {info.fresh_count} ({info.fresh_status || 'pending'})
                                      </Badge>
                                    </div>
                                  )}
                                  {info.revision_count > 0 && (
                                    <div className="text-xs">
                                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                        🔄 Revision: {info.revision_count} ({info.revision_status || 'pending'})
                                      </Badge>
                                    </div>
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
                          <h3 className="font-semibold text-foreground break-words">{item.module_code} - {item.module_title}</h3>
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

      {/* Edit Dialog */}
      <EditCurriculumDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        item={selectedItem}
        onSuccess={fetchCurriculum}
      />
    </DashboardLayout>
  );
}
