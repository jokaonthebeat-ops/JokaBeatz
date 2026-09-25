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
  name: "search_products",
  title: "Search products",
  description: "Search the Joka Beatz shop catalog (beat packs, drum kits, presets, etc.) by name, category, or free-text query. Returns up to 20 products with name, slug, price, category, and shop URL.",
  inputSchema: {
    query: z.string().optional().describe("Text to match against product name/description."),
    category: z.string().optional().describe("Filter by category slug or name."),
    limit: z.number().int().positive().optional().describe("Max results (default 20, hard cap 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, category, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const sb = supabaseForUser(ctx);
    const cap = Math.min(limit ?? 20, 50);
    let q = sb.from("products").select("id, name, slug, price, category, description, active").eq("active", true).limit(cap);
    if (query) q = q.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    if (category) q = q.ilike("category", `%${category}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = (data ?? []).map((p) => ({
      name: p.name,
      price: p.price,
      category: p.category,
      url: `https://jokabeatz.com/shop/${p.slug}`,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { count: rows.length, products: rows },
    };
  },
});