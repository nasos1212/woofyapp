import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Users, UserPlus, Crown, Activity, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { format, startOfDay, subDays, isAfter } from "date-fns";
import MetricTooltip from "./MetricTooltip";

const PLAN_COLORS: Record<string, string> = {
  single: "hsl(var(--primary))",
  duo: "hsl(var(--accent-foreground))",
  pack: "hsl(var(--secondary-foreground))",
  free: "hsl(var(--muted-foreground))",
};

const PLAN_LABELS: Record<string, string> = {
  single: "Solo Paw",
  duo: "Dynamic Duo",
  pack: "Pack Leader",
};

interface GrowthMetricsProps {
  dateRange: "7d" | "30d" | "90d";
}

interface MembershipRow {
  id: string;
  user_id: string;
  created_at: string;
  plan_type: string | null;
  is_active: boolean;
}

interface ProfileRow {
  user_id: string;
  created_at: string;
}

const normalizePlanType = (planType?: string | null) => {
  const value = planType?.trim().toLowerCase();

  if (!value) return "single";
  if (["single", "solo", "solo paw"].includes(value)) return "single";
  if (["couple", "duo", "dynamic duo"].includes(value)) return "duo";
  if (["family", "pack", "pack leader"].includes(value)) return "pack";

  return value;
};

const getPeriodLabel = (dateRange: GrowthMetricsProps["dateRange"]) => {
  if (dateRange === "7d") return "7D";
  if (dateRange === "30d") return "30D";
  return "90D";
};

