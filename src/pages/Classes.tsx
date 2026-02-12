import { useState, useEffect } from 'react';
import { Plus, Trash2, MoreVertical, BookOpen, Users, Upload, Pencil } from 'lucide-react';
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
import { EditClassDialog } from '@/components/classes/EditClassDialog';
import { BulkStudentImportDialog } from '@/components/classes/BulkStudentImportDialog';

interface Class {
  id: string;
  name: string;
  description: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export default function Classes() {
  const navigate = useNavigate();

  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<Class | null>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [classToEdit, setClassToEdit] = useState<Class | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('classes')
        .select('id, name, description, email, created_at, updated_at')
        .order('name', { ascending: true });

      if (error) throw error;

      setClasses(data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('classes').delete().eq('id', id);

      if (error) throw error;

      toast.success('Class deleted');
      setClasses(classes.filter((c) => c.id !== id));

      setDeleteDialogOpen(false);
      setClassToDelete(null);
    } catch (error) {
      console.error(error);
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
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Classes</h1>
            <p className="text-muted-foreground">
              Manage classes and students
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsBulkImportOpen(true)}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Import Students
            </Button>

            <Button
              onClick={() => setIsAddClassOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Class
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              All Classes
            </CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full" />
              </div>
            ) : classes.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No classes yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[60px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {classes.map((classItem) => (
                    <TableRow key={classItem.id}>
                      <TableCell className="font-medium">
                        {classItem.name}
                      </TableCell>

                      <TableCell>
                        {classItem.email || '-'}
                      </TableCell>

                      <TableCell>
                        {new Date(classItem.created_at).toLocaleDateString()}
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">

                            {/* EDIT */}
                            <DropdownMenuItem
                              onClick={() => {
                                setClassToEdit(classItem);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>

                            {/* STUDENTS */}
                            <DropdownMenuItem
                              onClick={() => handleViewStudents(classItem)}
                            >
                              <Users className="h-4 w-4 mr-2" />
                              Students
                            </DropdownMenuItem>

                            {/* DELETE */}
                            <DropdownMenuItem
                              onClick={() => {
                                setClassToDelete(classItem);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-destructive"
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}

      <AddClassDialog
        open={isAddClassOpen}
        onOpenChange={setIsAddClassOpen}
        onSuccess={fetchClasses}
      />

      <EditClassDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchClasses}
        classData={classToEdit}
      />

      <BulkStudentImportDialog
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
        onSuccess={fetchClasses}
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{classToDelete?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => classToDelete && handleDelete(classToDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </DashboardLayout>
  );
}
