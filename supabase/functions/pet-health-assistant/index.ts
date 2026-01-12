import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
8. **Proactive Reminders** - Alert users about upcoming vaccinations, medications, and pet birthdays
9. **Activity Awareness** - Understand user's app usage patterns to provide more relevant assistance

## CONTEXTUAL AWARENESS
You will receive detailed context about:
- **User Profile**: Name, contact information, membership status
- **Pet Details**: Name, breed, birthday/age, health notes
- **Health Records**: Vaccinations, vet visits, medications, upcoming appointments
- **Upcoming Reminders**: Medications, vaccinations, and appointments due soon (with urgency levels)
- **Pending Birthdays**: Pet birthdays coming up in the next 60 days
- **Lost Pet Alerts**: Any active lost pet alerts the user has posted
- **Offer History**: What discounts they've used, favorite businesses
- **Favorite Offers**: What deals they're interested in
- **Recent Activity**: Pages they've visited, features they use most, what they're interested in
- **Community Questions**: Relevant questions and answers from the Wooffy community about similar topics, breeds, or issues

USE THIS CONTEXT to:
- Address the pet by name naturally ("Based on Luna's breed...")
- Reference their health history ("Since Luna had her rabies vaccine in March...")
- **Proactively mention upcoming reminders** ("I notice Luna's heartworm medication is due in 3 days...")
- **Celebrate upcoming birthdays** ("Luna's 5th birthday is coming up in 2 weeks! 🎂")
- **Be aware of lost pet situations** ("I see you have an active alert for Max. Any updates on the search?")
- Suggest relevant offers ("There's a great grooming offer at PetSpa that would be perfect for Luna!")
- Calculate age-appropriate advice using their birthday
- Track patterns ("I notice Luna has been to the vet twice this month...")
- Reference their interests based on activity ("I see you've been looking at grooming offers lately...")
- **Reference community wisdom** ("Other Wooffy members with Golden Retrievers have found that..." or "12 members in the community reported similar symptoms...")
- Link to relevant community discussions when appropriate ("You might find this community thread helpful: [topic]")

## PROACTIVE AWARENESS
When you see upcoming reminders or important events:
- **Overdue items**: Mention with urgency ("Luna's rabies vaccine is overdue by 5 days - please schedule this soon!")
- **Due today**: Highlight immediately ("Today is the day for Luna's heartworm medication!")
- **Due this week**: Mention helpfully ("Luna's vet checkup is scheduled for Friday")
- **Upcoming birthdays**: Be celebratory and suggest party ideas or treats

## COMMUNITY INTEGRATION
When you have community context:
- Mention how many members have discussed similar topics
- Reference verified professional answers when available
- Suggest the user check out or contribute to related community discussions
- Use phrases like "Based on experiences shared by 15 other pet parents..." or "A verified vet in our community recommends..."
- Never present community advice as medical fact - always frame it as shared experiences

## RESPONSE GUIDELINES
- Keep responses concise but helpful (2-3 paragraphs max unless detail is needed)
- Use relevant emojis sparingly 🐕 🐾 💊 🎂
- Be proactive - if you notice something in their records or reminders, mention it
- For health concerns, ALWAYS recommend consulting a veterinarian
- Never diagnose definitively - suggest possibilities and recommend professional evaluation

## LANGUAGE RULE (CRITICAL - MUST FOLLOW)
You MUST respond in the language specified in the user's profile preference OR the language they write in.

**Priority order:**
1. If the user writes their message in a non-English language (Greek, Spanish, etc.), respond ENTIRELY in that language
2. Otherwise, use the user's preferred_language from their profile
3. If no preference is set, default to English

