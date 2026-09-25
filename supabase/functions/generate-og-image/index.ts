import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateOGRequest {
  title: string;
  tagline?: string;
  imagePrompt?: string;
}

// Logo URL for Joka Beatz brand
const LOGO_URL = "https://joka-beatz.lovable.app/joka-beatz-logo.png";

// Generate image using Flux Kontext API (KIE) with logo reference
async function generateImage(
  prompt: string,
  apiKey: string,
  inputImageUrl?: string
): Promise<string | null> {
  try {
    console.log("Starting OG image generation with KIE Flux Kontext");
    
    const requestBody: Record<string, unknown> = {
      prompt,
      aspectRatio: "16:9",
      model: "flux-kontext-pro",
      enableTranslation: true,
      outputFormat: "jpeg",
    };

    // Add input image for editing/reference if provided
    if (inputImageUrl) {
      requestBody.inputImageUrl = inputImageUrl;
    }
    
    // Create task
    const createResponse = await fetch("https://api.kie.ai/api/v1/flux/kontext/generate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error("Flux create task failed:", createResponse.status, errorText);
      throw new Error(`KIE API error: ${createResponse.status}`);
    }

    const createResult = await createResponse.json();
    if (createResult.code !== 200) {
      console.error("Flux create error:", createResult.msg);
      throw new Error(createResult.msg || "Failed to create image task");
    }

    const taskId = createResult.data?.taskId;
    if (!taskId) {
      throw new Error("No taskId returned from KIE API");
    }

    console.log("OG image task created:", taskId);

    // Poll for completion (max 120 seconds)
    const maxWait = 120000;
    const pollInterval = 2000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const statusResponse = await fetch(
        `https://api.kie.ai/api/v1/flux/kontext/record-info?taskId=${taskId}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        }
      );

      if (!statusResponse.ok) {
        console.error("Status check failed:", statusResponse.status);
        continue;
      }

      const statusResult = await statusResponse.json();
      if (statusResult.code !== 200) {
        console.error("Status error:", statusResult.msg);
        continue;
      }

      const successFlag = statusResult.data?.successFlag;
      
      if (successFlag === 1) {
        // Success - get the image URL
        const imageUrl =
          statusResult.data?.response?.resultImageUrl ||
          statusResult.data?.response?.imageUrl ||
          statusResult.data?.response?.url;
        console.log("OG image generated successfully");
        return imageUrl || null;
      } else if (successFlag === 2 || successFlag === 3) {
        // Failed
        const errorMsg = statusResult.data?.errorMessage || "Image generation failed";
        console.error("Image generation failed:", errorMsg);
        throw new Error(errorMsg);
      }
      // successFlag === 0 means still processing, continue polling
    }

    throw new Error("Image generation timeout after 120 seconds");
  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
}

// Upload image URL to Supabase storage
async function uploadImageToStorage(
  imageUrl: string,
  supabase: any,
  filename: string
): Promise<string> {
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error("Failed to fetch generated image from KIE");
  }

  const imageBlob = await imageResponse.blob();
  const imageBytes = new Uint8Array(await imageBlob.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("og-images")
    .upload(filename, imageBytes, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from("og-images")
    .getPublicUrl(filename);

  console.log("OG image uploaded:", publicUrlData.publicUrl);
  return publicUrlData.publicUrl;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const KIE_API_KEY = Deno.env.get("KIE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!KIE_API_KEY) {
      throw new Error("KIE_API_KEY is not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { title, tagline, imagePrompt }: GenerateOGRequest = await req.json();

    if (!title) {
      return new Response(
        JSON.stringify({ error: "Title is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating OG image for:", title, tagline, imagePrompt ? "(custom prompt)" : "(default)");

    // Build the image generation prompt - use custom prompt if provided, otherwise default
    let prompt: string;
    
    if (imagePrompt && imagePrompt.trim()) {
      // Use custom image prompt with required elements
      prompt = `Create a stunning 16:9 social media Open Graph banner (1200x630px) for the Joka Beatz music producer brand.

LOGO PLACEMENT (CRITICAL):
- Place the provided Joka Beatz logo prominently at the TOP CENTER of the image
- Logo should be clearly visible, well-sized, and properly integrated

MAIN TEXT TO DISPLAY (BIG, BOLD):
"${title.toUpperCase()}"
${tagline ? `\nSUBTEXT: "${tagline}"` : ""}

CUSTOM VISUAL DIRECTION:
${imagePrompt}

REQUIRED COLOR PALETTE:
- Primary accent: Deep crimson red (#DC2626)
- Background: Rich black (#0A0A0A) to dark charcoal
- Text: Pure white (#FFFFFF) for contrast
- Secondary: Steel grey for depth

TYPOGRAPHY:
- Title text MUST be EXTREMELY LARGE and BOLD
- Heavy, modern sans-serif font style
- Text centered, ALL CAPS for impact
- Add glow/shadow effects

Ultra-high resolution, crisp details, professional color grading.`;
    } else {
      // Default prompt
      prompt = `Transform this logo into a stunning 16:9 social media Open Graph banner (1200x630px) for the Joka Beatz music producer brand.

LOGO PLACEMENT (CRITICAL):
- Place the provided Joka Beatz logo prominently at the TOP CENTER of the image
- Logo should be clearly visible, well-sized (not too small), and properly integrated
- Keep the logo intact and recognizable

MAIN TEXT TO DISPLAY (BIG, BOLD, BELOW LOGO):
"${title.toUpperCase()}"
${tagline ? `\nSUBTEXT: "${tagline}"` : ""}

STRICT COLOR PALETTE:
- Primary accent: Deep crimson red (#DC2626) for glows and highlights
- Background: Rich black (#0A0A0A) to dark charcoal (#1A1A1A) gradient
- Text: Pure white (#FFFFFF) for maximum contrast
- Secondary: Steel grey (#4A4A4A) for subtle depth

TYPOGRAPHY REQUIREMENTS:
- Title text MUST be EXTREMELY LARGE, BOLD, and PROMINENT
- Heavy, modern sans-serif font style (like Bebas Neue or Impact)
- Text perfectly centered below the logo
- Add red glow or shadow effects to make text pop
- ALL CAPS for maximum impact

VISUAL STYLE:
- Cinematic, high-end music industry aesthetic
- Dramatic volumetric lighting with red accent glows emanating from behind
- Abstract 3D elements in background: geometric shapes, audio waveforms, equalizer bars
- Sleek metallic and glossy textures reflecting red light
- Atmospheric fog/haze effects for depth
- Premium Netflix title card / major record label branding feel

COMPOSITION:
- Logo at top center (clearly visible)
- Main title text centered in middle-lower area
- Background elements complement but don't compete with logo and text
- Layered depth with foreground glow effects

Ultra-high resolution, crisp details, professional color grading. The logo and text must be the hero elements.`;
    }

    // Generate the image using KIE Flux Kontext with logo as reference
    const generatedImageUrl = await generateImage(prompt, KIE_API_KEY, LOGO_URL);
    
    if (!generatedImageUrl) {
      throw new Error("Failed to generate OG image");
    }

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const filename = `og-image-${timestamp}.jpg`;
    const publicUrl = await uploadImageToStorage(generatedImageUrl, supabase, filename);

    return new Response(
      JSON.stringify({ 
        success: true,
        url: publicUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating OG image:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const status = errorMessage.includes("timeout") ? 504 : 500;
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
