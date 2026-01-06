import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation constants
const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 10000;
const MAX_CONTEXT_ITEMS = 100;

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 20; // 20 requests per minute per user
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // Clean up old entries every 5 minutes

// In-memory rate limit store
interface RateLimitEntry {
  requests: number[];
}
const rateLimitStore = new Map<string, RateLimitEntry>();

// Periodic cleanup of old rate limit entries
let lastCleanup = Date.now();
const cleanupRateLimitStore = () => {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  
  lastCleanup = now;
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  
  for (const [key, entry] of rateLimitStore.entries()) {
    entry.requests = entry.requests.filter(ts => ts > cutoff);
    if (entry.requests.length === 0) {
      rateLimitStore.delete(key);
    }
  }
};

// Check and update rate limit - returns true if request should be allowed
const checkRateLimit = (identifier: string): { allowed: boolean; remaining: number; resetIn: number } => {
  cleanupRateLimitStore();
  
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  
  let entry = rateLimitStore.get(identifier);
  if (!entry) {
    entry = { requests: [] };
    rateLimitStore.set(identifier, entry);
  }
  
  // Filter to only requests within the current window
  entry.requests = entry.requests.filter(ts => ts > windowStart);
  
  const remaining = MAX_REQUESTS_PER_WINDOW - entry.requests.length;
  const oldestRequest = entry.requests[0];
  const resetIn = oldestRequest ? Math.ceil((oldestRequest + RATE_LIMIT_WINDOW_MS - now) / 1000) : 0;
  
  if (entry.requests.length >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0, resetIn };
  }
  
  // Add current request
  entry.requests.push(now);
  return { allowed: true, remaining: remaining - 1, resetIn: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000) };
};

// Extract identifier for rate limiting (user ID from auth header or IP)
const getRateLimitIdentifier = (req: Request): string => {
  // Try to get user ID from authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    // Use a hash of the auth token to identify users
    const token = authHeader.replace('Bearer ', '');
    // Simple hash for identification (not cryptographic, just for rate limit keying)
    let hash = 0;
    for (let i = 0; i < Math.min(token.length, 100); i++) {
      hash = ((hash << 5) - hash) + token.charCodeAt(i);
      hash |= 0;
    }
    return `auth:${hash}`;
  }
  
  // Fallback to IP address
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';
  return `ip:${ip}`;
};

const SYSTEM_PROMPT = `You are Wooffy, a highly intelligent and personalized AI pet health assistant for Wooffy members. You have deep knowledge of your user and their pets.

## YOUR CORE IDENTITY
- You are warm, friendly, and genuinely care about pets and their owners
- You remember context from the conversation and build on previous topics
- You proactively offer relevant advice based on what you know about the user's pet

## YOUR CAPABILITIES
1. **Personalized Pet Health Advice** - Using the pet's specific breed, age, and health history
2. **Symptom Analysis** - Help identify potential issues based on the pet's profile (always recommend vet visits for serious concerns)
3. **Preventive Care Planning** - Tailored vaccination schedules, dental care, parasite prevention based on their records
4. **Breed-Specific Guidance** - Deep knowledge of breed-specific health concerns, exercise needs, nutrition
5. **Behavioral Understanding** - Interpret behaviors in context of breed, age, and known health conditions
6. **Offer & Savings Recommendations** - Suggest relevant Wooffy partner offers based on their pet's needs
7. **Community Knowledge** - Reference relevant community discussions and experiences from other Wooffy members

## CONTEXTUAL AWARENESS
You will receive detailed context about:
- **User Profile**: Name, contact information, membership status
- **Pet Details**: Name, breed, birthday/age, health notes
- **Health Records**: Vaccinations, vet visits, medications, upcoming appointments
- **Offer History**: What discounts they've used, favorite businesses
- **Favorite Offers**: What deals they're interested in
- **Recent Activity**: Pages they've visited, features they use most, what they're interested in
- **Community Questions**: Relevant questions and answers from the Wooffy community about similar topics, breeds, or issues

USE THIS CONTEXT to:
- Address the pet by name naturally ("Based on Luna's breed...")
- Reference their health history ("Since Luna had her rabies vaccine in March...")
- Suggest relevant offers ("There's a great grooming offer at PetSpa that would be perfect for Luna!")
- Calculate age-appropriate advice using their birthday
- Track patterns ("I notice Luna has been to the vet twice this month...")
- Reference their interests based on activity ("I see you've been looking at grooming offers lately...")
- **Reference community wisdom** ("Other Wooffy members with Golden Retrievers have found that..." or "12 members in the community reported similar symptoms...")
- Link to relevant community discussions when appropriate ("You might find this community thread helpful: [topic]")

## COMMUNITY INTEGRATION
When you have community context:
- Mention how many members have discussed similar topics
- Reference verified professional answers when available
- Suggest the user check out or contribute to related community discussions
- Use phrases like "Based on experiences shared by 15 other pet parents..." or "A verified vet in our community recommends..."
- Never present community advice as medical fact - always frame it as shared experiences

## RESPONSE GUIDELINES
- Keep responses concise but helpful (2-3 paragraphs max unless detail is needed)
- Use relevant emojis sparingly 🐕 🐾 💊
- Be proactive - if you notice something in their records, mention it
- For health concerns, ALWAYS recommend consulting a veterinarian
- Never diagnose definitively - suggest possibilities and recommend professional evaluation

## LANGUAGE RULE (CRITICAL)
**ALWAYS respond in the same language the user writes in.** If they write in Spanish, respond in Spanish. If they write in Portuguese, respond in Portuguese. Match their language naturally while maintaining your friendly Wooffy personality.

## DISCLAIMER (include when discussing health concerns)
"Remember, I'm an AI assistant and can't replace professional veterinary care. If you're concerned about your pet's health, please consult your veterinarian." (Translate this to the user's language)`;

