import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PartnerLink {
  id: string;
  name: string;
  url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const usePartnerLinks = () => {
  return useQuery({
    queryKey: ["partner-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_links")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as PartnerLink[];
    },
  });
};

export const useAdminPartnerLinks = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-partner-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_links")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as PartnerLink[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (link: { name: string; url: string; display_order?: number }) => {
      const { data, error } = await supabase
        .from("partner_links")
        .insert(link)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-partner-links"] });
      queryClient.invalidateQueries({ queryKey: ["partner-links"] });
      toast({ title: "Partner link added" });
    },
    onError: (error) => {
      toast({ title: "Error adding partner link", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PartnerLink> & { id: string }) => {
      const { data, error } = await supabase
        .from("partner_links")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-partner-links"] });
      queryClient.invalidateQueries({ queryKey: ["partner-links"] });
      toast({ title: "Partner link updated" });
    },
    onError: (error) => {
      toast({ title: "Error updating partner link", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("partner_links")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-partner-links"] });
      queryClient.invalidateQueries({ queryKey: ["partner-links"] });
      toast({ title: "Partner link deleted" });
    },
    onError: (error) => {
      toast({ title: "Error deleting partner link", description: error.message, variant: "destructive" });
    },
  });

  return {
    ...query,
    createPartnerLink: createMutation.mutate,
    updatePartnerLink: updateMutation.mutate,
    deletePartnerLink: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
