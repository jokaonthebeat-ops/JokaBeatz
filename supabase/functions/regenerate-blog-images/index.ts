import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate image using Flux Kontext API (primary)
async function generateBlogImage(
  prompt: string,
  apiKey: string
): Promise<string | null> {
  try {
    console.log("Starting KIE image generation with prompt:", prompt.substring(0, 100));

    const createResponse = await fetch("https://api.kie.ai/api/v1/flux/kontext/generate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        aspectRatio: "16:9",
        model: "flux-kontext-pro",
        enableTranslation: true,
        outputFormat: "jpeg",
      }),
    });

    if (!createResponse.ok) {
      console.error("Flux create task failed:", createResponse.status);
      return null;
    }

    const createResult = await createResponse.json();
    if (createResult.code !== 200) {
      console.error("Flux create error:", createResult.msg);
      return null;
    }

    const taskId = createResult.data?.taskId;
    if (!taskId) {
      console.error("No taskId returned");
      return null;
    }

    const maxWait = 120000;
    const pollInterval = 2000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const statusResponse = await fetch(
        `https://api.kie.ai/api/v1/flux/kontext/record-info?taskId=${taskId}`,
        { headers: { Authorization: `Bearer ${apiKey}` } }
      );

      if (!statusResponse.ok) continue;

      const statusResult = await statusResponse.json();
      if (statusResult.code !== 200) continue;

      const successFlag = statusResult.data?.successFlag;

      if (successFlag === 1) {
        const imageUrl =
          statusResult.data?.response?.resultImageUrl ||
          statusResult.data?.response?.imageUrl ||
          statusResult.data?.response?.url;
        console.log("Image generated successfully:", imageUrl);
        return imageUrl || null;
      } else if (successFlag === 2 || successFlag === 3) {
        console.error("Image generation failed:", statusResult.data?.errorMessage);
        return null;
      }
    }

    console.error("Image generation timeout");
    return null;
  } catch (error) {
    console.error("Image generation error:", error);
    return null;
  }
}

// Fallback: Generate image using Lovable AI
async function generateImageWithLovableAI(
  prompt: string,
  lovableApiKey: string
): Promise<string | null> {
  try {
    console.log("Using Lovable AI fallback for image generation...");
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      console.error("Lovable AI image generation failed:", response.status);
      return null;
    }

    const data = await response.json();
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageData) {
      console.error("No image returned from Lovable AI");
      return null;
    }

    console.log("Lovable AI image generated successfully");
    return imageData;
  } catch (error) {
    console.error("Lovable AI image error:", error);
    return null;
  }
}

// Smart generation with fallback
async function generateImageWithFallback(
  prompt: string,
  kieApiKey: string | undefined,
  lovableApiKey: string | undefined
): Promise<string | null> {
  if (kieApiKey) {
    const result = await generateBlogImage(prompt, kieApiKey);
    if (result) return result;
  }
  if (lovableApiKey) {
    console.log("KIE failed, trying Lovable AI fallback...");
    return await generateImageWithLovableAI(prompt, lovableApiKey);
  }
  console.error("No image generation API available");
  return null;
}

// Upload image (URL or base64) to storage
async function uploadImageToStorage(
  imageUrlOrData: string,
  supabase: any,
  slug: string
): Promise<string | null> {
  try {
    let imageBytes: Uint8Array;
    let contentType = "image/jpeg";
    let ext = "jpg";

    if (imageUrlOrData.startsWith("data:")) {
      const matches = imageUrlOrData.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) return null;
      contentType = matches[1];
      ext = contentType.includes("png") ? "png" : "jpg";
      const binaryStr = atob(matches[2]);
      imageBytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        imageBytes[i] = binaryStr.charCodeAt(i);
      }
    } else {
      const imageResponse = await fetch(imageUrlOrData);
      if (!imageResponse.ok) return null;
      const imageBlob = await imageResponse.blob();
      imageBytes = new Uint8Array(await imageBlob.arrayBuffer());
    }

    const fileName = `${slug}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("blog-images")
      .upload(fileName, imageBytes, { contentType, upsert: false });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("blog-images")
      .getPublicUrl(fileName);

    console.log("Image uploaded:", urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error("Upload error:", error);
    return null;
  }
}

// Upload OG image
async function uploadOgImageToStorage(
  imageUrlOrData: string,
  supabase: any,
  slug: string
): Promise<string | null> {
  try {
    let imageBytes: Uint8Array;
    let contentType = "image/jpeg";
    let ext = "jpg";

    if (imageUrlOrData.startsWith("data:")) {
      const matches = imageUrlOrData.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) return null;
      contentType = matches[1];
      ext = contentType.includes("png") ? "png" : "jpg";
      const binaryStr = atob(matches[2]);
      imageBytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        imageBytes[i] = binaryStr.charCodeAt(i);
      }
    } else {
      const imageResponse = await fetch(imageUrlOrData);
      if (!imageResponse.ok) return null;
      const imageBlob = await imageResponse.blob();
      imageBytes = new Uint8Array(await imageBlob.arrayBuffer());
    }

    const fileName = `og-${slug}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("og-images")
      .upload(fileName, imageBytes, { contentType, upsert: false });

    if (uploadError) {
      console.error("OG image upload error:", uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("og-images")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error("OG image upload error:", error);
    return null;
  }
}

