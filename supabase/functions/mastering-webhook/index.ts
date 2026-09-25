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
    // Handle GET requests (Tonn may verify webhook URL with GET)
    if (req.method === "GET") {
      console.log("Webhook verification ping received (GET)");
      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse body - handle empty or malformed bodies gracefully
    let body: Record<string, unknown> = {};
    try {
      const text = await req.text();
      if (text && text.trim()) {
        body = JSON.parse(text);
      }
    } catch {
      // Empty or invalid JSON - treat as verification ping
      console.log("Webhook ping received (empty/invalid body)");
      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Webhook received:", JSON.stringify(body, null, 2));

    // If no meaningful data, treat as ping/verification
    if (!body || Object.keys(body).length === 0) {
      console.log("Webhook verification ping received (empty object)");
      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Tonn webhook payload structure (per docs):
    // - mastering_task_id: the task identifier
    // - status/state: COMPLETED, FAILED, MASTERING_TASK_COMPLETED, etc.
    // - download_url_mastered_preview: for preview completions
    // - finalMasterTaskResults: for final master completions
    const { 
      mastering_task_id,
      mixing_task_id,
      enhance_task_id,
      status,
      state,
      stage,
      download_url_mastered_preview,
      download_url_mastered,
      finalMasterTaskResults,
      error_message,
    } = body as Record<string, unknown>;

    const taskId = mastering_task_id || mixing_task_id || enhance_task_id;

    // If no task ID but we have other data, it's a verification/status request - return OK
    if (!taskId) {
      console.log("Webhook received without task ID - treating as ping");
      return new Response(JSON.stringify({ status: "ok", received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find job by task_id - may not exist yet due to race condition
    // Tonn sends webhooks immediately, sometimes before we save the task_id
    const { data: job, error: jobError } = await supabase
      .from("mastering_jobs")
      .select("*")
      .eq("task_id", taskId)
      .single();

    if (jobError || !job) {
      // Race condition: webhook arrived before task_id was saved
      // Return 200 OK to acknowledge receipt - the job will be updated via polling
      console.log("Job not found yet for task (race condition):", taskId);
      return new Response(JSON.stringify({ received: true, pending: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine if this is preview or final processing
    const isFullProcessing = job.stripe_payment_intent_id || job.status === "processing_final";

    // Build update data based on status/state
    // Tonn uses "state" field with values like MASTERING_TASK_COMPLETED, MASTERING_TASK_FAILED
    const updateData: Record<string, unknown> = {};
    const taskState = (state as string) || (status as string) || "";

    // Update processing stage for progress tracking
    if (taskState && !taskState.includes("COMPLETED") && !taskState.includes("FAILED")) {
      updateData.processing_stage = taskState;
    }

    // Check for completion
    if (taskState.includes("COMPLETED") || taskState === "COMPLETED") {
      if (isFullProcessing && (download_url_mastered || (finalMasterTaskResults as Record<string, unknown>)?.download_url)) {
        // Final master completed
        updateData.status = "completed";
        updateData.output_file_url = download_url_mastered || (finalMasterTaskResults as Record<string, unknown>)?.download_url;
        updateData.processing_stage = null;
      } else if (download_url_mastered_preview) {
        // Preview completed
        updateData.status = "pending_payment";
        updateData.preview_file_url = download_url_mastered_preview;
        updateData.processing_stage = null;
      }
    } else if (taskState.includes("FAILED") || taskState === "FAILED" || taskState === "ERROR") {
      updateData.status = "failed";
      updateData.error_message = (error_message as string) || "Processing failed";
      updateData.processing_stage = null;
    }

    console.log("Updating job:", job.id, updateData);

    if (Object.keys(updateData).length > 0) {
      await supabase
        .from("mastering_jobs")
        .update(updateData)
        .eq("id", job.id);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
