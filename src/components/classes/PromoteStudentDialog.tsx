import { useState, useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PromoteStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: any;
  onConfirm: (academicYear: string, designation: string) => void;
}

export function PromoteStudentDialog({
  open,
  onOpenChange,
  student,
  onConfirm,
}: PromoteStudentDialogProps) {
  const [academicYear, setAcademicYear] = useState('');
  const [designation, setDesignation] = useState('');

  // Setup default values when dialog opens
  useEffect(() => {
    if (open && student) {
      // Calculate default next academic year
      let nextYear = '';
      if (student.academic_year) {
        const match = student.academic_year.match(/^(\d{4})-(\d{2})$/);
        if (match) {
          const startYear = parseInt(match[1], 10);
          const endYear = parseInt(match[2], 10);
          nextYear = `${startYear + 1}-${(endYear + 1).toString().padStart(2, '0')}`;
        } else {
          const match2 = student.academic_year.match(/^(\d{4})-(\d{4})$/);
          if (match2) {
            const startYear = parseInt(match2[1], 10);
            nextYear = `${startYear + 1}-${startYear + 2}`;
          }
        }
      }
      
      if (!nextYear) {
        const currentY = new Date().getFullYear();
        nextYear = `${currentY}-${(currentY + 1).toString().slice(2)}`;
      }
      setAcademicYear(nextYear);

      // Calculate default next designation
      let nextDesignation = student.designation || '';
      if (nextDesignation) {
        const lower = nextDesignation.toLowerCase();
        if (lower.includes('ccc') || lower.includes('certified') || lower.includes('1')) nextDesignation = '2. Junior Fellow';
        else if (lower.includes('junior') || lower.includes('intern') || lower.includes('2')) nextDesignation = '3. Senior Fellow';
        else if (lower.includes('senior') || lower.includes('3')) nextDesignation = '3. Senior Fellow';
      }
      setDesignation(nextDesignation);
    }
  }, [open, student]);

  const handleConfirm = () => {
    onConfirm(academicYear, designation);
    onOpenChange(false);
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-primary" />
            Promote Student
          </DialogTitle>
          <DialogDescription>
            Select the new academic year and designation for {student.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="academic_year" className="text-sm">
              Academic Year
            </Label>
            <Select
              value={academicYear}
              onValueChange={setAcademicYear}
            >
              <SelectTrigger id="academic_year">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025-26">2025-26</SelectItem>
                <SelectItem value="2026-27">2026-27</SelectItem>
                <SelectItem value="2027-28">2027-28</SelectItem>
                <SelectItem value="2028-29">2028-29</SelectItem>
                <SelectItem value="2029-30">2029-30</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="designation" className="text-sm">
              Designation
            </Label>
            <Select
              value={designation}
              onValueChange={setDesignation}
            >
              <SelectTrigger id="designation">
                <SelectValue placeholder="Select designation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1. CCC">1. CCC</SelectItem>
                <SelectItem value="2. Junior Fellow">2. Junior Fellow</SelectItem>
                <SelectItem value="3. Senior Fellow">3. Senior Fellow</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!academicYear || !designation}>
            Promote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
