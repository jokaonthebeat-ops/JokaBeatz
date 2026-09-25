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
    if (!TONN_API_KEY) {
      throw new Error("TONN_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from("mastering_jobs")
      .select("*")
      .eq("id", job_id)
      .single();

    if (jobError || !job) {
      throw new Error("Job not found");
    }

    if (!job.task_id) {
      throw new Error("No task ID available for this job");
    }

    // Verify payment was completed
    if (!job.stripe_payment_intent_id && job.status !== "processing_final") {
      throw new Error("Payment required before retrieving final master");
    }

    // Get settings for sample rate
    const settings = job.settings as { sampleRate?: string };
    const sampleRate = settings?.sampleRate || "44100";

    // Call Tonn API to retrieve final master
    // Per docs: GET /retrievefinalmaster?masteringTaskId=xxx&sampleRate=xxx
    const endpoint = `https://tonn.roexaudio.com/retrievefinalmaster?masteringTaskId=${job.task_id}&sampleRate=${sampleRate}`;

    console.log("Retrieving final master:", endpoint);

    // Per official RoEx client: use only x-api-key header
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "x-api-key": TONN_API_KEY,
      },
    });

    const responseText = await response.text();
    console.log("Tonn final response:", response.status, responseText);

    // 202 = still processing
    if (response.status === 202) {
      let stage = "PROCESSING_FINAL";
      try {
        const data = JSON.parse(responseText);
        stage = data.stage || data.status || "PROCESSING_FINAL";
      } catch {
        // Ignore parse errors
      }

      await supabase
        .from("mastering_jobs")
        .update({ processing_stage: stage })
        .eq("id", job_id);

      return new Response(JSON.stringify({ 
        status: "processing", 
        stage,
        message: "Final master is still being generated" 
      }), {
        status: 202,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!response.ok) {
      const message = `Tonn API error: ${response.status}`;
      
      await supabase
        .from("mastering_jobs")
        .update({ status: "failed", error_message: message, processing_stage: null })
        .eq("id", job_id);

      return new Response(JSON.stringify({ error: message, details: responseText }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse result
    const result = JSON.parse(responseText);
    
    // Per Tonn docs, finalMasterTaskResults contains the download URL
    const outputUrl = result.finalMasterTaskResults?.download_url || 
                      result.download_url || 
                      result.output_url;

    if (!outputUrl) {
      throw new Error("No download URL in response");
    }

    // Update job as completed
    await supabase
      .from("mastering_jobs")
      .update({ 
        output_file_url: outputUrl,
        status: "completed",
        processing_stage: null,
      })
      .eq("id", job_id);

    return new Response(JSON.stringify({ 
      status: "completed",
      download_url: outputUrl,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Final master error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
