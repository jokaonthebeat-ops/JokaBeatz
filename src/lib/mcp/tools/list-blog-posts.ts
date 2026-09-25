import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_blog_posts",
  title: "List blog posts",
  description: "List published Joka Beatz blog posts, newest first. Returns title, slug, excerpt, and public URL.",
  inputSchema: {
    query: z.string().optional().describe("Match against post title."),
    limit: z.number().int().positive().optional().describe("Max results (default 10, cap 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const sb = supabaseForUser(ctx);
    const cap = Math.min(limit ?? 10, 50);
    let q = sb
      .from("blog_posts")
      .select("title, slug, excerpt, published_at, status")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(cap);
    if (query) q = q.ilike("title", `%${query}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = (data ?? []).map((p) => ({
      title: p.title,
      excerpt: p.excerpt,
      published_at: p.published_at,
      url: `https://jokabeatz.com/blog/${p.slug}`,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { count: rows.length, posts: rows },
    };
  },
});