**IMPORTANT:**
- When responding in a language, use that language for the ENTIRE response - every word, every sentence
- Never mix languages (e.g., don't write some sentences in English and some in Greek)
- Translate everything including greetings, advice, and disclaimers
- If the user writes in Greek (Ελληνικά), respond completely in Greek
- If the user writes in Spanish (Español), respond completely in Spanish

**EXCEPTION - SPECIAL HANDLING:**
- **Pet names** (e.g., "Kobe", "Falafel", "Luna") - ALWAYS keep exactly as they are, never translate
- **Breed names** (e.g., "Golden Retriever", "French Bulldog") - ALWAYS keep in English, never translate
- **Medication names** (e.g., "Apoquel", "Heartgard", "Frontline", "Bravecto") - ALWAYS keep in English
- **Vaccine names** (e.g., "DHPP", "Bordetella", "Rabies vaccine", "Leptospirosis") - ALWAYS keep in English
- **Business/Partner names** from Wooffy - ALWAYS keep in English
- **Record types** (e.g., "vaccination", "checkup", "medication", "surgery") - ALWAYS keep in English

**MEDICAL TERMS - Translate with English in brackets:**
- For medical/veterinary conditions and terms (e.g., "rabies", "parvo", "heartworm", "arthritis", "diabetes", "allergies")
- Translate the term to the user's language BUT always include the English term in brackets
- Example in Greek: "λύσσα (rabies)" or "αρθρίτιδα (arthritis)"
- Example in Spanish: "rabia (rabies)" or "artritis (arthritis)"
- This helps users research conditions and communicate with vets

**Language codes reference:**
- en = English
- el = Greek (Ελληνικά)
- es = Spanish (Español)
- de = German (Deutsch)
- fr = French (Français)
- it = Italian (Italiano)
- pt = Portuguese (Português)
- ru = Russian (Русский)
- ar = Arabic (العربية)

## DISCLAIMER (include when discussing health concerns - translate to response language)
"Remember, I'm an AI assistant and can't replace professional veterinary care. If you're concerned about your pet's health, please consult your veterinarian."`;

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  el: 'Greek',
  es: 'Spanish',
  de: 'German',
  fr: 'French',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  tr: 'Turkish',
  ar: 'Arabic',
};

const buildContextPrompt = (context: any): string => {
  const parts: string[] = [];
  
  // Add language preference at the top for visibility
  if (context.userProfile?.preferred_language) {
    const langCode = context.userProfile.preferred_language;
    const langName = LANGUAGE_NAMES[langCode] || langCode;
    parts.push(`## USER'S PREFERRED LANGUAGE: ${langName} (${langCode})
**You MUST respond entirely in ${langName} unless the user writes in a different language.**`);
  }
  
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
      const age = pet.birthday 
        ? calculateAge(pet.birthday) 
        : (pet.age_years ? `~${pet.age_years} years` : 'Unknown');
      const gender = pet.gender === 'male' ? 'Male' : pet.gender === 'female' ? 'Female' : 'Unknown';
      parts.push(`### Pet ${idx + 1}: ${String(pet.pet_name || 'Unknown').substring(0, 100)}
- Breed: ${String(pet.pet_breed || 'Mixed/Unknown').substring(0, 100)}
- Gender: ${gender}
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

  // Add upcoming reminders with urgency indicators
  if (context.upcomingReminders && Array.isArray(context.upcomingReminders)) {
    const reminders = context.upcomingReminders.slice(0, 10);
    const overdue = reminders.filter((r: any) => r.is_overdue);
    const urgent = reminders.filter((r: any) => r.is_urgent && !r.is_overdue);
    const upcoming = reminders.filter((r: any) => !r.is_urgent && !r.is_overdue);
    
    parts.push(`## UPCOMING REMINDERS & MEDICATIONS`);
    
    if (overdue.length > 0) {
      parts.push(`### ⚠️ OVERDUE (${overdue.length})`);
      overdue.forEach((r: any) => {
        parts.push(`- **${r.pet_name}**: ${r.title} (${r.record_type}) - OVERDUE by ${Math.abs(r.days_until)} days
  ${r.preferred_time ? `Preferred time: ${r.preferred_time}` : ''}`);
      });
    }
    
    if (urgent.length > 0) {
      parts.push(`### 🔔 DUE THIS WEEK (${urgent.length})`);
      urgent.forEach((r: any) => {
        const dueText = r.days_until === 0 ? 'TODAY' : `in ${r.days_until} days`;
        parts.push(`- **${r.pet_name}**: ${r.title} (${r.record_type}) - Due ${dueText}
  ${r.preferred_time ? `Preferred time: ${r.preferred_time}` : ''}`);
      });
    }
    
    if (upcoming.length > 0) {
      parts.push(`### 📅 COMING UP (${upcoming.length})`);
      upcoming.forEach((r: any) => {
        parts.push(`- **${r.pet_name}**: ${r.title} (${r.record_type}) - in ${r.days_until} days (${r.next_due_date})`);
      });
    }
  }

  // Add pending pet birthdays
  if (context.pendingBirthdays && Array.isArray(context.pendingBirthdays)) {
    const birthdays = context.pendingBirthdays.slice(0, 5);
    if (birthdays.length > 0) {
      parts.push(`## 🎂 UPCOMING PET BIRTHDAYS`);
      birthdays.forEach((b: any) => {
        const dueText = b.days_until === 0 ? 'TODAY!' : b.days_until === 1 ? 'TOMORROW!' : `in ${b.days_until} days`;
        parts.push(`- **${b.pet_name}** (${b.pet_breed || 'Unknown breed'}) turns ${b.upcoming_age} ${dueText}`);
      });
    }
  }

  // Add active lost pet alerts
  if (context.lostPetAlerts && Array.isArray(context.lostPetAlerts)) {
    const alerts = context.lostPetAlerts.slice(0, 3);
    if (alerts.length > 0) {
      parts.push(`## 🚨 ACTIVE LOST PET ALERTS`);
      alerts.forEach((a: any) => {
        parts.push(`- **${a.pet_name}** (${a.pet_breed || 'Unknown breed'}) - Last seen: ${a.last_seen_location || 'Unknown'}
  Alert created: ${a.created_at ? new Date(a.created_at).toLocaleDateString('en-US') : 'Unknown'}`);
      });
    }
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

  // Verify user authentication
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    console.log('No authorization header provided');
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    console.log('Invalid authentication token:', userError?.message);
    return new Response(
      JSON.stringify({ error: 'Invalid authentication token' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Use authenticated user ID for rate limiting
  const rateLimitId = `user:${user.id}`;
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
