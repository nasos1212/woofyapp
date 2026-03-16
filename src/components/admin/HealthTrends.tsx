import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Syringe, Stethoscope } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const TYPE_COLORS: Record<string, string> = {
  vaccination: "#22c55e",
  checkup: "#3b82f6",
  surgery: "#ef4444",
  medication: "#f97316",
  dental: "#8b5cf6",
  allergy: "#ec4899",
  injury: "#eab308",
  lab_test: "#14b8a6",
  other: "#64748b",
};

const TYPE_LABELS: Record<string, string> = {
  vaccination: "Vaccination",
  checkup: "Checkup",
  surgery: "Surgery",
  medication: "Medication",
  dental: "Dental",
  allergy: "Allergy",
  injury: "Injury",
  lab_test: "Lab Test",
  other: "Other",
};

const HealthTrends = () => {
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [typeStats, setTypeStats] = useState<{ name: string; value: number; color: string; pct: number }[]>([]);
  const [monthlyRecords, setMonthlyRecords] = useState<{ month: string; count: number }[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, count } = await supabase
        .from("pet_health_records")
        .select("record_type, created_at", { count: "exact" });

      const records = data || [];
      setTotalRecords(count || 0);

      // Type distribution
      const typeMap: Record<string, number> = {};
      records.forEach(r => {
        typeMap[r.record_type] = (typeMap[r.record_type] || 0) + 1;
      });
      const total = records.length || 1;
      setTypeStats(
        Object.entries(typeMap)
          .map(([type, value]) => ({
            name: TYPE_LABELS[type] || type,
            value,
            color: TYPE_COLORS[type] || "#64748b",
            pct: Math.round((value / total) * 100),
          }))
          .sort((a, b) => b.value - a.value)
      );

      // Monthly trend (last 6 months)
      const monthMap: Record<string, number> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        monthMap[key] = 0;
      }
      records.forEach(r => {
        const d = new Date(r.created_at);
        const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        if (monthMap[key] !== undefined) monthMap[key]++;
      });
      setMonthlyRecords(Object.entries(monthMap).map(([month, count]) => ({ month, count })));
    } catch (error) {
      console.error("Error fetching health trends:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground text-sm py-8 text-center">Loading health trends...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card px-4 py-3">
          <Stethoscope className="w-4 h-4 text-primary" />
          <span className="text-lg font-bold tabular-nums">{totalRecords.toLocaleString()}</span>
          <span className="text-sm text-muted-foreground">health records tracked</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Record Type Distribution */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Record Types
            </CardTitle>
            <p className="text-xs text-muted-foreground">What health records owners track most</p>
          </CardHeader>
          <CardContent>
            {typeStats.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">No health records yet</p>
            ) : (
              <div className="flex items-start gap-4">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={typeStats} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" strokeWidth={2} stroke="hsl(var(--card))">
                      {typeStats.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 flex-1 min-w-0">
                  {typeStats.map(t => (
                    <div key={t.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                        <span className="text-muted-foreground truncate">{t.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-semibold tabular-nums">{t.value}</span>
                        <span className="text-xs text-muted-foreground">({t.pct}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Syringe className="w-4 h-4 text-primary" />
              Monthly Health Records
            </CardTitle>
            <p className="text-xs text-muted-foreground">Seasonal patterns in pet health tracking</p>
          </CardHeader>
          <CardContent>
            {monthlyRecords.every(m => m.count === 0) ? (
              <div className="h-[140px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthlyRecords}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" name="Records" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HealthTrends;
