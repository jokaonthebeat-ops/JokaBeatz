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
      .update({ status: "processing_preview", processing_stage: "ANALYZING" })
      .eq("id", job_id);

    // Map internal style values to Tonn mix analysis API enum values
    const styleMap: Record<string, string> = {
      HIPHOP_GRIME: "HIP_HOP_GRIME",
      ROCK_INDIE: "INDIE_ROCK",
      REGGAE_DUB: "REGGAE",
      OTHER: "BALANCED",
    };
    const rawStyle = settings.musicalStyle || "BALANCED";
    const mappedStyle = styleMap[rawStyle] || rawStyle;

    const payload = {
      mixDiagnosisData: {
        audioFileLocation: file_url,
        musicalStyle: mappedStyle,
        isMaster: false,
      },
    };

    console.log("Calling Tonn mix analysis:", payload);

    const response = await fetch("https://tonn.roexaudio.com/mixanalysis", {
      method: "POST",
      headers: {
        "x-api-key": TONN_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log("Tonn mix analysis response:", response.status, responseText);

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

    // Store analysis result in settings field and mark as completed
    const { data: currentJob } = await supabase
      .from("mastering_jobs")
      .select("settings")
      .eq("id", job_id)
      .single();

    const updatedSettings = {
      ...(currentJob?.settings as Record<string, unknown> || {}),
      analysisResult: result,
    };

    await supabase
      .from("mastering_jobs")
      .update({
        status: "completed",
        processing_stage: null,
        settings: updatedSettings,
      })
      .eq("id", job_id);

    return new Response(JSON.stringify({ status: "completed", analysis: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Mix analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
