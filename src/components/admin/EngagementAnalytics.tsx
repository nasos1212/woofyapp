import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Eye, MousePointer, RefreshCw, TrendingUp, Store, Gift, Home, Percent } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, subDays } from "date-fns";

interface AnalyticsEvent {
  id: string;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  entity_name: string | null;
  created_at: string;
}

interface Redemption {
  id: string;
  redeemed_at: string;
  offer_id: string;
  business_id: string;
  member_name: string | null;
  offers?: { title: string } | null;
  businesses?: { business_name: string } | null;
}

interface TopOfferEntity {
  name: string;
  businessName: string;
  count: number;
  entityId: string;
}

interface TopEntity {
  name: string;
  count: number;
  entityId: string;
}

interface ConversionData {
  name: string;
  clicks: number;
  redemptions: number;
  rate: number;
}

const COLORS = ["#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];

const EngagementAnalytics = () => {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("7d");

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
      const startDate = subDays(new Date(), days);

      // Fetch analytics events and actual redemptions in parallel
      const [eventsResult, redemptionsResult] = await Promise.all([
        supabase
          .from("analytics_events")
          .select("*")
          .gte("created_at", startDate.toISOString())
          .order("created_at", { ascending: false })
          .limit(5000),
        supabase
          .from("offer_redemptions")
          .select(`
            id,
            redeemed_at,
            offer_id,
            business_id,
            member_name,
            offers:offer_id (title),
            businesses:business_id (business_name)
          `)
          .gte("redeemed_at", startDate.toISOString())
          .order("redeemed_at", { ascending: false })
      ]);

      if (eventsResult.error) throw eventsResult.error;
      if (redemptionsResult.error) throw redemptionsResult.error;
      
      setEvents(eventsResult.data || []);
      setRedemptions(redemptionsResult.data || []);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  // Calculate metrics from analytics_events
  const businessViews = events.filter(e => e.event_type === "business_view");
  const offerClicks = events.filter(e => e.event_type === "offer_click");
  const shelterViews = events.filter(e => e.event_type === "shelter_view");
  
  // Use actual redemptions count from offer_redemptions table
  const actualRedemptionsCount = redemptions.length;

  // Top businesses by views (clicks)
  const topBusinessesByViews: TopEntity[] = Object.entries(
    businessViews.reduce((acc, e) => {
      if (e.entity_name) {
        acc[e.entity_name] = (acc[e.entity_name] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([name, count]) => ({ name, count, entityId: "" }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top businesses by offer clicks
  const topBusinessesByClicks: TopEntity[] = Object.entries(
    offerClicks.reduce((acc, e) => {
      // Get business name from metadata if available
      const metadata = (e as any).metadata;
      const businessName = metadata?.business_name || e.entity_name || "Unknown";
      if (businessName !== "Unknown") {
        acc[businessName] = (acc[businessName] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([name, count]) => ({ name, count, entityId: "" }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top shelters by views
  const topSheltersByViews: TopEntity[] = Object.entries(
    shelterViews.reduce((acc, e) => {
      if (e.entity_name) {
        acc[e.entity_name] = (acc[e.entity_name] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([name, count]) => ({ name, count, entityId: "" }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top offers by clicks (with business name)
  const topOffersByClicks: TopOfferEntity[] = Object.entries(
    offerClicks.reduce((acc, e) => {
      if (e.entity_name) {
        const metadata = (e as any).metadata;
        const key = `${e.entity_name}||${metadata?.business_name || "Unknown"}`;
        acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([key, count]) => {
      const [name, businessName] = key.split("||");
      return { name, businessName, count, entityId: "" };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top offers by redemptions (with business name)
  const topOffersByRedemptions: TopOfferEntity[] = Object.entries(
    redemptions.reduce((acc, r) => {
      const offerTitle = r.offers?.title || "Unknown Offer";
      const businessName = r.businesses?.business_name || "Unknown";
      const key = `${offerTitle}||${businessName}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([key, count]) => {
      const [name, businessName] = key.split("||");
      return { name, businessName, count, entityId: "" };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top businesses by redemptions
  const topBusinessesByRedemptions: TopEntity[] = Object.entries(
    redemptions.reduce((acc, r) => {
      const businessName = r.businesses?.business_name || "Unknown Business";
      acc[businessName] = (acc[businessName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([name, count]) => ({ name, count, entityId: "" }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate conversion rates per business (clicks to redemptions)
  const businessConversionRates: ConversionData[] = (() => {
    // Get clicks per business
    const clicksByBusiness: Record<string, number> = {};
    offerClicks.forEach(e => {
      const metadata = (e as any).metadata;
      const businessName = metadata?.business_name || "Unknown";
      if (businessName !== "Unknown") {
        clicksByBusiness[businessName] = (clicksByBusiness[businessName] || 0) + 1;
      }
    });

    // Get redemptions per business
    const redemptionsByBusiness: Record<string, number> = {};
    redemptions.forEach(r => {
      const businessName = r.businesses?.business_name || "Unknown";
      if (businessName !== "Unknown") {
        redemptionsByBusiness[businessName] = (redemptionsByBusiness[businessName] || 0) + 1;
      }
    });

    // Combine and calculate rates
    const allBusinesses = new Set([
      ...Object.keys(clicksByBusiness),
      ...Object.keys(redemptionsByBusiness)
    ]);

    return Array.from(allBusinesses)
      .map(name => {
        const clicks = clicksByBusiness[name] || 0;
        const redemptionsCount = redemptionsByBusiness[name] || 0;
        const rate = clicks > 0 ? (redemptionsCount / clicks) * 100 : 0;
        return { name, clicks, redemptions: redemptionsCount, rate };
      })
      .filter(b => b.clicks > 0 || b.redemptions > 0)
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5);
  })();

  // Overall conversion rate
  const overallConversionRate = offerClicks.length > 0 
    ? ((actualRedemptionsCount / offerClicks.length) * 100).toFixed(1)
    : "0";

  // Daily activity chart data - combine events and redemptions
  const dailyActivity: Record<string, { day: string; views: number; clicks: number; redeems: number }> = {};
  
  events.forEach(e => {
    const day = format(new Date(e.created_at), "MMM d");
    if (!dailyActivity[day]) {
      dailyActivity[day] = { day, views: 0, clicks: 0, redeems: 0 };
    }
    if (e.event_type === "business_view") dailyActivity[day].views++;
    if (e.event_type === "offer_click") dailyActivity[day].clicks++;
  });
  
  // Add actual redemptions to the chart
  redemptions.forEach(r => {
    const day = format(new Date(r.redeemed_at), "MMM d");
    if (!dailyActivity[day]) {
      dailyActivity[day] = { day, views: 0, clicks: 0, redeems: 0 };
    }
    dailyActivity[day].redeems++;
  });

  const chartData = Object.values(dailyActivity)
    .sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime())
    .slice(-14);

  // Event type distribution - use actual data
  const eventDistribution = [
    { name: "Business Views", value: businessViews.length, color: COLORS[0] },
    { name: "Offer Clicks", value: offerClicks.length, color: COLORS[1] },
    { name: "Redemptions", value: actualRedemptionsCount, color: COLORS[2] },
    { name: "Shelter Views", value: shelterViews.length, color: COLORS[3] },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Engagement Analytics
        </h2>
        <div className="flex gap-2">
          <Tabs value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
            <TabsList>
              <TabsTrigger value="7d">7 Days</TabsTrigger>
              <TabsTrigger value="30d">30 Days</TabsTrigger>
              <TabsTrigger value="90d">90 Days</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Eye className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{businessViews.length}</p>
                <p className="text-xs text-muted-foreground">Business Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <MousePointer className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{offerClicks.length}</p>
                <p className="text-xs text-muted-foreground">Offer Clicks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Gift className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{actualRedemptionsCount}</p>
                <p className="text-xs text-muted-foreground">Redemptions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Percent className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallConversionRate}%</p>
                <p className="text-xs text-muted-foreground">Conversion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Home className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{shelterViews.length}</p>
                <p className="text-xs text-muted-foreground">Shelter Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Activity Over Time */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Daily Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Bar dataKey="views" fill="#f97316" name="Views" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="clicks" fill="#eab308" name="Clicks" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="redeems" fill="#22c55e" name="Redeems" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Event Distribution */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Event Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {eventDistribution.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No data yet
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={eventDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="value"
                    >
                      {eventDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {eventDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Content - Row 1: Businesses */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Top Businesses by Views */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4 text-orange-500" />
              Top Businesses (by Views)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topBusinessesByViews.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">No views yet</p>
            ) : (
              <div className="space-y-3">
                {topBusinessesByViews.map((business, index) => (
                  <div key={business.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 h-6 p-0 justify-center">
                        {index + 1}
                      </Badge>
                      <span className="text-sm font-medium truncate max-w-[140px]">{business.name}</span>
                    </div>
                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                      {business.count} views
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Businesses by Offer Clicks */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MousePointer className="w-4 h-4 text-yellow-500" />
              Top Businesses (by Clicks)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topBusinessesByClicks.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">No clicks yet</p>
            ) : (
              <div className="space-y-3">
                {topBusinessesByClicks.map((business, index) => (
                  <div key={business.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 h-6 p-0 justify-center">
                        {index + 1}
                      </Badge>
                      <span className="text-sm font-medium truncate max-w-[140px]">{business.name}</span>
                    </div>
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      {business.count} clicks
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Businesses by Redemptions */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="w-4 h-4 text-green-500" />
              Top Businesses (by Redemptions)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topBusinessesByRedemptions.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">No redemptions yet</p>
            ) : (
              <div className="space-y-3">
                {topBusinessesByRedemptions.map((business, index) => (
                  <div key={business.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 h-6 p-0 justify-center">
                        {index + 1}
                      </Badge>
                      <span className="text-sm font-medium truncate max-w-[140px]">{business.name}</span>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      {business.count} redeemed
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Content - Row 2: Offers */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Offers by Clicks */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MousePointer className="w-4 h-4 text-yellow-500" />
              Top Offers (by Clicks)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topOffersByClicks.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">No clicks yet</p>
            ) : (
              <div className="space-y-3">
                {topOffersByClicks.map((offer, index) => (
                  <div key={`${offer.name}-${offer.businessName}`} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Badge variant="outline" className="w-6 h-6 p-0 justify-center shrink-0">
                        {index + 1}
                      </Badge>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{offer.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{offer.businessName}</p>
                      </div>
                    </div>
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shrink-0">
                      {offer.count} clicks
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Offers by Redemptions */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Gift className="w-4 h-4 text-green-500" />
              Top Offers (by Redemptions)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topOffersByRedemptions.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">No redemptions yet</p>
            ) : (
              <div className="space-y-3">
                {topOffersByRedemptions.map((offer, index) => (
                  <div key={`${offer.name}-${offer.businessName}`} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Badge variant="outline" className="w-6 h-6 p-0 justify-center shrink-0">
                        {index + 1}
                      </Badge>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{offer.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{offer.businessName}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 shrink-0">
                      {offer.count} redeemed
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Content - Row 3: Shelters & Conversion Rates */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Shelters by Views */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Home className="w-4 h-4 text-blue-500" />
              Top Shelters (by Views)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topSheltersByViews.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">No shelter views yet</p>
            ) : (
              <div className="space-y-3">
                {topSheltersByViews.map((shelter, index) => (
                  <div key={shelter.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 h-6 p-0 justify-center">
                        {index + 1}
                      </Badge>
                      <span className="text-sm font-medium truncate max-w-[180px]">{shelter.name}</span>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      {shelter.count} views
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Business Conversion Rates */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Percent className="w-4 h-4 text-purple-500" />
              Business Conversion Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {businessConversionRates.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">No data yet</p>
            ) : (
              <div className="space-y-3">
                {businessConversionRates.map((business, index) => (
                  <div key={business.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 p-0 justify-center">
                          {index + 1}
                        </Badge>
                        <span className="text-sm font-medium truncate max-w-[140px]">{business.name}</span>
                      </div>
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        {business.rate.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="ml-8 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{business.clicks} clicks</span>
                      <span>→</span>
                      <span>{business.redemptions} redeemed</span>
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

export default EngagementAnalytics;
