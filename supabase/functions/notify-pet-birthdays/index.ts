import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

    // Helper to fetch all rows with pagination
    async function fetchAll(query: any) {
      const pageSize = 1000;
      let allData: any[] = [];
      let from = 0;
      while (true) {
        const { data, error } = await query.range(from, from + pageSize - 1);
        if (error) throw error;
        allData = allData.concat(data || []);
        if (!data || data.length < pageSize) break;
        from += pageSize;
      }
      return allData;
    }

    console.log('Checking for pet birthdays...');

    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();
    const todayStr = today.toISOString().split('T')[0];

    // Fetch all pets with birthdays (paginated)
    const pets = await fetchAll(
      supabase
        .from('pets')
        .select('id, pet_name, pet_breed, pet_type, birthday, owner_user_id, photo_url')
        .not('birthday', 'is', null)
    );

    console.log(`Fetched ${pets.length} pets with birthdays`);

    let notificationsSent = 0;

    for (const pet of (pets || [])) {
      if (!pet.birthday) continue;

      const [year, month, day] = pet.birthday.split('-').map(Number);
      
      // Check if today is the pet's birthday
      if (month !== todayMonth || day !== todayDay) continue;

      const age = today.getFullYear() - year;
      if (age < 1) continue;

      // Check if already notified today for this pet
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', pet.owner_user_id)
        .eq('type', 'pet_birthday')
        .gte('created_at', `${todayStr}T00:00:00Z`)
        .lte('created_at', `${todayStr}T23:59:59Z`)
        .contains('data', { pet_id: pet.id })
        .maybeSingle();

      if (existing) continue;

      const ageText = age === 1 ? '1 year old' : `${age} years old`;

      await supabase
        .from('notifications')
        .insert({
          user_id: pet.owner_user_id,
          type: 'pet_birthday',
          title: `🎂 Happy Birthday, ${pet.pet_name}!`,
          message: `${pet.pet_name} is turning ${ageText} today! 🎉🐾 Wishing your furry friend the happiest of birthdays. Give them an extra treat from us!`,
          data: {
            pet_id: pet.id,
            pet_name: pet.pet_name,
            pet_breed: pet.pet_breed,
            pet_type: pet.pet_type,
            age,
            photo_url: pet.photo_url,
          }
        });

      notificationsSent++;
      console.log(`Birthday notification sent for ${pet.pet_name} (${ageText}) to user ${pet.owner_user_id}`);
    }

    console.log(`Completed: sent ${notificationsSent} pet birthday notifications`);

    return new Response(JSON.stringify({
      message: `Sent ${notificationsSent} pet birthday notifications`,
      notificationsSent,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('notify-pet-birthdays error:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(
      JSON.stringify({ error: 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
