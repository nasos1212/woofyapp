import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

  if (context.pets && context.pets.length > 0) {
    parts.push(`## PETS (${context.pets.length} total)`);
    context.pets.forEach((pet: any, idx: number) => {
      const age = pet.birthday ? calculateAge(pet.birthday) : 'Unknown';
      parts.push(`### Pet ${idx + 1}: ${pet.pet_name}
- Breed: ${pet.pet_breed || 'Mixed/Unknown'}
- Birthday: ${pet.birthday || 'Not set'}
- Age: ${age}
- Notes: ${pet.notes || 'None'}`);
    });
  }

  if (context.selectedPet) {
    parts.push(`## CURRENTLY DISCUSSING: ${context.selectedPet.name} (${context.selectedPet.breed || 'Unknown breed'})`);
  }

  if (context.healthRecords && context.healthRecords.length > 0) {
    parts.push(`## HEALTH RECORDS (${context.healthRecords.length} total)`);
    const recentRecords = context.healthRecords.slice(0, 10);
    recentRecords.forEach((record: any) => {
      parts.push(`- ${record.title} (${record.record_type}) - ${record.date_administered ? new Date(record.date_administered).toLocaleDateString('en-US') : 'No date'}
  Clinic: ${record.clinic_name || 'Unknown'} | Vet: ${record.veterinarian_name || 'Unknown'}
  ${record.next_due_date ? `Next due: ${new Date(record.next_due_date).toLocaleDateString('en-US')}` : ''}
  ${record.notes ? `Notes: ${record.notes}` : ''}`);
    });
  }

  if (context.redemptions && context.redemptions.length > 0) {
    parts.push(`## RECENT OFFER REDEMPTIONS (${context.redemptions.length} total)`);
    const recentRedemptions = context.redemptions.slice(0, 5);
    recentRedemptions.forEach((r: any) => {
      parts.push(`- ${r.offers?.title || 'Offer'} at ${r.businesses?.business_name || 'Business'} (${new Date(r.redeemed_at).toLocaleDateString('en-US')})`);
    });
  }

  if (context.favoriteOffers && context.favoriteOffers.length > 0) {
    parts.push(`## FAVORITE/SAVED OFFERS (${context.favoriteOffers.length} total)`);
    context.favoriteOffers.slice(0, 5).forEach((f: any) => {
      parts.push(`- ${f.offers?.title || 'Offer'} at ${f.offers?.businesses?.business_name || 'Business'}`);
    });
  }

  if (context.recentActivity && context.recentActivity.length > 0) {
    parts.push(`## RECENT USER ACTIVITY (behavior patterns)`);
    const activitySummary: Record<string, number> = {};
    context.recentActivity.forEach((a: any) => {
      const key = a.activity_type + (a.page_path ? ` (${a.page_path})` : '');
      activitySummary[key] = (activitySummary[key] || 0) + 1;
    });
    Object.entries(activitySummary).slice(0, 10).forEach(([activity, count]) => {
      parts.push(`- ${activity}: ${count} times`);
    });
  }

  if (context.communityQuestions && context.communityQuestions.length > 0) {
    parts.push(`## RELEVANT COMMUNITY DISCUSSIONS (${context.communityQuestions.length} related threads)`);
    context.communityQuestions.forEach((q: any) => {
      const answerCount = q.answer_count || 0;
      const helpedCount = q.helped_count || 0;
      const hasVerifiedAnswer = q.has_verified_answer ? '✓ Verified Pro Answer' : '';
      parts.push(`### "${q.title}"
- Category: ${q.category_name || 'General'}
- Urgency: ${q.urgency || 'normal'}
- ${answerCount} answers, helped ${helpedCount} members ${hasVerifiedAnswer}
- Breed tags: ${q.breed_tags?.join(', ') || 'None'}
${q.top_answer ? `- Top answer: "${q.top_answer.substring(0, 200)}..."` : ''}`);
    });
  }

  return parts.length > 0 ? `\n\n---\n# CONTEXT ABOUT THIS USER\n${parts.join('\n\n')}` : '';
};

const calculateAge = (birthday: string): string => {
  const birth = new Date(birthday);
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
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, petInfo, userContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build contextual system prompt with all user data
    let contextualSystemPrompt = SYSTEM_PROMPT;
    
    if (userContext) {
      contextualSystemPrompt += buildContextPrompt(userContext);
    } else if (petInfo) {
      // Fallback to basic pet info if no full context
      contextualSystemPrompt += `\n\n**Current pet context:**
- Pet name: ${petInfo.name || 'Unknown'}
- Breed: ${petInfo.breed || 'Unknown'}`;
    }

    console.log('Processing request with context:', {
      hasUserContext: !!userContext,
      petsCount: userContext?.pets?.length || 0,
      healthRecordsCount: userContext?.healthRecords?.length || 0,
      messagesCount: messages?.length || 0
    });

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