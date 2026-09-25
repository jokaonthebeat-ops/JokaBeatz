import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateVariationRequest {
  variationType: "subject_only" | "full_variation" | "tone_shift";
  tone?: "urgent" | "casual" | "professional" | "exclusive";
  originalSubject: string;
  originalContent?: string;
  category: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { variationType, tone, originalSubject, originalContent, category }: GenerateVariationRequest = await req.json();

    if (!variationType || !originalSubject) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build the prompt based on variation type
    let systemPrompt = `You are a marketing copywriter for Joka Beatz, a music producer brand selling beats, offering mixing/mastering services, and providing exclusive content. 
The brand voice is confident, professional yet approachable, and speaks to independent artists and content creators.
Keep emails engaging, action-oriented, and aligned with the music industry.`;

    let userPrompt = "";

    if (variationType === "subject_only") {
      userPrompt = `Generate 5 alternative email subject lines for this email:

Category: ${category}
Original subject: "${originalSubject}"

Requirements:
- Keep subjects under 60 characters
- Include emojis where appropriate
- Make them attention-grabbing and action-oriented
- Vary the approach (urgency, curiosity, value proposition, FOMO, direct)

Return ONLY a JSON array of 5 subject line strings, no explanation.`;
    } else if (variationType === "tone_shift") {
      const toneDescriptions: Record<string, string> = {
        urgent: "Create urgency and scarcity - limited time, exclusive drop, act now",
        casual: "Friendly and conversational - like texting a friend about something cool",
        professional: "Polished and business-like - premium quality, industry standards",
        exclusive: "VIP treatment - special access, insider benefits, exclusive offers",
      };

      userPrompt = `Rewrite this email with a "${tone}" tone:

Tone description: ${toneDescriptions[tone || "professional"]}

Original subject: "${originalSubject}"
Original content:
${originalContent || "No content provided"}

Requirements:
- Maintain the core message and call-to-action
- Shift the writing style to match the requested tone
- Keep HTML structure intact if present
- Generate a new matching subject line

Return ONLY a JSON object with "subject" and "content" keys, no explanation.`;
    } else {
      // full_variation
      userPrompt = `Create a completely new variation of this email:

Category: ${category}
Original subject: "${originalSubject}"
Original content:
${originalContent || "No content provided"}

Requirements:
- Keep the same purpose and call-to-action
- Use different angles, hooks, and messaging
- Maintain brand consistency
- Keep HTML structure if present, but update copy
- Create a fresh subject line

Return ONLY a JSON object with "subject" and "content" keys, no explanation.`;
    }

    // Call Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI generation failed");
    }

    const aiResponse = await response.json();
    const generatedText = aiResponse.choices?.[0]?.message?.content;

    if (!generatedText) {
      throw new Error("No content generated");
    }

    // Parse the response
    let result;
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanedText = generatedText.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.slice(7);
      }
      if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.slice(3);
      }
      if (cleanedText.endsWith("```")) {
        cleanedText = cleanedText.slice(0, -3);
      }
      result = JSON.parse(cleanedText.trim());
    } catch (parseError) {
      console.error("Parse error:", parseError, "Raw:", generatedText);
      throw new Error("Failed to parse AI response");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      variationType,
      result 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Generate variation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
