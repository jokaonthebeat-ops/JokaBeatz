import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Music, 
  X, 
  Plus,
  AlertCircle,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';

interface StemFile {
  id: string;
  file: File;
  name: string;
  size: number;
}

interface StemUploadProps {
  stems: StemFile[];
  onStemsChange: (stems: StemFile[]) => void;
  maxStems?: number;
  minStems?: number;
}

const StemUpload = ({ 
  stems, 
  onStemsChange, 
  maxStems = 32, 
  minStems = 2 
}: StemUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/x-wav'];
    const invalidFiles = files.filter(f => !validTypes.includes(f.type));
    
    if (invalidFiles.length > 0) {
      toast.error(`Invalid file format: ${invalidFiles.map(f => f.name).join(', ')}. Use MP3, WAV, or FLAC.`);
      return;
    }

    const oversizedFiles = files.filter(f => f.size > 100 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(`Files over 100MB: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    const newStems: StemFile[] = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
    }));

    const totalStems = [...stems, ...newStems];
    if (totalStems.length > maxStems) {
      toast.error(`Maximum ${maxStems} stems allowed`);
      return;
    }

    onStemsChange(totalStems);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [stems, onStemsChange, maxStems]);

  const removeStem = (id: string) => {
    onStemsChange(stems.filter(s => s.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const isValid = stems.length >= minStems && stems.length <= maxStems;

  return (
    <Card className="bg-secondary border-border card-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 rounded-lg bg-primary/10">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          Upload Your Stems
          <Badge variant="outline" className="ml-2">
            {stems.length}/{maxStems}
          </Badge>
        </CardTitle>
        <CardDescription>
          Upload {minStems}-{maxStems} audio stems for multitrack mixing (MP3, WAV, FLAC • max 100MB each)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stems List */}
        {stems.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stems.map((stem, index) => (
              <div 
                key={stem.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border group"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Music className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {index + 1}. {stem.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(stem.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-50 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => removeStem(stem.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Drop Zone */}
        <div
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-300 hover:border-primary/60 hover:bg-primary/5
            ${stems.length > 0 ? 'border-border' : 'border-primary/30'}
          `}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav,.flac,audio/mpeg,audio/wav,audio/flac"
            onChange={handleFileSelect}
            className="hidden"
            multiple
          />
          <div className="space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
              {stems.length > 0 ? (
                <Plus className="h-6 w-6 text-muted-foreground" />
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <p className="font-medium text-foreground">
              {stems.length > 0 ? 'Add more stems' : 'Drop your stems here'}
            </p>
            <p className="text-sm text-muted-foreground">
              {stems.length > 0 
                ? `${maxStems - stems.length} more slots available`
                : 'Select multiple files to upload'}
            </p>
          </div>
        </div>

        {/* Validation Message */}
        {stems.length > 0 && stems.length < minStems && (
          <div className="flex items-center gap-2 text-sm text-amber-500 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Add at least {minStems - stems.length} more stem{minStems - stems.length > 1 ? 's' : ''} (minimum {minStems} required)</span>
          </div>
        )}

        {isValid && (
          <div className="flex items-center gap-2 text-sm text-green-500 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
            <Music className="h-4 w-4 shrink-0" />
            <span>Ready to mix! {stems.length} stems will be combined into a balanced mix.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StemUpload;
