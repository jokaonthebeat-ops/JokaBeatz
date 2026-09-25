import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { MasteringService, MasteringSettings } from "@/types/mastering";
import { toast } from "sonner";

// Transform database response to typed MasteringService
const transformService = (row: Record<string, unknown>): MasteringService => ({
  id: row.id as string,
  name: row.name as string,
  slug: row.slug as string,
  description: row.description as string | null,
  service_type: row.service_type as MasteringService["service_type"],
  price_cents: row.price_cents as number,
  sale_price_cents: row.sale_price_cents as number | null,
  stripe_price_id: row.stripe_price_id as string | null,
  features: row.features as string[],
  default_settings: row.default_settings as MasteringSettings,
  is_active: row.is_active as boolean,
  is_featured: row.is_featured as boolean,
  display_order: row.display_order as number,
  created_at: row.created_at as string,
  updated_at: row.updated_at as string,
});

// Fetch all services (admin)
export function useMasteringServices() {
  return useQuery({
    queryKey: ["mastering-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mastering_services")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return (data || []).map(transformService);
    },
  });
}

// Fetch only active services (public)
export function useActiveServices() {
  return useQuery({
    queryKey: ["mastering-services", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mastering_services")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return (data || []).map(transformService);
    },
  });
}

// Create service
export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (service: Omit<MasteringService, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("mastering_services")
        .insert({
          ...service,
          default_settings: service.default_settings as unknown as Json,
        })
        .select()
        .single();

      if (error) throw error;
      return transformService(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mastering-services"] });
      toast.success("Service created successfully");
    },
    onError: (error) => {
      console.error("Create service error:", error);
      toast.error("Failed to create service");
    },
  });
}

// Update service
export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MasteringService> & { id: string }) => {
      const updateData = {
        ...updates,
        ...(updates.default_settings && {
          default_settings: updates.default_settings as unknown as Json,
        }),
      };

      const { data, error } = await supabase
        .from("mastering_services")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return transformService(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mastering-services"] });
      toast.success("Service updated successfully");
    },
    onError: (error) => {
      console.error("Update service error:", error);
      toast.error("Failed to update service");
    },
  });
}

// Delete service
export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("mastering_services")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mastering-services"] });
      toast.success("Service deleted successfully");
    },
    onError: (error) => {
      console.error("Delete service error:", error);
      toast.error("Failed to delete service");
    },
  });
}
