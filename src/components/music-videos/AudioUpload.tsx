import { useState, useRef } from "react";
import { Upload, Music, X, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface AudioUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export const AudioUpload = ({ file, onFileChange }: AudioUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const selectedFile = files[0];
    const validTypes = ["audio/mpeg", "audio/mp3"];
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.toLowerCase().endsWith(".mp3")) {
      toast.error("Please upload an MP3 file only");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("Audio file is too large (max 10MB)");
      return;
    }

    onFileChange(selectedFile);
    setIsPlaying(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const removeFile = () => {
    onFileChange(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  if (file) {
    return (
      <div className="bg-secondary rounded-xl p-4 flex items-center gap-4">
        <div className="bg-primary/20 rounded-lg p-3">
          <Music className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{file.name}</p>
          <p className="text-sm text-muted-foreground">
            {(file.size / (1024 * 1024)).toFixed(2)} MB
          </p>
        </div>
        <audio
          ref={audioRef}
          src={URL.createObjectURL(file)}
          onEnded={() => setIsPlaying(false)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={togglePlay}
          className="shrink-0"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={removeFile}
          className="shrink-0 text-muted-foreground hover:text-destructive"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={cn(
        "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
        dragOver
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary/50 hover:bg-secondary/50"
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,audio/mpeg"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
      <Music className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
      <p className="text-foreground font-semibold mb-1">Drop your song here</p>
      <p className="text-sm text-muted-foreground">
        Upload MP3 file (max 10MB)
      </p>
    </div>
  );
};
