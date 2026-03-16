import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Users, UserPlus, Crown } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, subMonths, startOfMonth } from "date-fns";

const PLAN_COLORS: Record<string, string> = {
  single: "#f97316",
  couple: "#3b82f6",
  family: "#8b5cf6",
  free: "#64748b",
};

const GrowthMetrics = () => {
  const [loading, setLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);
  const [activeMembers, setActiveMembers] = useState(0);
  const [totalPets, setTotalPets] = useState(0);
  const [monthlyGrowth, setMonthlyGrowth] = useState<{ month: string; members: number; cumulative: number }[]>([]);
  const [planDistribution, setPlanDistribution] = useState<{ name: string; value: number; color: string }[]>([]);
  const [newThisMonth, setNewThisMonth] = useState(0);
  const [freeMembers, setFreeMembers] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [membershipsRes, activeMembershipsRes, petsRes, profilesRes] = await Promise.all([
        supabase.from("memberships").select("id, created_at, plan_type, is_active"),
        supabase.from("memberships").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("pets").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);

      const memberships = membershipsRes.data || [];
      setTotalMembers(memberships.length);
      setActiveMembers(activeMembershipsRes.count || 0);
      setTotalPets(petsRes.count || 0);

      // Free members = profiles without a membership (approximate)
      const totalProfiles = profilesRes.count || 0;
      setFreeMembers(Math.max(0, totalProfiles - memberships.length));

      // Monthly growth over last 12 months
      const monthMap: Record<string, number> = {};
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const month = format(subMonths(now, i), "MMM yyyy");
        monthMap[month] = 0;
      }

      memberships.forEach(m => {
        const month = format(new Date(m.created_at), "MMM yyyy");
        if (monthMap[month] !== undefined) monthMap[month]++;
      });

      let cumulative = memberships.filter(m => {
        const monthStart = startOfMonth(subMonths(now, 12));
        return new Date(m.created_at) < monthStart;
      }).length;

      const growth = Object.entries(monthMap).map(([month, count]) => {
        cumulative += count;
        return { month, members: count, cumulative };
      });
      setMonthlyGrowth(growth);

      // This month's new members
      const thisMonthStart = startOfMonth(now);
      setNewThisMonth(memberships.filter(m => new Date(m.created_at) >= thisMonthStart).length);

      // Plan distribution
      const planCounts: Record<string, number> = {};
      memberships.forEach(m => {
        const plan = m.plan_type || "single";
        planCounts[plan] = (planCounts[plan] || 0) + 1;
      });
      setPlanDistribution(
        Object.entries(planCounts)
          .map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value,
            color: PLAN_COLORS[name] || "#a3a3a3",
          }))
          .sort((a, b) => b.value - a.value)
      );
    } catch (error) {
      console.error("Error fetching growth metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground text-sm py-8 text-center">Loading growth metrics...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Headline stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { icon: Users, label: "Total Members", value: totalMembers, color: "text-primary", bg: "bg-primary/15" },
          { icon: TrendingUp, label: "Active Members", value: activeMembers, color: "text-green-500", bg: "bg-green-500/15" },
          { icon: UserPlus, label: "New This Month", value: newThisMonth, color: "text-blue-500", bg: "bg-blue-500/15" },
          { icon: Users, label: "Free Members", value: freeMembers, color: "text-muted-foreground", bg: "bg-muted" },
          { icon: Crown, label: "Total Pets", value: totalPets, color: "text-orange-500", bg: "bg-orange-500/15" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold tabular-nums">{stat.value.toLocaleString()}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Growth Over Time */}
        <Card className="border-border/50 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Member Growth (12 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyGrowth.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyGrowth}>
                  <defs>
                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey="cumulative" stroke="hsl(var(--primary))" fill="url(#growthGrad)" name="Total Members" strokeWidth={2} />
                  <Area type="monotone" dataKey="members" stroke="#22c55e" fill="none" name="New Members" strokeWidth={2} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {planDistribution.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No data</div>
            ) : (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={planDistribution} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" strokeWidth={2} stroke="hsl(var(--card))">
                      {planDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
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
