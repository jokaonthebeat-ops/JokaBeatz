import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Server-side pricing validation - NEVER trust client-provided prices
const SERVICE_PRICES: Record<string, number> = {
  custom_beats: 300,
  mixing: 150,
  mastering: 75,
  consultation: 100,
};

const SERVICE_NAMES: Record<string, string> = {
  custom_beats: "Custom Beat Production",
  mixing: "Professional Mixing",
  mastering: "Audio Mastering",
  consultation: "1-on-1 Consultation",
};

interface CreateServicePaymentRequest {
  serviceType: string;
  customerName: string;
  customerEmail: string;
  projectNotes?: string;
  fileUrls?: string[];
  additionalData?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      serviceType,
      customerName,
      customerEmail,
      projectNotes,
      fileUrls,
      additionalData,
    }: CreateServicePaymentRequest = await req.json();

    // Validate required fields
    if (!serviceType || !customerName || !customerEmail) {
      throw new Error("Missing required fields: serviceType, customerName, customerEmail");
    }

    // Input validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail) || customerEmail.length > 255) {
      throw new Error("Invalid email address");
    }
    if (typeof customerName !== "string" || customerName.trim().length === 0 || customerName.length > 100) {
      throw new Error("Invalid customer name");
    }
    if (projectNotes && projectNotes.length > 5000) {
      throw new Error("Project notes too long (max 5000 characters)");
    }

    // Validate service type and get server-side price
    const price = SERVICE_PRICES[serviceType];
    if (price === undefined) {
      throw new Error("Invalid service type");
    }

    const serviceName = SERVICE_NAMES[serviceType];

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get authenticated user (optional - guest checkout allowed)
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    
    if (authHeader) {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } }
      );
      
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData } = await supabaseClient.auth.getClaims(token);
      if (claimsData?.claims?.sub) {
        userId = claimsData.claims.sub as string;
      }
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Create service order in database
    const { data: order, error: orderError } = await supabaseAdmin
      .from("service_orders")
      .insert({
        user_id: userId,
        customer_name: customerName,
        customer_email: customerEmail,
        service_type: serviceType,
        price: price,
        status: "pending",
        project_notes: projectNotes || null,
        file_urls: fileUrls || [],
        additional_data: additionalData || {},
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating service order:", orderError);
      throw new Error("Failed to create service order");
    }

    // Check if Stripe customer exists
    const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: serviceName,
              description: `Service order for ${customerName}`,
            },
            unit_amount: price * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}&type=service`,
      cancel_url: `${req.headers.get("origin")}/payment-canceled`,
      metadata: {
        order_id: order.id,
        order_type: "service",
        service_type: serviceType,
      },
    });

    // Update order with Stripe session ID
    await supabaseAdmin
      .from("service_orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);

    return new Response(
      JSON.stringify({ url: session.url, orderId: order.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Error creating service payment:", error);
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
