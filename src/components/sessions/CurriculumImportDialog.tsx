import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { importCurriculum } from '@/utils/universalImporter';

interface CurriculumImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CurriculumImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: CurriculumImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null);
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setIsLoading(true);

    try {
      const text = await file.text();
      const importResult = await importCurriculum(text);

      setResult(importResult);

      if (importResult.errors.length > 0) {
        toast.error(`Import completed with ${importResult.errors.length} errors`);
      } else if (importResult.success > 0) {
        toast.success(`Successfully imported ${importResult.success} curriculum items`);
        setTimeout(() => {
          handleClose();
          onSuccess();
        }, 1500);
      }
    } catch (error) {
      toast.error('Failed to import file');
      console.error('Import error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
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

        <div className="space-y-4 py-4">
          {!result ? (
            <>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.html"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="curriculum-file-input"
                  disabled={isLoading}
                />
                <label htmlFor="curriculum-file-input" className="cursor-pointer">
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">CSV, Excel, or HTML files</p>
                  </div>
                </label>
              </div>

              {file && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-900">
                    Selected: <strong>{file.name}</strong>
                  </p>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-900">
                  <strong>Note:</strong> This importer will automatically create:
                  <br />• Content Categories
                  <br />• Modules
                  <br />• Topics
                  <br />• Session metadata
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900">Import Complete</p>
                    <p className="text-sm text-green-800 mt-1">
                      Successfully imported: <strong>{result.success}</strong> items
                    </p>
                  </div>
                </div>
              </div>

              {result.failed > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900">Failed Items: {result.failed}</p>
                      <div className="text-xs text-red-800 mt-2 max-h-[200px] overflow-y-auto space-y-1">
                        {result.errors.slice(0, 10).map((error, idx) => (
                          <p key={idx}>• {error}</p>
                        ))}
                        {result.errors.length > 10 && (
                          <p>... and {result.errors.length - 10} more errors</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && file && (
            <Button onClick={handleImport} disabled={isLoading}>
              {isLoading ? 'Importing...' : 'Import Curriculum'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
