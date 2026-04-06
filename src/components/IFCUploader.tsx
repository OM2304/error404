import { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { parseIFCFile, IFCModel, ParseProgress } from '@/lib/ifcParser';

interface IFCUploaderProps {
  onModelLoaded: (model: IFCModel, file: File) => void;
}

export default function IFCUploader({ onModelLoaded }: IFCUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<ParseProgress | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setIsComplete(false);
    setProgress({ stage: 'Starting', progress: 0, detail: 'Initializing parser...' });

    const model = await parseIFCFile(file, setProgress);
    setIsComplete(true);
    onModelLoaded(model, file);
  }, [onModelLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="glass-panel rounded-xl card-shadow p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Upload IFC Model</h3>

      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-primary bg-primary/5'
            : isComplete
              ? 'border-status-resolved/50 bg-status-resolved/5'
              : 'border-border hover:border-primary/50 hover:bg-primary/5'
        }`}
      >
        {isComplete ? (
          <div className="animate-slide-up">
            <CheckCircle className="w-12 h-12 text-status-resolved mx-auto mb-3" />
            <p className="font-medium text-foreground">Model loaded successfully!</p>
            <p className="text-sm text-muted-foreground mt-1">Ready for clash detection</p>
          </div>
        ) : progress ? (
          <div className="space-y-3 animate-fade-in">
            <FileText className="w-10 h-10 text-primary mx-auto" />
            <p className="font-medium text-foreground">{progress.stage}</p>
            <p className="text-sm text-muted-foreground">{progress.detail}</p>
            <Progress value={progress.progress * 100} className="w-48 mx-auto" />
          </div>
        ) : (
          <>
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-foreground">Drop IFC file here</p>
            <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
            <input
              type="file"
              accept=".ifc,.IFC"
              onChange={handleSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              style={{ position: 'absolute', top: 0, left: 0 }}
            />
          </>
        )}
      </div>

      {!progress && !isComplete && (
        <div className="mt-4 flex justify-center">
          <label>
            <Button variant="outline" className="gap-2" asChild>
              <span>
                <Upload className="w-4 h-4" /> Select File
                <input type="file" accept=".ifc,.IFC" onChange={handleSelect} className="hidden" />
              </span>
            </Button>
          </label>
          <Button variant="outline" className="ml-2 gap-2" onClick={() => {
            const demoFile = new File(['demo'], 'sample-building.ifc', { type: 'application/octet-stream' });
            handleFile(demoFile);
          }}>
            <FileText className="w-4 h-4" /> Load Demo
          </Button>
        </div>
      )}
    </div>
  );
}
