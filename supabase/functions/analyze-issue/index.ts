import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { description, imageBase64, vehicleInfo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const messages: any[] = [
      {
        role: "system",
        content: `You are an expert vehicle mechanic AI assistant for "After Brakes", a vehicle service marketplace in Chennai, India. 
Analyze the vehicle issue described by the user. If an image is provided, verify it's a valid vehicle-related image first.
Always provide your analysis using the analyze_vehicle_issue function.`
      },
    ];

    const userContent: any[] = [];
    
    if (description) {
      userContent.push({ type: "text", text: `Issue description: ${description}` });
    }
    if (vehicleInfo) {
      userContent.push({ type: "text", text: `Vehicle: ${vehicleInfo}` });
    }
    if (imageBase64) {
      userContent.push({
        type: "image_url",
        image_url: { url: imageBase64 },
      });
    }

    if (userContent.length === 0) {
      return new Response(JSON.stringify({ error: "No description or image provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    messages.push({ role: "user", content: userContent });

    const body: any = {
      model: "google/gemini-3-flash-preview",
      messages,
      tools: [
        {
          type: "function",
          function: {
            name: "analyze_vehicle_issue",
            description: "Analyze a vehicle issue and provide diagnosis",
            parameters: {
              type: "object",
              properties: {
                is_valid_vehicle_image: {
                  type: "boolean",
                  description: "Whether the uploaded image is a valid vehicle-related image. True if no image was provided.",
                },
                image_rejection_reason: {
                  type: "string",
                  description: "If image is not vehicle-related, explain why. Empty if valid.",
                },
                issue: {
                  type: "string",
                  description: "Description of the detected/possible issue",
                },
                affected_part: {
                  type: "string",
                  description: "The vehicle part affected",
                },
                severity: {
                  type: "string",
                  enum: ["Low", "Medium", "High"],
                },
                recommendation: {
                  type: "string",
                  description: "Brief recommendation for the user",
                },
              },
              required: ["is_valid_vehicle_image", "issue", "affected_part", "severity", "recommendation"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "analyze_vehicle_issue" } },
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI analysis failed");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No analysis result from AI");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-issue error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
