import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface VolunteerRow {
  name: string;
  organization_type: string;
  organization_name?: string;
  work_email: string;
  personal_email?: string;
  phone_number: string;
  country?: string;
  city?: string;
  linkedin_profile?: string;
}

export function BulkUploadDialog({ open, onOpenChange, onSuccess }: BulkUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<VolunteerRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
      toast.error('Please upload an Excel (.xlsx, .xls) or CSV file');
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

      const parsedData: VolunteerRow[] = [];
      const parseErrors: string[] = [];

      jsonData.forEach((row, index) => {
        const rowNum = index + 2; // Excel row number (1-indexed, plus header row)
        
        const name = String(row['Name'] || row['name'] || '').trim();
        const orgType = String(row['Organization Type'] || row['organization_type'] || 'individual').toLowerCase();
        const orgName = String(row['Organization Name'] || row['organization_name'] || '').trim();
        const workEmail = String(row['Work Email'] || row['work_email'] || row['Email'] || row['email'] || '').trim();
        const personalEmail = String(row['Personal Email'] || row['personal_email'] || '').trim();
        const phone = String(row['Phone'] || row['phone_number'] || row['Phone Number'] || '').trim();
        const country = String(row['Country'] || row['country'] || '').trim();
        const city = String(row['City'] || row['city'] || '').trim();
        const linkedin = String(row['LinkedIn'] || row['linkedin_profile'] || row['LinkedIn Profile'] || '').trim();

        // Validation
        if (!name) {
          parseErrors.push(`Row ${rowNum}: Name is required`);
        }
        if (!workEmail) {
          parseErrors.push(`Row ${rowNum}: Work Email is required`);
        }
        if (!phone) {
          parseErrors.push(`Row ${rowNum}: Phone Number is required`);
        }

        const validOrgTypes = ['company', 'individual', 'institute'];
        const normalizedOrgType = validOrgTypes.includes(orgType) ? orgType : 'individual';

        parsedData.push({
          name: name,
          organization_type: normalizedOrgType,
          organization_name: normalizedOrgType === 'individual' ? undefined : orgName || undefined,
          work_email: workEmail,
          personal_email: personalEmail || undefined,
          phone_number: phone,
          country: country || undefined,
          city: city || undefined,
          linkedin_profile: linkedin || undefined,
        });
      });

      setPreviewData(parsedData);
      setErrors(parseErrors);
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Failed to parse file. Please check the format.');
    }
  };

  const handleUpload = async () => {
    if (errors.length > 0) {
      toast.error('Please fix validation errors before uploading');
      return;
    }

    if (previewData.length === 0) {
      toast.error('No valid data to upload');
      return;
    }

    setUploading(true);

    try {
      // Check for existing volunteers to avoid duplicates
      const existingEmails = new Set<string>();
      const { data: existingVolunteers } = await supabase
        .from('volunteers')
        .select('work_email, personal_email');

      if (existingVolunteers) {
        existingVolunteers.forEach((v: any) => {
          if (v.work_email) existingEmails.add(v.work_email.toLowerCase());
          if (v.personal_email) existingEmails.add(v.personal_email.toLowerCase());
        });
      }

      // Filter out duplicates
      const newVolunteers = previewData.filter(v => 
        !existingEmails.has(v.work_email.toLowerCase())
      );

      if (newVolunteers.length === 0) {
        toast.error('All volunteers already exist in the system');
        return;
      }

      if (newVolunteers.length < previewData.length) {
        toast.warning(`${previewData.length - newVolunteers.length} duplicate(s) skipped`);
      }

      // Insert with error handling for conflicts
      const { error } = await supabase.from('volunteers').insert(newVolunteers);

      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation - try inserting one by one to identify which ones fail
          let successCount = 0;
          const failedVolunteers: string[] = [];

          for (const volunteer of newVolunteers) {
            const { error: insertError } = await supabase.from('volunteers').insert([volunteer]);
            if (insertError) {
              failedVolunteers.push(volunteer.work_email);
            } else {
              successCount++;
            }
          }

          if (successCount > 0) {
            toast.success(`Successfully uploaded ${successCount} volunteer(s)`);
            if (failedVolunteers.length > 0) {
              toast.warning(`${failedVolunteers.length} volunteer(s) already exist: ${failedVolunteers.join(', ')}`);
            }
          } else {
            toast.error('All volunteers already exist in the system');
          }
        } else {
          throw error;
        }
      } else {
        toast.success(`Successfully uploaded ${newVolunteers.length} volunteers`);
      }

      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error uploading volunteers:', error);
      toast.error('Failed to upload volunteers. Please check the data and try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData([]);
    setErrors([]);
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const template = [
      {
        'Name': 'John Doe',
        'Organization Type': 'company',
        'Organization Name': 'ABC Corp',
        'Work Email': 'john@abccorp.com',
        'Personal Email': 'john.doe@gmail.com',
        'Phone Number': '+1234567890',
        'Country': 'USA',
        'City': 'New York',
        'LinkedIn Profile': 'https://linkedin.com/in/johndoe',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Volunteers');
    XLSX.writeFile(wb, 'volunteer_template.xlsx');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Bulk Upload Volunteers
          </DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file to add multiple volunteers at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download Template Button */}
          <Button variant="outline" onClick={downloadTemplate} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>

          {/* File Upload Area */}
          <div
            className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            {file ? (
              <p className="text-sm font-medium text-foreground">{file.name}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Click to upload or drag and drop<br />
                Excel (.xlsx, .xls) or CSV files
              </p>
            )}
          </div>

          {/* Validation Errors */}
          {errors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-destructive mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium text-sm">Validation Errors</span>
              </div>
              <ul className="text-xs text-destructive space-y-1 max-h-[100px] overflow-y-auto">
                {errors.slice(0, 5).map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
                {errors.length > 5 && (
                  <li className="font-medium">...and {errors.length - 5} more errors</li>
                )}
              </ul>
            </div>
          )}

          {/* Preview */}
          {previewData.length > 0 && errors.length === 0 && (
            <div className="bg-accent/50 border border-border rounded-lg p-3">
              <div className="flex items-center gap-2 text-primary mb-2">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium text-sm">Ready to upload</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {previewData.length} volunteer(s) will be added
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={uploading || previewData.length === 0 || errors.length > 0}
          >
            {uploading ? 'Uploading...' : `Upload ${previewData.length} Volunteers`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
