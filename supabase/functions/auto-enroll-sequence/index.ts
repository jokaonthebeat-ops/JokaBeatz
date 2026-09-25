import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EnrollRequest {
  email: string;
  sequence_type: "free_beats" | "newsletter";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, sequence_type }: EnrollRequest = await req.json();

    if (!email || !sequence_type) {
      throw new Error("Missing required fields: email and sequence_type");
    }

    // Find the appropriate active sequence
    const sequenceName = sequence_type === "free_beats" 
      ? "Free Beats 90-Day Nurture" 
      : "Newsletter 90-Day Nurture";

    const { data: sequence, error: seqError } = await supabase
      .from("email_sequences")
      .select("id")
      .eq("name", sequenceName)
      .eq("is_active", true)
      .single();

    if (seqError || !sequence) {
      console.log(`No active sequence found for ${sequence_type}, skipping enrollment`);
      return new Response(
        JSON.stringify({ success: true, enrolled: false, reason: "No active sequence" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check if already enrolled in this sequence
    const { data: existingEnrollment } = await supabase
      .from("email_sequence_enrollments")
      .select("id")
      .eq("sequence_id", sequence.id)
      .eq("recipient_email", email)
      .single();

    if (existingEnrollment) {
      console.log(`${email} already enrolled in sequence ${sequenceName}`);
      return new Response(
        JSON.stringify({ success: true, enrolled: false, reason: "Already enrolled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Get the first step to calculate next_send_at
    const { data: firstStep } = await supabase
      .from("email_sequence_steps")
      .select("delay_hours")
      .eq("sequence_id", sequence.id)
      .eq("step_order", 1)
      .single();

    // Calculate when to send the first email (immediately if delay is 0)
    const delayHours = firstStep?.delay_hours || 0;
    const nextSendAt = new Date(Date.now() + delayHours * 60 * 60 * 1000).toISOString();

    // Create the enrollment (no campaign_id needed for direct enrollments)
    const { data: enrollment, error: enrollError } = await supabase
      .from("email_sequence_enrollments")
      .insert({
        sequence_id: sequence.id,
        campaign_id: null,
        recipient_email: email,
        current_step: 0,
        status: "active",
        next_send_at: nextSendAt,
      })
      .select()
      .single();

    if (enrollError) {
      throw new Error(`Failed to create enrollment: ${enrollError.message}`);
    }

    console.log(`Successfully enrolled ${email} in ${sequenceName}`);

    // Trigger immediate email processing for this enrollment
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    try {
      const processResponse = await fetch(
        `${supabaseUrl}/functions/v1/process-sequence-emails`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({}),
        }
      );
      
      if (processResponse.ok) {
        console.log("Triggered immediate email processing");
      } else {
        console.log("Email processing trigger failed, will be picked up by cron");
      }
    } catch (error) {
      console.log("Could not trigger immediate processing:", error);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        enrolled: true, 
        enrollment_id: enrollment.id,
        sequence_name: sequenceName,
        next_send_at: nextSendAt
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error auto-enrolling in sequence:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
