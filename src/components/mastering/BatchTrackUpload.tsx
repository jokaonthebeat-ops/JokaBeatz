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
  Disc,
  GripVertical
} from 'lucide-react';
import { toast } from 'sonner';

interface TrackFile {
  id: string;
  file: File;
  name: string;
  size: number;
  trackNumber: number;
}

interface BatchTrackUploadProps {
  tracks: TrackFile[];
  onTracksChange: (tracks: TrackFile[]) => void;
  maxTracks?: number;
  minTracks?: number;
  serviceType?: 'ep' | 'album';
}

const BatchTrackUpload = ({ 
  tracks, 
  onTracksChange, 
  maxTracks = 20, 
  minTracks = 2,
  serviceType = 'ep'
}: BatchTrackUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const serviceLabel = serviceType === 'album' ? 'Album' : 'EP';

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

    // Auto-assign track numbers based on filename or order
    const sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name));
    
    const newTracks: TrackFile[] = sortedFiles.map((file, index) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      trackNumber: tracks.length + index + 1,
    }));

    const totalTracks = [...tracks, ...newTracks];
    if (totalTracks.length > maxTracks) {
      toast.error(`Maximum ${maxTracks} tracks allowed for batch mastering`);
      return;
    }

    onTracksChange(totalTracks);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [tracks, onTracksChange, maxTracks]);

  const removeTrack = (id: string) => {
    const updatedTracks = tracks
      .filter(t => t.id !== id)
      .map((t, index) => ({ ...t, trackNumber: index + 1 }));
    onTracksChange(updatedTracks);
  };

  const formatFileSize = (bytes: number) => {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const totalSize = tracks.reduce((acc, t) => acc + t.size, 0);
  const isValid = tracks.length >= minTracks && tracks.length <= maxTracks;

  return (
    <Card className="bg-secondary border-border card-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 rounded-lg bg-primary/10">
            <Disc className="h-5 w-5 text-primary" />
          </div>
          Upload {serviceLabel} Tracks
          <Badge variant="outline" className="ml-2">
            {tracks.length}/{maxTracks} tracks
          </Badge>
        </CardTitle>
        <CardDescription>
          Upload {minTracks}-{maxTracks} tracks for consistent {serviceLabel.toLowerCase()} mastering. Each track will be mastered with the same settings for a cohesive sound.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tracks List */}
        {tracks.length > 0 && (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {tracks.map((track) => (
              <div 
                key={track.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border group"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 font-bold text-primary text-sm">
                  {track.trackNumber}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {track.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(track.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-50 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => removeTrack(track.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {tracks.length > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
            <span>{tracks.length} track{tracks.length !== 1 ? 's' : ''}</span>
            <span>Total: {formatFileSize(totalSize)}</span>
          </div>
        )}

        {/* Upload Drop Zone */}
        <div
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-300 hover:border-primary/60 hover:bg-primary/5
            ${tracks.length > 0 ? 'border-border' : 'border-primary/30'}
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
              {tracks.length > 0 ? (
                <Plus className="h-6 w-6 text-muted-foreground" />
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <p className="font-medium text-foreground">
              {tracks.length > 0 ? 'Add more tracks' : 'Drop your album tracks here'}
            </p>
            <p className="text-sm text-muted-foreground">
              {tracks.length > 0 
                ? `${maxTracks - tracks.length} more slots available`
                : `Select all tracks from your ${serviceLabel.toLowerCase()}`}
            </p>
          </div>
        </div>

        {/* Validation Message */}
        {tracks.length > 0 && tracks.length < minTracks && (
          <div className="flex items-center gap-2 text-sm text-amber-500 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Add at least {minTracks - tracks.length} more track{minTracks - tracks.length > 1 ? 's' : ''} (minimum {minTracks} for batch mastering)</span>
          </div>
        )}

        {isValid && (
          <div className="flex items-center gap-2 text-sm text-green-500 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
            <Disc className="h-4 w-4 shrink-0" />
            <span>Ready! All {tracks.length} tracks will be mastered with consistent settings for a cohesive album sound.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BatchTrackUpload;
