import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyRequest {
  orderId: string;
  customerEmail: string;
  customerName: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const { orderId, customerEmail, customerName }: NotifyRequest = await req.json();

    if (!orderId || !customerEmail || !customerName) {
      throw new Error("Missing required fields");
    }

    // Get the order to verify and get user_id
    const { data: order, error: orderError } = await supabase
      .from("music_video_orders")
      .select("user_id, video_style, notification_sent")
      .eq("id", orderId)
      .single();

    if (orderError) throw orderError;

    if (order.notification_sent) {
      return new Response(
        JSON.stringify({ success: true, message: "Notification already sent" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create in-app notification if user has an account
    if (order.user_id) {
      const { error: notifError } = await supabase.from("user_notifications").insert({
        user_id: order.user_id,
        type: "video_ready",
        title: "Your Music Video is Ready! 🎬",
        message: `Your ${order.video_style} music video has been completed and is ready for download.`,
        link: "/dashboard",
      });

      if (notifError) {
        console.error("Failed to create notification:", notifError);
      }
    }

    // Send email notification
    const emailResponse = await resend.emails.send({
      from: "Joka Beatz <noreply@jokabeatz.com>",
      to: [customerEmail],
      subject: "🎬 Your Music Video is Ready for Download!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 16px; padding: 40px; border: 1px solid #333;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #f97316; margin: 0; font-size: 28px;">🎬 Your Video is Ready!</h1>
            </div>
            
            <p style="font-size: 18px; line-height: 1.6; margin-bottom: 24px;">
              Hey ${customerName}!
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #a3a3a3; margin-bottom: 32px;">
              Great news! Your custom <strong style="color: #ffffff;">${order.video_style} music video</strong> has been completed and is ready for download.
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://joka-beatz.lovable.app/dashboard" style="display: inline-block; background: linear-gradient(135deg, #f97316, #ea580c); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Download Your Video
              </a>
            </div>
            
            <p style="font-size: 14px; color: #737373; line-height: 1.6; margin-top: 32px;">
              Log in to your dashboard to download your video file. If you have any questions, just reply to this email!
            </p>
            
            <div style="border-top: 1px solid #333; margin-top: 32px; padding-top: 24px; text-align: center;">
              <p style="font-size: 14px; color: #737373; margin: 0;">
                Thanks for choosing Joka Beatz! 🎵
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent:", emailResponse);

    // Mark notification as sent
    const { error: updateError } = await supabase
      .from("music_video_orders")
      .update({ notification_sent: true })
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to update notification_sent:", updateError);
    }

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in notify-video-ready:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
