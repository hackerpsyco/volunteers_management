import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { importCurriculum } from '@/utils/universalImporter';

interface UnifiedImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ColumnMapping {
  [key: string]: string;
}

const SESSION_COLUMNS = [
  { value: 'title', label: 'Session Title (Topics Covered)' },
  { value: 'session_date', label: 'Session Date' },
  { value: 'session_time', label: 'Session Time' },
  { value: 'session_type', label: 'Session Type' },
  { value: 'content_category', label: 'Content Category' },
  { value: 's_no', label: 'S.No' },
  { value: 'modules', label: 'Modules' },
  { value: 'topics_covered', label: 'Topics Covered' },
  { value: 'videos', label: 'Videos (English)' },
  { value: 'videos_hindi', label: 'Videos (Hindi)' },
  { value: 'worksheets', label: 'Work Sheets' },
  { value: 'practical_activity', label: 'Practical Activity' },
  { value: 'quiz_content_ppt', label: 'Quiz/Content PPT' },
  { value: 'final_content_ppt', label: 'Final Content PPT' },
  { value: 'session_status', label: 'Session Status' },
  { value: 'status', label: 'Status' },
  { value: 'guest_speaker', label: 'Session By (Guest Speaker)' },
  { value: 'teacher', label: 'Session By (Teacher)' },
  { value: 'skip', label: 'Skip this column' },
];

function parseCSV(text: string): { headers: string[]; rows: any[] } {
  const lines = text.trim().split('\n').filter(line => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  let headerLineIndex = 0;
  let headers: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const potentialHeaders = lines[i]
      .split(',')
      .map(h => h.trim().replace(/^"|"$/g, ''))
      .filter(h => h !== '');
    
    if (potentialHeaders.length > 0 && potentialHeaders.some(h => isNaN(Number(h)))) {
      headers = potentialHeaders;
      headerLineIndex = i;
      break;
    }
  }

  if (headers.length === 0) return { headers: [], rows: [] };

  const rows = lines.slice(headerLineIndex + 1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: any = {};
    headers.forEach((header, index) => {
      const value = values[index] || '';
      row[header] = value;
    });
    return row;
  }).filter(row => {
    return Object.values(row).some(v => v !== '');
  });

  return { headers, rows };
}

