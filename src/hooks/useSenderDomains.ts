import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SenderDomain {
  id: string;
  email: string;
  name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const useSenderDomains = () => {
  return useQuery({
    queryKey: ["sender-domains"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sender_domains")
        .select("*")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as SenderDomain[];
    },
  });
};

export const useAddSenderDomain = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, name, is_default }: { email: string; name: string; is_default?: boolean }) => {
      const { data, error } = await supabase
        .from("sender_domains")
        .insert({ email, name, is_default: is_default || false })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sender-domains"] });
    },
  });
};

export const useUpdateSenderDomain = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, email, name, is_default }: { id: string; email: string; name: string; is_default?: boolean }) => {
      const { data, error } = await supabase
        .from("sender_domains")
        .update({ email, name, is_default })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sender-domains"] });
    },
  });
};

export const useDeleteSenderDomain = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sender_domains")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sender-domains"] });
    },
  });
};

export const useSetDefaultSenderDomain = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("sender_domains")
        .update({ is_default: true })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sender-domains"] });
    },
  });
};
