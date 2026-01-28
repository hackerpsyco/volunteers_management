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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UnifiedImportDialog } from '@/components/sessions/UnifiedImportDialog';
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
}

export default function Curriculum() {
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CurriculumItem | null>(null);

  useEffect(() => {
    fetchCurriculum();
  }, []);

  const fetchCurriculum = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('curriculum')
        .select('*')
        .order('content_category', { ascending: true })
        .order('module_no', { ascending: true });

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
      }));

      setCurriculum(formattedData);
    } catch (error) {
      console.error('Error fetching curriculum:', error);
      toast.error('Failed to load curriculum');
    } finally {
      setLoading(false);
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
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Module No.</TableHead>
                        <TableHead>Module Name</TableHead>
                        <TableHead>Topics Covered</TableHead>
                        <TableHead>Videos</TableHead>
                        <TableHead>PPT/Quiz</TableHead>
                        <TableHead>Fresh Session</TableHead>
                        <TableHead>Revision Session</TableHead>
                        <TableHead className="w-[60px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {curriculum.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Badge variant="outline">{item.content_category}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{item.module_code}</TableCell>
                          <TableCell>{item.module_title}</TableCell>
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
                            {item.fresh_session ? (
                              <a
                                href={item.fresh_session}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                📅 View
                              </a>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.revision_session ? (
                              <a
                                href={item.revision_session}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                🔄 View
                              </a>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
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
                  {curriculum.map((item) => (
                    <div key={item.id} className="bg-muted/50 rounded-lg p-4 space-y-3 border border-border">
                      {/* Category and Module No */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <Badge variant="outline" className="mb-2">{item.content_category}</Badge>
                          <h3 className="font-semibold text-foreground break-words">{item.module_title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">Module: {item.module_code}</p>
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
                      {item.fresh_session && (
                        <div className="text-xs">
                          <a
                            href={item.fresh_session}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium"
                          >
                            📅 View Fresh Session →
                          </a>
                        </div>
                      )}

                      {/* Revision Session */}
                      {item.revision_session && (
                        <div className="text-xs">
                          <a
                            href={item.revision_session}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium"
                          >
                            🔄 View Revision Session →
                          </a>
                        </div>
                      )}

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
    </DashboardLayout>
  );
}
