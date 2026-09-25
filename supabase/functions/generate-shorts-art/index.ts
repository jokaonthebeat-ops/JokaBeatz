import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  beat: string;
  artist: string;
  genre?: string;
  customPrompt?: string;
  aspect?: "9:16" | "16:9";
  mode?: "single" | "mix";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const kieApiKey = Deno.env.get("KIE_API_KEY");
    if (!kieApiKey && !lovableApiKey) throw new Error("No image generation API key configured");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();
    if (!roleData) throw new Error("Admin access required");

    const { beat, artist, genre, customPrompt, aspect, mode }: Body = await req.json();
    if (!beat || !artist) throw new Error("beat and artist are required");

    const isLandscape = aspect === "16:9";
    const isMix = mode === "mix";

    const portraitPrompt = `Premium hyper-modern 9:16 portrait thumbnail artwork (1080x1920) for a ${genre || "hip-hop"} type beat in the visual world of ${artist}.
Editorial-grade, photorealistic, magazine-cover quality. Cinematic depth-of-field, volumetric lighting, dramatic rim light, soft film grain, rich color grading. Mix of high-fashion photography, luxury aesthetics, and street culture iconography that fits ${artist}'s vibe (designer fashion, jewelry, luxury cars, neon-lit cityscapes, smoke, chrome reflections, moody portraits, futuristic interiors).
Bold modern composition with strong focal point, layered depth, premium textures (glossy, metallic, glass, velvet). Vibrant accent colors against deep moody blacks. High dynamic range, ultra-sharp 8K detail, trending on Behance, ArtStation aesthetic.
ABSOLUTELY NO text, NO words, NO letters, NO numbers, NO logos, NO watermarks, NO captions, NO typography of any kind anywhere in the image.`;

    const landscapeMixPrompt = `Premium hyper-modern 16:9 landscape thumbnail artwork (1920x1080) for a ${genre || "hip-hop"} type beat mix${artist ? ` in the visual world of ${artist}` : ""}.
Editorial-grade, photorealistic, movie-poster quality. Cinematic depth-of-field, volumetric lighting, dramatic rim light, soft film grain, rich color grading. Mix of high-fashion photography, luxury aesthetics, and street culture iconography${artist ? ` that fits ${artist}'s vibe` : ""} (designer fashion, jewelry, luxury cars, neon-lit cityscapes, smoke, chrome reflections, moody portraits, futuristic interiors).
Bold modern wide composition with strong focal point, layered depth, premium textures (glossy, metallic, glass, velvet). Vibrant accent colors against deep moody blacks. High dynamic range, ultra-sharp 8K detail, trending on Behance, ArtStation aesthetic.
ABSOLUTELY NO text, NO words, NO letters, NO numbers, NO logos, NO watermarks, NO captions, NO typography of any kind anywhere in the image.`;

    const prompt = customPrompt?.trim() || (isLandscape && isMix ? landscapeMixPrompt : portraitPrompt);

    const aspectRatio = isLandscape ? "16:9" : "9:16";
    let imageData: string | null = null;

    // Primary: KIE Nano Banana Pro (Gemini 3 Pro Image — premium photorealistic quality)
    if (kieApiKey) {
      imageData = await generateWithKie(prompt, aspectRatio, kieApiKey);
    }

    // Fallback: Lovable AI (Nano Banana Pro via gateway)
    if (!imageData && lovableApiKey) {
      console.log("KIE failed or unavailable, falling back to Lovable AI Nano Banana Pro");
      imageData = await generateWithLovable(prompt, lovableApiKey);
    }

    if (!imageData) {
      throw new Error("Image generation failed — try again or tweak the custom prompt");
    }

    return new Response(JSON.stringify({ success: true, imageDataUrl: imageData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("generate-shorts-art error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: msg === "Unauthorized" ? 401 : 500,
    });
  }
});

async function generateWithKie(prompt: string, aspectRatio: string, apiKey: string): Promise<string | null> {
  try {
    console.log("KIE Nano Banana Pro generation starting, aspect:", aspectRatio);
    const createRes = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/nano-banana-pro",
        input: {
          prompt,
          image_size: aspectRatio,
          output_format: "jpeg",
        },
      }),
    });
    if (!createRes.ok) {
      console.error("KIE create failed:", createRes.status, await createRes.text());
      return null;
    }
    const createJson = await createRes.json();
    if (createJson.code !== 200) {
      console.error("KIE create error:", createJson.msg);
      return null;
    }
    const taskId = createJson.data?.taskId;
    if (!taskId) return null;

    const maxWait = 180000;
    const start = Date.now();
    while (Date.now() - start < maxWait) {
      await new Promise((r) => setTimeout(r, 2500));
      const statusRes = await fetch(
        `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
        { headers: { Authorization: `Bearer ${apiKey}` } }
      );
      if (!statusRes.ok) continue;
      const statusJson = await statusRes.json();
      if (statusJson.code !== 200) continue;
      const state = statusJson.data?.state;
      if (state === "success") {
        let resultJson = statusJson.data?.resultJson;
        if (typeof resultJson === "string") {
          try { resultJson = JSON.parse(resultJson); } catch { resultJson = null; }
        }
        const url =
          resultJson?.resultUrls?.[0] ||
          resultJson?.resultUrl ||
          statusJson.data?.response?.resultImageUrl ||
          statusJson.data?.response?.imageUrl;
        if (!url) return null;
        // Fetch and convert to data URL so the client can use it directly
        const imgRes = await fetch(url);
        if (!imgRes.ok) return null;
        const buf = new Uint8Array(await imgRes.arrayBuffer());
        let bin = "";
        for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
        const b64 = btoa(bin);
        return `data:image/jpeg;base64,${b64}`;
      } else if (state === "fail" || state === "failed") {
        console.error("KIE generation failed:", statusJson.data?.failMsg || statusJson.data?.errorMessage);
        return null;
      }
    }
    console.error("KIE generation timeout");
    return null;
  } catch (e) {
    console.error("KIE error:", e);
    return null;
  }
}

async function generateWithLovable(prompt: string, apiKey: string): Promise<string | null> {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });
    if (!res.ok) {
      console.error("Lovable AI fallback failed:", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null;
  } catch (e) {
    console.error("Lovable AI fallback error:", e);
    return null;
  }
}