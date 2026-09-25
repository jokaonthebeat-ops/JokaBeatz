import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesUpdate, Json } from "@/integrations/supabase/types";

export type BlogSettings = Tables<"blog_settings">;

export interface BlogSettingsFormData {
  auto_generate_enabled: boolean;
  generation_frequency: string;
  default_author: string;
  content_topics: Record<string, number>;
}

export const useBlogSettings = () => {
  return useQuery({
    queryKey: ["blog-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
};

export const useUpdateBlogSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (settings: BlogSettingsFormData & { id: string }) => {
      const { id, content_topics, ...rest } = settings;
      
      const updateData: TablesUpdate<"blog_settings"> = {
        ...rest,
        content_topics: content_topics as unknown as Json,
      };

      const { data, error } = await supabase
        .from("blog_settings")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-settings"] });
      toast({
        title: "Settings saved",
        description: "Blog settings have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
