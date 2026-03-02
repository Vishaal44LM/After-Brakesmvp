import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { description, imageUrl, action } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const messages: any[] = [{ role: "system", content: "" }];

    if (action === "verify-image") {
      messages[0].content = "You are a vehicle image verification assistant. Determine if the uploaded image is an appropriate vehicle-related image (car, bike, engine, parts, damage, etc). Respond with JSON only.";
      const userContent: any[] = [
        { type: "text", text: "Is this an appropriate vehicle-related image? Respond with: {\"isVehicleImage\": true/false, \"reason\": \"brief explanation\"}" },
      ];
      if (imageUrl) {
        userContent.push({ type: "image_url", image_url: { url: imageUrl } });
      }
      messages.push({ role: "user", content: userContent });
    } else {
      messages[0].content = `You are an expert vehicle mechanic AI assistant. Analyze the vehicle issue described and provide a diagnosis. Always respond with valid JSON in this exact format:
{
  "issue": "Brief description of the detected issue",
  "part": "Affected vehicle part",
  "severity": "Low" or "Medium" or "High",
  "estimatedCostMin": number (in INR),
  "estimatedCostMax": number (in INR),
  "recommendation": "Brief recommendation for the user"
}`;
      const userContent: any[] = [
        { type: "text", text: `Vehicle issue description: ${description || "No description provided"}` },
      ];
      if (imageUrl) {
        userContent.push({ type: "image_url", image_url: { url: imageUrl } });
      }
      messages.push({ role: "user", content: userContent });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Try to parse JSON from the response
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: content };
    } catch {
      parsed = { raw: content };
    }

    return new Response(JSON.stringify({ success: true, analysis: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-issue error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
