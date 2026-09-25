import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    // Get sender settings
    const { data: senderSettings } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["sender_email", "sender_name", "site_url"]);

    const senderEmail = senderSettings?.find(s => s.key === "sender_email")?.value || "onboarding@resend.dev";
    const senderName = senderSettings?.find(s => s.key === "sender_name")?.value || "Joka Beatz";
    const siteUrl = senderSettings?.find(s => s.key === "site_url")?.value || "https://joka-beatz.lovable.app";

    // Find enrollments that are due to receive their next email
    const now = new Date().toISOString();
    const { data: dueEnrollments, error: enrollmentsError } = await supabase
      .from("email_sequence_enrollments")
      .select(`
        *,
        sequence:email_sequences(*),
        campaign:email_campaigns(*)
      `)
      .eq("status", "active")
      .lte("next_send_at", now)
      .not("next_send_at", "is", null);

    if (enrollmentsError) {
      throw new Error(`Failed to fetch enrollments: ${enrollmentsError.message}`);
    }

    console.log(`Found ${dueEnrollments?.length || 0} enrollments due for processing`);

    // Prepare emails for batch sending
    interface EmailToSend {
      enrollment: typeof dueEnrollments[0];
      step: { id: string; subject: string; content: string; step_order: number };
      recipientName: string;
      nextStepDelayHours: number | null;
    }
    
    const emailsToSend: EmailToSend[] = [];
    const completedEnrollments: string[] = [];

    // First pass: gather all email data
    for (const enrollment of dueEnrollments || []) {
      const nextStepOrder = enrollment.current_step + 1;
      
      const { data: step } = await supabase
        .from("email_sequence_steps")
        .select("*")
        .eq("sequence_id", enrollment.sequence_id)
        .eq("step_order", nextStepOrder)
        .single();

      if (!step) {
        // No more steps - mark for completion
        completedEnrollments.push(enrollment.id);
        console.log(`Enrollment ${enrollment.id} completed - no more steps`);
        continue;
      }

      // Look up recipient's name
      let recipientName = "there";
      
      const { data: freeBeatLead } = await supabase
        .from("free_beat_requests")
        .select("name")
        .eq("email", enrollment.recipient_email)
        .single();
      
      if (freeBeatLead?.name) {
        recipientName = freeBeatLead.name;
      } else {
        const { data: newsletterLead } = await supabase
          .from("leads")
          .select("name")
          .eq("email", enrollment.recipient_email)
          .single();
        
        if (newsletterLead?.name) {
          recipientName = newsletterLead.name;
        }
      }

      // Get next step delay for scheduling
      const { data: nextStep } = await supabase
        .from("email_sequence_steps")
        .select("delay_hours")
        .eq("sequence_id", enrollment.sequence_id)
        .eq("step_order", nextStepOrder + 1)
        .single();

      emailsToSend.push({
        enrollment,
        step,
        recipientName,
        nextStepDelayHours: nextStep?.delay_hours || null,
      });
    }

    // Mark completed enrollments
    if (completedEnrollments.length > 0) {
      await supabase
        .from("email_sequence_enrollments")
        .update({
          status: "completed",
          completed_at: now,
          next_send_at: null,
        })
        .in("id", completedEnrollments);
    }

    let processed = 0;
    let errors = 0;

    // Send emails in batches of 100 (Resend limit)
    const BATCH_SIZE = 100;
    for (let i = 0; i < emailsToSend.length; i += BATCH_SIZE) {
      const batch = emailsToSend.slice(i, i + BATCH_SIZE);
      
      const batchEmails = batch.map(({ enrollment, step, recipientName }) => {
        const processedSubject = step.subject
          .replace(/\{\{name\}\}/g, recipientName)
          .replace(/\{\{email\}\}/g, enrollment.recipient_email);

        const processedContent = step.content
          .replace(/\{\{site_url\}\}/g, siteUrl)
          .replace(/\{\{email\}\}/g, enrollment.recipient_email)
          .replace(/\{\{name\}\}/g, recipientName);

        return {
          from: `${senderName} <${senderEmail}>`,
          to: [enrollment.recipient_email],
          subject: processedSubject,
          html: processedContent,
          headers: {
            "X-Sequence-ID": enrollment.sequence_id,
            "X-Enrollment-ID": enrollment.id,
            "X-Step-ID": step.id,
          },
        };
      });

      try {
        // Use Resend batch send
        const { data: batchResult, error: batchError } = await resend.batch.send(batchEmails);

        if (batchError) {
          console.error("Batch send error:", batchError);
          errors += batch.length;
          continue;
        }

        console.log(`Batch sent ${batch.length} emails successfully`);

        // Process successful sends
        for (let j = 0; j < batch.length; j++) {
          const { enrollment, step, nextStepDelayHours } = batch[j];
          const nextStepOrder = enrollment.current_step + 1;

          try {
            // Log the sent email
            await supabase.from("email_sequence_logs").insert({
              enrollment_id: enrollment.id,
              step_id: step.id,
              status: "sent",
            });

            const nextSendAt = nextStepDelayHours
              ? new Date(Date.now() + nextStepDelayHours * 60 * 60 * 1000).toISOString()
              : null;

            // Update enrollment
            await supabase
              .from("email_sequence_enrollments")
              .update({
                current_step: nextStepOrder,
                next_send_at: nextSendAt,
                ...(nextSendAt ? {} : { status: "completed", completed_at: now }),
              })
              .eq("id", enrollment.id);

            processed++;
            console.log(`Sent step ${nextStepOrder} to ${enrollment.recipient_email}`);
          } catch (error) {
            console.error(`Error updating enrollment ${enrollment.id}:`, error);
            errors++;
          }
        }
      } catch (error) {
        console.error("Batch send failed:", error);
        errors += batch.length;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        errors,
        message: `Processed ${processed} emails with ${errors} errors`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Error processing sequence emails:", error);
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
