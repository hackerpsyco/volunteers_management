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
import { Checkbox } from '@/components/ui/checkbox';
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
        .map(h => String(h || '').trim())
        .filter(h => h !== '');
      
      if (potentialHeaders.length >= 3) {
     