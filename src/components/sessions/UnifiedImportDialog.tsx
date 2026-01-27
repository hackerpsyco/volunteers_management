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

interface UnifiedImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ColumnMapping {
  [key: string]: string;
}

const CURRICULUM_COLUMNS = [
  { value: 'content_category', label: 'Content Category' },
  { value: 'module_no', label: 'Module No. / S.No' },
  { value: 'module_name', label: 'Module Name / Modules' },
  { value: 'topics_covered', label: 'Topics Covered' },
  { value: 'videos', label: 'Videos' },
  { value: 'quiz_content_ppt', label: 'Quiz/Content PPT' },
  { value: 'skip', label: 'Skip this column' },
];

function parseCSV(text: string): { headers: string[]; rows: any[] } {
  // Handle both Windows (\r\n) and Unix (\n) line endings
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedText.trim().split('\n').filter(line => line.trim());
  
  if (lines.length === 0) return { headers: [], rows: [] };

  let headerLineIndex = 0;
  let headers: string[] = [];
  
  // Find header row
  for (let i = 0; i < lines.length; i++) {
    const potentialHeaders = lines[i]
      .split(',')
      .map(h => h.trim().replace(/^"|"$/g, '').replace(/\r/g, ''))
      .filter(h => h !== '');
    
    if (potentialHeaders.length > 0 && potentialHeaders.some(h => isNaN(Number(h)))) {
      headers = potentialHeaders;
      headerLineIndex = i;
      console.log('Found headers at line', i, ':', headers);
      break;
    }
  }

  if (headers.length === 0) {
    console.error('No headers found in CSV');
    return { headers: [], rows: [] };
  }

  // Parse data rows
  const rows = lines.slice(headerLineIndex + 1).map((line, idx) => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, '').replace(/\r/g, ''));
    const row: any = {};
    headers.forEach((header, index) => {
      const value = values[index] || '';
      row[header] = value;
    });
    return row;
  }).filter(row => {
    // Keep rows that have at least one non-empty value
    return Object.values(row).some(v => v !== '');
  });

  console.log(`Parsed ${rows.length} data rows from CSV`);
  return { headers, rows };
}

export function UnifiedImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: UnifiedImportDialogProps) {
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
          toast.success(`Loaded ${rows.length} rows from CSV`);
        } else {
          toast.error('No data found in CSV file');
        }
      } catch (error) {
        toast.error(`Error parsing CSV: ${error}`);
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

  const handleImport = async () => {
    if (Object.keys(columnMapping).length === 0) {
      toast.error('Please map at least one column');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Starting import process...');
      console.log('Total CSV rows:', csvData.length);
      console.log('Column mapping:', columnMapping);

      // Track last seen values for grouped columns
      let lastContentCategory = '';
      let lastModuleNo: number | null = null;
      let lastModuleName = '';

      const transformedData = csvData.map((row, index) => {
        const newRow: any = {};
        Object.entries(columnMapping).forEach(([csvCol, dbCol]) => {
          if (dbCol && dbCol !== 'skip') {
            let value: any = row[csvCol];

            // Handle empty cells - inherit from previous row for grouped columns
            if (!value || value.trim() === '') {
              if (dbCol === 'content_category' && lastContentCategory) {
                value = lastContentCategory;
              } else if (dbCol === 'module_no' && lastModuleNo !== null) {
                value = lastModuleNo;
              } else if (dbCol === 'module_name' && lastModuleName) {
                value = lastModuleName;
              }
            }

            // Type conversion
            if (dbCol === 'module_no' && value) {
              value = parseInt(value) || null;
            }

            // Store last seen values for grouped columns
            if (dbCol === 'content_category' && value) {
              lastContentCategory = value;
            } else if (dbCol === 'module_no' && value !== null) {
              lastModuleNo = value;
            } else if (dbCol === 'module_name' && value) {
              lastModuleName = value;
            }

            if (value !== null && value !== undefined && value !== '') {
              newRow[dbCol] = value;
            }
          }
        });

        // Log first few rows for debugging
        if (index < 5) {
          console.log(`Row ${index + 1} transformed:`, newRow);
        }

        return newRow;
      });

      // Filter out completely empty rows, but keep all rows with at least topics_covered
      const validData = transformedData.filter((row) => {
        // Must have topics_covered (the unique identifier for each row)
        return row.topics_covered && row.topics_covered.trim() !== '';
      });

      if (validData.length === 0) {
        toast.error('No valid data to import. Make sure "Topics Covered" column is mapped.');
        setIsLoading(false);
        return;
      }

      console.log(`Importing ${validData.length} curriculum items...`);
      console.log('Sample data:', validData.slice(0, 3));

      const batchSize = 50;
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < validData.length; i += batchSize) {
        const batch = validData.slice(i, i + batchSize);
        
        console.log(`Inserting batch ${i / batchSize + 1}:`, batch.length, 'items');
        
        const { data, error } = await supabase
          .from('curriculum')
          .insert(batch)
          .select();

        if (error) {
          console.error(`Batch ${i / batchSize + 1} error:`, error);
          failureCount += batch.length;
        } else {
          console.log(`Batch ${i / batchSize + 1} success:`, data?.length, 'items inserted');
          successCount += batch.length;
        }
      }

      if (failureCount > 0) {
        toast.error(`Import partially failed: ${successCount} imported, ${failureCount} failed`);
      } else {
        toast.success(`Successfully imported ${successCount} curriculum items`);
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Curriculum from CSV
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer">
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium">Click to upload CSV file</p>
                  <p className="text-xs text-muted-foreground">
                    CSV file with curriculum data
                  </p>
                </div>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Expected columns: Content Category, Module No., Module Name, Topics Covered, Videos, Quiz/Content PPT
            </p>
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
            <div>
              <h3 className="font-medium mb-3">Map CSV Columns to Database Fields</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select which database field each CSV column should map to.
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
                        {CURRICULUM_COLUMNS.map(col => (
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
          {step === 'mapping' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={isLoading}>
                {isLoading ? 'Importing...' : `Import ${csvData.length} Items`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
