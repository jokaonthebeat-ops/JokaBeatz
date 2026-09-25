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
    const { job_id } = await req.json();

    const TONN_API_KEY = Deno.env.get("TONN_API_KEY")?.trim();
    if (!TONN_API_KEY) throw new Error("TONN_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: job, error: jobError } = await supabase
      .from("mastering_jobs")
      .select("*")
      .eq("id", job_id)
      .single();

    if (jobError || !job) throw new Error("Job not found");
    if (!job.task_id) throw new Error("No task ID available");
    if (!job.stripe_payment_intent_id && job.status !== "processing_final") {
      throw new Error("Payment required before retrieving final enhanced track");
    }

    const endpoint = `https://tonn.roexaudio.com/retrieveenhancedtrack`;
    console.log("Retrieving final enhanced track:", endpoint, "task:", job.task_id);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "x-api-key": TONN_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ mixReviveData: { mixReviveTaskId: job.task_id } }),
    });

    const responseText = await response.text();
    console.log("Tonn mix enhance final response:", response.status, responseText);

    if (response.status === 202) {
      let stage = "PROCESSING_FINAL";
      try {
        const data = JSON.parse(responseText);
        stage = data.stage || data.status || "PROCESSING_FINAL";
      } catch { /* ignore */ }

      await supabase
        .from("mastering_jobs")
        .update({ processing_stage: stage })
        .eq("id", job_id);

      return new Response(JSON.stringify({ status: "processing", stage }), {
        status: 202,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!response.ok) {
      const message = `Tonn API error: ${response.status}`;
      await supabase
        .from("mastering_jobs")
        .update({ status: "failed", error_message: message })
        .eq("id", job_id);

      return new Response(JSON.stringify({ error: message }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(responseText);
    const taskResults = result.revived_track_tasks_results || result.mixReviveFinalTaskResults || result;
    const outputUrl = taskResults?.download_url_revived || taskResults?.download_url || result.download_url || result.output_url;

    if (!outputUrl) throw new Error("No download URL in response");

    await supabase
      .from("mastering_jobs")
      .update({ output_file_url: outputUrl, status: "completed", processing_stage: null })
      .eq("id", job_id);

    return new Response(JSON.stringify({ status: "completed", download_url: outputUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Mix enhance final error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
