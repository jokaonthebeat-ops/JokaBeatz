import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  site_url: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  og_image: string;
  twitter_handle: string;
  theme_color: string;
  instagram_url: string;
  youtube_url: string;
  twitter_url: string;
  beatstars_url: string;
  youtube_video_id: string;
  sender_email: string;
  sender_name: string;
}

const defaultSettings: SiteSettings = {
  site_url: "https://jokabeatz.com",
  seo_title: "Joka Beatz - Industry-Ready Beats & Pro Studio Services",
  seo_description: "Professional beats, custom music production, mixing & mastering services.",
  seo_keywords: "beats, instrumentals, music production",
  og_image: "",
  twitter_handle: "@JokaBeatz",
  theme_color: "#DC2626",
  instagram_url: "",
  youtube_url: "",
  twitter_url: "",
  beatstars_url: "",
  youtube_video_id: "1CIlH-Dwe_g",
  sender_email: "",
  sender_name: "Joka Beatz",
};

export const useSiteSettings = () => {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async (): Promise<SiteSettings> => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value");

      if (error) {
        console.error("Error fetching site settings:", error);
        return defaultSettings;
      }

      const settings = { ...defaultSettings };
      data?.forEach((row) => {
        if (row.key in settings) {
          (settings as Record<string, string>)[row.key] = row.value || "";
        }
      });

      return settings;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateSiteSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<SiteSettings>) => {
      const updates = Object.entries(settings).map(([key, value]) =>
        supabase
          .from("site_settings")
          .upsert({ key, value }, { onConflict: "key" })
      );

      const results = await Promise.all(updates);
      const errors = results.filter((r) => r.error);
      
      if (errors.length > 0) {
        throw new Error("Failed to update some settings");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
  });
};
