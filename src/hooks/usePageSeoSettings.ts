import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PageSeoSettings {
  id: string;
  path: string;
  page_name: string;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  og_image: string | null;
  image_prompt: string | null;
  created_at: string;
  updated_at: string;
}

export const usePageSeoSettings = (path?: string) => {
  return useQuery({
    queryKey: ["page-seo-settings", path],
    queryFn: async (): Promise<PageSeoSettings | null> => {
      if (!path) return null;
      
      const { data, error } = await supabase
        .from("page_seo_settings")
        .select("*")
        .eq("path", path)
        .maybeSingle();

      if (error) {
        console.error("Error fetching page SEO settings:", error);
        return null;
      }

      return data;
    },
    enabled: !!path,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

export const useAllPageSeoSettings = () => {
  return useQuery({
    queryKey: ["all-page-seo-settings"],
    queryFn: async (): Promise<PageSeoSettings[]> => {
      const { data, error } = await supabase
        .from("page_seo_settings")
        .select("*")
        .order("path");

      if (error) {
        console.error("Error fetching all page SEO settings:", error);
        return [];
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdatePageSeoSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<PageSeoSettings> & { id: string }) => {
      const { id, ...updateData } = settings;
      
      const { error } = await supabase
        .from("page_seo_settings")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page-seo-settings"] });
      queryClient.invalidateQueries({ queryKey: ["all-page-seo-settings"] });
    },
  });
};
