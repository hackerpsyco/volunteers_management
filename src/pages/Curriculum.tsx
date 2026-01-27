import { useState, useEffect } from 'react';
import { Trash2, Upload } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UnifiedImportDialog } from '@/components/sessions/UnifiedImportDialog';

interface CurriculumItem {
  id: string;
  content_category: string;
  module_code: string;
  module_title: string;
  topic_title: string;
  videos: string;
  quiz_content_ppt: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export default function Curriculum() {
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);

  useEffect(() => {
    fetchCurriculum();
  }, []);

  const fetchCurriculum = async () => {
    try {
      setLoading(true);
      
      // Fetch from topic_sessions with joins to get full curriculum data
      const { data, error } = await (supabase
        .from('topic_sessions' as any)
        .select(`
          id,
          status,
          video_english,
          quiz_content_ppt,
          created_at,
          updated_at,
          topics (
            title,
            topic_code,
            modules (
              module_code,
              title,
              content_categories (
                name
              )
            )
          )
        `)
        .order('created_at', { ascending: false }) as any);

      if (error) {
        console.error('Fetch error:', error);
        throw error;
      }

      console.log('Fetched curriculum data:', data);

      const formattedData = (data || []).map((item: any) => ({
        id: item.id,
        content_category: item.topics?.modules?.content_categories?.name || '',
        module_code: item.topics?.modules?.module_code || '',
        module_title: item.topics?.modules?.title || '',
        topic_title: item.topics?.title || '',
        videos: item.video_english || '',
        quiz_content_ppt: item.quiz_content_ppt || '',
        status: item.status || 'pending',
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      console.log('Formatted data:', formattedData);
      setCurriculum(formattedData);

      // Extract unique categories and statuses
      const uniqueCategories = [...new Set(formattedData.map(item => item.content_category))].filter(Boolean) as string[];
      const uniqueStatuses = [...new Set(formattedData.map(item => item.status))].filter(Boolean) as string[];
      setCategories(uniqueCategories);
      setStatuses(uniqueStatuses);
    } catch (error) {
      console.error('Error fetching curriculum:', error);
      toast.error('Failed to load curriculum');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this curriculum item?')) return;

    try {
      const { error } = await (supabase
        .from('topic_sessions' as any)
        .delete()
        .eq('id', id) as any);

      if (error) throw error;
      toast.success('Curriculum item deleted successfully');
      fetchCurriculum();
    } catch (error) {
      console.error('Error deleting curriculum:', error);
      toast.error('Failed to delete curriculum item');
    }
  };

  const filteredCurriculum = curriculum.filter(item => {
    const categoryMatch = !filterCategory || item.content_category === filterCategory;
    const statusMatch = !filterStatus || item.status === filterStatus;
    return categoryMatch && statusMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'available':
        return 'bg-blue-100 text-blue-800';
      case 'committed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Curriculum</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Manage curriculum content and resources
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

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Filter by Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Filter by Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Statuses</option>
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Curriculum Table */}
        <div className="space-y-3 md:space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredCurriculum.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <p className="text-sm md:text-base text-muted-foreground">
                {curriculum.length === 0 ? 'No curriculum items yet. Import data to get started!' : 'No items match your filters.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Content Category</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Module No.</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Module Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Topics Covered</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Videos</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">QUIZ/CONTENT PPT</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCurriculum.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                      <td className="px-4 py-3 text-sm">{item.content_category}</td>
                      <td className="px-4 py-3 text-sm font-medium">{item.module_code}</td>
                      <td className="px-4 py-3 text-sm">{item.module_title}</td>
                      <td className="px-4 py-3 text-sm">{item.topic_title}</td>
                      <td className="px-4 py-3 text-sm">
                        {item.videos ? (
                          <a 
                            href={item.videos} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline truncate block max-w-xs"
                            title={item.videos}
                          >
                            🎥 Video
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {item.quiz_content_ppt ? (
                          <a 
                            href={item.quiz_content_ppt} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline truncate block max-w-xs"
                            title={item.quiz_content_ppt}
                          >
                            📊 PPT
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status || 'pending')}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(item.id)}
                          className="gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Import Dialog */}
      <UnifiedImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={fetchCurriculum}
      />
    </DashboardLayout>
  );
}
