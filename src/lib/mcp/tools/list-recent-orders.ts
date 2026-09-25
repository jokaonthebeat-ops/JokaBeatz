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
  name: "list_recent_orders",
  title: "List recent orders",
  description: "List the most recent shop orders (admin only; RLS restricts non-admin callers to their own orders). Returns id, customer email, total, status, and created_at.",
  inputSchema: {
    limit: z.number().int().positive().optional().describe("Max rows (default 20, cap 100)."),
    status: z.string().optional().describe("Filter by status (e.g. paid, pending)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, status }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const sb = supabaseForUser(ctx);
    const cap = Math.min(limit ?? 20, 100);
    let q = sb
      .from("orders")
      .select("id, user_id, product_id, amount, status, created_at")
      .order("created_at", { ascending: false })
      .limit(cap);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { count: data?.length ?? 0, orders: data ?? [] },
    };
  },
});