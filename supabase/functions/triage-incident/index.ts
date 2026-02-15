import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { description, issueType } = await req.json();

    if (!description) throw new Error("Description is required");

    const systemPrompt = `You are a cybersecurity incident triage AI for a university help desk. Analyze the incident description and return a JSON classification.

Your task:
1. Classify the incident type from these options ONLY: scam, phishing, online_fraud, hacking_attempt, malware, social_media_threat, other
2. Assign a priority: high, medium, or low
3. Provide a brief reason (1-2 sentences)

Rules:
- If someone reports financial loss, stolen credentials, or ongoing attack: HIGH priority
- If someone reports a suspicious link/email but hasn't interacted: MEDIUM priority  
- General inquiries or non-urgent reports: LOW priority
- Use the description context to pick the most accurate issue type

Respond with ONLY valid JSON, no markdown:
{"issueType": "...", "priority": "...", "reason": "..."}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `User selected issue type: ${issueType || "not specified"}\n\nIncident description:\n${description}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service payment required." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the JSON from the AI response
    let triage;
    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      triage = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      triage = { issueType: issueType || "other", priority: "medium", reason: "AI classification unavailable, defaulting to manual review." };
    }

    // Validate the values
    const validTypes = ["scam", "phishing", "online_fraud", "hacking_attempt", "malware", "social_media_threat", "other"];
    const validPriorities = ["high", "medium", "low"];

    if (!validTypes.includes(triage.issueType)) triage.issueType = issueType || "other";
    if (!validPriorities.includes(triage.priority)) triage.priority = "medium";

    return new Response(
      JSON.stringify(triage),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Triage error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
