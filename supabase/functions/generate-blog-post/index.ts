import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const categorySearchQueries: Record<string, string[]> = {
  "music-business": [
    "music industry news 2026 artists producers",
    "beat licensing streaming revenue indie artists 2026",
    "music business tips independent artists 2026",
  ],
  "industry-news": [
    "music industry news trends February 2026",
    "streaming platforms music artists 2026 news",
    "record labels music tech industry 2026",
  ],
  "ai-music": [
    "AI music production tools 2026 new releases",
    "artificial intelligence music industry 2026",
    "AI beat making mixing mastering tools 2026",
  ],
};

const categoryPrompts: Record<string, string> = {
  "music-business": `Write about making money in music. Topics can include: monetization strategies, beat licensing, sync placements, building a fanbase, social media marketing, streaming revenue, email lists, merchandise, live performances, collaborations, or music business tips.`,
  "industry-news": `Write about current music industry news and trends. Topics can include: streaming platform updates, artist success stories, industry shifts, new technologies, legal changes, copyright updates, label news, or emerging markets.`,
  "ai-music": `Write about AI in music production. Topics can include: AI tools for producers, AI mixing and mastering, AI composition tools, AI-generated vocals, ethical considerations, how AI is changing music, AI plugins, or the future of AI in music.`,
};

// Search for real current news via Firecrawl
async function searchCurrentNews(
  category: string,
  firecrawlKey: string
): Promise<string> {
  const queries = categorySearchQueries[category] || categorySearchQueries["music-business"];
  const query = queries[Math.floor(Math.random() * queries.length)];

  try {
    console.log("Searching Firecrawl for:", query);
    const response = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        limit: 5,
        tbs: "qdr:m",
        scrapeOptions: { formats: ["markdown"] },
      }),
    });

    if (!response.ok) {
      console.error("Firecrawl search failed:", response.status);
      return "";
    }

    const data = await response.json();
    if (!data.success || !data.data?.length) {
      console.log("No search results from Firecrawl");
      return "";
    }

    const snippets = data.data
      .slice(0, 5)
      .map((r: any) => {
        const title = r.title || r.url;
        const content = (r.markdown || r.description || "").substring(0, 400);
        return `- **${title}**: ${content}`;
      })
      .join("\n\n");

    console.log(`Got ${data.data.length} Firecrawl results for: ${query}`);
    return snippets;
  } catch (err) {
    console.error("Firecrawl search error:", err);
    return "";
  }
}

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

    console.log("Image task created:", taskId);

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

// Fallback: Generate image using Lovable AI (Gemini image model)
async function generateImageWithLovableAI(
  prompt: string,
  lovableApiKey: string
): Promise<string | null> {
  try {
    console.log("Falling back to Lovable AI for image generation...");
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
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

    console.log("Lovable AI image generated successfully (base64)");
    return imageData; // Returns data:image/png;base64,... 
  } catch (error) {
    console.error("Lovable AI image error:", error);
    return null;
  }
}