const buildContextPrompt = (context: any): string => {
  const parts: string[] = [];
  
  if (context.userProfile) {
    parts.push(`## USER PROFILE
- Name: ${context.userProfile.full_name || 'Unknown'}
- Email: ${context.userProfile.email || 'Unknown'}
- Phone: ${context.userProfile.phone || 'Not provided'}
- Member since: ${context.userProfile.created_at ? new Date(context.userProfile.created_at).toLocaleDateString('en-US') : 'Unknown'}`);
  }

  if (context.membership) {
    parts.push(`## MEMBERSHIP
- Plan: ${context.membership.plan_type || 'Standard'}
- Member Number: ${context.membership.member_number}
- Active: ${context.membership.is_active ? 'Yes' : 'No'}
- Expires: ${context.membership.expires_at ? new Date(context.membership.expires_at).toLocaleDateString('en-US') : 'Unknown'}`);
  }

  if (context.pets && Array.isArray(context.pets)) {
    const pets = context.pets.slice(0, MAX_CONTEXT_ITEMS);
    parts.push(`## PETS (${pets.length} total)`);
    pets.forEach((pet: any, idx: number) => {
      const age = pet.birthday ? calculateAge(pet.birthday) : 'Unknown';
      parts.push(`### Pet ${idx + 1}: ${String(pet.pet_name || 'Unknown').substring(0, 100)}
- Breed: ${String(pet.pet_breed || 'Mixed/Unknown').substring(0, 100)}
- Birthday: ${pet.birthday || 'Not set'}
- Age: ${age}
- Notes: ${String(pet.notes || 'None').substring(0, 500)}`);
    });
  }

  if (context.selectedPet) {
    parts.push(`## CURRENTLY DISCUSSING: ${String(context.selectedPet.name || 'Unknown').substring(0, 100)} (${String(context.selectedPet.breed || 'Unknown breed').substring(0, 100)})`);
  }

  if (context.healthRecords && Array.isArray(context.healthRecords)) {
    const records = context.healthRecords.slice(0, 10);
    parts.push(`## HEALTH RECORDS (${records.length} shown)`);
    records.forEach((record: any) => {
      parts.push(`- ${String(record.title || 'Record').substring(0, 100)} (${record.record_type}) - ${record.date_administered ? new Date(record.date_administered).toLocaleDateString('en-US') : 'No date'}
  Clinic: ${String(record.clinic_name || 'Unknown').substring(0, 100)} | Vet: ${String(record.veterinarian_name || 'Unknown').substring(0, 100)}
  ${record.next_due_date ? `Next due: ${new Date(record.next_due_date).toLocaleDateString('en-US')}` : ''}
  ${record.notes ? `Notes: ${String(record.notes).substring(0, 200)}` : ''}`);
    });
  }

  if (context.redemptions && Array.isArray(context.redemptions)) {
    const redemptions = context.redemptions.slice(0, 5);
    parts.push(`## RECENT OFFER REDEMPTIONS`);
    redemptions.forEach((r: any) => {
      parts.push(`- ${String(r.offers?.title || 'Offer').substring(0, 100)} at ${String(r.businesses?.business_name || 'Business').substring(0, 100)} (${new Date(r.redeemed_at).toLocaleDateString('en-US')})`);
    });
  }

  if (context.favoriteOffers && Array.isArray(context.favoriteOffers)) {
    const favorites = context.favoriteOffers.slice(0, 5);
    parts.push(`## FAVORITE/SAVED OFFERS`);
    favorites.forEach((f: any) => {
      parts.push(`- ${String(f.offers?.title || 'Offer').substring(0, 100)} at ${String(f.offers?.businesses?.business_name || 'Business').substring(0, 100)}`);
    });
  }

  if (context.recentActivity && Array.isArray(context.recentActivity)) {
    parts.push(`## RECENT USER ACTIVITY`);
    const activitySummary: Record<string, number> = {};
    context.recentActivity.slice(0, MAX_CONTEXT_ITEMS).forEach((a: any) => {
      const key = String(a.activity_type || 'unknown').substring(0, 50);
      activitySummary[key] = (activitySummary[key] || 0) + 1;
    });
    Object.entries(activitySummary).slice(0, 10).forEach(([activity, count]) => {
      parts.push(`- ${activity}: ${count} times`);
    });
  }

  if (context.communityQuestions && Array.isArray(context.communityQuestions)) {
    const questions = context.communityQuestions.slice(0, 5);
    parts.push(`## RELEVANT COMMUNITY DISCUSSIONS`);
    questions.forEach((q: any) => {
      const answerCount = q.answer_count || 0;
      const helpedCount = q.helped_count || 0;
      const hasVerifiedAnswer = q.has_verified_answer ? '✓ Verified Pro Answer' : '';
      parts.push(`### "${String(q.title || 'Question').substring(0, 150)}"
- Category: ${String(q.category_name || 'General').substring(0, 50)}
- Urgency: ${q.urgency || 'normal'}
- ${answerCount} answers, helped ${helpedCount} members ${hasVerifiedAnswer}
- Breed tags: ${Array.isArray(q.breed_tags) ? q.breed_tags.slice(0, 5).join(', ') : 'None'}
${q.top_answer ? `- Top answer: "${String(q.top_answer).substring(0, 200)}..."` : ''}`);
    });
  }

  return parts.length > 0 ? `\n\n---\n# CONTEXT ABOUT THIS USER\n${parts.join('\n\n')}` : '';
};

