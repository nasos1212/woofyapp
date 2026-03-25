import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Dog, PawPrint } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import MetricTooltip from "./MetricTooltip";

const AGE_COLORS = ["#22c55e", "#3b82f6", "#8b5cf6", "#f97316", "#ef4444", "#64748b"];
const GENDER_COLORS: Record<string, string> = { Male: "#3b82f6", Female: "#ec4899", Unknown: "#94a3b8" };

const PetDemographics = () => {
  const [loading, setLoading] = useState(true);
  const [breedStats, setBreedStats] = useState<{ breed: string; count: number }[]>([]);
  const [petTypeStats, setPetTypeStats] = useState<{ name: string; value: number; color: string }[]>([]);
  const [ageDistribution, setAgeDistribution] = useState<{ range: string; count: number; color: string }[]>([]);
  const [genderStats, setGenderStats] = useState<{ name: string; value: number; color: string }[]>([]);
  const [breedByCity, setBreedByCity] = useState<{ city: string; breeds: { breed: string; count: number }[] }[]>([]);
  const [totalPets, setTotalPets] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [petsRes, profilesRes] = await Promise.all([
        supabase.from("pets").select("id, pet_type, pet_breed, gender, birthday, age_years, owner_user_id"),
        supabase.from("profiles").select("user_id, preferred_city"),
      ]);

      const pets = petsRes.data || [];
      const profiles = profilesRes.data || [];
      setTotalPets(pets.length);

      const cityMap: Record<string, string> = {};
      profiles.forEach(p => { if (p.preferred_city) cityMap[p.user_id] = p.preferred_city; });

      // Pet type distribution
      const typeMap: Record<string, number> = {};
      pets.forEach(p => { typeMap[p.pet_type || "dog"] = (typeMap[p.pet_type || "dog"] || 0) + 1; });
      const typeColors: Record<string, string> = { dog: "#f97316", cat: "#8b5cf6", other: "#64748b" };
      setPetTypeStats(
        Object.entries(typeMap)
          .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1) + "s", value, color: typeColors[name] || "#64748b" }))
          .sort((a, b) => b.value - a.value)
      );

      // Breed distribution (top 15)
      const breedMap: Record<string, number> = {};
      pets.forEach(p => { breedMap[p.pet_breed || "Unknown"] = (breedMap[p.pet_breed || "Unknown"] || 0) + 1; });
      setBreedStats(Object.entries(breedMap).map(([breed, count]) => ({ breed, count })).sort((a, b) => b.count - a.count).slice(0, 15));

      // Age distribution
      const now = new Date();
      const ageRanges = [
        { range: "Puppy (0-1)", min: 0, max: 1 },
        { range: "Young (1-3)", min: 1, max: 3 },
        { range: "Adult (3-7)", min: 3, max: 7 },
        { range: "Mature (7-10)", min: 7, max: 10 },
        { range: "Senior (10+)", min: 10, max: 100 },
        { range: "Unknown", min: -1, max: -1 },
      ];
      const ageCounts = ageRanges.map(r => ({ ...r, count: 0 }));
      pets.forEach(p => {
        let age: number | null = null;
        if (p.birthday) {
          age = (now.getTime() - new Date(p.birthday).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        } else if (p.age_years !== null) {
          age = p.age_years;
        }
        if (age === null) { ageCounts[5].count++; }
        else {
          const bucket = ageCounts.find(a => age! >= a.min && age! < a.max);
          if (bucket) bucket.count++; else ageCounts[5].count++;
        }
      });
      setAgeDistribution(ageCounts.filter(a => a.count > 0).map((a, i) => ({ range: a.range, count: a.count, color: AGE_COLORS[i % AGE_COLORS.length] })));

      // Gender distribution
      const genderMap: Record<string, number> = {};
      pets.forEach(p => { const g = p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : "Unknown"; genderMap[g] = (genderMap[g] || 0) + 1; });
      setGenderStats(Object.entries(genderMap).map(([name, value]) => ({ name, value, color: GENDER_COLORS[name] || "#94a3b8" })).sort((a, b) => b.value - a.value));

      // Top breed per city
      const cityBreeds: Record<string, Record<string, number>> = {};
      pets.forEach(p => {
        const city = cityMap[p.owner_user_id];
        const breed = p.pet_breed || "Unknown";
        if (city) {
          if (!cityBreeds[city]) cityBreeds[city] = {};
          cityBreeds[city][breed] = (cityBreeds[city][breed] || 0) + 1;
        }
      });
      setBreedByCity(
        Object.entries(cityBreeds)
          .map(([city, breeds]) => {
            const sorted = Object.entries(breeds).sort((a, b) => b[1] - a[1]).map(([breed, count]) => ({ breed, count }));
            return { city, breeds: sorted, totalPets: sorted.reduce((sum, b) => sum + b.count, 0) };
          })
          .sort((a, b) => b.totalPets - a.totalPets).slice(0, 6)
          .map(({ city, breeds }) => ({ city, breeds }))
      );
    } catch (error) {
      console.error("Error fetching pet demographics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-muted-foreground text-sm py-8 text-center">Loading pet demographics...</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pet Type */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Pet Types</CardTitle>
              <MetricTooltip text="Distribution of registered pets by species (dogs, cats, etc.). All-time data from all registered pets on the platform." />
            </div>
            <p className="text-xs text-muted-foreground">{totalPets.toLocaleString()} total pets registered</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart><Pie data={petTypeStats} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" strokeWidth={2} stroke="hsl(var(--card))">{petTypeStats.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie></PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {petTypeStats.map(t => (
                  <div key={t.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                    <span className="text-sm font-medium">{t.name}</span>
                    <Badge variant="secondary" className="text-xs">{t.value}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gender */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Gender Split</CardTitle>
              <MetricTooltip text="Male vs Female distribution of all registered pets. 'Unknown' means gender wasn't specified during registration." />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart><Pie data={genderStats} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" strokeWidth={2} stroke="hsl(var(--card))">{genderStats.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie></PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {genderStats.map(g => (
                  <div key={g.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color }} />
                    <span className="text-sm font-medium">{g.name}</span>
                    <Badge variant="secondary" className="text-xs">{g.value}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Age Distribution */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Age Distribution</CardTitle>
              <MetricTooltip text="Pet age groups calculated from birthday or manually entered age. Helps understand which life stages are most represented — valuable for targeted product recommendations." />
            </div>
          </CardHeader>
          <CardContent>
            {ageDistribution.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">No age data</p>
            ) : (
              <div className="space-y-2">
                {ageDistribution.map(a => {
                  const maxVal = Math.max(...ageDistribution.map(x => x.count));
                  const pct = maxVal > 0 ? Math.round((a.count / maxVal) * 100) : 0;
                  return (
                    <div key={a.range} className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{a.range}</span>
                        <span className="font-semibold tabular-nums">{a.count}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: a.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex items-center gap-2"><Dog className="w-4 h-4 text-primary" />Top Breeds</CardTitle>
              <MetricTooltip text="The 15 most popular breeds registered on the platform. This data is highly valuable for pet food, insurance, and product companies to understand market demand." />
            </div>
          </CardHeader>
          <CardContent>
            {breedStats.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">No breed data</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(200, breedStats.length * 28)}>
                <BarChart data={breedStats} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <YAxis type="category" dataKey="breed" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={110} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" name="Pets" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Breeds by City</CardTitle>
              <MetricTooltip text="All registered breeds per city, based on pet owners' preferred city. Useful for regional product distribution and targeted marketing." />
            </div>
          </CardHeader>
          <CardContent>
            {breedByCity.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">No data — members need to set preferred city</p>
            ) : (
              <div className="space-y-4">
                {breedByCity.map((item) => (
                  <div key={item.city}>
                    <p className="text-sm font-semibold mb-1">{item.city}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.breeds.map((b) => (
                        <Badge key={b.breed} variant="secondary" className="text-xs gap-1">
                          <PawPrint className="w-3 h-3" />
                          {b.breed} <span className="font-semibold">({b.count})</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PetDemographics;
