import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { useAcademicYear } from '@/contexts/AcademicYearContext';

interface ExportCurriculumDialogProps {
  isOpen: boolean;
  onClose: () => void;
  classes: any[];
  defaultClassId?: string;
}

type TimeframeOption = 'current_year' | 'previous_year' | 'monthly' | 'all_time';

export function ExportCurriculumDialog({
  isOpen,
  onClose,
  classes,
  defaultClassId,
}: ExportCurriculumDialogProps) {
  const { selectedYear } = useAcademicYear();
  const [selectedClass, setSelectedClass] = useState<string>(defaultClassId || '');
  const [timeframe, setTimeframe] = useState<TimeframeOption>('current_year');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  // Update default when changed
  React.useEffect(() => {
    if (defaultClassId && !selectedClass) {
      setSelectedClass(defaultClassId);
    }
  }, [defaultClassId, selectedClass]);

  const getDateRangeForTimeframe = () => {
    if (timeframe === 'all_time') {
      return { startDate: new Date('2000-01-01'), endDate: new Date('2100-01-01') };
    }
    
    if (timeframe === 'monthly' && selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59); // Last day of month
      return { startDate, endDate };
    }

    let yearStr = selectedYear;
    if (timeframe === 'previous_year') {
      // Basic fallback to previous year based on selected year
      const [start] = selectedYear.split('-');
      const prevStart = parseInt(start) - 1;
      const prevEndStr = (prevStart + 1).toString().slice(2);
      yearStr = `${prevStart}-${prevEndStr}` as any;
    } else if (timeframe === 'current_year') {
      yearStr = selectedYear;
    }

    const [startYearStr] = yearStr.split('-');
    const startYear = parseInt(startYearStr);
    const startDate = new Date(startYear, 5, 1); // June 1st
    const endDate = new Date(startYear + 1, 4, 31, 23, 59, 59); // May 31st
    
    return { startDate, endDate };
  };

  const handleExport = async () => {
    if (!selectedClass) {
      toast.error('Please select a class');
      return;
    }
    
    if (timeframe === 'monthly' && !selectedMonth) {
      toast.error('Please select a month');
      return;
    }

    setIsExporting(true);
    try {
      const classObj = classes.find((c) => c.id === selectedClass);
      if (!classObj) throw new Error('Class not found');

      // 1. Fetch Curriculum
      const { data: curriculumData, error: curriculumError } = await supabase
        .from('curriculum')
        .select(`*, subjects:subject_id(name)`)
        .eq('class_id', selectedClass)
        .order('content_category', { ascending: true })
        .order('module_no', { ascending: true });

      if (curriculumError) throw curriculumError;

      // 2. Fetch Sessions
      const { startDate, endDate } = getDateRangeForTimeframe();
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('id, topics_covered, status, volunteer_name')
        .eq('class_batch', classObj.name)
        .gte('session_date', startDate.toISOString())
        .lte('session_date', endDate.toISOString());

      if (sessionError) throw sessionError;

      // 3. Map Sessions to Topics
      const topicSessions = new Map<string, any[]>();
      (sessionData || []).forEach(session => {
        if (!session.topics_covered) return;
        const existing = topicSessions.get(session.topics_covered) || [];
        existing.push(session);
        topicSessions.set(session.topics_covered, existing);
      });

      // 4. Generate CSV
      const headers = [
        'Content Category',
        'Module No',
        'Module Name',
        'Topic Title',
        'Videos',
        'Quiz/Content/PPT',
        'Fresh Session',
        'Revision Session',
        'Status',
        'Completed By Volunteer'
      ];

      const escapeCsv = (val: any) => {
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const csvRows = [headers.join(',')];

      (curriculumData || []).forEach(item => {
        const cleanModuleTitle = item.module_name?.replace(/^-\s+/, '') || '';
        const topic = item.topics_covered || '';
        const sessions = topicSessions.get(topic) || [];
        
        let status = 'Not Completed';
        let volunteerName = '-';

        const completedSession = sessions.find(s => s.status === 'completed');
        if (completedSession) {
          status = 'Completed';
          volunteerName = completedSession.volunteer_name || 'Unknown';
        } else if (sessions.some(s => s.status === 'in_progress' || s.status === 'committed' || s.status === 'pending')) {
           // Not completed but there's a session record
           status = 'Not Completed';
           volunteerName = sessions[0].volunteer_name || '-';
        }

        const rowData = [
          item.content_category,
          item.module_no,
          cleanModuleTitle,
          topic,
          item.videos,
          item.quiz_content_ppt,
          item.fresh_session,
          item.revision_session,
          status,
          volunteerName
        ];

        csvRows.push(rowData.map(escapeCsv).join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      
      let timeframeStr = timeframe;
      if (timeframe === 'monthly') timeframeStr = selectedMonth;
      link.setAttribute('download', `Curriculum_Report_${classObj.name.replace(/\s+/g, '_')}_${timeframeStr}.csv`);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Report downloaded successfully');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Curriculum Report</DialogTitle>
          <DialogDescription>
            Download a CSV report containing curriculum data along with completion status for the selected timeframe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Class</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select class..." />
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

          <div className="space-y-2">
            <Label>Timeframe</Label>
            <Select value={timeframe} onValueChange={(val) => setTimeframe(val as TimeframeOption)}>
              <SelectTrigger>
                <SelectValue placeholder="Select timeframe..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current_year">Current Academic Year ({selectedYear})</SelectItem>
                <SelectItem value="previous_year">Previous Academic Year</SelectItem>
                <SelectItem value="monthly">Monthly Wise</SelectItem>
                <SelectItem value="all_time">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {timeframe === 'monthly' && (
            <div className="space-y-2">
              <Label>Select Month</Label>
              <Input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)} 
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting || !selectedClass}>
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export to CSV'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
