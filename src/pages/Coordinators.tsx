import { useState, useEffect } from 'react';
import { Plus, MoreVertical, Trash2 } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { AddCoordinatorDialog } from '@/components/coordinators/AddCoordinatorDialog';

interface Coordinator {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: string;
}

export function Coordinators() {
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCoordinator, setSelectedCoordinator] = useState<Coordinator | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCoordinators();
  }, []);

  const fetchCoordinators = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coordinators')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCoordinators(data || []);
    } catch (error) {
      console.error('Error fetching coordinators:', error);
      toast({
        title: 'Error',
        description: 'Failed to load coordinators',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('coordinators')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCoordinators(coordinators.filter(c => c.id !== id));
      toast({
        title: 'Success',
        description: 'Coordinator deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting coordinator:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete coordinator',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedCoordinator(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Coordinators</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Manage coordinators and supervisors
            </p>
          </div>
          <Button
            onClick={() => setOpenDialog(true)}
            className="gap-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Coordinator</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* Coordinators Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>All Coordinators</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : coordinators.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm md:text-base text-muted-foreground mb-4">
                  No coordinators yet. Add one to get started!
                </p>
                <Button onClick={() => setOpenDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Coordinator
                </Button>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[60px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coordinators.map((coordinator) => (
                        <TableRow key={coordinator.id}>
                          <TableCell className="font-medium">{coordinator.name}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{coordinator.email}</TableCell>
                          <TableCell>{coordinator.phone || '-'}</TableCell>
                          <TableCell>{coordinator.location || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={coordinator.status === 'active' ? 'default' : 'secondary'}>
                              {coordinator.status}
                            </Badge>
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
                                    setSelectedCoordinator(coordinator);
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
                  {coordinators.map((coordinator) => (
                    <div key={coordinator.id} className="bg-muted/50 rounded-lg p-4 space-y-3 border border-border">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground break-words">{coordinator.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">ID: {coordinator.id.substring(0, 8)}</p>
                        </div>
                        <Badge variant={coordinator.status === 'active' ? 'default' : 'secondary'} className="flex-shrink-0">
                          {coordinator.status}
                        </Badge>
                      </div>

                      <div className="text-xs">
                        <span className="text-muted-foreground block">Email</span>
                        <p className="font-medium break-all text-sm">{coordinator.email}</p>
                      </div>

                      {coordinator.phone && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Phone</span>
                          <p className="font-medium text-sm">{coordinator.phone}</p>
                        </div>
                      )}

                      {coordinator.location && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Location</span>
                          <p className="font-medium text-sm">{coordinator.location}</p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2 border-t border-border">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedCoordinator(coordinator);
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

      <AddCoordinatorDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        onSuccess={fetchCoordinators}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coordinator</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCoordinator?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedCoordinator && handleDelete(selectedCoordinator.id)}
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
