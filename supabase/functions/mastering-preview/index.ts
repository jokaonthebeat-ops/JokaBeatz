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
    const { job_id, file_url, file_urls, settings, service_type } = await req.json();

    // Input validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!job_id || !uuidRegex.test(job_id)) {
      return new Response(JSON.stringify({ error: "Invalid job ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const validServiceTypes = ["mastering", "mixing", "mix_enhance", "batch_mastering", "audio_cleanup"];
    if (!service_type || !validServiceTypes.includes(service_type)) {
      return new Response(JSON.stringify({ error: "Invalid service type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const TONN_API_KEY_RAW = Deno.env.get("TONN_API_KEY");
    const TONN_API_KEY = TONN_API_KEY_RAW?.trim();
    if (!TONN_API_KEY) {
      throw new Error("TONN_API_KEY is not configured");
    }

    // Safe diagnostics (no secret leakage): helps confirm which key version is loaded.
    const keyLen = TONN_API_KEY.length;
    const keyPrefix = TONN_API_KEY.slice(0, 4);
    const keySuffix = TONN_API_KEY.slice(-4);
    const hadWhitespace = TONN_API_KEY_RAW !== TONN_API_KEY;
    console.log("TONN key diagnostics:", { keyLen, keyPrefix, keySuffix, hadWhitespace });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update job status to processing_preview
    await supabase
      .from("mastering_jobs")
      .update({ status: "processing_preview", processing_stage: "PENDING" })
      .eq("id", job_id);

    // Determine Tonn API endpoint based on service type
    // Mixing uses multitrack endpoint with multiple stems (2-32 tracks)
    // Batch mastering uses mastering endpoint with multiple tracks in trackData
    // Mastering and enhance use single-track endpoints
    let endpoint = "https://tonn.roexaudio.com/masteringpreview";
    const isMixing = service_type === "mixing";
    const isBatchMastering = service_type === "batch_mastering";
    
    if (isMixing) {
      // Multitrack mixing requires 2-32 tracks
      endpoint = "https://tonn.roexaudio.com/mixpreview";
    } else if (service_type === "mix_enhance") {
      endpoint = "https://tonn.roexaudio.com/enhancepreview";
    }
    // Batch mastering uses the same /masteringpreview endpoint but with multiple tracks

    // Webhook URL for async notifications
    const webhookURL = `${supabaseUrl}/functions/v1/mastering-webhook`;

    // Validate musical style against Tonn API enums
    const VALID_STYLES = ["ROCK_INDIE", "POP", "ACOUSTIC", "HIPHOP_GRIME", "ELECTRONIC", "REGGAE_DUB", "ORCHESTRAL", "METAL", "OTHER"];
    const musicalStyle = VALID_STYLES.includes(settings.musicalStyle) ? settings.musicalStyle : "OTHER";

    // Validate loudness - Tonn only supports LOW, MEDIUM, HIGH (no MAX)
    const VALID_LOUDNESS = ["LOW", "MEDIUM", "HIGH"];
    const desiredLoudness = VALID_LOUDNESS.includes(settings.desiredLoudness) ? settings.desiredLoudness : "MEDIUM";

    let tonnPayload: Record<string, unknown>;

    if (isMixing) {
      // Multitrack mixing: requires array of track URLs (2-32 tracks)
      // Per Tonn API: mixingData.trackData is array of { trackURL: string }
      const trackUrls = file_urls || [file_url];
      
      if (trackUrls.length < 2) {
        throw new Error("Multitrack mixing requires at least 2 stems");
      }
      if (trackUrls.length > 32) {
        throw new Error("Multitrack mixing supports maximum 32 stems");
      }

      const trackData = trackUrls.map((url: string) => ({ trackURL: url }));
      
      tonnPayload = {
        mixingData: {
          trackData,
          musicalStyle,
          desiredLoudness,
          webhookURL,
        },
      };
    } else if (isBatchMastering) {
      // Batch mastering: multiple tracks in trackData array for album/EP
      // Each track gets mastered individually with the same settings
      const trackUrls = file_urls || [file_url];
      
      if (trackUrls.length < 2) {
        throw new Error("Batch mastering requires at least 2 tracks");
      }
      if (trackUrls.length > 20) {
        throw new Error("Batch mastering supports maximum 20 tracks");
      }

      const trackData = trackUrls.map((url: string) => ({ trackURL: url }));
      
      tonnPayload = {
        masteringData: {
          trackData,
          musicalStyle,
          desiredLoudness,
          webhookURL,
        },
      };
    } else {
      // Single-track processing: mastering or enhance
      const baseData = {
        trackData: [{ trackURL: file_url }],
        musicalStyle,
        desiredLoudness,
        webhookURL,
      };

      tonnPayload = service_type === "mix_enhance"
        ? { enhanceData: baseData }
        : { masteringData: baseData };
    }

    console.log("Tonn API request:", { endpoint, payload: tonnPayload });

    // Per official RoEx client: use only x-api-key header (not Bearer, not query param)
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": TONN_API_KEY,
      },
      body: JSON.stringify(tonnPayload),
    });

    const responseText = await response.text();
    console.log("Tonn API response:", response.status, responseText);

    if (!response.ok) {
      const message = response.status === 401
        ? "Tonn API authentication failed. Please verify your API key is valid and has credits."
        : `Tonn API error: ${response.status}`;

      await supabase
        .from("mastering_jobs")
        .update({ status: "failed", error_message: message, processing_stage: null })
        .eq("id", job_id);

      return new Response(JSON.stringify({ error: message, status: response.status, details: responseText }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse response - different task ID keys per service
    const result = JSON.parse(responseText);
    const taskId = result.mixing_task_id || result.mastering_task_id || result.enhance_task_id || result.task_id;

    console.log("Task ID received:", taskId);

    // Update job with task ID
    await supabase
      .from("mastering_jobs")
      .update({ 
        task_id: taskId || null, 
        processing_stage: "STARTED" 
      })
      .eq("id", job_id);

    return new Response(JSON.stringify({ success: true, task_id: taskId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Preview error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
