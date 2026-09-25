import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MusicVideoProject {
  id: string;
  customer_name: string;
  customer_email: string;
  video_style: string;
  video_quality: string;
  vision_description: string;
  total_price: number;
  status: string;
  progress_percent: number;
  progress_note: string | null;
  final_video_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface RealtimeUpdate {
  projectId: string;
  newProgress?: number;
  newStatus?: string;
  timestamp: number;
}

export const useMusicVideoProjects = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [lastUpdate, setLastUpdate] = useState<RealtimeUpdate | null>(null);

  // Clear the lastUpdate after animation completes
  const clearLastUpdate = useCallback(() => {
    setLastUpdate(null);
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('music-video-progress')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'music_video_orders',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Music video update received:', payload);
          
          // Track update details for toast/animation
          if (payload.new && 'id' in payload.new) {
            const newData = payload.new as MusicVideoProject;
            setLastUpdate({
              projectId: newData.id,
              newProgress: newData.progress_percent,
              newStatus: newData.status,
              timestamp: Date.now(),
            });
          }
          
          // Invalidate and refetch when data changes
          queryClient.invalidateQueries({ queryKey: ["music-video-projects", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const query = useQuery({
    queryKey: ["music-video-projects", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("music_video_orders")
        .select("id, customer_name, customer_email, video_style, video_quality, vision_description, total_price, status, progress_percent, progress_note, final_video_url, created_at, updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as MusicVideoProject[];
    },
    enabled: !!user?.id,
  });

  return {
    ...query,
    lastUpdate,
    clearLastUpdate,
  };
};