// Upload image (URL or base64 data URI) to Supabase storage
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
      // Base64 data URI from Lovable AI
      const matches = imageUrlOrData.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        console.error("Invalid base64 data URI");
        return null;
      }
      contentType = matches[1];
      ext = contentType.includes("png") ? "png" : "jpg";
      const binaryStr = atob(matches[2]);
      imageBytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        imageBytes[i] = binaryStr.charCodeAt(i);
      }
    } else {
      // URL from KIE API
      const imageResponse = await fetch(imageUrlOrData);
      if (!imageResponse.ok) {
        console.error("Failed to fetch generated image");
        return null;
      }
      const imageBlob = await imageResponse.blob();
      imageBytes = new Uint8Array(await imageBlob.arrayBuffer());
    }

    const fileName = `${slug}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("blog-images")
      .upload(fileName, imageBytes, {
        contentType,
        upsert: false,
      });

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

// Upload OG image to og-images bucket
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
      .upload(fileName, imageBytes, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error("OG image upload error:", uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("og-images")
      .getPublicUrl(fileName);

    console.log("OG image uploaded:", urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error("OG image upload error:", error);
    return null;
  }
}

// Smart image generation with KIE primary + Lovable AI fallback
async function generateImageWithFallback(
  prompt: string,
  kieApiKey: string,
  lovableApiKey: string | undefined
): Promise<string | null> {
  // Try KIE API first
  const kieResult = await generateBlogImage(prompt, kieApiKey);
  if (kieResult) return kieResult;

  // Fallback to Lovable AI
  if (lovableApiKey) {
    console.log("KIE API failed, trying Lovable AI fallback...");
    return await generateImageWithLovableAI(prompt, lovableApiKey);
  }

  console.error("Both KIE and Lovable AI unavailable for image generation");
  return null;
}

// Allowed outbound domains
const ALLOWED_LINK_DOMAINS = [
  "spotify.com", "artists.spotify.com", "music.apple.com", "soundcloud.com",
  "distrokid.com", "tunecore.com", "cdbaby.com", "billboard.com",
  "rollingstone.com", "pitchfork.com", "musicweek.com", "hypebot.com",
  "musicbusinessworldwide.com", "ascap.com", "bmi.com", "soundexchange.com",
  "youtube.com", "instagram.com", "tiktok.com",
];

function sanitizeOutboundLinks(html: string): string {
  if (!html) return html;

  return html.replace(/<a\s([^>]*)>/gi, (match, attrs) => {
    const hrefMatch = attrs.match(/href=["']([^"']*)["']/i);
    if (!hrefMatch) return match;

    const href = hrefMatch[1];

    if (href.startsWith("/") || href.startsWith("#")) {
      return `<a ${attrs}>`;
    }

    try {
      const url = new URL(href);
      const hostname = url.hostname.replace(/^www\./, "");
      const isAllowed = ALLOWED_LINK_DOMAINS.some(
        (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
      );

      if (!isAllowed) {
        console.log(`Stripping disallowed outbound link: ${href}`);
        return `<span>`;
      }

      const cleanAttrs = attrs
        .replace(/\s*target=["'][^"']*["']/gi, "")
        .replace(/\s*rel=["'][^"']*["']/gi, "")
        .trim();
      return `<a ${cleanAttrs} target="_blank" rel="noopener noreferrer">`;
    } catch {
      return `<span>`;
    }
  }).replace(/<\/a>/gi, (match) => {
    return `</a>`;
  });
}

function injectInlineImagesIntoHtml(
  html: string,
  imageUrls: string[]
): string {
  if (!html || imageUrls.length === 0) return html;

  let out = html;
  let searchFrom = 0;
  let h2Count = 0;

  for (const url of imageUrls) {
    while (true) {
      const lower = out.toLowerCase();
      const h2Start = lower.indexOf("<h2", searchFrom);
      if (h2Start === -1) return out;

      const h2End = lower.indexOf("</h2>", h2Start);
      if (h2End === -1) return out;

      h2Count++;
      const insertAt = h2End + "</h2>".length;

      if (h2Count <= 2) {
        searchFrom = insertAt;
        continue;
      }

      const imgHtml = `\n<div style="margin: 1.25rem 0;">\n  <img src="${url}" alt="Article illustration" loading="lazy" style="width: 100%; height: auto; border-radius: 12px;" />\n</div>\n`;
      out = out.slice(0, insertAt) + imgHtml + out.slice(insertAt);
      searchFrom = insertAt + imgHtml.length;
      break;
    }
  }

  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category = "music-business", customTopic } = await req.json();
    const KIE_API_KEY = Deno.env.get("KIE_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!KIE_API_KEY && !LOVABLE_API_KEY) {
      throw new Error("No image generation API key configured (KIE_API_KEY or LOVABLE_API_KEY)");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const currentYear = new Date().getFullYear();
    const currentDate = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

    let realTimeNewsContext = "";
    if (FIRECRAWL_API_KEY) {
      realTimeNewsContext = await searchCurrentNews(category, FIRECRAWL_API_KEY);
    } else {
      console.warn("FIRECRAWL_API_KEY not set — skipping real-time search");
    }

    const categoryContext = categoryPrompts[category] || categoryPrompts["music-business"];
    const topicInstruction = customTopic 
      ? `Focus specifically on this topic: ${customTopic}`
      : `Pick a specific, actionable topic that would be valuable for independent artists and producers in ${currentYear}. Focus on current trends and news from ${currentYear} — do NOT reference ${currentYear - 1} or earlier years as "current" or "recent".`;

    const systemPrompt = `You are a music industry expert and content writer for Joka Beatz, a professional beat producer's website. Write engaging, practical blog content for artists and producers.

