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

let XLSX: any = null;
const loadXLSX = async () => {
  if (!XLSX) {
    XLSX = await import('xlsx');
  }
  return XLSX;
};

interface BulkSessionImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ColumnMapping {
  [key: string]: string;
}

const SESSION_COLUMNS = [
  { value: 'title', label: 'Session Title' },
  { value: 'session_date', label: 'Session Date' },
  { value: 'session_time', label: 'Session Time' },
  { value: 'facilitator_name', label: 'Facilitator Name' },
  { value: 'volunteer_name', label: 'Volunteer Name' },
  { value: 'coordinator_name', label: 'Coordinator Name' },
  { value: 'topics_covered', label: 'Topics Covered' },
  { value: 'content_category', label: 'Content Category' },
  { value: 'module_name', label: 'Module Name' },
  { value: 'session_objective', label: 'Session Objective' },
  { value: 'practical_activities', label: 'Practical Activities' },
  { value: 'session_highlights', label: 'Session Highlights' },
  { value: 'learning_outcomes', label: 'Learning Outcomes' },
  { value: 'facilitator_reflection', label: 'Facilitator Reflection' },
  { value: 'best_performer', label: 'Best Performer' },
  { value: 'class_batch', label: 'Class Batch' },
  { value: 'skip', label: 'Skip this column' },
];

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
        .map((h: any) => String(h || '').trim())
        .filter((h: string) => h !== '');
      
      if (potentialHeaders.length >= 3) {
        headerLineIndex = i;
        headers = (data[i] as any[]).map((h: any) => String(h || '').trim());
        break;
      }
    }

    const rows = data.slice(headerLineIndex + 1)
      .filter((row: any) => {
        const vals = (row as any[]).filter((v: any) => v !== null && v !== undefined && String(v).trim() !== '');
        return vals.length > 0;
      })
      .map((row: any) => {
        const obj: any = {};
        headers.forEach((header, idx) => {
          obj[header] = (row as any[])[idx] || '';
        });
        return obj;
      });

    return { headers, rows };
  } catch (error) {
    console.error('Error parsing Excel:', error);
    throw error;
  }
}

export function BulkSessionImportDialog({ open, onOpenChange, onSuccess }: BulkSessionImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [step, setStep] = useState<'upload' | 'mapping' | 'importing'>('upload');
  const [importing, setImporting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    try {
      const xlsx = await loadXLSX();
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = xlsx.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.SheetNames[0];
      const result = await parseExcelSheet(selectedFile, firstSheet);
      
      setHeaders(result.headers);
      setRows(result.rows);
      
      // Auto-map columns
      const autoMapping: ColumnMapping = {};
      result.headers.forEach((header) => {
        const lowerHeader = header.toLowerCase();
        const match = SESSION_COLUMNS.find((col) =>
          lowerHeader.includes(col.value.replace(/_/g, ' ')) ||
          col.label.toLowerCase().includes(lowerHeader)
        );
        if (match) {
          autoMapping[header] = match.value;
        }
      });
      setColumnMapping(autoMapping);
      setStep('mapping');
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Failed to read file');
    }
  };

  const handleImport = async () => {
    if (rows.length === 0) {
      toast.error('No data to import');
      return;
    }

    setImporting(true);
    setStep('importing');

    try {
      let successCount = 0;
      for (const row of rows) {
        const sessionData: any = {
          session_type: 'regular',
          status: 'scheduled',
          session_time: '10:00',
          session_date: new Date().toISOString().split('T')[0],
          title: 'Imported Session',
        };

        Object.entries(columnMapping).forEach(([header, field]) => {
          if (field !== 'skip' && row[header]) {
            if (field === 'session_date') {
              try {
                const dateVal = row[header];
                if (typeof dateVal === 'number') {
                  const xlsx2 = XLSX;
                  const date = xlsx2.SSF.parse_date_code(dateVal);
                  sessionData[field] = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
                } else {
                  sessionData[field] = String(dateVal);
                }
              } catch {
                sessionData[field] = String(row[header]);
              }
            } else {
              sessionData[field] = String(row[header]);
            }
          }
        });

        const { error } = await supabase.from('sessions').insert(sessionData);
        if (!error) successCount++;
      }

      toast.success(`Imported ${successCount} of ${rows.length} sessions`);
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error importing sessions:', error);
      toast.error('Failed to import sessions');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setHeaders([]);
    setRows([]);
    setColumnMapping({});
    setStep('upload');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Sessions</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <Label>Upload Excel File</Label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Found {rows.length} rows. Map the columns below:
            </p>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {headers.map((header) => (
                <div key={header} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-40 truncate">{header}</span>
                  <Select
                    value={columnMapping[header] || 'skip'}
                    onValueChange={(value) =>
                      setColumnMapping((prev) => ({ ...prev, [header]: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SESSION_COLUMNS.map((col) => (
                        <SelectItem key={col.value} value={col.value}>
                          {col.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-sm text-muted-foreground">Importing sessions...</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {step === 'mapping' && (
            <Button onClick={handleImport} disabled={importing}>
              <Upload className="h-4 w-4 mr-2" />
              Import {rows.length} Sessions
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
