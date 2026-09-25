import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { MasteringJob, MasteringPreviewSettings, MasteringServiceType, MixEnhanceSettings, MixAnalysisSettings, AudioCleanupSettings, AnalysisResult } from "@/types/mastering";
import { toast } from "sonner";

// Transform database row to typed MasteringJob
const transformJob = (row: Record<string, unknown>): MasteringJob => ({
  id: row.id as string,
  user_id: row.user_id as string,
  service_id: row.service_id as string | null,
  task_id: row.task_id as string | null,
  status: row.status as string,
  processing_stage: row.processing_stage as string | null,
  input_file_url: row.input_file_url as string,
  preview_file_url: row.preview_file_url as string | null,
  output_file_url: row.output_file_url as string | null,
  settings: row.settings as MasteringJob["settings"],
  error_message: row.error_message as string | null,
  stripe_session_id: row.stripe_session_id as string | null,
  stripe_payment_intent_id: row.stripe_payment_intent_id as string | null,
  price_cents: row.price_cents as number | null,
  created_at: row.created_at as string,
  updated_at: row.updated_at as string,
  service: row.service as MasteringJob["service"],
});

// Fetch user's mastering jobs
export function useMasteringJobs(userId?: string) {
  return useQuery({
    queryKey: ["mastering-jobs", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("mastering_jobs")
        .select("*, service:mastering_services(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(transformJob);
    },
    enabled: !!userId,
  });
}

// Fetch all mastering jobs (admin)
export function useAllMasteringJobs() {
  return useQuery({
    queryKey: ["mastering-jobs", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mastering_jobs")
        .select("*, service:mastering_services(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(transformJob);
    },
  });
}

// Create a new mastering job
export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      user_id,
      service_id,
      settings,
      input_file_url,
    }: {
      user_id: string;
      service_id: string;
      settings: Record<string, unknown>;
      input_file_url: string;
    }) => {
      const { data, error } = await supabase
        .from("mastering_jobs")
        .insert({
          user_id,
          service_id,
          settings: settings as unknown as Json,
          input_file_url,
          status: "uploading",
        })
        .select()
        .single();

      if (error) throw error;
      return transformJob(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mastering-jobs"] });
    },
    onError: (error) => {
      console.error("Create job error:", error);
      toast.error("Failed to create mastering job");
    },
  });
}

// Start preview processing
export function useMasteringPreview() {
  return useMutation({
    mutationFn: async ({
      job_id,
      file_url,
      file_urls,
      settings,
      service_type,
    }: {
      job_id: string;
      file_url?: string;
      file_urls?: string[];
      settings: MasteringPreviewSettings;
      service_type: MasteringServiceType;
    }) => {
      const { data, error } = await supabase.functions.invoke("mastering-preview", {
        body: { job_id, file_url, file_urls, settings, service_type },
      });

      if (error) throw error;
      return data;
    },
    onError: (error) => {
      console.error("Preview error:", error);
      toast.error("Failed to start preview processing");
    },
  });
}

// Poll for preview result
export function usePollPreview() {
  return useMutation({
    mutationFn: async ({ job_id }: { job_id: string }) => {
      const { data, error } = await supabase.functions.invoke("mastering-retrieve", {
        body: { job_id },
      });

      if (error) throw error;
      return data as { status: string; preview_url?: string; stage?: string };
    },
  });
}

// Start checkout for full master
export function useMasteringCheckout() {
  return useMutation({
    mutationFn: async ({ job_id, return_path }: { job_id: string; return_path?: string }) => {
      const { data, error } = await supabase.functions.invoke("mastering-checkout", {
        body: { job_id, return_path },
      });

      if (error) throw error;
      return data as { url: string };
    },
    onError: (error) => {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout");
    },
  });
}

// Poll for final master result
export function usePollFinalMaster() {
  return useMutation({
    mutationFn: async ({ job_id }: { job_id: string }) => {
      const { data, error } = await supabase.functions.invoke("mastering-final", {
        body: { job_id },
      });

      if (error) throw error;
      return data as { status: string; download_url?: string; stage?: string };
    },
  });
}

