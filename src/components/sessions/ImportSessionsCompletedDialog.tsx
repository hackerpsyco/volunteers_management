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

// Dynamic import for xlsx library
let XLSX: any = null;
const loadXLSX = async () => {
  if (!XLSX) {
    XLSX = await import('xlsx');
  }
  return XLSX;
};

interface ImportSessionsCompletedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ColumnMapping {
  [key: string]: string;
}

const SESSION_COLUMNS = [
  { value: 'title', label: 'Session Title / Topics Covered' },
  { value: 'session_date', label: 'Session Date' },
  { value: 'session_time', label: 'Session Time' },
  { value: 'facilitator_name', label: 'Facilitator Name' },
  { value: 'volunteer_name', label: 'Volunteer Name' },
  { value: 'content_category', label: 'Content Category' },
  { value: 'module_no', label: 'Module No.' },
  { value: 'module_name', label: 'Module Name' },
  { value: 'topics_covered', label: 'Topics Covered' },
  { value: 'session_objective', label: 'Session Objective' },
  { value: 'practical_activities', label: 'Practical Activities' },
  { value: 'session_highlights', label: 'Session Highlights' },
  { value: 'learning_outcomes', label: 'Learning Outcomes' },
  { value: 'best_performer', label: 'Best Performer' },
  { value: 'status', label: 'Status' },
  { value: 'session_type', label: 'Session Type' },
  { value: 'skip', label: 'Skip this column' },
];

function parseCSV(text: string): { headers: string[]; rows: any[] } {
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedText.trim().split('\n').filter(line => line.trim());
  
  if (lines.length === 0) return { headers: [], rows: [] };

  let headerLineIndex = 0;
  let headers: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const potentialHeaders = lines[i]
      .split(',')
      .map(h => h.trim().replace(/^"|"$/g, '').replace(/\r/g, ''))
      .filter(h => h !== '');
    
    if (potentialHeaders.length > 0 && potentialHeaders.some(h => isNaN(Number(h)))) {
      headers = potentialHeaders;
      headerLineIndex = i;
      break;
    }
  }

  if (headers.length === 0) {
    return { headers: [], rows: [] };
  }

  const rows = lines.slice(headerLineIndex + 1).map((line) => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, '').replace(/\r/g, ''));
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

async function parseExcel(file: File): Promise<{ headers: string[]; rows: any[]; sheets: string[] }> {
  try {
    const xlsx = await loadXLSX();
    const arrayBuffer = await file.arrayBuffer();
    const workbook = xlsx.read(arrayBuffer, { type: 'array' });
    
    return {
      headers: [],
      rows: [],
      sheets: workbook.SheetNames,
    };
  } catch (error) {
    console.error('Error reading Excel:', error);
    throw new Error(`Failed to read Excel file: ${error}`);
  }
}

async function parseExcelSheet(file: File, sheetName: string): Promise<{ headers: string[]; rows: any[] }> {
  try {
    const xlsx = await loadXLSX();
    const arrayBuffer = await file.arrayBuffer();
    const workbook = xlsx.read(arrayBuffer, { type: 'array' });
    
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      throw new Error(`Sheet "${sheetName}" not found`);
    }
    
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (!data || data.length === 0) {
      return { headers: [], rows: [] };
    }

    let headerLineIndex = 0;
    let headers: string[] = [];
    
    for (let i = 0; i < Math.min(data.length, 20); i++) {
      const potentialHeaders = (data[i] as any[])
        .map(h => String(h || '').trim())
        .filter(h => h !== '');
      
      if (potentialHeaders.length >= 3) {
        const textCount = potentialHeaders.filter(h => isNaN(Number(h))).length;
        if (textCount >= potentialHeaders.length * 0.7) {
          headers = potentialHeaders;
          headerLineIndex = i;
          break;
        }
      }
    }

    if (headers.length === 0) {
      return { headers: [], rows: [] };
    }

    const rows = (data as any[]).slice(headerLineIndex + 1).map((row) => {
      const obj: any = {};
      headers.forEach((header, index) => {
        const value = row[index];
        obj[header] = value ? String(value).trim() : '';
      });
      return obj;
    }).filter(row => {
      return Object.values(row).some(v => v !== '');
    });

    return { headers, rows };
  } catch (error) {
    console.error('Error parsing Excel sheet:', error);
    throw new Error(`Failed to parse Excel sheet: ${error}`);
  }
}

