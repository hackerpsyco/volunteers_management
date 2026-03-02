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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ImportSessionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ColumnMapping {
  [key: string]: string;
}

const DATABASE_COLUMNS = [
  { value: 'title', label: 'Session Title (Topics Covered)' },
  { value: 'session_date', label: 'Session Date' },
  { value: 'session_time', label: 'Session Time' },
  { value: 'status', label: 'Status (pending/committed/completed)' },
  { value: 'facilitator_name', label: 'Facilitator Name' },
  { value: 'volunteer_name', label: 'Volunteer Name' },
  { value: 'coordinator_name', label: 'Coordinator Name' },
  { value: 'class_batch', label: 'Class/Batch' },
  { value: 'content_category', label: 'Content Category' },
  { value: 'session_type', label: 'Session Type' },
  { value: 's_no', label: 'S.No' },
  { value: 'modules', label: 'Modules' },
  { value: 'topics_covered', label: 'Topics Covered' },
  { value: 'videos', label: 'Videos (English)' },
  { value: 'videos_hindi', label: 'Videos (Hindi)' },
  { value: 'worksheets', label: 'Work Sheets' },
  { value: 'practical_activity', label: 'Practical Activity' },
  { value: 'quiz_content_ppt', label: 'Quiz/Content PPT' },
  { value: 'final_content_ppt', label: 'Final Content PPT' },
  { value: 'session_objective', label: 'Session Objective' },
  { value: 'practical_activities', label: 'Practical Activities' },
  { value: 'session_highlights', label: 'Session Highlights' },
  { value: 'learning_outcomes', label: 'Learning Outcomes' },
  { value: 'skip', label: 'Skip this column' },
];

