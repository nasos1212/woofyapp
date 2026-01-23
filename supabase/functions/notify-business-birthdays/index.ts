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
    
    // Use UTC date for consistent comparison (birthday is stored as date only)
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

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

      // Calculate upcoming birthdays - notify on days 0, 1, 2, 3 (covers the full window)
      const NOTIFICATION_DAYS = [0, 1, 2, 3];
      
      const upcomingBirthdays = petsData.map(pet => {
        if (!pet.birthday) return null;
        
        // Parse birthday as UTC date (YYYY-MM-DD format)
        const [year, month, day] = pet.birthday.split('-').map(Number);
        const birthdayDate = new Date(Date.UTC(year, month - 1, day));
        
        // Calculate this year's birthday in UTC
        let thisYearBirthday = new Date(Date.UTC(todayUTC.getUTCFullYear(), birthdayDate.getUTCMonth(), birthdayDate.getUTCDate()));
        
        // If birthday has passed this year, check next year
        if (thisYearBirthday < todayUTC) {
          thisYearBirthday = new Date(Date.UTC(todayUTC.getUTCFullYear() + 1, birthdayDate.getUTCMonth(), birthdayDate.getUTCDate()));
        }
        
        // Calculate days until (both dates are at midnight UTC, so division is clean)
        const diffTime = thisYearBirthday.getTime() - todayUTC.getTime();
        const daysUntil = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        console.log(`Pet ${pet.pet_name}: birthday ${pet.birthday}, thisYearBirthday ${thisYearBirthday.toISOString()}, daysUntil ${daysUntil}`);
        
        // Check if this is within notification window (0-3 days)
        if (NOTIFICATION_DAYS.includes(daysUntil)) {
          return { ...pet, daysUntil };
        }
        return null;
      }).filter(Boolean) as Array<typeof petsData[0] & { daysUntil: number }>;

      if (upcomingBirthdays.length === 0) {
        console.log(`No upcoming birthdays matching notification days for ${businessData.business_name}`);
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

        // Customize message based on days until birthday
        const daysMessage = pet.daysUntil === 0 
          ? "today! 🎉" 
          : `in ${pet.daysUntil} day${pet.daysUntil !== 1 ? 's' : ''}!`;

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: businessData.user_id,
            type: 'business_birthday_reminder',
            title: pet.daysUntil === 0 
              ? `🎂 It's ${pet.pet_name}'s Birthday Today!` 
              : `🎂 Upcoming Pet Birthday: ${pet.pet_name}`,
            message: `${ownerName}'s pet ${pet.pet_name} (${pet.pet_breed || 'Pet'}) is turning ${age} ${daysMessage} Consider sending them a birthday offer.`,
            data: {
              pet_id: pet.id,
              pet_name: pet.pet_name,
              pet_breed: pet.pet_breed,
              owner_user_id: pet.owner_user_id,
              owner_name: ownerName,
              birthday: pet.birthday,
              age,
              days_until: pet.daysUntil,
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
