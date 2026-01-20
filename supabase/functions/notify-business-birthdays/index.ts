import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting business birthday notification check...');

    // Fetch all business birthday settings where reminders are enabled
    const { data: enabledBusinesses, error: settingsError } = await supabase
      .from('business_birthday_settings')
      .select('business_id, days_before_reminder, custom_message')
      .eq('enabled', true);

    if (settingsError) {
      console.error('Error fetching birthday settings:', settingsError);
      throw settingsError;
    }

    if (!enabledBusinesses || enabledBusinesses.length === 0) {
      console.log('No businesses with birthday reminders enabled');
      return new Response(JSON.stringify({ 
        message: 'No businesses with birthday reminders enabled',
        notificationsSent: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${enabledBusinesses.length} businesses with reminders enabled`);

    let totalNotificationsSent = 0;
    const now = new Date();

    for (const business of enabledBusinesses) {
      const { business_id, days_before_reminder } = business;

      // Get business details including owner user_id
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('id, business_name, user_id')
        .eq('id', business_id)
        .single();

      if (businessError || !businessData) {
        console.error(`Error fetching business ${business_id}:`, businessError);
        continue;
      }

      // Get all redemptions for this business to find customer pets
      const { data: redemptionsData, error: redemptionsError } = await supabase
        .from('offer_redemptions')
        .select('membership_id')
        .eq('business_id', business_id);

      if (redemptionsError) {
        console.error(`Error fetching redemptions for business ${business_id}:`, redemptionsError);
        continue;
      }

      // Get unique membership IDs
      const membershipIds = [...new Set(redemptionsData?.map(r => r.membership_id) || [])];
      
      if (membershipIds.length === 0) {
        console.log(`No customer redemptions found for business ${businessData.business_name}`);
        continue;
      }

      // Get pets for these memberships with birthdays
      const { data: petsData, error: petsError } = await supabase
        .from('pets')
        .select('id, pet_name, pet_breed, birthday, owner_user_id')
        .in('membership_id', membershipIds)
        .not('birthday', 'is', null);

      if (petsError) {
        console.error(`Error fetching pets for business ${business_id}:`, petsError);
        continue;
      }

      if (!petsData || petsData.length === 0) {
        console.log(`No pets with birthdays found for business ${businessData.business_name}`);
        continue;
      }

      // Calculate upcoming birthdays within the reminder window
      const upcomingBirthdays = petsData.filter(pet => {
        if (!pet.birthday) return false;
        
        const birthday = new Date(pet.birthday);
        const thisYearBirthday = new Date(now.getFullYear(), birthday.getMonth(), birthday.getDate());
        
        // If birthday has passed this year, check next year
        if (thisYearBirthday < now) {
          thisYearBirthday.setFullYear(thisYearBirthday.getFullYear() + 1);
        }
        
        const daysUntil = Math.ceil((thisYearBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntil === days_before_reminder; // Only notify on the exact reminder day
      });

      if (upcomingBirthdays.length === 0) {
        console.log(`No upcoming birthdays matching reminder window for ${businessData.business_name}`);
        continue;
      }

      console.log(`Found ${upcomingBirthdays.length} upcoming birthdays for ${businessData.business_name}`);

      // Get owner profiles for the pets
      const ownerIds = [...new Set(upcomingBirthdays.map(p => p.owner_user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', ownerIds);

      // Check which pets have already been notified today
      const today = now.toISOString().split('T')[0];
      const { data: existingNotifications } = await supabase
        .from('notifications')
        .select('data')
        .eq('user_id', businessData.user_id)
        .eq('type', 'business_birthday_reminder')
        .gte('created_at', `${today}T00:00:00Z`)
        .lte('created_at', `${today}T23:59:59Z`);

      const alreadyNotifiedPetIds = new Set(
        existingNotifications?.map(n => (n.data as any)?.pet_id).filter(Boolean) || []
      );

      // Create notifications for each upcoming birthday
      for (const pet of upcomingBirthdays) {
        // Skip if already notified today
        if (alreadyNotifiedPetIds.has(pet.id)) {
          console.log(`Already notified for pet ${pet.pet_name} today, skipping`);
          continue;
        }

        const profile = profilesData?.find(p => p.user_id === pet.owner_user_id);
        const ownerName = profile?.full_name || 'A customer';
        
        const birthday = new Date(pet.birthday);
        const thisYearBirthday = new Date(now.getFullYear(), birthday.getMonth(), birthday.getDate());
        if (thisYearBirthday < now) {
          thisYearBirthday.setFullYear(thisYearBirthday.getFullYear() + 1);
        }
        const age = thisYearBirthday.getFullYear() - birthday.getFullYear();

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: businessData.user_id,
            type: 'business_birthday_reminder',
            title: `🎂 Upcoming Pet Birthday: ${pet.pet_name}`,
            message: `${ownerName}'s pet ${pet.pet_name} (${pet.pet_breed || 'Pet'}) is turning ${age} in ${days_before_reminder} day${days_before_reminder !== 1 ? 's' : ''}! Consider sending them a birthday offer.`,
            data: {
              pet_id: pet.id,
              pet_name: pet.pet_name,
              pet_breed: pet.pet_breed,
              owner_user_id: pet.owner_user_id,
              owner_name: ownerName,
              birthday: pet.birthday,
              age,
              days_until: days_before_reminder,
              business_id: business_id
            }
          });

        if (notificationError) {
          console.error(`Error creating notification for pet ${pet.pet_name}:`, notificationError);
        } else {
          totalNotificationsSent++;
          console.log(`Sent birthday reminder for ${pet.pet_name} to ${businessData.business_name}`);
        }
      }
    }

    console.log(`Completed: sent ${totalNotificationsSent} birthday reminder notifications`);

    return new Response(JSON.stringify({ 
      message: `Sent ${totalNotificationsSent} birthday reminder notifications`,
      notificationsSent: totalNotificationsSent 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('notify-business-birthdays error:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(
      JSON.stringify({ error: 'An error occurred. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
