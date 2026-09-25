import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EnrollRequest {
  campaignId: string;
  sequenceId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      throw new Error("Admin access required");
    }

    const { campaignId, sequenceId }: EnrollRequest = await req.json();

    if (!campaignId || !sequenceId) {
      throw new Error("Missing campaignId or sequenceId");
    }

    // Get sequence details
    const { data: sequence, error: seqError } = await supabase
      .from("email_sequences")
      .select("*")
      .eq("id", sequenceId)
      .single();

    if (seqError || !sequence) {
      throw new Error("Sequence not found");
    }

    if (!sequence.is_active) {
      throw new Error("Sequence is not active");
    }

    // Get first step delay
    const { data: firstStep } = await supabase
      .from("email_sequence_steps")
      .select("delay_hours")
      .eq("sequence_id", sequenceId)
      .eq("step_order", 1)
      .single();

    if (!firstStep) {
      throw new Error("Sequence has no steps");
    }

    // Get campaign tracking events to determine eligible recipients
    const { data: trackingEvents } = await supabase
      .from("email_tracking_events")
      .select("recipient_email, event_type")
      .eq("campaign_id", campaignId);

    // Aggregate events per recipient
    const recipientEvents = new Map<string, Set<string>>();
    trackingEvents?.forEach((event) => {
      if (!recipientEvents.has(event.recipient_email)) {
        recipientEvents.set(event.recipient_email, new Set());
      }
      recipientEvents.get(event.recipient_email)!.add(event.event_type);
    });

    // Get all recipients from campaign
    const { data: campaign } = await supabase
      .from("email_campaigns")
      .select("recipient_type")
      .eq("id", campaignId)
      .single();

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // Fetch original recipients
    let recipients: string[] = [];
    if (campaign.recipient_type === "free_beats" || campaign.recipient_type === "both") {
      const { data: freeBeatLeads } = await supabase.from("free_beat_requests").select("email");
      if (freeBeatLeads) recipients.push(...freeBeatLeads.map((l) => l.email));
    }
    if (campaign.recipient_type === "newsletter" || campaign.recipient_type === "both") {
      const { data: newsletterLeads } = await supabase.from("leads").select("email");
      if (newsletterLeads) recipients.push(...newsletterLeads.map((l) => l.email));
    }
    recipients = [...new Set(recipients)];

    // Filter based on trigger type
    const eligibleRecipients = recipients.filter((email) => {
      const events = recipientEvents.get(email) || new Set();
      
      switch (sequence.trigger_type) {
        case "opened_not_clicked":
          return events.has("opened") && !events.has("clicked");
        case "not_opened":
          return events.has("delivered") && !events.has("opened");
        case "clicked":
          return events.has("clicked");
        case "all_recipients":
          return events.has("delivered");
        default:
          return false;
      }
    });

    // Check for existing enrollments
    const { data: existingEnrollments } = await supabase
      .from("email_sequence_enrollments")
      .select("recipient_email")
      .eq("sequence_id", sequenceId)
      .eq("campaign_id", campaignId);

    const existingEmails = new Set(existingEnrollments?.map((e) => e.recipient_email) || []);
    const newRecipients = eligibleRecipients.filter((email) => !existingEmails.has(email));

    if (newRecipients.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          enrolled: 0,
          message: "No new eligible recipients found",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate first send time
    const nextSendAt = new Date(Date.now() + firstStep.delay_hours * 60 * 60 * 1000).toISOString();

    // Create enrollments
    const enrollments = newRecipients.map((email) => ({
      sequence_id: sequenceId,
      campaign_id: campaignId,
      recipient_email: email,
      current_step: 0,
      status: "active",
      next_send_at: nextSendAt,
    }));

    const { error: insertError } = await supabase
      .from("email_sequence_enrollments")
      .insert(enrollments);

    if (insertError) {
      throw new Error(`Failed to create enrollments: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        enrolled: newRecipients.length,
        nextSendAt,
        triggerType: sequence.trigger_type,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Error enrolling recipients:", error);
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
