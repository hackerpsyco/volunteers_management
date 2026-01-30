import { useState, useEffect } from 'react';
import { Plus, Trash2, MoreVertical, BookOpen, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { AddClassDialog } from '@/components/classes/AddClassDialog';

interface Class {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export default function Classes() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<Class | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Class deleted successfully');
      setClasses(classes.filter((c) => c.id !== id));
      setDeleteDialogOpen(false);
      setClassToDelete(null);
    } catch (error) {
      console.error('Error deleting class:', error);
      toast.error('Failed to delete class');
    }
  };

  const handleViewStudents = (classItem: Class) => {
    navigate(`/classes/${classItem.id}/students`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Classes</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Manage classes and students
            </p>
          </div>
          <Button
            onClick={() => setIsAddClassOpen(true)}
            className="w-full sm:w-auto gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Class</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* Classes Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              All Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : classes.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No classes yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Get started by adding your first class
                </p>
                <Button onClick={() => setIsAddClassOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Class
                </Button>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Class Name</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-[60px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classes.map((classItem) => (
                        <TableRow key={classItem.id}>
                          <TableCell className="font-medium">{classItem.name}</TableCell>
                          <TableCell className="text-sm">
                            {new Date(classItem.created_at).toLocaleDateString()}
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
                                  onClick={() => handleViewStudents(classItem)}
                                >
                                  <Users className="h-4 w-4 mr-2" />
                                  Students
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setClassToDelete(classItem);
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
                  {classes.map((classItem) => (
                    <div key={classItem.id} className="bg-muted/50 rounded-lg p-4 space-y-3 border border-border">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground break-words">{classItem.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            Created: {new Date(classItem.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-border">
                        <Button
                          size="sm"
                          onClick={() => handleViewStudents(classItem)}
                          className="flex-1"
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Students
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setClassToDelete(classItem);
                            setDeleteDialogOpen(true);
                          }}
                          className="flex-1"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Class Dialog */}
      <AddClassDialog
        open={isAddClassOpen}
        onOpenChange={setIsAddClassOpen}
        onSuccess={fetchClasses}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{classToDelete?.name}"? This will also delete all students in this class. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => classToDelete && handleDelete(classToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
