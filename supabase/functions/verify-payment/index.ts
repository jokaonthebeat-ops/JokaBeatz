import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { signBeatDeliverables } from "../_shared/beatDeliverables.ts";

const TIER_LABELS: Record<string, string> = {
  mp3_lease: "MP3 Lease",
  wav_lease: "WAV Lease",
  trackout: "Trackout",
  unlimited: "Unlimited",
  exclusive: "Exclusive",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  sessionId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId }: VerifyRequest = await req.json();

    if (!sessionId) {
      throw new Error("Missing session ID");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ success: false, error: "Payment not completed" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if this is a service order or product order
    const orderType = session.metadata?.order_type;
    const orderId = session.metadata?.order_id;
    
    let orderData = null;
    let productFiles: { file_name: string; file_path: string }[] = [];

    if (orderType === "beat") {
      const { data: existing } = await supabaseAdmin
        .from("orders")
        .select("id, status, beat_id, license_tier, amount")
        .eq("stripe_session_id", sessionId)
        .maybeSingle();

      const wasPending = existing && existing.status !== "completed";
      const { data: updatedOrder } = await supabaseAdmin
        .from("orders")
        .update({ status: "completed", stripe_payment_intent_id: session.payment_intent as string })
        .eq("stripe_session_id", sessionId)
        .select("id, amount, beat_id, license_tier")
        .single();

      const beatId = session.metadata?.beatId as string;
      const tier = session.metadata?.licenseTier as string;
      const { data: beat } = await supabaseAdmin.from("beats").select("title").eq("id", beatId).maybeSingle();
      productFiles = await signBeatDeliverables(supabaseAdmin, beatId, tier);
      const tierLabel = TIER_LABELS[tier] || tier;
      orderData = updatedOrder
        ? { ...updatedOrder, products: { id: beatId, name: `${beat?.title ?? "Beat"} — ${tierLabel}`, description: null } }
        : null;

      // Email download links once (first verification)
      const email = session.customer_details?.email;
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (wasPending && email && resendKey) {
        try {
          const links = productFiles
            .map((f) => `<li style="margin:8px 0"><a href="${f.file_path}" style="color:#DC2626">${f.file_name}</a></li>`)
            .join("");
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "Joka Beatz <noreply@jokabeatz.com>",
              to: [email],
              subject: `Your ${beat?.title ?? "beat"} (${tierLabel}) downloads`,
              html: `<div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#fff;padding:32px"><div style="max-width:560px;margin:0 auto;background:#1a1a1a;border-radius:12px;padding:32px"><h2>Thanks for your purchase!</h2><p>${beat?.title ?? "Beat"} — ${tierLabel}</p><ul>${links || "<li>Your files will be available in your dashboard.</li>"}</ul><p style="color:#aaa;font-size:13px">Links expire in 7 days. You can always get fresh links from your dashboard at <a href="https://jokabeatz.com/dashboard" style="color:#DC2626">jokabeatz.com/dashboard</a>.</p></div></div>`,
            }),
          });
        } catch (e) {
          console.error("Beat email failed:", e);
        }
      }
    } else if (orderType === "service" && orderId) {
      // Handle service order
      const { data: updatedOrder, error: updateError } = await supabaseAdmin
        .from("service_orders")
        .update({
          status: "paid",
          stripe_payment_intent_id: session.payment_intent as string,
        })
        .eq("id", orderId)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating service order:", updateError);
      }
      
      orderData = updatedOrder;
    } else {
      // Handle product order (existing logic)
      const { data: updatedOrder, error: updateError } = await supabaseAdmin
        .from("orders")
        .update({
          status: "completed",
          stripe_payment_intent_id: session.payment_intent as string,
        })
        .eq("stripe_session_id", sessionId)
        .select(`
          *,
          products (
            id,
            name,
            description
          )
        `)
        .single();

      if (updateError) {
        console.error("Error updating order:", updateError);
      }

      orderData = updatedOrder;

      // Get product files for the purchased product
      if (updatedOrder?.product_id) {
        const { data: files } = await supabaseAdmin
          .from("product_files")
          .select("file_name, file_path")
          .eq("product_id", updatedOrder.product_id);

        if (files) {
          productFiles = files;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        order: orderData,
        orderType: orderType || "product",
        productFiles,
        customerEmail: session.customer_details?.email,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Error verifying payment:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
