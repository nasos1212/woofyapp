import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface AnalyticsData {
  totalMembers: number;
  activeMembers: number;
  expiredMembers: number;
  planDistribution: { name: string; value: number }[];
  signupsByMonth: { month: string; signups: number }[];
  totalRedemptions: number;
}

const COLORS = ["#60a5fa", "#34d399", "#f472b6", "#fbbf24"];

const UserAnalytics = () => {
  const [data, setData] = useState<AnalyticsData>({
    totalMembers: 0,
    activeMembers: 0,
    expiredMembers: 0,
    planDistribution: [],
    signupsByMonth: [],
    totalRedemptions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [membershipsRes, redemptionsRes, profilesRes] = await Promise.all([
        supabase.from("memberships").select("*"),
        supabase.from("offer_redemptions").select("id"),
        supabase.from("profiles").select("created_at"),
      ]);

      if (membershipsRes.error) throw membershipsRes.error;

      const memberships = membershipsRes.data || [];
      const profiles = profilesRes.data || [];
      const now = new Date();

      // Calculate active vs expired
      const active = memberships.filter((m) => m.is_active && new Date(m.expires_at) > now);
      const expired = memberships.filter((m) => !m.is_active || new Date(m.expires_at) <= now);

      // Plan distribution
      const planCounts: Record<string, number> = {};
      memberships.forEach((m) => {
        const plan = m.plan_type || "single";
        planCounts[plan] = (planCounts[plan] || 0) + 1;
      });

      const planLabels: Record<string, string> = {
        single: "Solo Paw",
        duo: "Dynamic Duo",
        family: "Pack Leader",
      };

      const planDistribution = Object.entries(planCounts).map(([key, value]) => ({
        name: planLabels[key] || key,
        value,
      }));

      // Signups by month (last 6 months)
      const monthCounts: Record<string, number> = {};
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthCounts[key] = 0;
        months.push({
          key,
          label: d.toLocaleDateString("en-US", { month: "short" }),
        });
      }

      profiles.forEach((p) => {
        const created = new Date(p.created_at);
        const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
        if (monthCounts[key] !== undefined) {
          monthCounts[key]++;
        }
      });

      const signupsByMonth = months.map((m) => ({
        month: m.label,
        signups: monthCounts[m.key],
      }));

      setData({
        totalMembers: memberships.length,
        activeMembers: active.length,
        expiredMembers: expired.length,
        planDistribution,
        signupsByMonth,
        totalRedemptions: redemptionsRes.data?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading analytics...</p>;

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold">{data.totalMembers}</p>
                <p className="text-muted-foreground text-sm">Total Memberships</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold">{data.activeMembers}</p>
                <p className="text-muted-foreground text-sm">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold">{data.expiredMembers}</p>
                <p className="text-muted-foreground text-sm">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold">{data.totalRedemptions}</p>
                <p className="text-muted-foreground text-sm">Redemptions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Signups (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.signupsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="month" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="signups" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
                <Pie
                  data={data.planDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={{ stroke: "#888", strokeWidth: 1 }}
                >
                  {data.planDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserAnalytics;
