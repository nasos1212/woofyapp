import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, MessageSquare, Users, ThumbsUp, HelpCircle, Flag } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { subDays } from "date-fns";

const COLORS = ["#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f43f5e"];

interface CommunityAnalyticsProps {
  dateRange: "7d" | "30d" | "90d";
}

interface CategoryStat {
  name: string;
  count: number;
  color: string;
}

interface TopContributor {
  userId: string;
  name: string;
  answerCount: number;
  upvotes: number;
}

const CommunityAnalytics = ({ dateRange }: CommunityAnalyticsProps) => {
  const [loading, setLoading] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [totalHelped, setTotalHelped] = useState(0);
  const [pendingReports, setPendingReports] = useState(0);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [topContributors, setTopContributors] = useState<TopContributor[]>([]);
  const [urgencyStats, setUrgencyStats] = useState<{ name: string; count: number; color: string }[]>([]);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    const startDate = subDays(new Date(), days).toISOString();

    try {
      const [questionsRes, answersRes, helpedRes, reportsRes, categoriesRes, questionsFullRes, expertStatsRes] = await Promise.all([
        supabase.from("community_questions").select("*", { count: "exact", head: true }).gte("created_at", startDate),
        supabase.from("community_answers").select("*", { count: "exact", head: true }).gte("created_at", startDate),
        supabase.from("community_helped").select("*", { count: "exact", head: true }).gte("created_at", startDate),
        supabase.from("community_reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("community_categories").select("id, name").order("display_order"),
        supabase.from("community_questions").select("category_id, urgency").gte("created_at", startDate),
        supabase.from("community_expert_stats").select("user_id, total_answers, total_upvotes").order("total_answers", { ascending: false }).limit(5),
      ]);

      setTotalQuestions(questionsRes.count || 0);
      setTotalAnswers(answersRes.count || 0);
      setTotalHelped(helpedRes.count || 0);
      setPendingReports(reportsRes.count || 0);

      // Category breakdown
      const categories = categoriesRes.data || [];
      const questions = questionsFullRes.data || [];
      const catCounts: Record<string, number> = {};
      questions.forEach(q => {
        catCounts[q.category_id] = (catCounts[q.category_id] || 0) + 1;
      });
      setCategoryStats(
        categories
          .map((c, i) => ({ name: c.name, count: catCounts[c.id] || 0, color: COLORS[i % COLORS.length] }))
          .filter(c => c.count > 0)
          .sort((a, b) => b.count - a.count)
      );

      // Urgency breakdown
      const urgCounts: Record<string, number> = {};
      questions.forEach(q => {
        const u = q.urgency || "normal";
        urgCounts[u] = (urgCounts[u] || 0) + 1;
      });
      setUrgencyStats([
        { name: "Normal", count: urgCounts["normal"] || 0, color: "#22c55e" },
        { name: "Urgent", count: urgCounts["urgent"] || 0, color: "#eab308" },
        { name: "Emergency", count: urgCounts["emergency"] || 0, color: "#ef4444" },
      ].filter(u => u.count > 0));

      // Top contributors from expert stats
      const experts = expertStatsRes.data || [];
      if (experts.length > 0) {
        const userIds = experts.map(e => e.user_id);
        const { data: profiles } = await supabase
          .from("profiles_limited")
          .select("user_id, full_name")
          .in("user_id", userIds);
        
        const profileMap: Record<string, string> = {};
        (profiles || []).forEach(p => { profileMap[p.user_id] = p.full_name || "Anonymous"; });

        setTopContributors(
          experts.map(e => ({
            userId: e.user_id,
            name: profileMap[e.user_id] || "Anonymous",
            answerCount: e.total_answers || 0,
            upvotes: e.total_upvotes || 0,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching community analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground text-sm py-8 text-center">Loading community analytics...</p>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-primary" />
        Community Hub
      </h3>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <HelpCircle className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalQuestions}</p>
                <p className="text-xs text-muted-foreground">Questions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <MessageSquare className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalAnswers}</p>
                <p className="text-xs text-muted-foreground">Answers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <ThumbsUp className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalHelped}</p>
                <p className="text-xs text-muted-foreground">Helped</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Flag className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingReports}</p>
                <p className="text-xs text-muted-foreground">Pending Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Questions by Category */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Questions by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryStats.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No data</div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={categoryStats} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="count">
                      {categoryStats.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 min-w-0 flex-1">
                  {categoryStats.map((item) => (
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

        {/* Top Contributors */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Top Contributors (All-Time)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topContributors.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">No contributors yet</p>
            ) : (
              <div className="space-y-3">
                {topContributors.map((c, index) => (
                  <div key={c.userId} className="flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className="w-6 h-6 p-0 justify-center shrink-0">
                      {index + 1}
                    </Badge>
                    <span className="text-sm font-medium truncate flex-1 min-w-0">{c.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                        {c.answerCount} ans
                      </Badge>
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                        {c.upvotes} ↑
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Urgency Breakdown */}
      {urgencyStats.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Questions by Urgency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {urgencyStats.map((u) => (
                <div key={u.name} className="flex-1 rounded-lg p-3 text-center" style={{ backgroundColor: `${u.color}15` }}>
                  <p className="text-2xl font-bold" style={{ color: u.color }}>{u.count}</p>
                  <p className="text-xs text-muted-foreground">{u.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CommunityAnalytics;
