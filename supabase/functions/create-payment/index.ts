import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TIERS = ["mp3_lease", "wav_lease", "trackout", "unlimited", "exclusive"];
const TIER_LABELS: Record<string, string> = {
  mp3_lease: "MP3 Lease",
  wav_lease: "WAV Lease",
  trackout: "Trackout",
  unlimited: "Unlimited",
  exclusive: "Exclusive",
};

interface PaymentRequest {
  productId?: string;
  beatId?: string;
  licenseTier?: string;
  returnPath?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId, beatId, licenseTier, returnPath }: PaymentRequest = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    let userEmail: string | null = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      if (user) {
        userId = user.id;
        userEmail = user.email || null;
      }
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    let customerId: string | undefined;
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin");

    // ===== Beat + license purchase =====
    if (beatId) {
      const appReturn = typeof returnPath === "string" && /^\/app\/buy\/[a-z0-9-]+$/i.test(returnPath) ? returnPath : null;
      if (!licenseTier || !TIERS.includes(licenseTier)) throw new Error("Invalid license tier");
      if (!userId) throw new Error("Please sign in to purchase a beat license");

      const { data: beat } = await supabaseAdmin
        .from("beats")
        .select("id, title, status")
        .eq("id", beatId)
        .maybeSingle();
      if (!beat || beat.status !== "published") throw new Error("Beat not available");

      const { data: license } = await supabaseAdmin
        .from("beat_licenses")
        .select("id, tier, price_cents, stripe_price_id, active")
        .eq("beat_id", beatId)
        .eq("tier", licenseTier)
        .maybeSingle();
      if (!license || !license.active) throw new Error("License not available");

      if (licenseTier === "exclusive") {
        const { count } = await supabaseAdmin
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("beat_id", beatId)
          .eq("license_tier", "exclusive")
          .eq("status", "completed");
        if ((count ?? 0) > 0) throw new Error("Exclusive rights already sold");
      }

      const lineItem = license.stripe_price_id
        ? { price: license.stripe_price_id, quantity: 1 }
        : {
            price_data: {
              currency: "usd",
              product_data: { name: `${beat.title} — ${TIER_LABELS[licenseTier]}` },
              unit_amount: license.price_cents,
            },
            quantity: 1,
          };

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : userEmail || undefined,
        line_items: [lineItem],
        mode: "payment",
        success_url: appReturn
          ? `${origin}${appReturn}?tier=${licenseTier}&session_id={CHECKOUT_SESSION_ID}`
          : `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: appReturn ? `${origin}${appReturn}?tier=${licenseTier}&canceled=1` : `${origin}/payment-canceled`,
        metadata: {
          order_type: "beat",
          beatId,
          licenseTier,
          userId,
        },
      });

      await supabaseAdmin.from("orders").insert({
        user_id: userId,
        beat_id: beatId,
        license_tier: licenseTier,
        amount: license.price_cents / 100,
        status: "pending",
        stripe_session_id: session.id,
      });

      return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ===== Product purchase (existing) =====
    if (!productId) throw new Error("Missing required product ID");

    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, name, price, active")
      .eq("id", productId)
      .single();

    if (productError || !product) throw new Error("Product not found");
    if (!product.active) throw new Error("Product is not available for purchase");

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: product.name },
            unit_amount: Math.round(product.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment-canceled`,
      metadata: { productId, userId: userId || "" },
    });

    if (userId) {
      await supabaseAdmin.from("orders").insert({
        user_id: userId,
        product_id: productId,
        amount: product.price,
        status: "pending",
        stripe_session_id: session.id,
      });
    }

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.error("Error creating payment session:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
