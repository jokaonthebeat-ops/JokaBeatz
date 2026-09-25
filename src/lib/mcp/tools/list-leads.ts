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
  name: "list_leads",
  title: "List email leads",
  description: "List the most recent email leads captured across the site (admin only via RLS). Returns email, name, source page, and created_at.",
  inputSchema: {
    limit: z.number().int().positive().optional().describe("Max rows (default 25, cap 200)."),
    source: z.string().optional().describe("Filter by source_page substring."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, source }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const sb = supabaseForUser(ctx);
    const cap = Math.min(limit ?? 25, 200);
    let q = sb
      .from("leads")
      .select("email, name, source_page, created_at")
      .order("created_at", { ascending: false })
      .limit(cap);
    if (source) q = q.ilike("source_page", `%${source}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { count: data?.length ?? 0, leads: data ?? [] },
    };
  },
});