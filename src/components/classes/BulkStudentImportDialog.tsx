import { useState, useRef, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface BulkStudentImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface StudentRow {
  name: string;
  email?: string;
  phone_number?: string;
  class_id: string;
  student_id?: string;
  roll_number?: string;
  gender?: string;
  dob?: string;
  subject?: string;
  academic_year?: string;
}

interface Class {
  id: string;
  name: string;
}

export function BulkStudentImportDialog({ open, onOpenChange, onSuccess }: BulkStudentImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<StudentRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classes, setClasses] = useState<Class[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch classes when dialog opens
  useEffect(() => {
    if (open) {
      fetchClasses();
    }
  }, [open]);

  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      const { data, error } = await (supabase as any)
        .from('classes')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoadingClasses(false);
    }
  };

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

      const parsedData: StudentRow[] = [];
      const parseErrors: string[] = [];

      jsonData.forEach((row, index) => {
        const rowNum = index + 2;

        const getValue = (keys: string[]): string => {
          const lowerKeys = keys.map(k => k.toLowerCase());
          for (const key of Object.keys(row)) {
            if (lowerKeys.includes(key.toLowerCase().trim())) {
              const value = row[key];
              if (value !== undefined && value !== null && value !== '') {
                return String(value).trim();
              }
            }
          }
          return '';
        };

        const name = getValue(['Name', 'name', 'NAME', 'Student Name', 'student_name']);
        const email = getValue(['Email', 'email', 'EMAIL', 'Student Email', 'student_email']);
        const phone = getValue(['Phone', 'phone_number', 'PHONE_NUMBER', 'Phone Number', 'Mobile', 'mobile']);
        const studentId = getValue(['Student ID', 'student_id', 'STUDENT_ID', 'Roll Number', 'roll_number']);
        const rollNumber = getValue(['Roll Number', 'roll_number', 'ROLL_NUMBER', 'Roll No', 'roll_no']);
        const gender = getValue(['Gender', 'gender', 'GENDER']);
        const dob = getValue(['DOB', 'dob', 'DOB', 'Date of Birth', 'date_of_birth']);
        const subject = getValue(['Subject', 'subject', 'SUBJECT']).toLowerCase();
        const academicYear = getValue(['Academic Year', 'academic_year', 'ACADEMIC_YEAR', 'Year', 'year']);

        // Validate subject if provided
        const validSubjects = ['commerce', 'computer science', 'arts'];
        const normalizedSubject = subject && validSubjects.includes(subject) ? subject : undefined;

        // Skip completely empty rows
        if (!name) {
          return;
        }

        if (!name) {
          parseErrors.push(`Row ${rowNum}: Name is required`);
          return;
        }

        parsedData.push({
          name: name || undefined,
          email: email || undefined,
          phone_number: phone || undefined,
          student_id: studentId || rollNumber || undefined,
          roll_number: rollNumber || undefined,
          gender: gender || undefined,
          dob: dob || undefined,
          subject: normalizedSubject,
          academic_year: academicYear || undefined,
          class_id: selectedClass,
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
    if (!selectedClass) {
      toast.error('Please select a class');
      return;
    }

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
      // Check for existing students
      const existingEmailsMap = new Map<string, any>();
      const existingStudentIdsMap = new Map<string, any>();
      const existingNamesMap = new Map<string, any>();
      
      const { data: existingStudents, error: fetchError } = await (supabase
        .from('students' as any)
        .select('id, email, student_id, name, academic_year, class_id')
        .eq('class_id', selectedClass) as any);

      if (fetchError) {
        console.error('Error fetching existing students:', fetchError);
      }

      if (existingStudents) {
        existingStudents.forEach((s: any) => {
          if (s.email) existingEmailsMap.set(s.email.toLowerCase(), s);
          if (s.student_id) existingStudentIdsMap.set(s.student_id.toLowerCase(), s);
          if (s.name) existingNamesMap.set(s.name.toLowerCase().trim(), s);
        });
      }

      // Filter new students and find duplicates to update
      const newStudents: StudentRow[] = [];
      const studentsToUpdate: { id: string, academic_year?: string }[] = [];

      previewData.forEach(s => {
        let existing = null;
        
        // Match globally for exact identifiers, but for Name, only match within the SAME class
        if (s.email && existingEmailsMap.has(s.email.toLowerCase())) {
          existing = existingEmailsMap.get(s.email.toLowerCase());
        } else if (s.student_id && existingStudentIdsMap.has(s.student_id.toLowerCase())) {
          existing = existingStudentIdsMap.get(s.student_id.toLowerCase());
        } else if (s.name) {
          // If matching purely by name, it MUST be in the same class to be considered the same person
          const nameMatch = existingNamesMap.get(s.name.toLowerCase().trim());
          if (nameMatch && nameMatch.class_id === selectedClass) {
            existing = nameMatch;
          }
        }

        if (existing && existing.class_id === selectedClass) {
          // Only update if they are already in the target class
          if (s.academic_year && existing.academic_year !== s.academic_year) {
            studentsToUpdate.push({
              id: existing.id,
              academic_year: s.academic_year
            });
          }
        } else if (existing && existing.class_id !== selectedClass) {
          // They exist in another class, skip them completely to avoid moving them
          // We don't push them to newStudents to avoid 23505 constraint errors
        } else {
          newStudents.push(s);
        }
      });

      if (newStudents.length === 0 && studentsToUpdate.length === 0) {
        toast.error('All students already exist in this class');
        return;
      }

      if (newStudents.length + studentsToUpdate.length < previewData.length) {
        const skipped = previewData.length - (newStudents.length + studentsToUpdate.length);
        toast.warning(`${skipped} duplicate(s) skipped completely`);
      }

      // Map the data to match database schema
      const studentsToInsert = newStudents.map(s => ({
        class_id: s.class_id,
        student_id: s.student_id || `STU-${Date.now()}-${Math.random()}`,
        name: s.name,
        email: s.email || null,
        phone_number: s.phone_number || null,
        gender: s.gender || null,
        dob: s.dob || null,
        roll_number: s.roll_number || null,
        subject: s.subject || null,
        academic_year: s.academic_year || null,
      }));

      let insertError = null;
      if (studentsToInsert.length > 0) {
        const res = await (supabase
          .from('students' as any)
          .insert(studentsToInsert) as any);
        insertError = res.error;
      }

      // Process updates
      let updateCount = 0;
      if (studentsToUpdate.length > 0) {
        for (const update of studentsToUpdate) {
          const { error: err } = await (supabase
            .from('students' as any)
            .update({ 
              academic_year: update.academic_year
            })
            .eq('id', update.id) as any);
          if (!err) updateCount++;
        }
      }

      if (insertError) {
        if (insertError.code === '23505') {
          // Unique constraint violation - try one by one
          let successCount = 0;
          const failedStudents: string[] = [];

          for (const student of studentsToInsert) {
            const { error: insertError } = await (supabase
              .from('students' as any)
              .insert([student]) as any);
            if (insertError) {
              failedStudents.push(student.email || student.name || 'Unknown');
            } else {
              successCount++;
            }
          }

          if (successCount > 0 || updateCount > 0) {
            toast.success(`Successfully uploaded ${successCount} new student(s)${updateCount > 0 ? ` and updated ${updateCount} existing student(s)` : ''}`);
            if (failedStudents.length > 0) {
              toast.warning(`${failedStudents.length} student(s) already exist completely`);
            }
          } else {
            toast.error('All students already exist in this class');
          }
        } else {
          throw insertError;
        }
      } else {
        toast.success(`Successfully uploaded ${newStudents.length} new student(s)${updateCount > 0 ? ` and updated ${updateCount} existing student(s)` : ''}`);
      }

      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error uploading students:', error);
      toast.error('Failed to upload students. Please check the data and try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData([]);
    setErrors([]);
    setSelectedClass('');
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const template = [
      {
        'Name': 'John Doe',
        'Student ID': 'STU001',
        'Roll Number': '001',
        'Email': 'john@example.com',
        'Phone': '+1234567890',
        'Gender': 'Male',
        'DOB': '2010-01-15',
        'Subject': 'Commerce',
        'Academic Year': '2026-2027',
      },
      {
        'Name': 'Jane Smith',
        'Student ID': 'STU002',
        'Roll Number': '002',
        'Email': 'jane@example.com',
        'Phone': '+0987654321',
        'Gender': 'Female',
        'DOB': '2010-03-20',
        'Subject': 'Computer Science',
        'Academic Year': '2026-2027',
      },
      {
        'Name': 'Bob Johnson',
        'Student ID': 'STU003',
        'Roll Number': '003',
        'Email': 'bob@example.com',
        'Phone': '+1122334455',
        'Gender': 'Male',
        'DOB': '2010-05-10',
        'Subject': 'Arts',
        'Academic Year': '2026-2027',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'student_template.xlsx');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Bulk Import Students
          </DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file to add multiple students to a class at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Class Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Class *</label>
            <Select value={selectedClass} onValueChange={setSelectedClass} disabled={loadingClasses}>
              <SelectTrigger>
                <SelectValue placeholder={loadingClasses ? "Loading classes..." : "Choose a class"} />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {classes.length === 0 && !loadingClasses && (
              <p className="text-xs text-muted-foreground">No classes available. Please create a class first.</p>
            )}
          </div>

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
                {previewData.length} student(s) will be added to {classes.find(c => c.id === selectedClass)?.name}
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
            disabled={uploading || previewData.length === 0 || errors.length > 0 || !selectedClass}
          >
            {uploading ? 'Uploading...' : `Upload ${previewData.length} Students`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
