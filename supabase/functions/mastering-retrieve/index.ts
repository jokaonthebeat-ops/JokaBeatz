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

    // Get job to find task_id
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

    // Determine service type from job settings or service
    const serviceType = job.service?.service_type || (job.settings as Record<string, unknown>)?.serviceType || "mastering";

    // Poll Tonn API for preview result based on service type
    // Mixing uses the multitrack mix endpoint
    // Batch mastering and regular mastering use the same mastering retrieval endpoint
    // Enhance uses the enhance endpoint
    let endpoint = "https://tonn.roexaudio.com/retrievepreviewmaster";
    let requestBody: Record<string, unknown>;

    if (serviceType === "mixing") {
      // Multitrack mixing uses the mix preview retrieval endpoint
      endpoint = "https://tonn.roexaudio.com/retrievepreviewmix";
      requestBody = { mixingData: { mixingTaskId: job.task_id } };
    } else if (serviceType === "mix_enhance") {
      // Mix enhance uses the enhance endpoint for single-track processing
      endpoint = "https://tonn.roexaudio.com/retrievepreviewenhance";
      requestBody = { enhanceData: { enhanceTaskId: job.task_id } };
    } else {
      // Both regular mastering and batch mastering use the same retrieval endpoint
      requestBody = { masteringData: { masteringTaskId: job.task_id } };
    }

    console.log("Polling Tonn API:", endpoint, "task:", job.task_id, "serviceType:", serviceType);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": TONN_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log("Tonn retrieve response:", response.status, responseText);

    // 202 = still processing
    if (response.status === 202) {
      // Parse for any stage info
      let stage = "PROCESSING";
      try {
        const data = JSON.parse(responseText);
        stage = data.stage || data.status || "PROCESSING";
      } catch {
        // Ignore parse errors
      }

      // Update processing stage
      await supabase
        .from("mastering_jobs")
        .update({ processing_stage: stage })
        .eq("id", job_id);

      return new Response(JSON.stringify({ 
        status: "processing", 
        stage,
        message: "Preview is still being generated" 
      }), {
        status: 202,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Error responses
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

    // 200 = completed
    const result = JSON.parse(responseText);
    
    // Parse response based on service type - Tonn returns different result keys
    // mastering: previewMasterTaskResults, mixing: previewMixTaskResults, enhance: previewEnhanceTaskResults
    const taskResults = result.previewMasterTaskResults || result.previewMixTaskResults || result.previewEnhanceTaskResults || result;
    const previewUrl = taskResults.download_url_mastered_preview || taskResults.download_url_mixed_preview || taskResults.download_url_enhanced_preview || taskResults.preview_url || result.download_url;
    const previewStartTime = taskResults.preview_start_time || result.preview_start_time || 0;

    if (!previewUrl) {
      throw new Error("No preview URL in response");
    }

    // Update job with preview URL and change status to pending_payment
    await supabase
      .from("mastering_jobs")
      .update({ 
        preview_file_url: previewUrl,
        status: "pending_payment",
        processing_stage: null,
      })
      .eq("id", job_id);

    return new Response(JSON.stringify({ 
      status: "completed",
      preview_url: previewUrl,
      preview_start_time: previewStartTime,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Retrieve error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
