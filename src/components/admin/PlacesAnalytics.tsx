import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Star, ClipboardList, CheckCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const TYPE_COLORS: Record<string, string> = {
  cafe: "#f97316",
  restaurant: "#eab308",
  bar: "#8b5cf6",
  hotel: "#3b82f6",
  beach: "#14b8a6",
  park: "#22c55e",
  nature_trail: "#10b981",
  pharmacy: "#ef4444",
  store: "#ec4899",
  vet: "#6366f1",
  office: "#64748b",
  other: "#a3a3a3",
};

const TYPE_LABELS: Record<string, string> = {
  cafe: "Café",
  restaurant: "Restaurant",
  bar: "Bar",
  hotel: "Hotel",
  beach: "Beach",
  park: "Park",
  nature_trail: "Nature Trail",
  pharmacy: "Pharmacy",
  store: "Store",
  vet: "Vet",
  office: "Office",
  other: "Other",
};

const PlacesAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [totalPlaces, setTotalPlaces] = useState(0);
  const [verifiedPlaces, setVerifiedPlaces] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [typeStats, setTypeStats] = useState<{ name: string; count: number; color: string }[]>([]);
  const [cityStats, setCityStats] = useState<{ name: string; count: number }[]>([]);
  const [topRated, setTopRated] = useState<{ name: string; city: string; rating: number; reviewCount: number }[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [placesRes, verifiedRes, ratingsRes, requestsRes, placesFullRes, ratingsFullRes] = await Promise.all([
        supabase.from("pet_friendly_places").select("*", { count: "exact", head: true }),
        supabase.from("pet_friendly_places").select("*", { count: "exact", head: true }).eq("verified", true),
        supabase.from("pet_friendly_place_ratings").select("*", { count: "exact", head: true }),
        supabase.from("pet_friendly_place_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("pet_friendly_places").select("id, name, place_type, city, rating, verified"),
        supabase.from("pet_friendly_place_ratings").select("place_id, rating"),
      ]);

      setTotalPlaces(placesRes.count || 0);
      setVerifiedPlaces(verifiedRes.count || 0);
      setTotalRatings(ratingsRes.count || 0);
      setPendingRequests(requestsRes.count || 0);

      const places = placesFullRes.data || [];
      const ratings = ratingsFullRes.data || [];

      // Type breakdown
      const typeCounts: Record<string, number> = {};
      places.forEach(p => { typeCounts[p.place_type] = (typeCounts[p.place_type] || 0) + 1; });
      setTypeStats(
        Object.entries(typeCounts)
          .map(([type, count]) => ({
            name: TYPE_LABELS[type] || type,
            count,
            color: TYPE_COLORS[type] || "#a3a3a3",
          }))
          .sort((a, b) => b.count - a.count)
      );

      // City breakdown
      const cityCounts: Record<string, number> = {};
      places.forEach(p => {
        if (p.city) cityCounts[p.city] = (cityCounts[p.city] || 0) + 1;
      });
      setCityStats(
        Object.entries(cityCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8)
      );

      // Top rated places (by review count + avg rating)
      const placeRatings: Record<string, { total: number; count: number }> = {};
      ratings.forEach(r => {
        if (!placeRatings[r.place_id]) placeRatings[r.place_id] = { total: 0, count: 0 };
        placeRatings[r.place_id].total += r.rating;
        placeRatings[r.place_id].count++;
      });
      
      const ratedPlaces = places
        .filter(p => placeRatings[p.id] && placeRatings[p.id].count >= 1)
        .map(p => ({
          name: p.name,
          city: p.city || "",
          rating: Math.round((placeRatings[p.id].total / placeRatings[p.id].count) * 10) / 10,
          reviewCount: placeRatings[p.id].count,
        }))
        .sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating)
        .slice(0, 5);
      setTopRated(ratedPlaces);
    } catch (error) {
      console.error("Error fetching places analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground text-sm py-8 text-center">Loading places analytics...</p>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <MapPin className="w-5 h-5 text-primary" />
        Pet-Friendly Places
      </h3>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <MapPin className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPlaces}</p>
                <p className="text-xs text-muted-foreground">Total Places</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{verifiedPlaces}</p>
                <p className="text-xs text-muted-foreground">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalRatings}</p>
                <p className="text-xs text-muted-foreground">Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <ClipboardList className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingRequests}</p>
                <p className="text-xs text-muted-foreground">Pending Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Places by Type */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Places by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {typeStats.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No data</div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={typeStats} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="count">
                      {typeStats.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 min-w-0 flex-1">
                  {typeStats.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground truncate">{item.name}</span>
                      <span className="font-medium ml-auto shrink-0">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Places by City */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Places by City</CardTitle>
          </CardHeader>
          <CardContent>
            {cityStats.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={cityStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" name="Places" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Rated Places */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            Top Rated Places (by Reviews)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topRated.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">No reviews yet</p>
          ) : (
            <div className="space-y-3">
              {topRated.map((place, index) => (
                <div key={`${place.name}-${index}`} className="flex items-center gap-2 min-w-0">
                  <Badge variant="outline" className="w-6 h-6 p-0 justify-center shrink-0">
                    {index + 1}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{place.name}</p>
                    <p className="text-xs text-muted-foreground">{place.city}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs gap-1">
                      <Star className="w-3 h-3" /> {place.rating}
                    </Badge>
                    <span className="text-xs text-muted-foreground">({place.reviewCount})</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlacesAnalytics;
