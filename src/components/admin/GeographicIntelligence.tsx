import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Users, PawPrint, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const GeographicIntelligence = () => {
  const [loading, setLoading] = useState(true);
  const [cityData, setCityData] = useState<{
    city: string;
    members: number;
    pets: number;
    businesses: number;
    places: number;
  }[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profilesRes, petsRes, businessesRes, placesRes] = await Promise.all([
        supabase.from("profiles").select("user_id, preferred_city"),
        supabase.from("pets").select("owner_user_id"),
        supabase.from("businesses").select("city").eq("verification_status", "approved"),
        supabase.from("pet_friendly_places").select("city"),
      ]);

      const profiles = profilesRes.data || [];
      const pets = petsRes.data || [];
      const businesses = businessesRes.data || [];
      const places = placesRes.data || [];

      // Build owner-to-city map
      const ownerCity: Record<string, string> = {};
      profiles.forEach(p => { if (p.preferred_city) ownerCity[p.user_id] = p.preferred_city; });

      // Aggregate by city
      const cities: Record<string, { members: number; pets: number; businesses: number; places: number }> = {};

      const ensureCity = (city: string) => {
        if (!cities[city]) cities[city] = { members: 0, pets: 0, businesses: 0, places: 0 };
      };

      // Members per city
      profiles.forEach(p => {
        if (p.preferred_city) {
          ensureCity(p.preferred_city);
          cities[p.preferred_city].members++;
        }
      });

      // Pets per city (via owner)
      pets.forEach(p => {
        const city = ownerCity[p.owner_user_id];
        if (city) {
          ensureCity(city);
          cities[city].pets++;
        }
      });

      // Businesses per city
      businesses.forEach(b => {
        if (b.city) {
          ensureCity(b.city);
          cities[b.city].businesses++;
        }
      });

      // Places per city
      places.forEach(p => {
        if (p.city) {
          ensureCity(p.city);
          cities[p.city].places++;
        }
      });

      setCityData(
        Object.entries(cities)
          .map(([city, data]) => ({ city, ...data }))
          .sort((a, b) => b.members - a.members)
          .slice(0, 10)
      );
    } catch (error) {
      console.error("Error fetching geographic data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground text-sm py-8 text-center">Loading geographic data...</p>;
  }

  const totalMembers = cityData.reduce((s, c) => s + c.members, 0);
  const totalPets = cityData.reduce((s, c) => s + c.pets, 0);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* City Comparison Chart */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Members & Pets by City
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cityData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">No city data</div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(200, cityData.length * 36)}>
                <BarChart data={cityData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="city" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={90} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Bar dataKey="members" fill="hsl(var(--primary))" name="Members" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="pets" fill="#f97316" name="Pets" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* City Detail Cards */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">City Breakdown</CardTitle>
            <p className="text-xs text-muted-foreground">Platform presence across Cyprus</p>
          </CardHeader>
          <CardContent>
            {cityData.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">No data</p>
            ) : (
              <div className="space-y-3">
                {cityData.map((city) => {
                  const memberPct = totalMembers > 0 ? Math.round((city.members / totalMembers) * 100) : 0;
                  const petsPerMember = city.members > 0 ? (city.pets / city.members).toFixed(1) : "0";
                  return (
                    <div key={city.city} className="rounded-lg border border-border/50 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">{city.city}</span>
                        <Badge variant="secondary" className="text-xs">{memberPct}% of members</Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div>
                          <p className="text-sm font-bold tabular-nums">{city.members}</p>
                          <p className="text-[10px] text-muted-foreground">Members</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold tabular-nums">{city.pets}</p>
                          <p className="text-[10px] text-muted-foreground">Pets</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold tabular-nums">{city.businesses}</p>
                          <p className="text-[10px] text-muted-foreground">Partners</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold tabular-nums">{petsPerMember}</p>
                          <p className="text-[10px] text-muted-foreground">Pets/Member</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GeographicIntelligence;