// Parse Excel/CSV files properly
function parseExcelFile(file: File): Promise<{ headers: string[]; rows: any[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        
        // Parse Excel file
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        if (jsonData.length === 0) {
          resolve({ headers: [], rows: [] });
          return;
        }
        
        // Get headers from first row
        const headers = Object.keys(jsonData[0]);
        
        resolve({ headers, rows: jsonData });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
}

export function ImportSessionsDialog({
  open,
  onOpenChange,
  onSuccess,
}: ImportSessionsDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'mapping' | 'confirm'>('upload');
  const [previewRows, setPreviewRows] = useState(5);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    // Parse Excel/CSV file
    parseExcelFile(selectedFile)
      .then(({ headers, rows }) => {
        if (rows.length > 0) {
          setCsvData(rows);
          setCsvHeaders(headers);
          
          // Auto-detect and map common column names
          const autoMapping: ColumnMapping = {};
          headers.forEach(header => {
            const headerLower = header.toLowerCase().trim();
            
            // Match your exact Excel columns
            if (headerLower.includes('topic')) {
              autoMapping[header] = 'title';
            } else if (headerLower.includes('category')) {
              autoMapping[header] = 'content_category';
            } else if (headerLower.includes('module')) {
              autoMapping[header] = 'modules';
            } else if (headerLower.includes('volunteer')) {
              autoMapping[header] = 'volunteer_name';
            } else if (headerLower.includes('class')) {
              autoMapping[header] = 'class_batch';
            } else if (headerLower.includes('centre')) {
              autoMapping[header] = 'skip';
            } else if (headerLower.includes('time slot') || headerLower.includes('time')) {
              autoMapping[header] = 'session_time';
            } else if (headerLower.includes('date')) {
              autoMapping[header] = 'session_date';
            } else if (headerLower.includes('type')) {
              autoMapping[header] = 'session_type';
            } else if (headerLower.includes('status')) {
              autoMapping[header] = 'status';
            } else if (headerLower.includes('recording')) {
              autoMapping[header] = 'recording_url';
            } else if (headerLower.includes('meeting')) {
              autoMapping[header] = 'meeting_link';
            }
          });
          
          setColumnMapping(autoMapping);
          setStep('preview');
          toast.success(`Loaded ${rows.length} rows from Excel`);
        } else {
          toast.error('No data found in file');
        }
      })
      .catch((error) => {
        console.error('Error parsing file:', error);
        toast.error(`Error parsing file: ${error.message}`);
      });
  };

  const handleMappingChange = (csvColumn: string, dbColumn: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [csvColumn]: dbColumn,
    }));
  };

  const handleImport = async () => {
    if (Object.keys(columnMapping).length === 0) {
      toast.error('Please map at least one column');
      return;
    }

    // Check if title is mapped
    const hasTitleMapping = Object.values(columnMapping).includes('title');
    if (!hasTitleMapping) {
      toast.error('Please map a column to "Session Title"');
      return;
    }

    setIsLoading(true);

    try {
      // Transform CSV data using column mapping
      const transformedData = csvData.map((row) => {
        const newRow: any = {};
        Object.entries(columnMapping).forEach(([csvCol, dbCol]) => {
          if (dbCol && dbCol !== 'skip' && row[csvCol] !== undefined && row[csvCol] !== '') {
            let value: any = row[csvCol];

            // Type conversion
            if (dbCol === 's_no') {
              value = parseInt(value) || null;
            } else if (dbCol === 'session_date') {
              // Try to parse date
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                value = date.toISOString().split('T')[0];
              }
            } else if (dbCol === 'status') {
              // Normalize status values
              const statusLower = value.toLowerCase().trim();
              if (statusLower.includes('complete') || statusLower.includes('done')) {
                value = 'completed';
              } else if (statusLower.includes('commit') || statusLower.includes('scheduled')) {
                value = 'committed';
              } else {
                value = 'pending';
              }
            }

            newRow[dbCol] = value;
          }
        });

        // Set defaults
        if (!newRow.session_type) newRow.session_type = 'guest_teacher';
        if (!newRow.status) newRow.status = 'completed'; // Default to completed for past sessions
        if (!newRow.session_date) newRow.session_date = new Date().toISOString().split('T')[0];
        if (!newRow.session_time) newRow.session_time = '09:00';
        if (!newRow.class_batch) newRow.class_batch = 'WES Fellow'; // Default class
        
        // Mark as recorded if status is completed
        if (newRow.status === 'completed') {
          newRow.recorded_at = new Date().toISOString();
        }

        return newRow;
      });

      // Validate required fields
      const validData = transformedData.filter((row, index) => {
        const title = String(row.title || '').trim();
        if (!title) {
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
        toast.warning(`Importing ${validData.length} of ${transformedData.length} rows (some rows were skipped due to missing title)`);
      }

      // Insert into database in batches to avoid large payloads
      const batchSize = 10;
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < validData.length; i += batchSize) {
        const batch = validData.slice(i, i + batchSize);
        
        // Clean data - include all mapped fields
        const cleanedBatch = batch.map(row => {
          const cleanedRow: any = {};
          
          // Add all fields that have values
          if (row.title) cleanedRow.title = String(row.title).trim();
          if (row.session_date) cleanedRow.session_date = row.session_date;
          if (row.session_time) cleanedRow.session_time = row.session_time;
          if (row.status) cleanedRow.status = row.status;
          if (row.session_type) cleanedRow.session_type = row.session_type;
          if (row.class_batch) cleanedRow.class_batch = row.class_batch;
          if (row.recorded_at) cleanedRow.recorded_at = row.recorded_at;
          if (row.content_category) cleanedRow.content_category = row.content_category;
          if (row.modules) cleanedRow.modules = row.modules;
          if (row.volunteer_name) cleanedRow.volunteer_name = row.volunteer_name;
          if (row.recording_url) cleanedRow.recording_url = row.recording_url;
          if (row.meeting_link) cleanedRow.meeting_link = row.meeting_link;
          
          // Always ensure these required fields exist
          if (!cleanedRow.title) cleanedRow.title = 'Imported Session';
          if (!cleanedRow.session_date) cleanedRow.session_date = new Date().toISOString().split('T')[0];
          if (!cleanedRow.session_time) cleanedRow.session_time = '09:00';
          if (!cleanedRow.session_type) cleanedRow.session_type = 'guest_teacher';
          if (!cleanedRow.status) cleanedRow.status = 'completed';
          if (!cleanedRow.class_batch) cleanedRow.class_batch = 'WES Fellow';
          
          return cleanedRow;
        });
        
        const { error } = await supabase
          .from('sessions')
          .insert(cleanedBatch);

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
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Sessions from Excel/CSV
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {step === 'upload' && (
            <div className="space-y-4 py-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input" className="cursor-pointer">
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">CSV or Excel files</p>
                  </div>
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Make sure your file has headers in the first row with all your session data
              </p>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4 py-4">
              <div>
                <h3 className="font-medium mb-2">Preview Excel Data</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Review your data below. All columns will be imported.
                </p>
              </div>

              <div className="overflow-x-auto border rounded max-h-[400px]">
                <table className="w-full text-xs">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      {csvHeaders.map((header) => (
                        <th key={header} className="px-3 py-2 text-left font-semibold border-r whitespace-nowrap">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(0, previewRows).map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-t hover:bg-muted/50">
                        {csvHeaders.map((header) => (
                          <td key={`${rowIndex}-${header}`} className="px-3 py-2 border-r truncate max-w-[200px]">
                            {row[header] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-muted-foreground">
                Showing {Math.min(previewRows, csvData.length)} of {csvData.length} rows
              </p>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-4 py-4">
              <div>
                <h3 className="font-medium mb-2">Map Excel Columns to Database Fields</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Review the auto-detected mappings below. Adjust any columns that are incorrect. 
                  <strong> Status column is important</strong> - make sure it's mapped correctly.
                </p>
              </div>

              <div className="space-y-3 max-h-[350px] overflow-y-auto">
                {csvHeaders.map((header, index) => {
                  const currentMapping = columnMapping[header];
                  const isImportant = ['title', 'status', 'session_date', 'facilitator_name'].includes(currentMapping);
                  
                  return (
                    <div 
                      key={`${header}-${index}`} 
                      className={`flex items-end gap-2 p-2 rounded border ${
                        isImportant ? 'border-blue-300 bg-blue-50' : 'border-border'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <Label className="text-xs mb-1 block font-semibold">
                          Excel Column: {header}
                          {isImportant && <span className="text-blue-600 ml-1">★</span>}
                        </Label>
                        <div className="text-xs bg-muted p-2 rounded truncate">
                          Sample: {csvData[0]?.[header] || '(empty)'}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Label className="text-xs mb-1 block">Maps to Database</Label>
                        <Select
                          value={currentMapping || ''}
                          onValueChange={(value) => handleMappingChange(header, value)}
                        >
                          <SelectTrigger className={`h-9 ${isImportant ? 'border-blue-400' : ''}`}>
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            {DATABASE_COLUMNS.map(col => (
                              <SelectItem key={col.value} value={col.value}>
                                {col.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 mt-4 border-t pt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button onClick={() => setStep('mapping')}>
                Next: Map Columns
              </Button>
            </>
          )}
          {step === 'mapping' && (
            <>
              <Button variant="outline" onClick={() => setStep('preview')}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={isLoading}>
                {isLoading ? 'Importing...' : `Import ${csvData.length} Sessions`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
