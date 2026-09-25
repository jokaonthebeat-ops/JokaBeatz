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

    // Update job status to processing
    await supabase
      .from("mastering_jobs")
      .update({ status: "processing_preview", processing_stage: "SUBMITTING" })
      .eq("id", job_id);

    const webhookURL = `${supabaseUrl}/functions/v1/mastering-webhook`;

    // Tonn Mix Revive API payload — all required fields per their schema
    const payload = {
      mixReviveData: {
        audioFileLocation: file_url,
        musicalStyle: settings.musicalStyle || "OTHER",
        loudnessPreference: "STREAMING_LOUDNESS",
        applyMastering: true,
        isMaster: false,
        fixClippingIssues: true,
        fixLoudnessIssues: true,
        fixStereoWidthIssues: true,
        fixTonalProfileIssues: true,
        applyDrumEnhancement: true,
        applyVocalEnhancement: true,
        getProcessedStems: false,
        stemProcessing: false,
        webhookURL,
      },
    };

    console.log("Calling Tonn mix revive preview:", JSON.stringify(payload));

    const response = await fetch("https://tonn.roexaudio.com/mixenhancepreview", {
      method: "POST",
      headers: {
        "x-api-key": TONN_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log("Tonn mix enhance preview response:", response.status, responseText);

    if (!response.ok) {
      await supabase
        .from("mastering_jobs")
        .update({ status: "failed", error_message: `Tonn API error: ${response.status} - ${responseText}` })
        .eq("id", job_id);

      return new Response(JSON.stringify({ error: `Tonn API error: ${response.status}`, details: responseText }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(responseText);
    const taskId = result.mixrevive_task_id || result.mixRevivePreviewTaskId || result.mixEnhancePreviewTaskId || result.taskId || result.task_id;

    if (!taskId) {
      throw new Error("No task ID returned from Tonn API");
    }

    await supabase
      .from("mastering_jobs")
      .update({ task_id: taskId, status: "processing_preview", processing_stage: "QUEUED" })
      .eq("id", job_id);

    return new Response(JSON.stringify({ task_id: taskId, status: "processing" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Mix enhance preview error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
