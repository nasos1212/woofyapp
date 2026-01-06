import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isValidUUID = (str: string): boolean => UUID_REGEX.test(str);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    const { userId } = body;
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidUUID(userId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid user ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const alerts: any[] = [];
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Fetch user's membership and pets
    const { data: membership } = await supabase
      .from('memberships')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!membership) {
      return new Response(JSON.stringify({ alerts: [], message: 'No membership found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch pets
    const { data: pets } = await supabase
      .from('pets')
      .select('id, pet_name, pet_breed, birthday')
      .eq('membership_id', membership.id);

    // Fetch health records with upcoming due dates
    const { data: healthRecords } = await supabase
      .from('pet_health_records')
      .select('*, pets!inner(pet_name)')
      .eq('owner_user_id', userId)
      .not('next_due_date', 'is', null)
      .gte('next_due_date', now.toISOString().split('T')[0])
      .lte('next_due_date', thirtyDaysFromNow.toISOString().split('T')[0]);

    // Check for upcoming vaccinations
    if (healthRecords) {
      for (const record of healthRecords) {
        const dueDate = new Date(record.next_due_date);
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        let priority = 'normal';
        if (daysUntilDue <= 3) priority = 'urgent';
        else if (daysUntilDue <= 7) priority = 'high';

        alerts.push({
          user_id: userId,
          alert_type: 'vaccination_due',
          title: `${record.title} due soon for ${record.pets?.pet_name}`,
          message: `${record.pets?.pet_name}'s ${record.title} is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''} (${dueDate.toLocaleDateString()}). Don't forget to schedule an appointment!`,
          priority,
          data: {
            pet_name: record.pets?.pet_name,
            record_id: record.id,
            record_type: record.record_type,
            due_date: record.next_due_date,
            days_until_due: daysUntilDue
          },
          expires_at: new Date(dueDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    }

    // Check for upcoming pet birthdays
    if (pets) {
      for (const pet of pets) {
        if (!pet.birthday) continue;
        
        const birthday = new Date(pet.birthday);
        const thisYearBirthday = new Date(now.getFullYear(), birthday.getMonth(), birthday.getDate());
        
        if (thisYearBirthday < now) {
          thisYearBirthday.setFullYear(thisYearBirthday.getFullYear() + 1);
        }
        
        const daysUntilBirthday = Math.ceil((thisYearBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilBirthday <= 14) {
          const age = thisYearBirthday.getFullYear() - birthday.getFullYear();
          
          alerts.push({
            user_id: userId,
            alert_type: 'birthday_coming',
            title: `🎂 ${pet.pet_name}'s birthday is coming up!`,
            message: `${pet.pet_name} will be ${age} year${age !== 1 ? 's' : ''} old on ${thisYearBirthday.toLocaleDateString()}! Check out our partner offers for pet treats and gifts.`,
            priority: daysUntilBirthday <= 3 ? 'high' : 'normal',
            data: {
              pet_name: pet.pet_name,
              pet_id: pet.id,
              birthday: pet.birthday,
              age,
              days_until: daysUntilBirthday
            },
            expires_at: new Date(thisYearBirthday.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString()
          });
        }
      }
    }

    // Fetch user's recent activity to suggest relevant offers
    const { data: recentActivity } = await supabase
      .from('user_activity_tracking')
      .select('activity_type, activity_data, page_path')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Analyze activity for offer suggestions
    if (recentActivity && recentActivity.length > 0) {
      const offerViews = recentActivity.filter(a => a.activity_type === 'offer_view');
      const categoryInterests: Record<string, number> = {};
      
      offerViews.forEach(a => {
        const category = a.activity_data?.category;
        if (category && typeof category === 'string') {
          categoryInterests[category] = (categoryInterests[category] || 0) + 1;
        }
      });

      // Find top interested category
      const topCategory = Object.entries(categoryInterests)
        .sort((a, b) => b[1] - a[1])[0];

      if (topCategory && topCategory[1] >= 3) {
        alerts.push({
          user_id: userId,
          alert_type: 'offer_suggestion',
          title: `New offers in ${topCategory[0]} you might like!`,
          message: `Based on your interests, we found some great ${topCategory[0]} deals for your pets. Check them out!`,
          priority: 'low',
          data: { category: topCategory[0], view_count: topCategory[1] },
          expires_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    }

    // Check for existing alerts to avoid duplicates
    const { data: existingAlerts } = await supabase
      .from('ai_proactive_alerts')
      .select('alert_type, data')
      .eq('user_id', userId)
      .eq('is_dismissed', false)
      .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());

    // Filter out duplicate alerts
    const newAlerts = alerts.filter(alert => {
      return !existingAlerts?.some(existing => 
        existing.alert_type === alert.alert_type && 
        JSON.stringify(existing.data) === JSON.stringify(alert.data)
      );
    });

    // Insert new alerts
    if (newAlerts.length > 0) {
      await supabase
        .from('ai_proactive_alerts')
        .insert(newAlerts);
    }

    return new Response(JSON.stringify({ 
      alerts: newAlerts, 
      message: `Generated ${newAlerts.length} new alerts` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('generate-ai-alerts error:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(
      JSON.stringify({ error: 'An error occurred. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