const GrowthMetrics = ({ dateRange }: GrowthMetricsProps) => {
  const [loading, setLoading] = useState(true);
  const [paidMembersInPeriod, setPaidMembersInPeriod] = useState(0);
  const [freeMembersInPeriod, setFreeMembersInPeriod] = useState(0);
  const [activeMembers, setActiveMembers] = useState(0);
  const [totalPaidMembers, setTotalPaidMembers] = useState(0);
  const [totalPets, setTotalPets] = useState(0);
  const [memberGrowth, setMemberGrowth] = useState<{ paidWoW: [number, number]; freeWoW: [number, number]; paidMoM: [number, number]; freeMoM: [number, number] }>({ paidWoW: [0, 0], freeWoW: [0, 0], paidMoM: [0, 0], freeMoM: [0, 0] });
  const [planDistribution, setPlanDistribution] = useState<{ name: string; value: number; color: string }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
        const periodStart = startOfDay(subDays(new Date(), days - 1));
        const periodEnd = new Date();

        const [membershipsRes, profilesRes, petsRes] = await Promise.all([
          supabase.from("memberships").select("id, user_id, created_at, plan_type, is_active"),
          supabase.from("profiles").select("user_id, created_at"),
          supabase.from("pets").select("*", { count: "exact", head: true }),
        ]);

        if (membershipsRes.error) throw membershipsRes.error;
        if (profilesRes.error) throw profilesRes.error;
        if (petsRes.error) throw petsRes.error;

        const memberships = (membershipsRes.data || []) as MembershipRow[];
        const profiles = (profilesRes.data || []) as ProfileRow[];

        const normalizedMemberships = memberships.map((membership) => ({
          ...membership,
          normalized_plan_type: normalizePlanType(membership.plan_type),
        }));

        // Separate paid vs free memberships
        const paidMemberships = normalizedMemberships.filter((m) => m.plan_type !== "free");
        const freeMemberships = normalizedMemberships.filter((m) => m.plan_type === "free");

        const allPaidUserIds = new Set(paidMemberships.map((m) => m.user_id));
        const activePaidUserIds = new Set(
          paidMemberships
            .filter((m) => m.is_active)
            .map((m) => m.user_id)
        );

        const paidMembershipsInPeriod = paidMemberships.filter(
          (m) => new Date(m.created_at) >= periodStart
        );
        const paidUserIdsInPeriod = new Set(paidMembershipsInPeriod.map((m) => m.user_id));

        const freeMembershipsInPeriod = freeMemberships.filter(
          (m) => new Date(m.created_at) >= periodStart
        );
        const freeUserIdsInPeriod = new Set(freeMembershipsInPeriod.map((m) => m.user_id));

        setPaidMembersInPeriod(paidUserIdsInPeriod.size);
        setFreeMembersInPeriod(freeUserIdsInPeriod.size);
        setActiveMembers(activePaidUserIds.size);
        setTotalPaidMembers(allPaidUserIds.size);
        setTotalPets(petsRes.count || 0);

        const planCounts: Record<string, number> = {};
        paidMembershipsInPeriod.forEach((membership) => {
          const plan = membership.normalized_plan_type;
          planCounts[plan] = (planCounts[plan] || 0) + 1;
        });

        setPlanDistribution(
          Object.entries(planCounts)
            .map(([plan, value]) => ({
              name: PLAN_LABELS[plan] || plan,
              value,
              color: PLAN_COLORS[plan] || "hsl(var(--muted-foreground))",
            }))
            .sort((a, b) => b.value - a.value)
        );

        // WoW and MoM growth
        const now = new Date();
        const oneWeekAgo = subDays(now, 7);
        const twoWeeksAgo = subDays(now, 14);
        const oneMonthAgo = subDays(now, 30);
        const twoMonthsAgo = subDays(now, 60);

        const countInRange = (items: { created_at: string }[], start: Date, end: Date) =>
          items.filter(i => { const d = new Date(i.created_at); return isAfter(d, start) && !isAfter(d, end); }).length;

        const paidItems = paidMemberships.map(m => ({ created_at: m.created_at }));
        const freeItems = freeMemberships.map(m => ({ created_at: m.created_at }));

        setMemberGrowth({
          paidWoW: [countInRange(paidItems, oneWeekAgo, now), countInRange(paidItems, twoWeeksAgo, oneWeekAgo)],
          freeWoW: [countInRange(freeItems, oneWeekAgo, now), countInRange(freeItems, twoWeeksAgo, oneWeekAgo)],
          paidMoM: [countInRange(paidItems, oneMonthAgo, now), countInRange(paidItems, twoMonthsAgo, oneMonthAgo)],
          freeMoM: [countInRange(freeItems, oneMonthAgo, now), countInRange(freeItems, twoMonthsAgo, oneMonthAgo)],
        });
      } catch (error) {
        console.error("Error fetching growth metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  if (loading) {
    return <p className="text-muted-foreground text-sm py-8 text-center">Loading growth metrics...</p>;
  }

  const periodLabel = getPeriodLabel(dateRange);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          {
            icon: UserPlus,
            label: `Paid Members (${periodLabel})`,
            value: paidMembersInPeriod,
            color: "text-primary",
            bg: "bg-primary/15",
            tip: `Unique users who started a paid membership during the selected ${periodLabel} period.`,
          },
          {
            icon: Users,
            label: `Free Members (${periodLabel})`,
            value: freeMembersInPeriod,
            color: "text-accent-foreground",
            bg: "bg-accent/20",
            tip: `New profiles created during the selected ${periodLabel} period that still do not have any paid membership.`,
          },
          {
            icon: TrendingUp,
            label: "Current Active Paid",
            value: activeMembers,
            color: "text-secondary-foreground",
            bg: "bg-secondary",
            tip: "Unique users whose paid membership is currently active right now, regardless of the selected date range.",
          },
          {
            icon: Activity,
            label: "Total Paid Members",
            value: totalPaidMembers,
            color: "text-muted-foreground",
            bg: "bg-muted",
            tip: "All unique users who have ever had a paid membership on the platform.",
          },
          {
            icon: Crown,
            label: "Total Pets",
            value: totalPets,
            color: "text-primary",
            bg: "bg-primary/10",
            tip: "All pets currently registered on the platform.",
          },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-bold tabular-nums">{stat.value.toLocaleString()}</p>
                  <div className="flex items-center gap-1">
                    <p className="text-[11px] text-muted-foreground leading-tight">{stat.label}</p>
                    <MetricTooltip text={stat.tip} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-border/50 md:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Member Growth</CardTitle>
              <MetricTooltip text="Week-over-week and month-over-month comparison of new paid and free member signups." />
            </div>
          </CardHeader>
          <CardContent>
            {(() => {
              const calcPct = (curr: number, prev: number) => prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);
              const GrowthBadge = ({ pct }: { pct: number }) => {
                if (pct === 0) return <span className="flex items-center justify-center gap-0.5 text-xs text-muted-foreground font-medium"><Minus className="w-3 h-3" />0%</span>;
                const pos = pct > 0;
                return <span className={`flex items-center justify-center gap-0.5 text-xs font-semibold ${pos ? "text-green-600" : "text-red-500"}`}>{pos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{pos ? "+" : ""}{pct}%</span>;
              };
              const rows = [
                { label: "Paid Members", wow: memberGrowth.paidWoW, mom: memberGrowth.paidMoM },
                { label: "Free Members", wow: memberGrowth.freeWoW, mom: memberGrowth.freeMoM },
              ];
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium border-b border-border/50 pb-2">
                    <div>Metric</div>
                    <div className="text-center">Week over Week</div>
                    <div className="text-center">Month over Month</div>
                  </div>
                  {rows.map((r) => (
                    <div key={r.label} className="grid grid-cols-3 gap-2 items-center py-1.5">
                      <div className="text-sm font-medium">{r.label}</div>
                      <div className="text-center space-y-0.5">
                        <div className="text-sm font-bold tabular-nums">{r.wow[0]} <span className="text-muted-foreground font-normal text-xs">vs {r.wow[1]}</span></div>
                        <GrowthBadge pct={calcPct(r.wow[0], r.wow[1])} />
                      </div>
                      <div className="text-center space-y-0.5">
                        <div className="text-sm font-bold tabular-nums">{r.mom[0]} <span className="text-muted-foreground font-normal text-xs">vs {r.mom[1]}</span></div>
                        <GrowthBadge pct={calcPct(r.mom[0], r.mom[1])} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Plan Distribution ({periodLabel})</CardTitle>
              <MetricTooltip text="Breakdown of memberships started in the selected period, normalized to the current plan names. Legacy 'family' memberships are counted as 'Pack Leader'." />
            </div>
          </CardHeader>
          <CardContent>
            {planDistribution.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No paid memberships in this period</div>
            ) : (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={planDistribution} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" strokeWidth={2} stroke="hsl(var(--card))">
                      {planDistribution.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5">
                  {planDistribution.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-semibold tabular-nums">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GrowthMetrics;