const calculateAge = (birthday: string): string => {
  try {
    const birth = new Date(birthday);
    if (isNaN(birth.getTime())) return 'Unknown';
    
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    
    if (years === 0) {
      return `${months} month${months !== 1 ? 's' : ''} old`;
    } else if (years === 1 && months < 0) {
      return `${12 + months} months old`;
    } else {
      return `${years} year${years !== 1 ? 's' : ''} old`;
    }
  } catch {
    return 'Unknown';
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Check rate limit before processing
  const rateLimitId = getRateLimitIdentifier(req);
  const rateLimit = checkRateLimit(rateLimitId);
  
  if (!rateLimit.allowed) {
    console.log(`Rate limit exceeded for ${rateLimitId}`);
    return new Response(
      JSON.stringify({ 
        error: `Too many requests. Please wait ${rateLimit.resetIn} seconds before trying again.` 
      }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(MAX_REQUESTS_PER_WINDOW),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimit.resetIn),
          'Retry-After': String(rateLimit.resetIn)
        } 
      }
    );
  }

  try {
    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { messages, petInfo, userContext } = body;
    
    // Validate messages
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limit messages to prevent abuse
    const sanitizedMessages = messages.slice(-MAX_MESSAGES).map((msg: any) => ({
      role: String(msg.role || 'user').substring(0, 20),
      content: String(msg.content || '').substring(0, MAX_MESSAGE_LENGTH)
    }));

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build contextual system prompt with all user data
    let contextualSystemPrompt = SYSTEM_PROMPT;
    
    if (userContext && typeof userContext === 'object') {
      contextualSystemPrompt += buildContextPrompt(userContext);
    } else if (petInfo && typeof petInfo === 'object') {
      contextualSystemPrompt += `\n\n**Current pet context:**
- Pet name: ${String(petInfo.name || 'Unknown').substring(0, 100)}
- Breed: ${String(petInfo.breed || 'Unknown').substring(0, 100)}`;
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
          ...sanitizedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Service is busy. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "AI service error. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("pet-health-assistant error:", error instanceof Error ? error.message : 'Unknown error');
    return new Response(
      JSON.stringify({ error: "An error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
