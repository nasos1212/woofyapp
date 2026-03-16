import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Eye, MousePointer, TrendingUp, Store, Gift, Home, Cake, Check } from "lucide-react";
import CommunityAnalytics from "./CommunityAnalytics";
import PlacesAnalytics from "./PlacesAnalytics";
import BreedInsights from "./BreedInsights";
import ConversionFunnel from "./ConversionFunnel";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { format, subDays } from "date-fns";

interface AnalyticsEvent {
  id: string;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  entity_name: string | null;
  created_at: string;
  metadata?: any;
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

interface BirthdayOffer {
  id: string;
  pet_name: string;
  owner_name: string | null;
  discount_value: number;
  discount_type: string;
  sent_at: string;
  redeemed_at: string | null;
  business_id: string;
}

interface TopOfferEntity {
  name: string;
  businessName: string;
  count: number;
}

interface TopEntity {
  name: string;
  count: number;
}

const COLORS = ["#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];

const StatCard = ({ icon: Icon, value, label, colorClass, bgClass }: {
  icon: any;
  value: number;
  label: string;
  colorClass: string;
  bgClass: string;
}) => (
  <Card className="border-border/50 hover:border-border transition-colors">
    <CardContent className="pt-4 pb-3">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${bgClass}`}>
          <Icon className={`w-5 h-5 ${colorClass}`} />
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums">{value.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const RankList = ({ items, colorClass, emptyText }: {
  items: TopEntity[];
  colorClass: string;
  emptyText: string;
}) => {
  if (items.length === 0) return <p className="text-muted-foreground text-sm py-4 text-center">{emptyText}</p>;
  const maxVal = items[0]?.count || 1;
  return (
    <div className="space-y-2.5">
      {items.map((item, index) => {
        const pct = Math.round((item.count / maxVal) * 100);
        return (
          <div key={item.name} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-muted-foreground font-medium w-4 shrink-0">{index + 1}.</span>
                <span className="font-medium truncate">{item.name}</span>
              </div>
              <Badge variant="secondary" className="shrink-0 text-xs font-semibold tabular-nums">{item.count}</Badge>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const OfferRankList = ({ items, colorClass, emptyText }: {
  items: TopOfferEntity[];
  colorClass: string;
  emptyText: string;
}) => {
  if (items.length === 0) return <p className="text-muted-foreground text-sm py-4 text-center">{emptyText}</p>;
  const maxVal = items[0]?.count || 1;
  return (
    <div className="space-y-2.5">
      {items.map((offer, index) => {
        const pct = Math.round((offer.count / maxVal) * 100);
        return (
          <div key={`${offer.name}-${offer.businessName}`} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-xs text-muted-foreground font-medium w-4 shrink-0">{index + 1}.</span>
                <div className="min-w-0">
                  <p className="font-medium line-clamp-1">{offer.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{offer.businessName}</p>
                </div>
              </div>
              <Badge variant="secondary" className="shrink-0 text-xs font-semibold tabular-nums ml-2">{offer.count}</Badge>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const EngagementAnalytics = () => {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [birthdayOffers, setBirthdayOffers] = useState<BirthdayOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
      const startDate = subDays(new Date(), days);

      const [eventsResult, redemptionsResult, birthdayResult] = await Promise.all([
        supabase
          .from("analytics_events")
          .select("*")
          .gte("created_at", startDate.toISOString())
          .order("created_at", { ascending: false })
          .limit(5000),
        supabase
          .from("offer_redemptions")
          .select(`id, redeemed_at, offer_id, business_id, member_name, offers:offer_id (title), businesses:business_id (business_name)`)
          .gte("redeemed_at", startDate.toISOString())
          .order("redeemed_at", { ascending: false }),
        supabase
          .from("sent_birthday_offers")
          .select(`id, pet_name, owner_name, discount_value, discount_type, sent_at, redeemed_at, business_id`)
          .gte("sent_at", startDate.toISOString())
          .order("sent_at", { ascending: false }),
      ]);

      if (eventsResult.error) throw eventsResult.error;
      if (redemptionsResult.error) throw redemptionsResult.error;
      if (birthdayResult.error) throw birthdayResult.error;

      setEvents(eventsResult.data || []);
      setRedemptions(redemptionsResult.data || []);
      setBirthdayOffers(birthdayResult.data || []);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const businessViews = events.filter(e => e.event_type === "business_view");
  const offerClicks = events.filter(e => e.event_type === "offer_click");
  const shelterViews = events.filter(e => e.event_type === "shelter_view");
  const offerViews = events.filter(e => e.event_type === "offer_view");
  const socialClicks = events.filter(e => e.event_type === "social_click");
  const contactClicks = events.filter(e => e.event_type === "contact_click");
  const directoryImpressions = events.filter(e => e.event_type === "directory_impression");

  // Top businesses by clicks
  const topBusinessesByClicks: TopEntity[] = Object.entries(
    offerClicks.reduce((acc, e) => {
      const name = e.metadata?.business_name || e.entity_name || "Unknown";
      if (name !== "Unknown") acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);

  // Top shelters by views
  const topSheltersByViews: TopEntity[] = Object.entries(
    shelterViews.reduce((acc, e) => {
      if (e.entity_name) acc[e.entity_name] = (acc[e.entity_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);

  // Top offers by clicks
  const topOffersByClicks: TopOfferEntity[] = Object.entries(
    offerClicks.reduce((acc, e) => {
      if (e.entity_name) {
        const key = `${e.entity_name}||${e.metadata?.business_name || "Unknown"}`;
        acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>)
  ).map(([key, count]) => {
    const [name, businessName] = key.split("||");
    return { name, businessName, count };
  }).sort((a, b) => b.count - a.count).slice(0, 5);

  // Top offers by redemptions
  const topOffersByRedemptions: TopOfferEntity[] = Object.entries(
    redemptions.reduce((acc, r) => {
      const key = `${r.offers?.title || "Unknown"}||${r.businesses?.business_name || "Unknown"}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([key, count]) => {
    const [name, businessName] = key.split("||");
    return { name, businessName, count };
  }).sort((a, b) => b.count - a.count).slice(0, 5);

  // Top businesses by redemptions
  const topBusinessesByRedemptions: TopEntity[] = Object.entries(
    redemptions.reduce((acc, r) => {
      const name = r.businesses?.business_name || "Unknown";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);

  // Daily activity trend (area chart)
  const dailyActivity: Record<string, { day: string; views: number; clicks: number; redeems: number }> = {};
  events.forEach(e => {
    const day = format(new Date(e.created_at), "dd MMM");
    if (!dailyActivity[day]) dailyActivity[day] = { day, views: 0, clicks: 0, redeems: 0 };
    if (e.event_type === "business_view") dailyActivity[day].views++;
    if (e.event_type === "offer_click") dailyActivity[day].clicks++;
  });
  redemptions.forEach(r => {
    const day = format(new Date(r.redeemed_at), "dd MMM");
    if (!dailyActivity[day]) dailyActivity[day] = { day, views: 0, clicks: 0, redeems: 0 };
    dailyActivity[day].redeems++;
  });
  const chartData = Object.values(dailyActivity).slice(-14);

  // Event distribution
  const eventDistribution = [
    { name: "Profile Views", value: businessViews.length, color: COLORS[0] },
    { name: "Offer Clicks", value: offerClicks.length, color: COLORS[1] },
    { name: "Redemptions", value: redemptions.length, color: COLORS[2] },
    { name: "Shelter Views", value: shelterViews.length, color: COLORS[3] },
    { name: "Social Clicks", value: socialClicks.length, color: COLORS[4] },
    { name: "Contact Clicks", value: contactClicks.length, color: COLORS[5] },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Analytics Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Track engagement across all platform features</p>
        </div>
        <Tabs value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
          <TabsList>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="90d">90 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ───── SECTION: Key Metrics ───── */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Key Metrics</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Eye} value={businessViews.length} label="Profile Views" colorClass="text-orange-500" bgClass="bg-orange-500/15" />
          <StatCard icon={MousePointer} value={offerClicks.length} label="Offer Clicks" colorClass="text-yellow-500" bgClass="bg-yellow-500/15" />
          <StatCard icon={Gift} value={redemptions.length} label="Redemptions" colorClass="text-green-500" bgClass="bg-green-500/15" />
          <StatCard icon={Home} value={shelterViews.length} label="Shelter Views" colorClass="text-blue-500" bgClass="bg-blue-500/15" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          <StatCard icon={Eye} value={offerViews.length} label="Offer Views" colorClass="text-purple-500" bgClass="bg-purple-500/15" />
          <StatCard icon={MousePointer} value={socialClicks.length} label="Social Clicks" colorClass="text-pink-500" bgClass="bg-pink-500/15" />
          <StatCard icon={Store} value={contactClicks.length} label="Contact Clicks" colorClass="text-teal-500" bgClass="bg-teal-500/15" />
          <StatCard icon={Eye} value={directoryImpressions.length} label="Directory Impressions" colorClass="text-indigo-500" bgClass="bg-indigo-500/15" />
        </div>
      </div>

      {/* ───── SECTION: Funnel & Trends ───── */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Conversion & Trends</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <ConversionFunnel
            businessViews={businessViews.length}
            offerClicks={offerClicks.length}
            redemptions={redemptions.length}
          />

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Activity Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#eab308" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#eab308" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="redeemsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Area type="monotone" dataKey="views" stroke="#f97316" fill="url(#viewsGrad)" name="Views" strokeWidth={2} />
                    <Area type="monotone" dataKey="clicks" stroke="#eab308" fill="url(#clicksGrad)" name="Clicks" strokeWidth={2} />
                    <Area type="monotone" dataKey="redeems" stroke="#22c55e" fill="url(#redeemsGrad)" name="Redeems" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ───── SECTION: Event Distribution ───── */}
      {eventDistribution.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Event Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={eventDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" strokeWidth={2} stroke="hsl(var(--card))">
                    {eventDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
                {eventDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-semibold tabular-nums">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ───── SECTION: Top Performers ───── */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Top Performers</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top Businesses (Clicks)</CardTitle>
            </CardHeader>
            <CardContent>
              <RankList items={topBusinessesByClicks} colorClass="bg-yellow-500" emptyText="No clicks yet" />
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top Businesses (Redemptions)</CardTitle>
            </CardHeader>
            <CardContent>
              <RankList items={topBusinessesByRedemptions} colorClass="bg-green-500" emptyText="No redemptions yet" />
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Card className="border-border/50 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top Offers (Clicks)</CardTitle>
            </CardHeader>
            <CardContent>
              <OfferRankList items={topOffersByClicks} colorClass="bg-yellow-500" emptyText="No clicks yet" />
            </CardContent>
          </Card>
          <Card className="border-border/50 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top Offers (Redeemed)</CardTitle>
            </CardHeader>
            <CardContent>
              <OfferRankList items={topOffersByRedemptions} colorClass="bg-green-500" emptyText="No redemptions yet" />
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top Shelters (Views)</CardTitle>
            </CardHeader>
            <CardContent>
              <RankList items={topSheltersByViews} colorClass="bg-blue-500" emptyText="No shelter views yet" />
            </CardContent>
          </Card>

          {/* Birthday Offers */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Cake className="w-4 h-4 text-pink-500" />
                Birthday Offers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {birthdayOffers.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">No birthday offers sent yet</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-pink-500/10 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-pink-500">{birthdayOffers.length}</p>
                      <p className="text-xs text-muted-foreground">Sent</p>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-green-500">{birthdayOffers.filter(b => b.redeemed_at).length}</p>
                      <p className="text-xs text-muted-foreground">Redeemed</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Recent</p>
                    {birthdayOffers.slice(0, 5).map((offer) => (
                      <div key={offer.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="truncate">{offer.pet_name}</span>
                          <span className="text-muted-foreground text-xs">
                            ({offer.discount_type === 'percentage' ? `${offer.discount_value}%` : `€${offer.discount_value}`})
                          </span>
                        </div>
                        {offer.redeemed_at ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1 text-xs">
                            <Check className="w-3 h-3" /> Redeemed
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Pending</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ───── SECTION: Breed & Pet Insights ───── */}
      <div className="border-t border-border/50 pt-6">
        <BreedInsights dateRange={dateRange} />
      </div>

      {/* ───── SECTION: Community Hub ───── */}
      <div className="border-t border-border/50 pt-6">
        <CommunityAnalytics dateRange={dateRange} />
      </div>

      {/* ───── SECTION: Pet-Friendly Places ───── */}
      <div className="border-t border-border/50 pt-6">
        <PlacesAnalytics />
      </div>
    </div>
  );
};

export default EngagementAnalytics;
