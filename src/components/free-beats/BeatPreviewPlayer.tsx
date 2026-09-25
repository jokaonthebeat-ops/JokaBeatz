import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Play, Pause, Volume2, VolumeX, Volume1, Music, Share2, Download, Lock } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import AudioWaveform from "./AudioWaveform";
import ShareButtons from "./ShareButtons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface FreeBeat {
  id: string;
  title: string;
  bpm: number | null;
  genre: string | null;
  preview_url: string;
  download_url: string;
  image_url: string | null;
}

interface BeatPreviewPlayerProps {
  isUnlocked?: boolean;
}

const BeatPreviewPlayer = ({ isUnlocked = false }: BeatPreviewPlayerProps) => {
  const [beats, setBeats] = useState<FreeBeat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentBeat, setCurrentBeat] = useState<FreeBeat | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const previousVolumeRef = useRef(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const connectedAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchBeats();
  }, []);

  useEffect(() => {
    // Cleanup audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      // Don't close AudioContext - it can be reused
    };
  }, []);

  const fetchBeats = async () => {
    try {
      const { data, error } = await supabase
        .from("free_beats")
        .select("id, title, bpm, genre, preview_url, download_url, image_url")
        .eq("active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setBeats(data || []);
    } catch (error) {
      console.error("Error fetching beats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlay = async (beat: FreeBeat) => {
    // If clicking the same beat, toggle play/pause
    if (currentBeat?.id === beat.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        // Resume AudioContext if suspended
        if (audioContextRef.current?.state === "suspended") {
          await audioContextRef.current.resume();
        }
        audioRef.current?.play();
        setIsPlaying(true);
      }
      return;
    }

    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    try {
      // Create or resume AudioContext on user interaction
      if (!audioContextRef.current || audioContextRef.current.state === "closed") {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      // Create new audio element with crossOrigin for CORS
      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.src = beat.preview_url;
      audio.volume = isMuted ? 0 : volume;
      
      // Wait for audio to be ready
      await new Promise<void>((resolve, reject) => {
        audio.addEventListener("canplaythrough", () => resolve(), { once: true });
        audio.addEventListener("error", (e) => reject(e), { once: true });
        audio.load();
      });

      // Only create a new source if this is a different audio element
      if (connectedAudioRef.current !== audio) {
        // Create analyser
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.8;

        // Create source and connect BEFORE playing
        const source = audioContextRef.current.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContextRef.current.destination);

        sourceRef.current = source;
        analyserRef.current = analyser;
        connectedAudioRef.current = audio;
      }

      audioRef.current = audio;
      setCurrentBeat(beat);
      setProgress(0);

      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration);
      });

      audio.addEventListener("timeupdate", () => {
        setProgress(audio.currentTime);
      });

      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        setProgress(0);
      });

      // Now play - audio is already connected to Web Audio API
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing audio:", error);
      // Fallback: try playing without Web Audio API
      try {
        const audio = new Audio(beat.preview_url);
        audio.volume = isMuted ? 0 : volume;
        audioRef.current = audio;
        setCurrentBeat(beat);
        setProgress(0);
        analyserRef.current = null; // No waveform visualization in fallback mode

        audio.addEventListener("loadedmetadata", () => {
          setDuration(audio.duration);
        });

        audio.addEventListener("timeupdate", () => {
          setProgress(audio.currentTime);
        });

        audio.addEventListener("ended", () => {
          setIsPlaying(false);
          setProgress(0);
        });

        await audio.play();
        setIsPlaying(true);
      } catch (fallbackError) {
        console.error("Fallback audio also failed:", fallbackError);
      }
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume > 0) {
      previousVolumeRef.current = newVolume;
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      const restoreVolume = previousVolumeRef.current || 0.8;
      setVolume(restoreVolume);
      setIsMuted(false);
      if (audioRef.current) {
        audioRef.current.volume = restoreVolume;
      }
    } else {
      previousVolumeRef.current = volume;
      setVolume(0);
      setIsMuted(true);
      if (audioRef.current) {
        audioRef.current.volume = 0;
      }
    }
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return VolumeX;
    if (volume < 0.5) return Volume1;
    return Volume2;
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setProgress(value[0]);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-secondary/50 rounded-lg" />
        ))}
      </div>
    );
  }

  if (beats.length === 0) {
    return null;
  }

  const VolumeIcon = getVolumeIcon();

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          <h3 className="text-base md:text-lg font-semibold text-foreground">Preview Beats</h3>
        </div>
        
        {/* Volume Control - hidden on mobile, tap to mute instead */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-1.5 rounded-full hover:bg-secondary/50 transition-colors"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            <VolumeIcon className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
          <Slider
            value={[volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="w-16 md:w-20 cursor-pointer hidden sm:block"
          />
        </div>
      </div>

      <div className="space-y-2 md:space-y-3">
        {beats.map((beat) => {
          const isCurrentBeat = currentBeat?.id === beat.id;
          const isThisPlaying = isCurrentBeat && isPlaying;

          return (
            <div
              key={beat.id}
              className={`group relative p-3 md:p-4 rounded-lg md:rounded-xl border transition-all duration-300 ${
                isCurrentBeat
                  ? "bg-primary/10 border-primary/50 shadow-lg shadow-primary/10"
                  : "bg-secondary/30 border-border hover:bg-secondary/50 hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-2 md:gap-4">
                {/* Cover art - smaller on mobile */}
                <div className="flex-shrink-0 w-10 h-10 md:w-14 md:h-14 rounded-lg overflow-hidden bg-secondary">
                  {beat.image_url ? (
                    <img
                      src={beat.image_url}
                      alt={beat.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="h-4 w-4 md:h-6 md:w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Play button - smaller on mobile */}
                <button
                  onClick={() => handlePlay(beat)}
                  className={`flex-shrink-0 w-9 h-9 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isThisPlaying
                      ? "bg-primary text-primary-foreground scale-110"
                      : "bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground hover:scale-105"
                  }`}
                >
                  {isThisPlaying ? (
                    <Pause className="h-4 w-4 md:h-5 md:w-5" />
                  ) : (
                    <Play className="h-4 w-4 md:h-5 md:w-5 ml-0.5" />
                  )}
                </button>

                {/* Beat info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground text-sm md:text-base truncate">{beat.title}</h4>
                  <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground">
                    {beat.genre && (
                      <span className="px-1.5 md:px-2 py-0.5 bg-secondary rounded-full text-[10px] md:text-xs font-medium">
                        {beat.genre}
                      </span>
                    )}
                    {beat.bpm && <span className="hidden sm:inline">{beat.bpm} BPM</span>}
                  </div>
                </div>

                {/* Download/Lock button */}
                {isUnlocked ? (
                  <a
                    href={beat.download_url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 bg-primary text-primary-foreground rounded-lg text-xs md:text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
                  >
                    <Download size={12} className="md:w-3.5 md:h-3.5" />
                    <span className="hidden sm:inline">Download</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-1 px-2 py-1 bg-secondary/50 rounded-lg text-[10px] md:text-xs text-muted-foreground shrink-0">
                    <Lock size={10} className="md:w-3 md:h-3" />
                    <span className="hidden sm:inline">Unlock</span>
                  </div>
                )}

                {/* Share button - hidden on mobile */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 md:h-9 md:w-9 text-muted-foreground hover:text-primary hidden sm:flex"
                      aria-label="Share this beat"
                    >
                      <Share2 size={16} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3" align="end">
                    <p className="text-xs text-muted-foreground mb-2">Share "{beat.title}"</p>
                    <ShareButtons
                      title={`Check out "${beat.title}" - Free beat from Joka Beatz!`}
                      compact
                    />
                  </PopoverContent>
                </Popover>

                {/* Duration indicator - hidden on mobile */}
                {isCurrentBeat && duration > 0 && (
                  <div className="hidden md:block text-xs md:text-sm text-muted-foreground font-mono">
                    {formatTime(progress)} / {formatTime(duration)}
                  </div>
                )}
              </div>

              {/* Waveform and Progress bar */}
              {isCurrentBeat && (
                <div className="mt-3 space-y-2">
                  <AudioWaveform
                    analyser={analyserRef.current}
                    isPlaying={isThisPlaying}
                    barCount={48}
                  />
                  {duration > 0 && (
                    <Slider
                      value={[progress]}
                      max={duration}
                      step={0.1}
                      onValueChange={handleSeek}
                      className="cursor-pointer"
                    />
                  )}
                </div>
              )}

              {/* Playing indicator */}
              {isThisPlaying && (
                <div className="absolute top-2 right-2 flex gap-0.5">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-1 bg-primary rounded-full animate-pulse"
                      style={{
                        height: `${8 + i * 4}px`,
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BeatPreviewPlayer;