// Verify payment after returning from Stripe checkout
export function useMasteringVerifyPayment() {
  return useMutation({
    mutationFn: async ({ job_id }: { job_id: string }) => {
      const { data, error } = await supabase.functions.invoke("mastering-verify-payment", {
        body: { job_id },
      });

      if (error) throw error;
      return data as { success: boolean; error?: string; message?: string };
    },
    onError: (error) => {
      console.error("Verify payment error:", error);
      toast.error("Failed to verify payment");
    },
  });
}

// Download completed master (legacy compatibility - just returns the stored URL)
export function useMasteringDownload() {
  return useMutation({
    mutationFn: async ({ job_id }: { job_id: string }) => {
      // First check if job already has output URL
      const { data: job, error: jobError } = await supabase
        .from("mastering_jobs")
        .select("output_file_url, status")
        .eq("id", job_id)
        .single();

      if (jobError) throw jobError;

      if (job?.output_file_url) {
        return { download_url: job.output_file_url };
      }

      // If not completed, try to poll for it
      const { data, error } = await supabase.functions.invoke("mastering-final", {
        body: { job_id },
      });

      if (error) throw error;
      return data as { download_url: string };
    },
    onError: (error) => {
      console.error("Download error:", error);
      toast.error("Failed to get download link");
    },
  });
}

// ─── Mix Enhance ─────────────────────────────────────────────────────────────

export function useMixEnhancePreview() {
  return useMutation({
    mutationFn: async ({ job_id, file_url, settings }: { job_id: string; file_url: string; settings: Partial<MixEnhanceSettings> }) => {
      const { data, error } = await supabase.functions.invoke("mix-enhance-preview", {
        body: { job_id, file_url, settings },
      });
      if (error) throw error;
      return data;
    },
    onError: (error) => {
      console.error("Mix enhance preview error:", error);
      toast.error("Failed to start mix enhancement");
    },
  });
}

export function usePollMixEnhance() {
  return useMutation({
    mutationFn: async ({ job_id }: { job_id: string }) => {
      const { data, error } = await supabase.functions.invoke("mix-enhance-retrieve", { body: { job_id } });
      if (error) throw error;
      return data as { status: string; preview_url?: string; stage?: string };
    },
  });
}

export function usePollMixEnhanceFinal() {
  return useMutation({
    mutationFn: async ({ job_id }: { job_id: string }) => {
      const { data, error } = await supabase.functions.invoke("mix-enhance-final", { body: { job_id } });
      if (error) throw error;
      return data as { status: string; download_url?: string; stage?: string };
    },
  });
}

// ─── Mix Analysis ─────────────────────────────────────────────────────────────

export function useMixAnalysis() {
  return useMutation({
    mutationFn: async ({ job_id, file_url, settings }: { job_id: string; file_url: string; settings: Partial<MixAnalysisSettings> }) => {
      const { data, error } = await supabase.functions.invoke("mix-analysis", {
        body: { job_id, file_url, settings },
      });
      if (error) throw error;
      return data as { status: string; analysis: AnalysisResult };
    },
    onError: (error) => {
      console.error("Mix analysis error:", error);
      toast.error("Failed to analyze mix");
    },
  });
}

// ─── Audio Cleanup ────────────────────────────────────────────────────────────

export function useAudioCleanup() {
  return useMutation({
    mutationFn: async ({ job_id, file_url, settings }: { job_id: string; file_url: string; settings: Partial<AudioCleanupSettings> }) => {
      const { data, error } = await supabase.functions.invoke("audio-cleanup", {
        body: { job_id, file_url, settings },
      });
      if (error) throw error;
      return data as { status: string; download_url?: string };
    },
    onError: (error) => {
      console.error("Audio cleanup error:", error);
      toast.error("Failed to run audio cleanup");
    },
  });
}