export function ImportSessionsCompletedDialog({
  open,
  onOpenChange,
  onSuccess,
}: ImportSessionsCompletedDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'sheet-select' | 'mapping'>('upload');
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
        let headers: string[] = [];
        let rows: any[] = [];

        if (fileExtension === 'xlsx' || fileExtension === 'xls') {
          const result = await parseExcel(selectedFile);
          setAvailableSheets(result.sheets);
          
          const sessionsSheet = result.sheets.find(s => s.toLowerCase().includes('session'));
          const sheetToUse = sessionsSheet || result.sheets[0];
          setSelectedSheet(sheetToUse);
          
          if (result.sheets.length === 1 || sessionsSheet) {
            const sheetData = await parseExcelSheet(selectedFile, sheetToUse);
            headers = sheetData.headers;
            rows = sheetData.rows;
            
            if (rows.length > 0) {
              setCsvData(rows);
              setCsvHeaders(headers);
              setStep('mapping');
              toast.success(`Loaded ${rows.length} sessions from "${sheetToUse}" sheet`);
            } else {
              toast.error('No data found in sheet');
            }
          } else {
            setStep('sheet-select');
            toast.info('Please select a sheet to import');
          }
        } else {
          const text = event.target?.result as string;
          const result = parseCSV(text);
          headers = result.headers;
          rows = result.rows;
          
          if (rows.length > 0) {
            setCsvData(rows);
            setCsvHeaders(headers);
            setStep('mapping');
            toast.success(`Loaded ${rows.length} sessions from file`);
          } else {
            toast.error('No data found in file');
          }
        }
      } catch (error) {
        toast.error(`Error parsing file: ${error}`);
      }
    };

    if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
      reader.readAsArrayBuffer(selectedFile);
    } else {
      reader.readAsText(selectedFile);
    }
  };

  const handleSheetSelect = async (sheetName: string) => {
    if (!file) return;
    
    try {
      setIsLoading(true);
      const result = await parseExcelSheet(file, sheetName);
      
      if (result.rows.length > 0) {
        setCsvData(result.rows);
        setCsvHeaders(result.headers);
        setSelectedSheet(sheetName);
        setStep('mapping');
        toast.success(`Loaded ${result.rows.length} sessions from "${sheetName}" sheet`);
      } else {
        toast.error(`No data found in "${sheetName}" sheet`);
      }
    } catch (error) {
      toast.error(`Error loading sheet: ${error}`);
    } finally {
      setIsLoading(false);
    }
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
      const transformedData = csvData.map((row) => {
        const newRow: any = {};
        Object.entries(columnMapping).forEach(([csvCol, dbCol]) => {
          if (dbCol && dbCol !== 'skip' && row[csvCol] !== undefined && row[csvCol] !== '') {
            let value: any = row[csvCol];

            // Type conversion
            if (dbCol === 'module_no') {
              value = parseInt(value) || null;
            } else if (dbCol === 'session_date') {
              // Try to parse date
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                value = date.toISOString().split('T')[0];
              }
            }

            newRow[dbCol] = value;
          }
        });

        // Set defaults only for missing fields (don't override status from Excel)
        if (!newRow.session_type) newRow.session_type = 'guest_teacher';
        if (!newRow.session_date) newRow.session_date = new Date().toISOString().split('T')[0];
        if (!newRow.session_time) newRow.session_time = '09:00';
        // Class is left empty by default as requested
        if (!newRow.class_batch) newRow.class_batch = 'WES Fellow'; // Default class
        // Status is NOT set as default - use whatever is in Excel, or leave empty if not mapped

        return newRow;
      });

      // Validate required fields
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
        toast.warning(`Importing ${validData.length} of ${transformedData.length} rows (some rows were skipped due to missing title)`);
      }

      // Insert into database in batches
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
        toast.success(`Successfully imported ${successCount} completed sessions`);
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
    setAvailableSheets([]);
    setSelectedSheet('');
    setStep('upload');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Completed Sessions
          </DialogTitle>
        </DialogHeader>

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
                  <p className="text-sm font-medium">Click to upload CSV or Excel file</p>
                  <p className="text-xs text-muted-foreground">
                    Supports .csv, .xlsx, and .xls files
                  </p>
                </div>
              </label>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
              <p className="font-medium mb-2">Import Features:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>All sessions will be marked as "completed"</li>
                <li>Class will default to "WES Fellow"</li>
                <li>Status and other fields from your Excel will be imported</li>
              </ul>
            </div>
          </div>
        )}

        {step === 'sheet-select' && (
          <div className="space-y-4 py-4">
            <div>
              <h3 className="font-medium mb-3">Select Sheet to Import</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your Excel file has multiple sheets. Select which sheet contains the session data.
              </p>
            </div>

            <div className="space-y-2">
              {availableSheets.map((sheet) => (
                <button
                  key={sheet}
                  onClick={() => handleSheetSelect(sheet)}
                  disabled={isLoading}
                  className="w-full p-3 text-left border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <p className="font-medium text-sm">{sheet}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
            <div>
              <h3 className="font-medium mb-3">Map CSV Columns to Session Fields</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select which database field each CSV column should map to. You must map at least one column to "Session Title".
              </p>
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

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {step === 'upload' && file && (
            <Button onClick={() => setStep('mapping')}>
              Next: Map Columns
            </Button>
          )}
          {step === 'sheet-select' && (
            <Button variant="outline" onClick={() => setStep('upload')}>
              Back
            </Button>
          )}
          {step === 'mapping' && (
            <>
              <Button 
                variant="outline" 
                onClick={() => availableSheets.length > 1 ? setStep('sheet-select') : setStep('upload')}
              >
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