export function UnifiedImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: UnifiedImportDialogProps) {
  const [activeTab, setActiveTab] = useState<'sessions' | 'curriculum'>('sessions');
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'mapping'>('upload');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const { headers, rows } = parseCSV(text);

        if (rows.length > 0) {
          setCsvData(rows);
          setCsvHeaders(headers);
          setStep('mapping');
          toast.success(`Loaded ${rows.length} rows from file`);
        } else {
          toast.error('No data found in file');
        }
      } catch (error) {
        toast.error(`Error parsing file: ${error}`);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleMappingChange = (csvColumn: string, dbColumn: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [csvColumn]: dbColumn,
    }));
  };

  const handleSessionImport = async () => {
    if (Object.keys(columnMapping).length === 0) {
      toast.error('Please map at least one column');
      return;
    }

    const hasTitleMapping = Object.values(columnMapping).includes('title');
    if (!hasTitleMapping) {
      toast.error('Please map a column to "Session Title"');
      return;
    }

    setIsLoading(true);

    try {
      const transformedData = csvData.map((row) => {
        const newRow: any = {};
        Object.entries(columnMapping).forEach(([csvCol, dbCol]) => {
          if (dbCol && dbCol !== 'skip' && row[csvCol] !== undefined && row[csvCol] !== '') {
            let value: any = row[csvCol];

            if (dbCol === 's_no') {
              value = parseInt(value) || null;
            } else if (dbCol === 'session_date') {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                value = date.toISOString().split('T')[0];
              }
            }

            newRow[dbCol] = value;
          }
        });

        if (!newRow.session_type) newRow.session_type = 'guest_teacher';
        if (!newRow.status) newRow.status = 'scheduled';
        if (!newRow.session_date) newRow.session_date = new Date().toISOString().split('T')[0];
        if (!newRow.session_time) newRow.session_time = '09:00';

        return newRow;
      });

      const validData = transformedData.filter((row, index) => {
        if (!row.title || row.title.trim() === '') {
          console.warn(`Row ${index + 1} skipped: missing title`);
          return false;
        }
        return true;
      });

      if (validData.length === 0) {
        toast.error('No valid data to import. Make sure you have mapped the "Session Title" column.');
        setIsLoading(false);
        return;
      }

      if (validData.length < transformedData.length) {
        toast.warning(`Importing ${validData.length} of ${transformedData.length} rows`);
      }

      const batchSize = 10;
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < validData.length; i += batchSize) {
        const batch = validData.slice(i, i + batchSize);
        const { error } = await supabase
          .from('sessions')
          .insert(batch);

        if (error) {
          console.error(`Batch ${i / batchSize + 1} error:`, error);
          failureCount += batch.length;
        } else {
          successCount += batch.length;
        }
      }

      if (failureCount > 0) {
        toast.error(`Import partially failed: ${successCount} imported, ${failureCount} failed`);
      } else {
        toast.success(`Successfully imported ${successCount} sessions`);
      }

      handleClose();
      onSuccess();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('An error occurred during import');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCurriculumImport = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setIsLoading(true);

    try {
      const text = await file.text();
      console.log('File text length:', text.length);
      const result = await importCurriculum(text);

      console.log('Import result:', result);

      if (result.errors.length > 0) {
        console.error('Import errors:', result.errors);
        toast.error(`Import failed: ${result.errors.join(', ')}`);
      } else {
        toast.success(`Successfully imported ${result.success} curriculum items`);
      }

      handleClose();
      onSuccess();
    } catch (error) {
      console.error('Curriculum import error:', error);
      toast.error('An error occurred during curriculum import');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setCsvData([]);
    setCsvHeaders([]);
    setColumnMapping({});
    setStep('upload');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Data
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'sessions' | 'curriculum')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="space-y-4">
            {step === 'upload' && (
              <div className="space-y-4 py-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-900 font-medium mb-2">📌 Important:</p>
                  <p className="text-xs text-blue-800">
                    For video/resource links, use full URLs (e.g., Google Drive, OneDrive, or direct file links). File names alone won't work as clickable links.
                  </p>
                </div>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="sessions-file-input"
                  />
                  <label htmlFor="sessions-file-input" className="cursor-pointer">
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm font-medium">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground">CSV or Excel files</p>
                    </div>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Make sure your file has headers in the first row
                </p>
              </div>
            )}

            {step === 'mapping' && (
              <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
                <div>
                  <h3 className="font-medium mb-3">Map CSV Columns to Database Fields</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select which database field each CSV column should map to. You must map at least one column to "Session Title".
                  </p>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <p className="text-xs text-amber-900 font-medium mb-1">💡 Tip for Video/Resource Links:</p>
                    <p className="text-xs text-amber-800">
                      If your CSV contains file names instead of URLs, they won't be clickable. Convert them to shareable links first (Google Drive, OneDrive, etc.)
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {csvHeaders.map((header, index) => (
                    <div key={`${header}-${index}`} className="flex items-end gap-2">
                      <div className="flex-1">
                        <Label className="text-xs mb-1 block">CSV Column: {header}</Label>
                        <div className="text-xs bg-muted p-2 rounded truncate">
                          {csvData[0]?.[header] || '(empty)'}
                        </div>
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs mb-1 block">Maps to</Label>
                        <Select
                          value={columnMapping[header] || ''}
                          onValueChange={(value) => handleMappingChange(header, value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            {SESSION_COLUMNS.map(col => (
                              <SelectItem key={col.value} value={col.value}>
                                {col.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="curriculum" className="space-y-4">
            {step === 'upload' && (
              <div className="space-y-4 py-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.html"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="curriculum-file-input"
                  />
                  <label htmlFor="curriculum-file-input" className="cursor-pointer">
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm font-medium">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground">CSV, Excel, or HTML files</p>
                    </div>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Supports curriculum data in CSV, Excel, or HTML table format
                </p>
              </div>
            )}

            {step === 'mapping' && (
              <div className="space-y-4 py-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    ✓ File loaded successfully. Click "Import Curriculum" to process the data.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {step === 'upload' && file && (
            <Button onClick={() => setStep('mapping')}>
              Next
            </Button>
          )}
          {step === 'mapping' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              {activeTab === 'sessions' && (
                <Button onClick={handleSessionImport} disabled={isLoading}>
                  {isLoading ? 'Importing...' : `Import ${csvData.length} Sessions`}
                </Button>
              )}
              {activeTab === 'curriculum' && (
                <Button onClick={handleCurriculumImport} disabled={isLoading}>
                  {isLoading ? 'Importing...' : 'Import Curriculum'}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