IMPORTANT: Today's date is ${currentDate}. The current year is ${currentYear}. All content must reflect ${currentYear} reality. Do NOT reference ${currentYear - 1} or earlier as "recent", "new", or "current". Use ${currentYear} throughout the article when referencing timeframes.

ORIGINALITY RULES (strictly enforced):
- Write 100% original content in your own words — do NOT copy, paraphrase, or reproduce sentences from any external source
- Use real-world news and events only as inspiration for topics, not as text to replicate
- Write as Joka Beatz's own voice and expertise — all opinions, tips, and advice must be original

LINKING RULES:
- You MAY include outbound links to trusted, authoritative music industry sources ONLY
- ALLOWED domains: spotify.com, artists.spotify.com, music.apple.com, soundcloud.com, distrokid.com, tunecore.com, cdbaby.com, billboard.com, rollingstone.com, pitchfork.com, musicweek.com, hypebot.com, musicbusinessworldwide.com, ascap.com, bmi.com, soundexchange.com, youtube.com, instagram.com, tiktok.com
- FORBIDDEN: Do NOT link to any beat stores, producer websites, or competitors (e.g. beatstars.com competitors, other beat selling platforms)
- FORBIDDEN: Do NOT link to low-quality, unknown, or unverified sites
- All links MUST use: <a href="URL" target="_blank" rel="noopener noreferrer">anchor text</a>
- Keep links natural and contextual — max 3-5 outbound links per article
- Link anchor text should be descriptive, NOT "click here" or "read more"