function injectInlineImagesIntoHtml(html: string, imageUrls: string[]): string {
  if (!html || imageUrls.length === 0) return html;

  let out = html;
  let searchFrom = 0;

  for (const url of imageUrls) {
    const lower = out.toLowerCase();
    const h2Start = lower.indexOf("<h2", searchFrom);
    if (h2Start === -1) break;
    const h2End = lower.indexOf("</h2>", h2Start);
    if (h2End === -1) break;

    const insertAt = h2End + "</h2>".length;
    const imgHtml = `\n<div style="margin: 1.25rem 0;">\n  <img src="${url}" alt="Article illustration" loading="lazy" style="width: 100%; height: auto; border-radius: 12px;" />\n</div>\n`;
    out = out.slice(0, insertAt) + imgHtml + out.slice(insertAt);
    searchFrom = insertAt + imgHtml.length;
  }

  return out;
}

function removeInlineImages(html: string): string {
  return html.replace(/<div style="margin: 1\.25rem 0;">\s*<img[^>]*alt="Article illustration"[^>]*\/>\s*<\/div>/gi, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { postId, title, content, generateInline = true, generateOg = true } = await req.json();

    if (!postId || !title) {
      throw new Error("postId and title are required");
    }

    const KIE_API_KEY = Deno.env.get("KIE_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!KIE_API_KEY && !LOVABLE_API_KEY) {
      throw new Error("No image generation API key configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const baseSlug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 50);

    const normalizePrompt = (p: string) =>
      `${p}. Ultra high resolution, professional photography, cinematic lighting, 8K quality, no text or watermarks.`;

    // Generate featured image
    const featuredPrompt = `A professional editorial photo for an article titled "${title}". Show a music producer or artist in a modern recording studio with LED accent lighting, working on their craft. Photorealistic, cinematic lighting, high detail, dramatic lighting.`;
    console.log("Generating featured image for:", title);
    
    let generatedData = await generateImageWithFallback(
      normalizePrompt(featuredPrompt),
      KIE_API_KEY,
      LOVABLE_API_KEY
    );

    let featuredImageUrl: string | null = null;
    if (generatedData) {
      featuredImageUrl = await uploadImageToStorage(generatedData, supabase, baseSlug);
    }

    // Generate OG image
    let ogImageUrl: string | null = null;
    if (generateOg) {
      const ogPrompt = `A professional Open Graph social preview image. Dark gradient background from black (#0A0A0A) to charcoal gray. Bold white headline text in the center. Red (#DC2626) accent bar at the bottom with "Read on JokaBeatz.com" call-to-action. Subtle music waveform pattern in background. Clean, modern, high contrast design for social feeds. 1200x630 aspect ratio. No photographs - pure graphic design with bold typography. Music production theme.`;
      
      console.log("Generating OG image for social sharing...");
      const ogData = await generateImageWithFallback(ogPrompt, KIE_API_KEY, LOVABLE_API_KEY);

      if (ogData) {
        ogImageUrl = await uploadOgImageToStorage(ogData, supabase, baseSlug);
      }
    }

    // Generate inline images - max 1 inline image to save credits
    const inlineImageUrls: string[] = [];
    let updatedContent = content || "";

    if (generateInline && content) {
      updatedContent = removeInlineImages(content);

      // Single inline image prompt (reduced from 2 to save API credits)
      const inlinePrompt = `A close-up shot of a music producer's hands on a mixing console, with colorful LED lights reflecting off the equipment. Studio environment with professional monitors in the background. Cinematic, photorealistic.`;

      const imgData = await generateImageWithFallback(normalizePrompt(inlinePrompt), KIE_API_KEY, LOVABLE_API_KEY);
      if (imgData) {
        const storedUrl = await uploadImageToStorage(imgData, supabase, `${baseSlug}-inline`);
        if (storedUrl) inlineImageUrls.push(storedUrl);
      }

      if (inlineImageUrls.length > 0) {
        updatedContent = injectInlineImagesIntoHtml(updatedContent, inlineImageUrls);
      }
    }

    // Update the blog post
    const updateData: Record<string, any> = {};
    if (featuredImageUrl) updateData.featured_image = featuredImageUrl;
    if (ogImageUrl) updateData.og_image = ogImageUrl;
    if (inlineImageUrls.length > 0 && updatedContent) updateData.content = updatedContent;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from("blog_posts")
        .update(updateData)
        .eq("id", postId);

      if (updateError) {
        console.error("Failed to update post:", updateError);
        throw new Error("Failed to update post with new images");
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        featuredImage: featuredImageUrl,
        ogImage: ogImageUrl,
        inlineImages: inlineImageUrls,
        content: updatedContent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error regenerating blog images:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
