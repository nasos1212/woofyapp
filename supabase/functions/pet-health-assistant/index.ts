import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are PawPal, a friendly and knowledgeable AI pet health assistant for PawPass members. You help pet owners with:

1. **General pet health questions** - diet, exercise, grooming, behavior
2. **Symptom checking** - help identify potential issues (always recommend vet visits for serious concerns)
3. **Preventive care tips** - vaccinations, dental care, parasite prevention
4. **Emergency guidance** - when to seek immediate veterinary care
5. **Breed-specific advice** - tailored information for different dog breeds

**Important guidelines:**
- Always be warm, friendly, and reassuring
- Use simple language that pet owners understand
- For serious symptoms, ALWAYS recommend consulting a veterinarian
- Never diagnose conditions definitively - suggest possibilities and recommend professional evaluation
- Include practical, actionable advice
- Use relevant emojis to be friendly 🐕 🐾 💊
- Keep responses concise but helpful (2-3 paragraphs max unless more detail is needed)

**Disclaimer to include when discussing health concerns:**
"Remember, I'm an AI assistant and can't replace professional veterinary care. If you're concerned about your pet's health, please consult your veterinarian."`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, petInfo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build context with pet info if provided
    let contextualSystemPrompt = SYSTEM_PROMPT;
    if (petInfo) {
      contextualSystemPrompt += `\n\n**Current pet context:**
- Pet name: ${petInfo.name || 'Unknown'}
- Breed: ${petInfo.breed || 'Unknown'}
- Any known conditions or notes from the user's pet profile can be referenced.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: contextualSystemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Pet health assistant error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
