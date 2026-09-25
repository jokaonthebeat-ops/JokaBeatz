import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailCampaignRequest {
  subject: string;
  content: string;
  beatDetails?: string;
  recipientType: "free_beats" | "newsletter" | "both";
  senderEmail?: string;
  senderName?: string;
  templateId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the user is an admin
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (rolesError || !roles || roles.length === 0) {
      throw new Error("Admin access required");
    }

    const { subject, content, beatDetails, recipientType, senderEmail, senderName, templateId }: EmailCampaignRequest = await req.json();

    if (!subject || !content || !recipientType) {
      throw new Error("Missing required fields");
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const resend = new Resend(resendApiKey);

    // Use provided sender or fall back to defaults
    let finalSenderEmail = senderEmail;
    let finalSenderName = senderName;
    let siteUrl = "https://joka-beatz.lovable.app";

    if (!finalSenderEmail || !finalSenderName) {
      // Fetch sender config from site_settings as fallback
      const { data: senderSettings } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["sender_email", "sender_name", "site_url"]);

      finalSenderEmail = finalSenderEmail || senderSettings?.find(s => s.key === "sender_email")?.value || "onboarding@resend.dev";
      finalSenderName = finalSenderName || senderSettings?.find(s => s.key === "sender_name")?.value || "Joka Beatz";
      siteUrl = senderSettings?.find(s => s.key === "site_url")?.value || siteUrl;
    } else {
      // Still fetch site_url
      const { data: siteSettings } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "site_url")
        .single();
      
      if (siteSettings?.value) {
        siteUrl = siteSettings.value;
      }
    }

    // Fetch recipients based on type with names for personalization
    interface Recipient {
      email: string;
      name: string;
    }
    let recipientMap = new Map<string, string>(); // email -> name

    if (recipientType === "free_beats" || recipientType === "both") {
      const { data: freeBeatLeads } = await supabase
        .from("free_beat_requests")
        .select("email, name");
      
      if (freeBeatLeads) {
        for (const lead of freeBeatLeads) {
          if (!recipientMap.has(lead.email)) {
            recipientMap.set(lead.email, lead.name || "there");
          }
        }
      }
    }

    if (recipientType === "newsletter" || recipientType === "both") {
      const { data: newsletterLeads } = await supabase
        .from("leads")
        .select("email, name");
      
      if (newsletterLeads) {
        for (const lead of newsletterLeads) {
          if (!recipientMap.has(lead.email)) {
            recipientMap.set(lead.email, lead.name || "there");
          }
        }
      }
    }

    const recipients = Array.from(recipientMap.keys());

    if (recipients.length === 0) {
      throw new Error("No recipients found");
    }

    // Create campaign record first to get the ID for tracking
    const { data: campaignData, error: campaignError } = await supabase
      .from("email_campaigns")
      .insert({
        subject,
        content,
        recipient_type: recipientType,
        recipient_count: recipients.length,
        emails_sent: 0,
        sent_at: new Date().toISOString(),
        sent_by: user.id,
      })
      .select("id")
      .single();

    if (campaignError || !campaignData) {
      throw new Error("Failed to create campaign record");
    }

    const campaignId = campaignData.id;

    // Send emails in batches (Resend supports up to 100 recipients per request)
    const batchSize = 50;
    let sentCount = 0;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      // Send to each recipient individually to personalize
      for (const recipientEmail of batch) {
        try {
          const recipientName = recipientMap.get(recipientEmail) || "there";
          
          // Process placeholders in subject
          const processedSubject = subject
            .replace(/\{\{name\}\}/g, recipientName)
            .replace(/\{\{email\}\}/g, recipientEmail)
            // Strip any remaining unmatched placeholders
            .replace(/\{\{[^}]+\}\}/g, "");

          // Process placeholders in content
          const processedContent = content
            .replace(/\{\{site_url\}\}/g, siteUrl)
            .replace(/\{\{email\}\}/g, recipientEmail)
            .replace(/\{\{name\}\}/g, recipientName)
            .replace(/\{\{custom_subject\}\}/g, subject)
            .replace(/\{\{beat_details\}\}/g, beatDetails || "new beats")
            .replace(/\{\{custom_content\}\}/g, "")
            // Strip any remaining unmatched placeholders so users never see raw brackets
            .replace(/\{\{[^}]+\}\}/g, "");

          await resend.emails.send({
            from: `${finalSenderName} <${finalSenderEmail}>`,
            to: [recipientEmail],
            subject: processedSubject,
            html: processedContent,
            headers: {
              "X-Campaign-ID": campaignId,
            },
          });
          sentCount++;
        } catch (error) {
          console.error(`Failed to send to ${recipientEmail}:`, error);
        }
      }
    }

    // Update campaign with actual sent count
    await supabase
      .from("email_campaigns")
      .update({ 
        recipient_count: sentCount,
        emails_sent: sentCount 
      })
      .eq("id", campaignId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        recipientCount: sentCount 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Error sending campaign:", error);
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
