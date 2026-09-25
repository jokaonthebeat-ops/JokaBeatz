import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Webhook } from "https://esm.sh/svix@1.15.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

// Resend webhook event types we care about
type ResendEventType = 
  | "email.sent"
  | "email.delivered"
  | "email.opened"
  | "email.clicked"
  | "email.bounced"
  | "email.complained";

interface ResendWebhookPayload {
  type: ResendEventType;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    headers?: Array<{ name: string; value: string }>;
    click?: { link: string };
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    // Verify webhook signature if secret is configured
    const body = await req.text();
    if (webhookSecret) {
      const svixId = req.headers.get("svix-id");
      const svixTimestamp = req.headers.get("svix-timestamp");
      const svixSignature = req.headers.get("svix-signature");

      if (!svixId || !svixTimestamp || !svixSignature) {
        console.error("Missing Svix headers");
        return new Response(JSON.stringify({ error: "Missing webhook signature headers" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const wh = new Webhook(webhookSecret);
      try {
        wh.verify(body, {
          "svix-id": svixId,
          "svix-timestamp": svixTimestamp,
          "svix-signature": svixSignature,
        });
        console.log("Webhook signature verified");
      } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return new Response(JSON.stringify({ error: "Invalid webhook signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the webhook payload
    const payload: ResendWebhookPayload = JSON.parse(body);
    console.log("Received webhook event:", payload.type);

    // Extract headers for tracking
    const headers = payload.data.headers || [];
    const campaignHeader = headers.find(h => h.name === "X-Campaign-ID");
    const sequenceHeader = headers.find(h => h.name === "X-Sequence-ID");
    const stepHeader = headers.find(h => h.name === "X-Step-ID");
    const enrollmentHeader = headers.find(h => h.name === "X-Enrollment-ID");
    
    const campaignId = campaignHeader?.value;
    const sequenceId = sequenceHeader?.value;
    const stepId = stepHeader?.value;
    const enrollmentId = enrollmentHeader?.value;

    // If no tracking headers present, skip
    if (!campaignId && !sequenceId) {
      console.log("No campaign or sequence ID found in headers, skipping tracking");
      return new Response(JSON.stringify({ success: true, message: "No tracking ID" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const recipientEmail = payload.data.to[0];
    
    // Map Resend event types to our event types
    const eventTypeMap: Record<ResendEventType, string> = {
      "email.sent": "sent",
      "email.delivered": "delivered",
      "email.opened": "opened",
      "email.clicked": "clicked",
      "email.bounced": "bounced",
      "email.complained": "complained",
    };

    const eventType = eventTypeMap[payload.type];
    if (!eventType) {
      console.log("Unhandled event type:", payload.type);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle campaign tracking
    if (campaignId) {
      // Insert tracking event
      const { error: insertError } = await supabase
        .from("email_tracking_events")
        .insert({
          campaign_id: campaignId,
          recipient_email: recipientEmail,
          event_type: eventType,
          event_data: {
            email_id: payload.data.email_id,
            timestamp: payload.created_at,
            click_link: payload.data.click?.link,
          },
        });

      if (insertError) {
        console.error("Error inserting tracking event:", insertError);
      }

      // Update campaign aggregate stats
      const columnMap: Record<string, string> = {
        sent: "emails_sent",
        delivered: "emails_delivered",
        opened: "emails_opened",
        clicked: "emails_clicked",
        bounced: "emails_bounced",
      };

      const columnToUpdate = columnMap[eventType];
      if (columnToUpdate) {
        const { data: campaign, error: fetchError } = await supabase
          .from("email_campaigns")
          .select("*")
          .eq("id", campaignId)
          .single();

        if (fetchError) {
          console.error("Error fetching campaign:", fetchError);
        } else if (campaign) {
          const currentValue = campaign[columnToUpdate] || 0;
          const updateData: Record<string, number> = {
            [columnToUpdate]: currentValue + 1,
          };

          if (eventType === "opened" || eventType === "clicked") {
            const { data: existingEvents } = await supabase
              .from("email_tracking_events")
              .select("id")
              .eq("campaign_id", campaignId)
              .eq("recipient_email", recipientEmail)
              .eq("event_type", eventType);

            if (existingEvents && existingEvents.length === 1) {
              const uniqueColumn = eventType === "opened" ? "unique_opens" : "unique_clicks";
              updateData[uniqueColumn] = (campaign[uniqueColumn] || 0) + 1;
            }
          }

          const { error: updateError } = await supabase
            .from("email_campaigns")
            .update(updateData)
            .eq("id", campaignId);

          if (updateError) {
            console.error("Error updating campaign stats:", updateError);
          }
        }
      }
    }

    // Handle sequence tracking
    if (sequenceId && stepId && enrollmentId) {
      console.log(`Tracking sequence event: ${eventType} for step ${stepId}`);
      
      // Find the log entry for this enrollment and step
      const { data: logEntry, error: logFetchError } = await supabase
        .from("email_sequence_logs")
        .select("*")
        .eq("enrollment_id", enrollmentId)
        .eq("step_id", stepId)
        .single();

      if (logFetchError) {
        console.error("Error fetching sequence log:", logFetchError);
      } else if (logEntry) {
        const updateData: Record<string, unknown> = {};
        const now = new Date().toISOString();

        if (eventType === "delivered" && !logEntry.delivered_at) {
          updateData.delivered_at = now;
        } else if (eventType === "opened") {
          if (!logEntry.opened_at) {
            updateData.opened_at = now;
          }
          updateData.open_count = (logEntry.open_count || 0) + 1;
        } else if (eventType === "clicked") {
          if (!logEntry.clicked_at) {
            updateData.clicked_at = now;
          }
          updateData.click_count = (logEntry.click_count || 0) + 1;
        } else if (eventType === "bounced" && !logEntry.bounced_at) {
          updateData.bounced_at = now;
        }

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from("email_sequence_logs")
            .update(updateData)
            .eq("id", logEntry.id);

          if (updateError) {
            console.error("Error updating sequence log:", updateError);
          } else {
            console.log("Updated sequence log with:", updateData);
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
