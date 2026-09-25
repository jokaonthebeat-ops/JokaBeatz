import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { job_id, file_url, settings } = await req.json();

    const TONN_API_KEY = Deno.env.get("TONN_API_KEY")?.trim();
    if (!TONN_API_KEY) throw new Error("TONN_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update job status
    await supabase
      .from("mastering_jobs")
      .update({ status: "processing_preview", processing_stage: "CLEANING" })
      .eq("id", job_id);

    const webhookURL = `${supabaseUrl}/functions/v1/mastering-webhook`;

    const payload = {
      audioCleanupData: {
        audioFileLocation: file_url,
        soundSource: settings.soundSource || settings.instrumentType || "VOCAL_GROUP",
        webhookURL,
      },
    };

    console.log("Calling Tonn audio cleanup (fire-and-forget):", JSON.stringify(payload));

    // Fire-and-forget: kick off Tonn API call in background, return immediately
    const fetchAndUpdate = async () => {
      try {
        const response = await fetch("https://tonn.roexaudio.com/audio-cleanup", {
          method: "POST",
          headers: {
            "x-api-key": TONN_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const responseText = await response.text();
        console.log("Tonn audio cleanup response:", response.status, responseText);

        if (!response.ok) {
          await supabase
            .from("mastering_jobs")
            .update({ status: "failed", error_message: `Tonn API error: ${response.status} - ${responseText}` })
            .eq("id", job_id);
          return;
        }

        let result: Record<string, unknown> = {};
        try { result = JSON.parse(responseText); } catch { /* ignore */ }

        // Check for synchronous result
        const cleanupResults = (result.audioCleanupResults || result.audio_cleanup_results) as Record<string, unknown> | undefined;
        const outputUrl = cleanupResults?.cleaned_audio_file_location_mp3 ||
          cleanupResults?.cleaned_audio_file_location ||
          cleanupResults?.downloadURL || cleanupResults?.download_url ||
          result.downloadURL || result.download_url;

        if (outputUrl) {
          console.log("Synchronous cleanup result — output URL:", outputUrl);
          await supabase
            .from("mastering_jobs")
            .update({ output_file_url: outputUrl, preview_file_url: outputUrl, status: "completed", processing_stage: null })
            .eq("id", job_id);
          return;
        }

        // Async: Tonn accepted the job and will call our webhook when done.
        const taskId = result.taskId || result.task_id || result.cleanup_task_id || result.id || result.job_id || result.reference_id;
        console.log("Async cleanup accepted — task ID:", taskId, "— waiting for webhook callback");
        if (taskId) {
          await supabase
            .from("mastering_jobs")
            .update({ task_id: taskId as string, processing_stage: "CLEANING" })
            .eq("id", job_id);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Processing failed";
        console.error("Background fetch error:", msg);
        if (!msg.includes("timed out") && !msg.includes("timeout")) {
          await supabase
            .from("mastering_jobs")
            .update({ status: "failed", error_message: msg })
            .eq("id", job_id);
        } else {
          console.log("Fetch timed out but Tonn may still deliver result via webhook");
        }
      }
    };

    // Use EdgeRuntime.waitUntil if available, otherwise fire without awaiting
    try {
      (EdgeRuntime as unknown as { waitUntil: (p: Promise<unknown>) => void }).waitUntil(fetchAndUpdate());
    } catch {
      fetchAndUpdate();
    }

    return new Response(JSON.stringify({ status: "processing" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Audio cleanup error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
