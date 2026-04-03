import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userContext, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const isTamil = language === "ta";

    const systemPrompt = `You are an expert AI Voice Mechanic for "After Brakes" in Chennai, India.
You diagnose vehicle problems through a conversational Q&A approach, just like a real mechanic would.
${isTamil ? "\nIMPORTANT: The user is speaking in Tamil. You MUST respond in Tamil (using Tamil script). Keep it conversational and natural Tamil as spoken in Chennai." : ""}

User context:
- Area: ${userContext?.area || "Not specified"}
- Vehicles: ${userContext?.vehicles || "Not specified"}

IMPORTANT RULES:
1. Act like a real mechanic having a face-to-face conversation
2. Ask ONE diagnostic question at a time to narrow down the problem
3. Ask about symptoms: sounds, smells, dashboard lights, when it happens, recent changes
4. After gathering enough info (usually 3-5 questions), provide a diagnosis and suggest fixes
5. Keep responses SHORT (1-3 sentences max) since this is voice conversation
6. Do NOT mention or estimate prices
7. Do NOT use asterisks (*), markdown, bullet points, or any formatting
8. Use natural spoken language, not written style
9. Reference Chennai conditions (heat, monsoon, road quality) when relevant
10. If the issue sounds serious or unsafe, strongly recommend visiting a mechanic immediately
${isTamil ? "11. ALWAYS respond in Tamil script only. Do not use English." : ""}`;

    const allMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: allMessages,
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI voice mechanic failed");
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I could not understand. Can you repeat?";

    return new Response(JSON.stringify({ reply: reply.replace(/\*+/g, "") }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-voice-mechanic error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
