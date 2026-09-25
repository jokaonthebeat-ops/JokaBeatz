import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FreeBeatEmailRequest {
  name: string;
  email: string;
}

interface FreeBeat {
  id: string;
  title: string;
  genre: string | null;
  bpm: number | null;
  download_url: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email }: FreeBeatEmailRequest = await req.json();

    if (!name || !email) {
      throw new Error("Missing required fields");
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    // Fetch active beats from database
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: beats, error: beatsError } = await supabase
      .from("free_beats")
      .select("id, title, genre, bpm, download_url")
      .eq("active", true)
      .order("display_order", { ascending: true });

    if (beatsError) {
      console.error("Error fetching beats:", beatsError);
    }

    const resend = new Resend(resendApiKey);

    // Generate beat list HTML
    const beatsListHtml = beats && beats.length > 0
      ? beats.map((beat: FreeBeat) => `
          <div style="background-color: #18181b; padding: 16px; border-radius: 8px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h3 style="margin: 0; color: #fff; font-size: 16px;">${beat.title}</h3>
                <p style="margin: 4px 0 0; color: #71717a; font-size: 14px;">
                  ${beat.genre ? beat.genre : ""} ${beat.bpm ? `• ${beat.bpm} BPM` : ""}
                </p>
              </div>
              <a href="${beat.download_url}" 
                 style="display: inline-block; background-color: #e11d48; color: #fff; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
                Download
              </a>
            </div>
          </div>
        `).join("")
      : `
          <div style="text-align: center; padding: 20px;">
            <p style="color: #a1a1aa;">Your beats are being prepared! Check back soon.</p>
          </div>
        `;

    const emailResponse = await resend.emails.send({
      from: "Joka Beatz <onboarding@resend.dev>",
      to: [email],
      subject: "🎵 Your Free Beats Are Ready!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0a; color: #fff;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #e11d48; margin: 0;">JOKA BEATZ</h1>
          </div>
          
          <h2 style="color: #fff;">Hey ${name}! 🔥</h2>
          
          <p style="color: #a1a1aa; line-height: 1.6;">
            Thanks for signing up! Your free beat pack is ready to download.
          </p>
          
          <div style="margin: 30px 0;">
            <h3 style="color: #fff; margin-bottom: 16px;">Your Free Beats:</h3>
            ${beatsListHtml}
          </div>
          
          <p style="color: #a1a1aa; line-height: 1.6;">
            What's included:
          </p>
          <ul style="color: #a1a1aa; line-height: 1.8;">
            <li>High-quality MP3/WAV files</li>
            <li>Royalty-free for non-commercial use</li>
            <li>Professional-grade audio</li>
          </ul>
          
          <p style="color: #a1a1aa; line-height: 1.6;">
            Want even more? Check out our full catalog of beats and products at 
            <a href="https://joka-beatz.lovable.app/shop" style="color: #e11d48;">joka-beatz.lovable.app</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #27272a; margin: 30px 0;" />
          
          <p style="color: #71717a; font-size: 12px; text-align: center;">
            You're receiving this email because you requested free beats at Joka Beatz.<br>
            <a href="#" style="color: #e11d48;">Unsubscribe</a>
          </p>
        </div>
      `,
    });

    console.log("Free beats email sent successfully:", emailResponse);

    // Auto-enroll in the Free Beats 90-day sequence
    try {
      const enrollResponse = await fetch(`${supabaseUrl}/functions/v1/auto-enroll-sequence`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({ email, sequence_type: "free_beats" }),
      });
      const enrollResult = await enrollResponse.json();
      console.log("Auto-enrollment result:", enrollResult);
    } catch (enrollError) {
      console.error("Failed to auto-enroll in sequence:", enrollError);
      // Don't fail the main request if enrollment fails
    }

    return new Response(
      JSON.stringify({ success: true, beatCount: beats?.length || 0 }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Error sending free beats email:", error);
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