Style guidelines:
- Write in a friendly, conversational but authoritative tone
- Include specific, actionable advice
- Use examples and real-world scenarios
- Break content into scannable sections with H2 and H3 headings
- Include bullet points for lists
- Keep paragraphs short (2-3 sentences)
- Total length: 800-1200 words
- Format as clean HTML (no \`\`\`html markers)`;

    const realTimeSection = realTimeNewsContext
      ? `\n\nCURRENT EVENTS CONTEXT (for topic inspiration only — do NOT copy this text):\nThe following headlines and snippets from today's web show what is happening in the music industry right now in ${currentYear}. Use them ONLY as inspiration for your topic and to ensure the article feels current. Do NOT reproduce, quote, or paraphrase any of this text — write everything in your own original words:\n\n${realTimeNewsContext}\n\nRemember: zero external links or source attributions in the article.`
      : "";

    const userPrompt = `${categoryContext}

${topicInstruction}${realTimeSection}

Generate a complete blog post for ${currentDate} with:
1. An engaging, SEO-friendly title (not in the HTML content) — do NOT include a year in the title unless it's ${currentYear}
2. A 2-sentence excerpt/summary
3. The full article content in HTML format — all year references must be ${currentYear}
4. 3-5 relevant tags
5. An SEO meta description (under 160 characters)
6. Estimated read time in minutes
7. A detailed image prompt (2-3 sentences) for the featured image. The image should:
   - Feature REAL PEOPLE (artists, producers, musicians, engineers, fans) in realistic settings
   - Show specific PLACES (recording studios, concert venues, home studios, streaming setups)
   - Include relevant EQUIPMENT (mixing consoles, microphones, headphones, instruments, laptops)
   - Depict ACTION (creating, performing, collaborating, celebrating success)
   - Use CINEMATIC LIGHTING (studio lights, neon accents, dramatic shadows)
   - Be PHOTOREALISTIC and professional quality, like an editorial magazine photo
   - NO text, logos, or watermarks
8. OPTIONAL: 1-2 additional image prompts for inline images (same style - real people, places, action)

Respond in this exact JSON format:
{
  "title": "Your Title Here",
  "excerpt": "Brief 2-sentence summary...",
  "content": "<h2>First Section</h2><p>Content here...</p>...",
  "tags": ["tag1", "tag2", "tag3"],
  "seoTitle": "SEO optimized title | Joka Beatz",
  "seoDescription": "Meta description under 160 chars...",
  "readTime": 5,
  "imagePrompt": "A professional photo of [specific person] in [specific setting] doing [specific action]. Cinematic lighting, high detail, photorealistic.",
  "inlineImagePrompts": ["A music producer at a mixing console in a dimly lit studio...", "An artist celebrating in a recording booth..."]
}`;

    // Use kie.ai API with Gemini 2.5 Flash for text
    const response = await fetch("https://api.kie.ai/gemini-2.5-flash/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KIE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("KIE API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402 || response.status === 401) {
        return new Response(
          JSON.stringify({ error: "API authentication failed. Please check your KIE API key." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`KIE API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content returned from AI");
    }

    // Parse the JSON response
    let parsedContent;
    try {
      let cleanedContent = content.trim();
      cleanedContent = cleanedContent.replace(/^```(?:json)?\s*\n?/i, "");
      cleanedContent = cleanedContent.replace(/\n?```\s*$/i, "");
      cleanedContent = cleanedContent.trim();
      
      if (cleanedContent.startsWith("```")) {
        const jsonStart = cleanedContent.indexOf("{");
        const jsonEnd = cleanedContent.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          cleanedContent = cleanedContent.substring(jsonStart, jsonEnd + 1);
        }
      }
      
      parsedContent = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content.substring(0, 500));
      throw new Error("Failed to parse AI response as JSON");
    }

    // Generate slug for image filename
    const baseSlug = parsedContent.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 50);

    // Generate featured + OG + optional inline images with fallback
    let featuredImageUrl: string | null = null;
    let ogImageUrl: string | null = null;
    const inlineImageUrls: string[] = [];

    const normalizePrompt = (p: string) =>
      `${p}. Ultra high resolution, professional photography, cinematic lighting, 8K quality, no text or watermarks.`;

    // Generate featured image (16:9 for blog display)
    if (parsedContent.imagePrompt) {
      const generatedImageData = await generateImageWithFallback(
        normalizePrompt(parsedContent.imagePrompt),
        KIE_API_KEY || "",
        LOVABLE_API_KEY
      );

      if (generatedImageData) {
        featuredImageUrl = await uploadImageToStorage(
          generatedImageData,
          supabase,
          baseSlug
        );
      }
    }

    // If featured image still null, generate a generic one with Lovable AI as last resort
    if (!featuredImageUrl && LOVABLE_API_KEY) {
      console.log("Generating last-resort featured image with Lovable AI...");
      const lastResortPrompt = `A professional editorial photo for a music blog article titled "${parsedContent.title}". Show a music producer or artist in a modern recording studio with LED accent lighting. Photorealistic, cinematic lighting, high detail, 16:9 aspect ratio. No text or watermarks.`;
      const fallbackData = await generateImageWithLovableAI(lastResortPrompt, LOVABLE_API_KEY);
      if (fallbackData) {
        featuredImageUrl = await uploadImageToStorage(fallbackData, supabase, baseSlug);
      }
    }

    // Generate dedicated OG image
    const ogPrompt = `A professional Open Graph social preview image. Dark gradient background from black (#0A0A0A) to charcoal gray. Bold white headline text in the center. Red (#DC2626) accent bar at the bottom with "Read on JokaBeatz.com" call-to-action. Subtle music waveform pattern in background. Clean, modern, high contrast design for social feeds. 1200x630 aspect ratio. No photographs - pure graphic design with bold typography. Music production theme.`;
    
    console.log("Generating OG image for social sharing...");
    const generatedOgData = await generateImageWithFallback(
      ogPrompt,
      KIE_API_KEY || "",
      LOVABLE_API_KEY
    );

    if (generatedOgData) {
      ogImageUrl = await uploadOgImageToStorage(
        generatedOgData,
        supabase,
        baseSlug
      );
    }

    if (Array.isArray(parsedContent.inlineImagePrompts)) {
      const prompts = parsedContent.inlineImagePrompts
        .filter((p: unknown) => typeof p === "string" && p.trim().length > 0)
        .slice(0, 1) as string[];

      for (const p of prompts) {
        const generatedData = await generateImageWithFallback(
          normalizePrompt(p),
          KIE_API_KEY || "",
          LOVABLE_API_KEY
        );
        if (!generatedData) continue;
        const storedUrl = await uploadImageToStorage(generatedData, supabase, baseSlug);
        if (storedUrl) inlineImageUrls.push(storedUrl);
      }
    }

    const contentWithImages =
      inlineImageUrls.length > 0
        ? injectInlineImagesIntoHtml(parsedContent.content, inlineImageUrls)
        : parsedContent.content;

    const finalContent = sanitizeOutboundLinks(contentWithImages);

    return new Response(
      JSON.stringify({
        ...parsedContent,
        category,
        featuredImage: featuredImageUrl,
        ogImage: ogImageUrl,
        inlineImages: inlineImageUrls,
        content: finalContent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating blog post:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
