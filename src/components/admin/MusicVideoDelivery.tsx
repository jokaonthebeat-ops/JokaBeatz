import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, Video, Loader2, Send, CheckCircle2 } from "lucide-react";

interface MusicVideoDeliveryProps {
  orderId: string;
  customerEmail: string;
  customerName: string;
  currentProgress: number;
  currentNote: string | null;
  finalVideoUrl: string | null;
  notificationSent: boolean;
  onUpdate: () => void;
}

export const MusicVideoDelivery = ({
  orderId,
  customerEmail,
  customerName,
  currentProgress,
  currentNote,
  finalVideoUrl,
  notificationSent,
  onUpdate,
}: MusicVideoDeliveryProps) => {
  const [progress, setProgress] = useState(currentProgress);
  const [progressNote, setProgressNote] = useState(currentNote || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState(finalVideoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("video/")) {
      toast.error("Please upload a video file");
      return;
    }

    // Validate file size (500MB max)
    if (file.size > 500 * 1024 * 1024) {
      toast.error("File size must be under 500MB");
      return;
    }

    setIsUploading(true);
    try {
      const timestamp = Date.now();
      const filePath = `${orderId}/${timestamp}-${file.name}`;

      const { data, error } = await supabase.storage
        .from("music-video-deliverables")
        .upload(filePath, file);

      if (error) throw error;

      // Get the file path for storage
      const videoPath = data.path;
      setUploadedVideoUrl(videoPath);

      // Update the order with the video URL
      const { error: updateError } = await supabase
        .from("music_video_orders")
        .update({ final_video_url: videoPath })
        .eq("id", orderId);

      if (updateError) throw updateError;

      toast.success("Video uploaded successfully!");
      onUpdate();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload video: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProgress = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("music_video_orders")
        .update({
          progress_percent: progress,
          progress_note: progressNote || null,
        })
        .eq("id", orderId);

      if (error) throw error;
      toast.success("Progress updated!");
      onUpdate();
    } catch (error: any) {
      toast.error("Failed to save progress: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkCompleteAndNotify = async () => {
    if (!uploadedVideoUrl) {
      toast.error("Please upload the final video first");
      return;
    }

    setIsNotifying(true);
    try {
      // Update order status to completed
      const { error: updateError } = await supabase
        .from("music_video_orders")
        .update({
          status: "completed",
          progress_percent: 100,
          progress_note: "Your video is ready for download!",
        })
        .eq("id", orderId);

      if (updateError) throw updateError;

      // Call notification edge function
      const { error: notifyError } = await supabase.functions.invoke("notify-video-ready", {
        body: {
          orderId,
          customerEmail,
          customerName,
        },
      });

      if (notifyError) throw notifyError;

      toast.success("Order marked complete and customer notified!");
      onUpdate();
    } catch (error: any) {
      console.error("Notification error:", error);
      toast.error("Failed to notify customer: " + error.message);
    } finally {
      setIsNotifying(false);
    }
  };

  return (
    <div className="space-y-6 border-t pt-6 mt-6">
      <h3 className="font-semibold text-lg">Delivery & Progress</h3>

      {/* Progress Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Progress: {progress}%</Label>
        </div>
        <Slider
          value={[progress]}
          onValueChange={(value) => setProgress(value[0])}
          max={100}
          step={5}
          className="w-full"
        />
      </div>

      {/* Progress Note */}
      <div className="space-y-2">
        <Label htmlFor="progress-note">Status Note (visible to customer)</Label>
        <Textarea
          id="progress-note"
          value={progressNote}
          onChange={(e) => setProgressNote(e.target.value)}
          placeholder="e.g., 'Editing in progress', 'Adding final effects'"
          rows={2}
        />
      </div>

      <Button onClick={handleSaveProgress} disabled={isSaving} variant="outline" className="w-full">
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Progress"
        )}
      </Button>

      {/* Video Upload */}
      <div className="space-y-3">
        <Label>Final Video File</Label>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="video/*"
          className="hidden"
        />

        {uploadedVideoUrl ? (
          <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <Video className="w-5 h-5 text-green-500" />
            <span className="text-sm flex-1 truncate">{uploadedVideoUrl.split("/").pop()}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              Replace
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full h-24 border-dashed"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
                Upload Final Video (up to 500MB)
              </>
            )}
          </Button>
        )}
      </div>

      {/* Complete & Notify Button */}
      <Button
        onClick={handleMarkCompleteAndNotify}
        disabled={isNotifying || !uploadedVideoUrl || notificationSent}
        className="w-full"
      >
        {notificationSent ? (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Customer Already Notified
          </>
        ) : isNotifying ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending Notification...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Mark Complete & Notify Customer
          </>
        )}
      </Button>
    </div>
  );
};
