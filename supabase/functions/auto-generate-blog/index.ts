import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BlogSettings {
  id: string;
  auto_generate_enabled: boolean;
  generation_frequency: string;
  content_topics: Record<string, number>;
  default_author: string;
  last_generated_at: string | null;
}

function shouldGenerate(lastGenerated: string | null, frequency: string): boolean {
  if (!lastGenerated) return true;
  const now = Date.now();
  const last = new Date(lastGenerated).getTime();
  const hoursSince = (now - last) / (1000 * 60 * 60);
  switch (frequency) {
    case "daily": return hoursSince >= 24;
    case "twice-weekly": return hoursSince >= 84;
    case "weekly": return hoursSince >= 168;
    default: return hoursSince >= 24;
  }
}

function selectCategory(weights: Record<string, number>): string {
  const entries = Object.entries(weights);
  if (entries.length === 0) return "music-business";
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  const random = Math.random() * total;
  let cumulative = 0;
  for (const [category, weight] of entries) {
    cumulative += weight;
    if (random <= cumulative) return category;
  }
  return entries[0][0];
}

// Use Firecrawl to discover what's trending right now for the given category
async function findTrendingTopic(
  category: string,
  firecrawlKey: string
): Promise<string | null> {
  const currentDate = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const queryMap: Record<string, string> = {
    "music-business": `music business news ${currentDate} independent artists streaming revenue`,
    "industry-news": `music industry breaking news ${currentDate} artists labels`,
    "ai-music": `AI music production tools new releases ${currentDate}`,
  };

  const query = queryMap[category] || `music industry news ${currentDate}`;

  try {
    console.log("Firecrawl: searching trending topics for:", query);
    const response = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        limit: 5,
        tbs: "qdr:w", // Last week — freshest results
      }),
    });

    if (!response.ok) {
      console.error("Firecrawl trending search failed:", response.status);
      return null;
    }

    const data = await response.json();
    if (!data.success || !data.data?.length) {
      console.log("No trending topics found via Firecrawl");
      return null;
    }

    // Build a topic seed from the top results' titles
    const topTitles = data.data
      .slice(0, 3)
      .map((r: any) => r.title || r.description || "")
      .filter(Boolean)
      .join(" | ");

    console.log("Trending topic seed:", topTitles);
    return topTitles || null;
  } catch (err) {
    console.error("Firecrawl topic search error:", err);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

    // 1. Fetch blog settings
    const { data: settings, error: settingsError } = await supabase
      .from("blog_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (settingsError) {
      console.error("Error fetching blog settings:", settingsError);
      throw new Error("Failed to fetch blog settings");
    }

    if (!settings) {
      console.log("No blog settings found");
      return new Response(
        JSON.stringify({ message: "No blog settings configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const blogSettings = settings as BlogSettings;

    // 2. Check if auto-generation is enabled
    if (!blogSettings.auto_generate_enabled) {
      console.log("Auto-generation is disabled");
      return new Response(
        JSON.stringify({ message: "Auto-generation is disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Check frequency
    if (!shouldGenerate(blogSettings.last_generated_at, blogSettings.generation_frequency || "daily")) {
      console.log("Not time to generate yet based on frequency settings");
      return new Response(
        JSON.stringify({
          message: "Not time to generate yet",
          lastGenerated: blogSettings.last_generated_at,
          frequency: blogSettings.generation_frequency,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Select category based on weights
    const contentTopics = (blogSettings.content_topics as Record<string, number>) || {
      "music-business": 40,
      "industry-news": 30,
      "ai-music": 30,
    };
    const selectedCategory = selectCategory(contentTopics);
    console.log("Selected category:", selectedCategory);

    // 5. Use Firecrawl to find a trending topic for richer, more current content
    let customTopic: string | undefined;
    if (FIRECRAWL_API_KEY) {
      const trendingTopic = await findTrendingTopic(selectedCategory, FIRECRAWL_API_KEY);
      if (trendingTopic) {
        customTopic = trendingTopic;
        console.log("Using trending topic from Firecrawl:", customTopic);
      }
    } else {
      console.warn("FIRECRAWL_API_KEY not set — skipping trending topic search");
    }

    // 6. Call the generate-blog-post function with optional trending topic
    const generateResponse = await fetch(
      `${supabaseUrl}/functions/v1/generate-blog-post`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          category: selectedCategory,
          ...(customTopic ? { customTopic } : {}),
        }),
      }
    );

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.error("Generate blog post failed:", generateResponse.status, errorText);
      throw new Error(`Failed to generate blog post: ${generateResponse.status}`);
    }

    const generatedPost = await generateResponse.json();
    console.log("Generated post:", generatedPost.title);

    // 7. Save as published post
    const slug = generatedPost.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 100);

    const { data: newPost, error: insertError } = await supabase
      .from("blog_posts")
      .insert({
        title: generatedPost.title,
        slug,
        content: generatedPost.content,
        excerpt: generatedPost.excerpt,
        category: selectedCategory,
        tags: generatedPost.tags || [],
        featured_image: generatedPost.featuredImage,
        og_image: generatedPost.ogImage,
        seo_title: generatedPost.seoTitle,
        seo_description: generatedPost.seoDescription,
        read_time: generatedPost.readTime || 5,
        author: blogSettings.default_author || "Joka Beatz",
        status: "published",
        published_at: new Date().toISOString(),
        is_ai_generated: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting blog post:", insertError);
      throw new Error("Failed to save blog post");
    }

    console.log("Created post:", newPost.id);

    // 8. Update last_generated_at
    const { error: updateError } = await supabase
      .from("blog_settings")
      .update({ last_generated_at: new Date().toISOString() })
      .eq("id", blogSettings.id);

    if (updateError) {
      console.error("Error updating last_generated_at:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Blog post generated and published",
        trendingTopicUsed: customTopic || null,
        post: {
          id: newPost.id,
          title: newPost.title,
          slug: newPost.slug,
          category: selectedCategory,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in auto-generate-blog:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
