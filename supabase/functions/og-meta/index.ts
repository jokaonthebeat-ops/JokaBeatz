import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://joka-beatz.lovable.app";
const DEFAULT_OG_IMAGE = `${SITE_URL}/joka-beatz-logo.png`;
const DEFAULT_TITLE = "Joka Beatz | Professional Music Producer";
const DEFAULT_DESCRIPTION = "Premium beats, drum kits, and music production resources for artists and producers.";

// Detect social media crawlers that need OG meta tags
function isSocialCrawler(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  const crawlers = [
    "facebookexternalhit",
    "twitterbot",
    "linkedinbot",
    "whatsapp",
    "slackbot",
    "discordbot",
    "telegrambot",
    "pinterest",
    "googlebot",
    "bingbot",
    "applebot",
    "embedly",
    "quora link preview",
    "showyoubot",
    "outbrain",
    "rogerbot",
    "vkshare",
  ];
  return crawlers.some((crawler) => ua.includes(crawler));
}

interface OGData {
  title: string;
  description: string;
  image: string;
  imageWidth?: number;
  imageHeight?: number;
  url: string;
  type: string;
}

// Trim title to optimal social media length (50-60 chars)
function trimTitle(title: string, maxLength = 60): string {
  if (title.length <= maxLength) return title;
  const trimmed = title.substring(0, maxLength - 3);
  const lastSpace = trimmed.lastIndexOf(" ");
  if (lastSpace > maxLength * 0.6) {
    return trimmed.substring(0, lastSpace).trim() + "...";
  }
  return trimmed.trim() + "...";
}

// Escape HTML entities to prevent XSS
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get("path") || "/";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let ogData: OGData = {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      image: DEFAULT_OG_IMAGE,
      url: `${SITE_URL}${path}`,
      type: "website",
    };

    // Handle blog posts: /blog/{slug}
    if (path.startsWith("/blog/")) {
      const slug = path.replace("/blog/", "").split("/")[0];

      const { data: post } = await supabase
        .from("blog_posts")
        .select("title, excerpt, seo_title, seo_description, featured_image, og_image, slug")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (post) {
        const fullTitle = post.seo_title || post.title;
        const trimmedTitle = trimTitle(fullTitle);
        const rawImage = post.featured_image || post.og_image || DEFAULT_OG_IMAGE;
        const hasOgImage = !!(post.featured_image || post.og_image);
        // Cache-bust to force social platforms to re-fetch the image
        const ogImage = hasOgImage ? `${rawImage}?v=${Date.now()}` : rawImage;

        ogData = {
          title: trimmedTitle,
          description: post.seo_description || post.excerpt || DEFAULT_DESCRIPTION,
          image: ogImage,
          imageWidth: hasOgImage ? 1200 : undefined,
          imageHeight: hasOgImage ? 630 : undefined,
          url: `${SITE_URL}/blog/${post.slug}`,
          type: "article",
        };
      }
    }
    // Handle products: /shop/{slug}
    else if (path.startsWith("/shop/")) {
      const slug = path.replace("/shop/", "").split("/")[0];

      let { data: product } = await supabase
        .from("products")
        .select("name, description, image_url, slug, price, category")
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle();

      // Fallback to ID if slug not found (backward compatibility)
      if (!product) {
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidPattern.test(slug)) {
          const result = await supabase
            .from("products")
            .select("name, description, image_url, slug, price, category")
            .eq("id", slug)
            .eq("active", true)
            .maybeSingle();
          product = result.data;
        }
      }

      if (product) {
        const productPath = product.slug ? `/shop/${product.slug}` : `/shop/${slug}`;
        const productTitle = `${product.name} | Joka Beatz`;
        ogData = {
          title: trimTitle(productTitle),
          description: product.description || `Get ${product.name} - ${product.category} from Joka Beatz. $${product.price}`,
          image: product.image_url || DEFAULT_OG_IMAGE,
          url: `${SITE_URL}${productPath}`,
          type: "product",
        };
      }
    }
    // Handle static pages - check page_seo_settings
    else {
      const { data: pageSeo } = await supabase
        .from("page_seo_settings")
        .select("seo_title, seo_description, og_image")
        .eq("path", path)
        .maybeSingle();

      if (pageSeo) {
        const pageTitle = pageSeo.seo_title || DEFAULT_TITLE;
        // Add cache-busting timestamp to force platforms to fetch fresh images
        const ogImageWithCacheBust = pageSeo.og_image 
          ? `${pageSeo.og_image}?v=${Date.now()}`
          : DEFAULT_OG_IMAGE;
        ogData = {
          title: trimTitle(pageTitle),
          description: pageSeo.seo_description || DEFAULT_DESCRIPTION,
          image: ogImageWithCacheBust,
          url: `${SITE_URL}${path}`,
          type: "website",
        };
      }
    }

    // Check if this is a social media crawler
    const userAgent = req.headers.get("user-agent");

    // For human visitors, immediately redirect with HTTP 302
    if (!isSocialCrawler(userAgent)) {
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          "Location": ogData.url,
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    // Build image dimension meta tags if available
    const imageDimensionTags =
      ogData.imageWidth && ogData.imageHeight
        ? `<meta property="og:image:width" content="${ogData.imageWidth}">
  <meta property="og:image:height" content="${ogData.imageHeight}">`
        : "";

    // Generate HTML with OG meta tags for crawlers only
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(ogData.title)}</title>
  <meta name="description" content="${escapeHtml(ogData.description)}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${ogData.type}">
  <meta property="og:url" content="${escapeHtml(ogData.url)}">
  <meta property="og:title" content="${escapeHtml(ogData.title)}">
  <meta property="og:description" content="${escapeHtml(ogData.description)}">
  <meta property="og:image" content="${escapeHtml(ogData.image)}">
  ${imageDimensionTags}
  <meta property="og:site_name" content="Joka Beatz">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${escapeHtml(ogData.url)}">
  <meta name="twitter:title" content="${escapeHtml(ogData.title)}">
  <meta name="twitter:description" content="${escapeHtml(ogData.description)}">
  <meta name="twitter:image" content="${escapeHtml(ogData.image)}">
</head>
<body></body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300", // 5 minutes for faster OG updates
      },
    });
  } catch (error) {
    console.error("Error generating OG meta:", error);

    // On error, redirect to homepage
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        "Location": SITE_URL,
      },
    });
  }
});
