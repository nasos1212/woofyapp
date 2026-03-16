import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Eye, MousePointer, TrendingUp, Store, Gift, Home, Cake, Check, Dog, MapPin, Activity, MessageCircle } from "lucide-react";
import MetricTooltip from "./MetricTooltip";
import GrowthMetrics from "./GrowthMetrics";
import PetDemographics from "./PetDemographics";
import GeographicIntelligence from "./GeographicIntelligence";
import HealthTrends from "./HealthTrends";
import BreedInsights from "./BreedInsights";
import CommunityAnalytics from "./CommunityAnalytics";
import PlacesAnalytics from "./PlacesAnalytics";
import ConversionFunnel from "./ConversionFunnel";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
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

interface TopOfferEntity { name: string; businessName: string; count: number; }
interface TopEntity { name: string; count: number; }

const COLORS = ["#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];

// ─── Section Header ───
const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) => (
  <div className="flex items-start gap-3 mb-4">
    <div className="p-2 rounded-xl bg-primary/10 mt-0.5">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  </div>
);

// ─── Stat Card ───
const StatCard = ({ icon: Icon, value, label, colorClass, bgClass, tip }: {
  icon: any; value: number; label: string; colorClass: string; bgClass: string; tip?: string;
}) => (
  <Card className="border-border/50 hover:border-border transition-colors">
    <CardContent className="pt-4 pb-3">
      <div className="flex items-center gap-2.5">
        <div className={`p-2 rounded-xl ${bgClass}`}>
          <Icon className={`w-4 h-4 ${colorClass}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xl font-bold tabular-nums">{value.toLocaleString()}</p>
          <div className="flex items-center gap-1">
            <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
            {tip && <MetricTooltip text={tip} />}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// ─── Rank List ───
const RankList = ({ items, colorClass, emptyText }: { items: TopEntity[]; colorClass: string; emptyText: string }) => {
  if (items.length === 0) return <p className="text-muted-foreground text-sm py-4 text-center">{emptyText}</p>;
  const maxVal = items[0]?.count || 1;
  return (
    <div className="space-y-2.5">
      {items.map((item, index) => (
        <div key={item.name} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs text-muted-foreground font-medium w-4 shrink-0">{index + 1}.</span>
              <span className="font-medium truncate">{item.name}</span>
            </div>
            <Badge variant="secondary" className="shrink-0 text-xs font-semibold tabular-nums">{item.count}</Badge>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${Math.round((item.count / maxVal) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};

const OfferRankList = ({ items, colorClass, emptyText }: { items: TopOfferEntity[]; colorClass: string; emptyText: string }) => {
  if (items.length === 0) return <p className="text-muted-foreground text-sm py-4 text-center">{emptyText}</p>;
  const maxVal = items[0]?.count || 1;
  return (
    <div className="space-y-2.5">
      {items.map((offer, index) => (
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
            <div className={`h-full rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${Math.round((offer.count / maxVal) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ───
const EngagementAnalytics = () => {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [birthdayOffers, setBirthdayOffers] = useState<BirthdayOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
      const startDate = subDays(new Date(), days);

      const [eventsResult, redemptionsResult, birthdayResult] = await Promise.all([
        supabase.from("analytics_events").select("*").gte("created_at", startDate.toISOString()).order("created_at", { ascending: false }).limit(5000),
        supabase.from("offer_redemptions").select(`id, redeemed_at, offer_id, business_id, member_name, offers:offer_id (title), businesses:business_id (business_name)`).gte("redeemed_at", startDate.toISOString()).order("redeemed_at", { ascending: false }),
        supabase.from("sent_birthday_offers").select(`id, pet_name, owner_name, discount_value, discount_type, sent_at, redeemed_at, business_id`).gte("sent_at", startDate.toISOString()).order("sent_at", { ascending: false }),
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

  const businessViews = events.filter(e => e.event_type === "business_view");
  const offerClicks = events.filter(e => e.event_type === "offer_click");
  const shelterViews = events.filter(e => e.event_type === "shelter_view");
  const offerViews = events.filter(e => e.event_type === "offer_view");
  const socialClicks = events.filter(e => e.event_type === "social_click");
  const contactClicks = events.filter(e => e.event_type === "contact_click");
  const directoryImpressions = events.filter(e => e.event_type === "directory_impression");

  // Top businesses by clicks
  const topBusinessesByClicks: TopEntity[] = Object.entries(
    offerClicks.reduce((acc, e) => { const n = e.metadata?.business_name || e.entity_name || "Unknown"; if (n !== "Unknown") acc[n] = (acc[n] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);

  const topSheltersByViews: TopEntity[] = Object.entries(
    shelterViews.reduce((acc, e) => { if (e.entity_name) acc[e.entity_name] = (acc[e.entity_name] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);

  const topOffersByClicks: TopOfferEntity[] = Object.entries(
    offerClicks.reduce((acc, e) => { if (e.entity_name) { const k = `${e.entity_name}||${e.metadata?.business_name || "Unknown"}`; acc[k] = (acc[k] || 0) + 1; } return acc; }, {} as Record<string, number>)
  ).map(([key, count]) => { const [name, businessName] = key.split("||"); return { name, businessName, count }; }).sort((a, b) => b.count - a.count).slice(0, 5);

  const topOffersByRedemptions: TopOfferEntity[] = Object.entries(
    redemptions.reduce((acc, r) => { const k = `${r.offers?.title || "Unknown"}||${r.businesses?.business_name || "Unknown"}`; acc[k] = (acc[k] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([key, count]) => { const [name, businessName] = key.split("||"); return { name, businessName, count }; }).sort((a, b) => b.count - a.count).slice(0, 5);

  const topBusinessesByRedemptions: TopEntity[] = Object.entries(
    redemptions.reduce((acc, r) => { const n = r.businesses?.business_name || "Unknown"; acc[n] = (acc[n] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);

  // Daily activity
  const dailyActivity: Record<string, { day: string; views: number; clicks: number; redeems: number }> = {};
  events.forEach(e => { const d = format(new Date(e.created_at), "dd MMM"); if (!dailyActivity[d]) dailyActivity[d] = { day: d, views: 0, clicks: 0, redeems: 0 }; if (e.event_type === "business_view") dailyActivity[d].views++; if (e.event_type === "offer_click") dailyActivity[d].clicks++; });
  redemptions.forEach(r => { const d = format(new Date(r.redeemed_at), "dd MMM"); if (!dailyActivity[d]) dailyActivity[d] = { day: d, views: 0, clicks: 0, redeems: 0 }; dailyActivity[d].redeems++; });
  const chartData = Object.values(dailyActivity).slice(-14);

  const eventDistribution = [
    { name: "Profile Views", value: businessViews.length, color: COLORS[0] },
    { name: "Offer Clicks", value: offerClicks.length, color: COLORS[1] },
    { name: "Redemptions", value: redemptions.length, color: COLORS[2] },
    { name: "Shelter Views", value: shelterViews.length, color: COLORS[3] },
    { name: "Social Clicks", value: socialClicks.length, color: COLORS[4] },
    { name: "Contact Clicks", value: contactClicks.length, color: COLORS[5] },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-10 overflow-x-hidden">
      {/* ═══════ HEADER ═══════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Platform Insights</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Complete platform intelligence — growth, demographics, engagement & trends</p>
        </div>
        <Tabs value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
          <TabsList>
            <TabsTrigger value="7d">7D</TabsTrigger>
            <TabsTrigger value="30d">30D</TabsTrigger>
            <TabsTrigger value="90d">90D</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ═══════ 1. GROWTH & RETENTION ═══════ */}
      <section>
        <SectionHeader icon={TrendingUp} title="Growth & Retention" subtitle="Member acquisition, plan distribution, and platform adoption" />
        <GrowthMetrics dateRange={dateRange} />
      </section>

      {/* ═══════ 2. PET DEMOGRAPHICS ═══════ */}
      <section className="border-t border-border/30 pt-8">
        <SectionHeader icon={Dog} title="Pet Demographics" subtitle="Breed, age, gender, and type distribution — the data brands want" />
        <PetDemographics />
      </section>

      {/* ═══════ 3. GEOGRAPHIC INTELLIGENCE ═══════ */}
      <section className="border-t border-border/30 pt-8">
        <SectionHeader icon={MapPin} title="Geographic Intelligence" subtitle="City-level pet population, partners, and market density" />
        <GeographicIntelligence />
      </section>

      {/* ═══════ 4. ENGAGEMENT METRICS ═══════ */}
      <section className="border-t border-border/30 pt-8">
        <SectionHeader icon={Eye} title="Engagement Metrics" subtitle="How members interact with businesses, offers, and content" />

        {/* Quick stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard icon={Eye} value={businessViews.length} label="Profile Views" colorClass="text-orange-500" bgClass="bg-orange-500/15" tip="Number of times members viewed a business profile page. High views indicate strong brand visibility." />
          <StatCard icon={MousePointer} value={offerClicks.length} label="Offer Clicks" colorClass="text-yellow-500" bgClass="bg-yellow-500/15" tip="How many times members clicked on an offer to see its details. Indicates interest in deals." />
          <StatCard icon={Gift} value={redemptions.length} label="Redemptions" colorClass="text-green-500" bgClass="bg-green-500/15" tip="Number of offers actually redeemed by members at partner businesses. This is the key revenue-driving metric." />
          <StatCard icon={Store} value={directoryImpressions.length} label="Directory Views" colorClass="text-indigo-500" bgClass="bg-indigo-500/15" tip="Times a business appeared in the directory listing. Shows general exposure even before a profile click." />
        </div>

        {/* Funnel + Trend */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <ConversionFunnel businessViews={businessViews.length} offerClicks={offerClicks.length} redemptions={redemptions.length} />
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
                      <linearGradient id="vG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f97316" stopOpacity={0.3} /><stop offset="100%" stopColor="#f97316" stopOpacity={0} /></linearGradient>
                      <linearGradient id="cG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#eab308" stopOpacity={0.3} /><stop offset="100%" stopColor="#eab308" stopOpacity={0} /></linearGradient>
                      <linearGradient id="rG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} /><stop offset="100%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                    <Area type="monotone" dataKey="views" stroke="#f97316" fill="url(#vG)" name="Views" strokeWidth={2} />
                    <Area type="monotone" dataKey="clicks" stroke="#eab308" fill="url(#cG)" name="Clicks" strokeWidth={2} />
                    <Area type="monotone" dataKey="redeems" stroke="#22c55e" fill="url(#rG)" name="Redeems" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Event distribution */}
        {eventDistribution.length > 0 && (
          <Card className="border-border/50 mb-6">
            <CardHeader className="pb-2"><CardTitle className="text-base">Event Distribution</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={eventDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={68} dataKey="value" strokeWidth={2} stroke="hsl(var(--card))">
                      {eventDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
                  {eventDistribution.map(item => (
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

        {/* Top performers */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="border-border/50"><CardHeader className="pb-2"><CardTitle className="text-base">Top Businesses (Clicks)</CardTitle></CardHeader><CardContent><RankList items={topBusinessesByClicks} colorClass="bg-yellow-500" emptyText="No clicks yet" /></CardContent></Card>
          <Card className="border-border/50"><CardHeader className="pb-2"><CardTitle className="text-base">Top Businesses (Redemptions)</CardTitle></CardHeader><CardContent><RankList items={topBusinessesByRedemptions} colorClass="bg-green-500" emptyText="No redemptions yet" /></CardContent></Card>
        </div>
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="border-border/50 overflow-hidden"><CardHeader className="pb-2"><CardTitle className="text-base">Top Offers (Clicks)</CardTitle></CardHeader><CardContent><OfferRankList items={topOffersByClicks} colorClass="bg-yellow-500" emptyText="No clicks yet" /></CardContent></Card>
          <Card className="border-border/50 overflow-hidden"><CardHeader className="pb-2"><CardTitle className="text-base">Top Offers (Redeemed)</CardTitle></CardHeader><CardContent><OfferRankList items={topOffersByRedemptions} colorClass="bg-green-500" emptyText="No redemptions yet" /></CardContent></Card>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-border/50"><CardHeader className="pb-2"><CardTitle className="text-base">Top Shelters (Views)</CardTitle></CardHeader><CardContent><RankList items={topSheltersByViews} colorClass="bg-blue-500" emptyText="No shelter views yet" /></CardContent></Card>
          <Card className="border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Cake className="w-4 h-4 text-pink-500" />Birthday Offers</CardTitle></CardHeader>
            <CardContent>
              {birthdayOffers.length === 0 ? <p className="text-muted-foreground text-sm py-4 text-center">No birthday offers sent yet</p> : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-pink-500/10 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-pink-500">{birthdayOffers.length}</p><p className="text-xs text-muted-foreground">Sent</p></div>
                    <div className="bg-green-500/10 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-green-500">{birthdayOffers.filter(b => b.redeemed_at).length}</p><p className="text-xs text-muted-foreground">Redeemed</p></div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Recent</p>
                    {birthdayOffers.slice(0, 5).map(offer => (
                      <div key={offer.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0"><span className="truncate">{offer.pet_name}</span><span className="text-muted-foreground text-xs">({offer.discount_type === 'percentage' ? `${offer.discount_value}%` : `€${offer.discount_value}`})</span></div>
                        {offer.redeemed_at ? <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1 text-xs"><Check className="w-3 h-3" />Redeemed</Badge> : <Badge variant="secondary" className="text-xs">Pending</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ═══════ 5. BREED INSIGHTS ═══════ */}
      <section className="border-t border-border/30 pt-8">
        <SectionHeader icon={Dog} title="Breed & Spending Insights" subtitle="Which breeds engage with offers — the data that sells" />
        <BreedInsights dateRange={dateRange} />
      </section>

      {/* ═══════ 6. HEALTH TRENDS ═══════ */}
      <section className="border-t border-border/30 pt-8">
        <SectionHeader icon={Activity} title="Health Data Trends" subtitle="Aggregated health record patterns — product R&D signals" />
        <HealthTrends />
      </section>

      {/* ═══════ 7. COMMUNITY HUB ═══════ */}
      <section className="border-t border-border/30 pt-8">
        <SectionHeader icon={MessageCircle} title="Community Hub" subtitle="Questions, engagement, and knowledge sharing metrics" />
        <CommunityAnalytics dateRange={dateRange} />
      </section>

      {/* ═══════ 8. PET-FRIENDLY PLACES ═══════ */}
      <section className="border-t border-border/30 pt-8">
        <SectionHeader icon={MapPin} title="Pet-Friendly Places" subtitle="Directory coverage, reviews, and listing requests" />
        <PlacesAnalytics />
      </section>
    </div>
  );
};

export default EngagementAnalytics;
