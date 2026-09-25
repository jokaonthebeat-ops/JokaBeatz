import { useState, useRef } from "react";
import { Upload, Video, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface VideoUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  label: string;
}

export const VideoUpload = ({ value, onChange, label }: VideoUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith("video/")) {
      toast.error("Please upload a video file");
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error("Video file is too large (max 100MB)");
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      
      const { error: uploadError } = await supabase.storage
        .from("music-video-demos")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("music-video-demos")
        .getPublicUrl(fileName);

      onChange(publicUrl);
      toast.success("Video uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload video: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput("");
      toast.success("Video URL set successfully");
    }
  };

  const removeVideo = async () => {
    if (value && value.includes("music-video-demos")) {
      try {
        const fileName = value.split("/").pop();
        if (fileName) {
          await supabase.storage.from("music-video-demos").remove([fileName]);
        }
      } catch (error) {
        console.error("Failed to delete file:", error);
      }
    }
    onChange(null);
  };

  if (value) {
    return (
      <div className="space-y-2">
        <div className="relative rounded-lg overflow-hidden bg-black/50">
          <video
            src={value}
            className="w-full h-40 object-cover"
            muted
            loop
            autoPlay
            playsInline
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={removeVideo}
            className="absolute top-2 right-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground truncate">{value}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all",
          dragOver
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/50 hover:bg-secondary/50",
          isUploading && "pointer-events-none opacity-50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={isUploading}
        />
        {isUploading ? (
          <>
            <Loader2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </>
        ) : (
          <>
            <Video className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground mb-1">
              Drop {label} here
            </p>
            <p className="text-xs text-muted-foreground">
              MP4, WebM, or MOV (max 100MB)
            </p>
          </>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">or</span>
      </div>
      
      <div className="flex gap-2">
        <Input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Paste video URL"
          className="flex-1"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={handleUrlSubmit}
          disabled={!urlInput.trim()}
        >
          Use URL
        </Button>
      </div>
    </div>
  );
};
