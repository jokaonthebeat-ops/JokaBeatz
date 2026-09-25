import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { job_id } = await req.json();

    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get job and service details
    const { data: job, error: jobError } = await supabase
      .from("mastering_jobs")
      .select("*, service:mastering_services(*)")
      .eq("id", job_id)
      .single();

    if (jobError || !job) {
      throw new Error("Job not found");
    }

    // Verify job has a preview (can't checkout without preview first)
    if (!job.preview_file_url) {
      throw new Error("Preview must be generated before checkout");
    }

    const service = job.service as Record<string, unknown>;
    const priceCents = (service?.sale_price_cents as number) || (service?.price_cents as number) || 999;
    const serviceName = (service?.name as string) || "AI Mastering";

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: serviceName,
              description: "Full AI-mastered track download",
            },
            unit_amount: priceCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/ai-mastering?success=true&job_id=${job_id}`,
      cancel_url: `${req.headers.get("origin")}/ai-mastering?canceled=true`,
      metadata: {
        job_id,
        type: "mastering",
        order_type: "mastering",
      },
    });

    // Update job with Stripe session ID and price
    // Mark as ready for final processing after payment
    await supabase
      .from("mastering_jobs")
      .update({
        stripe_session_id: session.id,
        price_cents: priceCents,
      })
      .eq("id", job_id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
