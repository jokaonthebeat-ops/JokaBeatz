import { useState, useEffect } from "react";
import { useMusicVideoProjects } from "@/hooks/useMusicVideoProjects";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { Video, Download, Loader2, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  pending: { color: "bg-yellow-500/20 text-yellow-500", icon: <Clock className="w-4 h-4" />, label: "Pending Payment" },
  paid: { color: "bg-blue-500/20 text-blue-500", icon: <Clock className="w-4 h-4" />, label: "Order Confirmed" },
  in_progress: { color: "bg-purple-500/20 text-purple-500", icon: <Video className="w-4 h-4" />, label: "In Production" },
  completed: { color: "bg-green-500/20 text-green-500", icon: <CheckCircle2 className="w-4 h-4" />, label: "Completed" },
  cancelled: { color: "bg-red-500/20 text-red-500", icon: <AlertCircle className="w-4 h-4" />, label: "Cancelled" },
};

export const MusicVideoProjects = () => {
  const { data: projects, isLoading, lastUpdate, clearLastUpdate } = useMusicVideoProjects();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  // Show toast and trigger animation when real-time update is received
  useEffect(() => {
    if (lastUpdate) {
      // Show toast notification
      const statusLabel = lastUpdate.newStatus ? statusConfig[lastUpdate.newStatus]?.label : null;
      
      if (lastUpdate.newStatus === 'completed') {
        toast.success("🎉 Your music video is ready!", {
          description: "Download it now from your dashboard.",
          duration: 5000,
        });
      } else if (statusLabel) {
        toast.info("Project Updated", {
          description: `Progress: ${lastUpdate.newProgress}% • ${statusLabel}`,
          duration: 3000,
        });
      }

      // Trigger animation on the updated card
      setAnimatingId(lastUpdate.projectId);
      
      // Clear animation after it completes
      const timer = setTimeout(() => {
        setAnimatingId(null);
        clearLastUpdate();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [lastUpdate, clearLastUpdate]);

  const handleDownload = async (projectId: string, videoUrl: string) => {
    setDownloadingId(projectId);
    try {
      // Call edge function to get signed download URL
      const { data, error } = await supabase.functions.invoke("get-video-download", {
        body: { orderId: projectId },
      });

      if (error) throw error;

      if (data?.downloadUrl) {
        // Open in new tab for download
        window.open(data.downloadUrl, "_blank");
        toast.success("Download started!");
      } else {
        throw new Error("No download URL received");
      }
    } catch (error: any) {
      console.error("Download error:", error);
      toast.error("Failed to download video: " + error.message);
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Video Projects</CardTitle>
          <CardDescription>Track your music video orders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Video Projects</CardTitle>
          <CardDescription>Track your music video orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No video projects yet</h3>
            <p className="text-muted-foreground mb-4">
              Order a custom music video and track its progress here.
            </p>
            <Button asChild>
              <Link to="/music-videos">Order Music Video</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Video Projects</CardTitle>
        <CardDescription>Track your music video orders</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {projects.map((project) => {
          const status = statusConfig[project.status] || statusConfig.pending;

          return (
            <div
              key={project.id}
              className={cn(
                "border border-border rounded-lg p-4 space-y-4 transition-all duration-500",
                animatingId === project.id && "ring-2 ring-primary/50 bg-primary/5 animate-pulse"
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground capitalize">
                      {project.video_style} Music Video
                    </h4>
                    <Badge className={status.color}>
                      {status.icon}
                      <span className="ml-1">{status.label}</span>
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {project.video_quality} • Ordered {format(new Date(project.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">${project.total_price.toFixed(2)}</p>
                </div>
              </div>

              {/* Progress */}
              {project.status !== "cancelled" && project.status !== "pending" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress_percent}%</span>
                  </div>
                  <Progress value={project.progress_percent} className="h-2" />
                  {project.progress_note && (
                    <p className="text-sm text-muted-foreground italic">
                      "{project.progress_note}"
                    </p>
                  )}
                </div>
              )}

              {/* Download Button */}
              {project.status === "completed" && project.final_video_url && (
                <Button
                  onClick={() => handleDownload(project.id, project.final_video_url!)}
                  disabled={downloadingId === project.id}
                  className="w-full"
                >
                  {downloadingId === project.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Preparing Download...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download Your Video
                    </>
                  )}
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
