import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioComparisonProps {
  originalUrl: string;
  masteredUrl: string;
  masteredLabel?: string;
}

export const AudioComparison = ({ originalUrl, masteredUrl, masteredLabel = 'Mastered' }: AudioComparisonProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTrack, setActiveTrack] = useState<'original' | 'mastered'>('mastered');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  
  const originalRef = useRef<HTMLAudioElement>(null);
  const masteredRef = useRef<HTMLAudioElement>(null);

  const activeRef = activeTrack === 'original' ? originalRef : masteredRef;
  const inactiveRef = activeTrack === 'original' ? masteredRef : originalRef;

  useEffect(() => {
    // Sync audio elements
    if (originalRef.current && masteredRef.current) {
      originalRef.current.volume = volume / 100;
      masteredRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handlePlayPause = () => {
    if (!activeRef.current) return;

    if (isPlaying) {
      activeRef.current.pause();
      inactiveRef.current?.pause();
    } else {
      activeRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTrackSwitch = (track: 'original' | 'mastered') => {
    if (track === activeTrack) return;

    const currentPos = activeRef.current?.currentTime || 0;
    const wasPlaying = isPlaying;

    // Pause current
    activeRef.current?.pause();

    // Switch and sync
    setActiveTrack(track);
    
    const newRef = track === 'original' ? originalRef : masteredRef;
    if (newRef.current) {
      newRef.current.currentTime = currentPos;
      if (wasPlaying) {
        newRef.current.play();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (activeRef.current) {
      setCurrentTime(activeRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (activeRef.current) {
      setDuration(activeRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    const time = value[0];
    if (originalRef.current) originalRef.current.currentTime = time;
    if (masteredRef.current) masteredRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 p-5 rounded-xl bg-background border border-border">
      {/* Hidden audio elements */}
      <audio
        ref={originalRef}
        src={originalUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />
      <audio
        ref={masteredRef}
        src={masteredUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Track Toggle */}
      <div className="flex items-center justify-center gap-3">
        <Button
          variant={activeTrack === 'original' ? 'outline' : 'ghost'}
          size="sm"
          onClick={() => handleTrackSwitch('original')}
          className={cn(
            "transition-all font-bold",
            activeTrack === 'original' && "border-primary text-primary red-glow"
          )}
        >
          Original
        </Button>
        <Button
          variant={activeTrack === 'mastered' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleTrackSwitch('mastered')}
          className={cn(
            "transition-all font-bold",
            activeTrack === 'mastered' && "bg-primary text-primary-foreground red-glow"
          )}
        >
          ✨ {masteredLabel}
        </Button>
      </div>

      {/* Player Controls */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePlayPause}
          className="shrink-0 border-primary/50 hover:bg-primary/10 hover:border-primary"
        >
          {isPlaying ? <Pause className="h-4 w-4 text-primary" /> : <Play className="h-4 w-4 text-primary" />}
        </Button>

        <div className="flex-1 space-y-1">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Volume2 className="h-4 w-4 text-primary" />
          <Slider
            value={[volume]}
            max={100}
            step={1}
            onValueChange={(v) => setVolume(v[0])}
            className="w-20"
          />
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground">
      🎧 Toggle between Original and {masteredLabel} to hear the difference
      </p>
    </div>
  );
};
