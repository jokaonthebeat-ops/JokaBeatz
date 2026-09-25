import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  testEmail: string;
  subject: string;
  content: string;
  senderEmail?: string;
  senderName?: string;
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

    const { testEmail, subject, content, senderEmail, senderName }: TestEmailRequest = await req.json();

    if (!testEmail || !subject || !content) {
      throw new Error("Missing required fields");
    }

    // Input validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail) || testEmail.length > 255) {
      throw new Error("Invalid email address");
    }
    if (subject.length > 500) {
      throw new Error("Subject too long");
    }
    if (content.length > 100000) {
      throw new Error("Content too long");
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

    // Replace placeholders
    const processedContent = content
      .replace(/\{\{site_url\}\}/g, siteUrl)
      .replace(/\{\{name\}\}/g, "Test User")
      .replace(/\{\{email\}\}/g, testEmail)
      .replace(/\{\{beat_details\}\}/g, "5 new trap beats, 3 R&B instrumentals")
      .replace(/\{\{custom_subject\}\}/g, subject)
      .replace(/\{\{custom_content\}\}/g, "")
      // Strip any remaining unmatched placeholders so no raw brackets appear
      .replace(/\{\{[^}]+\}\}/g, "");

    const processedSubject = subject
      .replace(/\{\{name\}\}/g, "Test User")
      .replace(/\{\{email\}\}/g, testEmail)
      // Strip any remaining unmatched placeholders
      .replace(/\{\{[^}]+\}\}/g, "");

    await resend.emails.send({
      from: `${finalSenderName} <${finalSenderEmail}>`,
      to: [testEmail],
      subject: `[TEST] ${processedSubject}`,
      html: processedContent,
    });

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Error sending test email:", error);
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
