import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MusicVideoUpgrade {
  id: string;
  name: string;
  price: number;
}

export interface MusicVideoSettings {
  id: string;
  reels_price: number;
  full_video_price: number;
  upgrade_720p_price: number;
  upgrade_1080p_price: number;
  demo_reels_url: string | null;
  demo_full_video_url: string | null;
  available_upgrades: MusicVideoUpgrade[];
  headline: string;
  subheadline: string;
}

export const useMusicVideoSettings = () => {
  return useQuery({
    queryKey: ["music-video-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("music_video_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        return {
          id: "",
          reels_price: 99.99,
          full_video_price: 249.99,
          upgrade_720p_price: 0,
          upgrade_1080p_price: 29.99,
          demo_reels_url: null,
          demo_full_video_url: null,
          available_upgrades: [] as MusicVideoUpgrade[],
          headline: "Custom Music Videos",
          subheadline: "Bring your song to life with stunning visuals",
        } as MusicVideoSettings;
      }

      return {
        ...data,
        available_upgrades: (data.available_upgrades as unknown as MusicVideoUpgrade[]) || [],
      } as MusicVideoSettings;
    },
  });
};

export const useUpdateMusicVideoSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<MusicVideoSettings>) => {
      const { data: existing } = await supabase
        .from("music_video_settings")
        .select("id")
        .limit(1)
        .maybeSingle();

      const updateData = {
        ...settings,
        available_upgrades: settings.available_upgrades as unknown as any,
      };

      if (existing) {
        const { error } = await supabase
          .from("music_video_settings")
          .update(updateData)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("music_video_settings")
          .insert(updateData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["music-video-settings"] });
      toast.success("Settings updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update settings: " + error.message);
    },
  });
};
