import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchProducts from "./tools/search-products";
import listRecentOrders from "./tools/list-recent-orders";
import listBlogPosts from "./tools/list-blog-posts";
import listLeads from "./tools/list-leads";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "joka-beatz-mcp",
  title: "Joka Beatz",
  version: "0.1.0",
  instructions:
    "Tools to browse the Joka Beatz beat shop, blog, orders, and free-beat leads. Callers act as the signed-in Joka Beatz user; admin-only data (orders, leads) requires an admin account.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchProducts, listRecentOrders, listBlogPosts, listLeads],
});