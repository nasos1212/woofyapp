import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Dog, PawPrint, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface BreedInsightsProps {
  dateRange: "7d" | "30d" | "90d";
}

interface BreedStat {
  breed: string;
  redemptions: number;
  uniqueUsers: number;
}

interface PetTypeStat {
  type: string;
  count: number;
  percentage: number;
}

const BreedInsights = ({ dateRange }: BreedInsightsProps) => {
  const [loading, setLoading] = useState(true);
  const [breedRedemptions, setBreedRedemptions] = useState<BreedStat[]>([]);
  const [petTypeStats, setPetTypeStats] = useState<PetTypeStat[]>([]);
  const [topBreedsByOfferClick, setTopBreedsByOfferClick] = useState<{ breed: string; clicks: number }[]>([]);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      // Get redemptions with pet breed info
      const [redemptionsRes, eventsRes] = await Promise.all([
        supabase
          .from("offer_redemptions")
          .select("id, redeemed_by_user_id, pet_id, pets:pet_id (pet_breed, pet_type)")
          .gte("redeemed_at", startDate.toISOString()),
        supabase
          .from("analytics_events")
          .select("user_id, event_type")
          .in("event_type", ["offer_click", "business_view"])
          .gte("created_at", startDate.toISOString())
          .not("user_id", "is", null),
      ]);

      const redemptions = redemptionsRes.data || [];
      const events = eventsRes.data || [];

      // Breed redemption breakdown
      const breedMap: Record<string, { redemptions: number; users: Set<string> }> = {};
      const petTypeMap: Record<string, number> = {};

      redemptions.forEach((r: any) => {
        const breed = r.pets?.pet_breed || "Unknown";
        const petType = r.pets?.pet_type || "dog";
        if (!breedMap[breed]) breedMap[breed] = { redemptions: 0, users: new Set() };
        breedMap[breed].redemptions++;
        breedMap[breed].users.add(r.redeemed_by_user_id);
        petTypeMap[petType] = (petTypeMap[petType] || 0) + 1;
      });

      const breedStats = Object.entries(breedMap)
        .map(([breed, data]) => ({ breed, redemptions: data.redemptions, uniqueUsers: data.users.size }))
        .sort((a, b) => b.redemptions - a.redemptions)
        .slice(0, 10);
      setBreedRedemptions(breedStats);

      // Pet type stats
      const totalPets = Object.values(petTypeMap).reduce((sum, c) => sum + c, 0);
      setPetTypeStats(
        Object.entries(petTypeMap)
          .map(([type, count]) => ({
            type: type.charAt(0).toUpperCase() + type.slice(1),
            count,
            percentage: totalPets > 0 ? Math.round((count / totalPets) * 100) : 0,
          }))
          .sort((a, b) => b.count - a.count)
      );

      // Cross-reference users who clicked offers with their pet breeds
      const clickerUserIds = [...new Set(events.filter(e => e.event_type === "offer_click").map(e => e.user_id).filter(Boolean))];
      
      if (clickerUserIds.length > 0) {
        const { data: clickerPets } = await supabase
          .from("pets")
          .select("owner_user_id, pet_breed")
          .in("owner_user_id", clickerUserIds.slice(0, 100));

        const breedClicks: Record<string, Set<string>> = {};
        (clickerPets || []).forEach(p => {
          const breed = p.pet_breed || "Unknown";
          if (!breedClicks[breed]) breedClicks[breed] = new Set();
          breedClicks[breed].add(p.owner_user_id);
        });

        // Count clicks per breed
        const breedClickCounts: Record<string, number> = {};
        events.filter(e => e.event_type === "offer_click").forEach(e => {
          const userPets = (clickerPets || []).filter(p => p.owner_user_id === e.user_id);
          userPets.forEach(p => {
            const breed = p.pet_breed || "Unknown";
            breedClickCounts[breed] = (breedClickCounts[breed] || 0) + 1;
          });
        });

        setTopBreedsByOfferClick(
          Object.entries(breedClickCounts)
            .map(([breed, clicks]) => ({ breed, clicks }))
            .sort((a, b) => b.clicks - a.clicks)
            .slice(0, 10)
        );
      }
    } catch (error) {
      console.error("Error fetching breed insights:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Dog className="w-5 h-5 text-primary" />
          Breed & Pet Insights
        </h3>
        <p className="text-muted-foreground text-sm py-8 text-center">Loading breed insights...</p>
      </div>
    );
  }

  const hasData = breedRedemptions.length > 0 || topBreedsByOfferClick.length > 0;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Dog className="w-5 h-5 text-primary" />
        Breed & Pet Insights
      </h3>

      {!hasData ? (
        <Card className="border-border/50">
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No breed data available yet. Data appears as members redeem offers.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Pet Type Breakdown */}
          {petTypeStats.length > 0 && (
            <div className="flex gap-3 flex-wrap">
              {petTypeStats.map((pt) => (
                <div
                  key={pt.type}
                  className="flex items-center gap-2 rounded-xl border border-border/50 bg-card px-4 py-3"
                >
                  <PawPrint className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-lg">{pt.count}</span>
                  <span className="text-muted-foreground text-sm">{pt.type} redemptions</span>
                  <Badge variant="secondary" className="text-xs">{pt.percentage}%</Badge>
                </div>
              ))}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Top Breeds by Offer Clicks */}
            {topBreedsByOfferClick.length > 0 && (
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Breeds Clicking on Offers
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Which breeds' owners engage with offers most</p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={Math.max(200, topBreedsByOfferClick.length * 36)}>
                    <BarChart data={topBreedsByOfferClick} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis
                        type="category"
                        dataKey="breed"
                        tick={{ fontSize: 11 }}
                        stroke="hsl(var(--muted-foreground))"
                        width={100}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="clicks" fill="hsl(var(--primary))" name="Clicks" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Top Breeds by Redemptions */}
            {breedRedemptions.length > 0 && (
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Dog className="w-4 h-4 text-primary" />
                    Breeds Redeeming Offers
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Which breeds actually use the offers</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2.5">
                    {breedRedemptions.map((b, i) => {
                      const maxVal = breedRedemptions[0]?.redemptions || 1;
                      const pct = Math.round((b.redemptions / maxVal) * 100);
                      return (
                        <div key={b.breed} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                              <span className="font-medium truncate">{b.breed}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-muted-foreground">{b.uniqueUsers} owners</span>
                              <Badge variant="secondary" className="text-xs font-semibold">{b.redemptions}</Badge>
                            </div>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default BreedInsights;
