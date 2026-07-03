import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * AI Vehicle Vision Assistant
 * Analyzes vehicle images (dashboard lights, damage, tyres, engine bay, etc.)
 * OR automobile documents (RC, insurance, PUC, service records, bills, etc.)
 * and returns a structured diagnostic report.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { fileBase64, fileName, mimeType, mode } = await req.json();
    if (!fileBase64) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const isDocument = mode === "document";

    const systemPrompt = isDocument
      ? `You are the After Brakes AI Vehicle Vision Assistant, specialized in analyzing automobile documents (RC, Insurance, PUC, Service History, Repair Bills, Mechanic Estimates, Warranty Documents, Vehicle Manuals, Inspection Reports, Roadside Assistance).
Extract key details, flag missing information, highlight important dates (expiry / renewal / next service) and provide clear recommendations. Always call analyze_vehicle_upload.`
      : `You are the After Brakes AI Vehicle Vision Assistant, specialized in vehicle diagnostics from images: dashboard warning lights, engine bay inspection, battery condition, oil leakage, tyre wear, brake components, suspension issues, exterior/accident damage, rust, fluid levels, missing components, and overall vehicle health.
If the image is not vehicle-related, mark is_valid=false. Always call analyze_vehicle_upload.`;

    const userContent: any[] = [
      { type: "text", text: isDocument ? `Analyze this automobile document: ${fileName || "document"}` : `Analyze this vehicle image: ${fileName || "image"}` },
    ];

    // Both PDFs and images: OpenRouter/Gemini accepts image_url for images
    // and `file` blocks for PDFs. Route by mime type.
    if (isDocument && mimeType === "application/pdf") {
      userContent.push({
        type: "file",
        file: { filename: fileName || "document.pdf", file_data: fileBase64 },
      });
    } else {
      userContent.push({ type: "image_url", image_url: { url: fileBase64 } });
    }

    const body = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      tools: [{
        type: "function",
        function: {
          name: "analyze_vehicle_upload",
          description: "Return a structured analysis of the uploaded vehicle image or document",
          parameters: {
            type: "object",
            properties: {
              is_valid: { type: "boolean", description: "Whether the upload is a valid vehicle image or automobile document" },
              rejection_reason: { type: "string", description: "If not valid, explain why. Empty otherwise." },
              category: { type: "string", description: "Detected category e.g. 'Dashboard Warning', 'Tyre Wear', 'RC Certificate', 'Insurance Policy'" },
              summary: { type: "string", description: "Short 1-2 sentence summary of what was detected" },
              severity: { type: "string", enum: ["Info", "Low", "Medium", "High", "Critical"], description: "Overall severity" },
              explanation: { type: "string", description: "Detailed explanation for the user in plain language" },
              recommended_actions: {
                type: "array", items: { type: "string" },
                description: "Ordered list of recommended next steps",
              },
              important_dates: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    label: { type: "string" },
                    date: { type: "string" },
                  },
                  required: ["label", "date"],
                  additionalProperties: false,
                },
                description: "Important dates found (documents): expiry, renewal, next service, etc.",
              },
              missing_information: {
                type: "array", items: { type: "string" },
                description: "Fields or details missing from the document / image",
              },
              vehicle_health_score: { type: "number", description: "0-100 estimated health score (images only, 0 for documents)" },
              maintenance_recommendations: { type: "array", items: { type: "string" } },
              urgent_warnings: { type: "array", items: { type: "string" } },
              safety_alerts: { type: "array", items: { type: "string" } },
              service_suggestions: { type: "array", items: { type: "string" } },
            },
            required: ["is_valid", "category", "summary", "severity", "explanation", "recommended_actions"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "analyze_vehicle_upload" } },
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
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI analysis failed");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No analysis returned");
    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("analyze-vehicle-vision error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
