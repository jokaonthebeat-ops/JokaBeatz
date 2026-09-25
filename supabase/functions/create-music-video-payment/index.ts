import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-MUSIC-VIDEO-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const {
      customerName,
      customerEmail,
      videoStyle,
      videoQuality,
      selectedUpgrades,
      imageUrls,
      songUrl,
      visionDescription,
    } = await req.json();

    logStep("Request body parsed", { customerEmail, videoStyle, videoQuality });

    // Input validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerName || typeof customerName !== "string" || customerName.trim().length === 0 || customerName.length > 100) {
      throw new Error("Invalid customer name");
    }
    if (!customerEmail || !emailRegex.test(customerEmail) || customerEmail.length > 255) {
      throw new Error("Invalid customer email");
    }
    if (!videoStyle || !["reels", "full_video"].includes(videoStyle)) {
      throw new Error("Invalid video style");
    }
    if (!videoQuality || !["720p", "1080p"].includes(videoQuality)) {
      throw new Error("Invalid video quality");
    }
    if (visionDescription && visionDescription.length > 2000) {
      throw new Error("Vision description too long (max 2000 characters)");
    }
    if (!Array.isArray(selectedUpgrades)) {
      throw new Error("Invalid upgrades format");
    }

    // Fetch settings from database for server-side price calculation
    const { data: settings, error: settingsError } = await supabaseClient
      .from("music_video_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (settingsError) throw settingsError;

    // Calculate price server-side
    const basePrice = videoStyle === "reels" 
      ? (settings?.reels_price || 99.99) 
      : (settings?.full_video_price || 249.99);
    
    const qualityPrice = videoQuality === "1080p" 
      ? (settings?.upgrade_1080p_price || 29.99) 
      : 0;

    const availableUpgrades = (settings?.available_upgrades || []) as { id: string; name: string; price: number }[];
    
    const selectedUpgradeDetails = selectedUpgrades.map((id: string) => {
      const upgrade = availableUpgrades.find((u) => u.id === id);
      return upgrade || null;
    }).filter(Boolean);

    const upgradesPrice = selectedUpgradeDetails.reduce(
      (sum: number, u: { price: number }) => sum + u.price,
      0
    );

    const totalPrice = basePrice + qualityPrice + upgradesPrice;

    logStep("Price calculated", { basePrice, qualityPrice, upgradesPrice, totalPrice });

    // Get user ID if authenticated
    let userId = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      userId = userData.user?.id || null;
    }

    // Create order in database
    const { data: order, error: orderError } = await supabaseClient
      .from("music_video_orders")
      .insert({
        user_id: userId,
        customer_name: customerName,
        customer_email: customerEmail,
        video_style: videoStyle,
        video_quality: videoQuality,
        vision_description: visionDescription,
        song_url: songUrl,
        base_price: basePrice,
        upgrades: selectedUpgradeDetails,
        total_price: totalPrice,
        status: "pending",
      })
      .select()
      .single();

    if (orderError) throw orderError;

    logStep("Order created", { orderId: order.id });

    // Insert order images
    if (imageUrls && imageUrls.length > 0) {
      const imageInserts = imageUrls.map((url: string, index: number) => ({
        order_id: order.id,
        image_url: url,
        display_order: index,
      }));

      const { error: imagesError } = await supabaseClient
        .from("music_video_order_images")
        .insert(imageInserts);

      if (imagesError) {
        logStep("Warning: Failed to insert images", { error: imagesError.message });
      }
    }

    // Create Stripe checkout session
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check for existing customer
    const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const lineItems = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Custom Music Video - ${videoStyle === "reels" ? "Reels Style" : "Full Video"}`,
            description: `${videoQuality} quality video${selectedUpgradeDetails.length > 0 ? ` with ${selectedUpgradeDetails.length} add-ons` : ""}`,
          },
          unit_amount: Math.round(totalPrice * 100),
        },
        quantity: 1,
      },
    ];

    const origin = req.headers.get("origin") || "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&type=music-video`,
      cancel_url: `${origin}/music-videos?cancelled=true`,
      metadata: {
        order_id: order.id,
        order_type: "music_video",
      },
    });

    logStep("Stripe session created", { sessionId: session.id });

    // Update order with stripe session id
    await supabaseClient
      .from("music_video_orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
