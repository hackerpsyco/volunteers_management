import { useState, useEffect } from 'react';
import { Trash2, Upload, Edit2, X, Check } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UnifiedImportDialog } from '@/components/sessions/UnifiedImportDialog';

interface RawCurriculumData {
  id: string;
  content_category: string;
  module_no: number;
  module_name: string;
  topics_covered: string;
  videos: string;
  quiz_content_ppt: string;
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
  created_at?: string;
  updated_at?: string;
}

export default function Curriculum() {
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<CurriculumItem>>({});

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
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      setCurriculum(formattedData);

      const uniqueCategories = [...new Set(formattedData.map(item => item.content_category))].filter(Boolean);
      setCategories(uniqueCategories);
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
      const { error } = await supabase
        .from('curriculum')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Curriculum item deleted successfully');
      fetchCurriculum();
    } catch (error) {
      console.error('Error deleting curriculum:', error);
      toast.error('Failed to delete curriculum item');
    }
  };

  const handleEdit = (item: CurriculumItem) => {
    setEditingId(item.id);
    setEditData({ ...item });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    try {
      const { error } = await supabase
        .from('curriculum')
        .update({
          content_category: editData.content_category,
          module_no: editData.module_code ? parseInt(editData.module_code) : null,
          module_name: editData.module_title,
          topics_covered: editData.topic_title,
          videos: editData.videos,
          quiz_content_ppt: editData.quiz_content_ppt,
        })
        .eq('id', editingId);

      if (error) throw error;
      toast.success('Curriculum item updated successfully');
      setEditingId(null);
      setEditData({});
      fetchCurriculum();
    } catch (error) {
      console.error('Error updating curriculum:', error);
      toast.error('Failed to update curriculum item');
    }
  };

  const filteredCurriculum = curriculum.filter(item =>
    !filterCategory || item.content_category === filterCategory
  );

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
                    <th className="px-4 py-3 text-center text-sm font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCurriculum.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                      <td className="px-4 py-3 text-sm">
                        {editingId === item.id ? (
                          <input
                            type="text"
                            value={editData.content_category || ''}
                            onChange={(e) => setEditData({ ...editData, content_category: e.target.value })}
                            className="w-full px-2 py-1 border border-input rounded"
                          />
                        ) : (
                          item.content_category
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {editingId === item.id ? (
                          <input
                            type="number"
                            value={editData.module_code || ''}
                            onChange={(e) => setEditData({ ...editData, module_code: e.target.value })}
                            className="w-full px-2 py-1 border border-input rounded"
                          />
                        ) : (
                          item.module_code
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {editingId === item.id ? (
                          <input
                            type="text"
                            value={editData.module_title || ''}
                            onChange={(e) => setEditData({ ...editData, module_title: e.target.value })}
                            className="w-full px-2 py-1 border border-input rounded"
                          />
                        ) : (
                          item.module_title
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {editingId === item.id ? (
                          <input
                            type="text"
                            value={editData.topic_title || ''}
                            onChange={(e) => setEditData({ ...editData, topic_title: e.target.value })}
                            className="w-full px-2 py-1 border border-input rounded"
                          />
                        ) : (
                          item.topic_title
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {editingId === item.id ? (
                          <input
                            type="text"
                            value={editData.videos || ''}
                            onChange={(e) => setEditData({ ...editData, videos: e.target.value })}
                            className="w-full px-2 py-1 border border-input rounded"
                          />
                        ) : item.videos ? (
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
                        {editingId === item.id ? (
                          <input
                            type="text"
                            value={editData.quiz_content_ppt || ''}
                            onChange={(e) => setEditData({ ...editData, quiz_content_ppt: e.target.value })}
                            className="w-full px-2 py-1 border border-input rounded"
                          />
                        ) : item.quiz_content_ppt ? (
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
                      <td className="px-4 py-3 text-center">
                        {editingId === item.id ? (
                          <div className="flex gap-1 justify-center">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={handleSaveEdit}
                              className="gap-1"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                              className="gap-1"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1 justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(item)}
                              className="gap-1"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(item.id)}
                              className="gap-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
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
