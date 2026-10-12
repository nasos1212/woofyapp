import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Smartphone, Users, Activity, UserPlus, Globe, LogIn, ExternalLink, RefreshCw } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { format, subDays } from "date-fns";

interface Session { user_id: string | null; created_at: string; metadata: any }
interface Token { user_id: string; platform: string; created_at: string; updated_at: string }
interface Profile { user_id: string; email: string; full_name: string | null; created_at: string; login_count: number | null }

const PAGE = 1000;
const PIE = ["hsl(var(--primary))", "hsl(var(--muted-foreground))", "hsl(var(--accent))"];

const Stat = ({ icon: Icon, value, label }: { icon: any; value: number | string; label: string }) => (
  <Card><CardContent className="pt-4 pb-3 flex items-center gap-3">
    <div className="p-2 rounded-xl bg-primary/10"><Icon className="w-4 h-4 text-primary" /></div>
    <div><p className="text-xl font-bold tabular-nums">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
  </CardContent></Card>
);

const AppMetrics = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const since = subDays(new Date(), 90).toISOString();
    const all: Session[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data } = await supabase.from("analytics_events").select("user_id, created_at, metadata")
        .eq("event_type", "app_session").gte("created_at", since).order("created_at").range(from, from + PAGE - 1);
      all.push(...((data as Session[]) || []));
      if (!data || data.length < PAGE) break;
    }
    const profs: Profile[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data } = await supabase.from("profiles").select("user_id, email, full_name, created_at, login_count").range(from, from + PAGE - 1);
      profs.push(...((data as Profile[]) || []));
      if (!data || data.length < PAGE) break;
    }
    const { data: tk } = await supabase.from("push_tokens").select("user_id, platform, created_at, updated_at").order("created_at", { ascending: false });
    setSessions(all); setProfiles(profs); setTokens((tk as Token[]) || []); setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const m = useMemo(() => {
    const now = Date.now();
    const activeIn = (days: number, pf?: string) => new Set(sessions.filter(s =>
      now - new Date(s.created_at).getTime() <= days * 864e5 && (!pf || (s.metadata?.platform ?? "web") === pf)).map(s => s.user_id)).size;
    const daily = Array.from({ length: 30 }, (_, i) => {
      const d = format(subDays(new Date(), 29 - i), "yyyy-MM-dd");
      const day = sessions.filter(s => s.created_at.slice(0, 10) === d);
      return {
        date: format(subDays(new Date(), 29 - i), "dd MMM"),
        iOS: new Set(day.filter(s => s.metadata?.platform === "ios").map(s => s.user_id)).size,
        Web: new Set(day.filter(s => (s.metadata?.platform ?? "web") === "web").map(s => s.user_id)).size,
      };
    });
    const platformCounts: Record<string, number> = {};
    const versions: Record<string, number> = {};
    sessions.forEach(s => {
      const p = s.metadata?.platform ?? "web";
      platformCounts[p] = (platformCounts[p] || 0) + 1;
      if (p !== "web") { const v = s.metadata?.app_version || "unknown"; versions[v] = (versions[v] || 0) + 1; }
    });
    const signups = (days: number) => profiles.filter(p => now - new Date(p.created_at).getTime() <= days * 864e5).length;
    const byUser = new Map(profiles.map(p => [p.user_id, p]));
    const lastSeen = new Map<string, string>();
    sessions.forEach(s => { if (s.user_id) lastSeen.set(s.user_id, s.created_at); });
    const deviceRows = tokens.filter(t => t.platform === "ios").map(t => ({ ...t, profile: byUser.get(t.user_id), lastSeen: lastSeen.get(t.user_id) }));
    return {
      dau: activeIn(1), wau: activeIn(7), mau: activeIn(30), iosMau: activeIn(30, "ios"),
      daily, platform: Object.entries(platformCounts).map(([name, value]) => ({ name: name === "ios" ? "iOS app" : name === "web" ? "Website" : name, value })),
      versions: Object.entries(versions).sort((a, b) => b[1] - a[1]),
      signups7: signups(7), signups30: signups(30),
      totalLogins: profiles.reduce((a, p) => a + (p.login_count || 0), 0),
      iosDevices: deviceRows.length, iosUsers: new Set(deviceRows.map(d => d.user_id)).size, deviceRows,
    };
  }, [sessions, tokens, profiles]);

  if (loading) return <p className="text-center text-muted-foreground py-10">Loading app metrics...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">App Metrics</h2>
          <p className="text-sm text-muted-foreground">Live usage from the iPhone app and website. Session tracking started with this update.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()}><RefreshCw className="w-4 h-4 mr-1" />Refresh</Button>
          <Button asChild size="sm" variant="secondary">
            <a href="https://appstoreconnect.apple.com/analytics" target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4 mr-1" />App Store downloads</a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={Smartphone} value={m.iosDevices} label="iPhones with app (notifications on)" />
        <Stat icon={Users} value={m.iosUsers} label="Accounts using iPhone app" />
        <Stat icon={Activity} value={m.dau} label="Active users today (24h)" />
        <Stat icon={Activity} value={m.wau} label="Active users (7 days)" />
        <Stat icon={Activity} value={m.mau} label="Active users (30 days)" />
        <Stat icon={Smartphone} value={m.iosMau} label="Active on iPhone app (30 days)" />
        <Stat icon={UserPlus} value={`${m.signups7} / ${m.signups30}`} label="New signups (7d / 30d)" />
        <Stat icon={LogIn} value={m.totalLogins} label={`Total logins, ${profiles.length} accounts`} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Daily active users (last 30 days)</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={m.daily}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" fontSize={11} interval={4} />
              <YAxis allowDecimals={false} fontSize={11} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="iOS" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Web" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="w-4 h-4" />App vs website sessions (90 days)</CardTitle></CardHeader>
          <CardContent className="h-56">
            {m.platform.length === 0 ? <p className="text-sm text-muted-foreground text-center py-10">No sessions recorded yet.</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={m.platform} dataKey="value" nameKey="name" outerRadius={70} label>
                  {m.platform.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
                </Pie><Tooltip /><Legend /></PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">iPhone app versions in use</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {m.versions.length === 0 ? <p className="text-sm text-muted-foreground">Shows after users open the app (version reporting is new).</p> :
              m.versions.map(([v, c]) => (
                <div key={v} className="flex justify-between text-sm"><span>Version {v}</span><Badge variant="secondary">{c} sessions</Badge></div>
              ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Accounts with the iPhone app ({m.iosDevices} devices)</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground border-b border-border">
              <th className="py-2 pr-3">Name</th><th className="py-2 pr-3">Email</th><th className="py-2 pr-3">Installed</th><th className="py-2">Last active</th>
            </tr></thead>
            <tbody>
              {m.deviceRows.map((d, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 pr-3">{d.profile?.full_name || "-"}</td>
                  <td className="py-2 pr-3">{d.profile?.email || "-"}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{format(new Date(d.created_at), "dd MMM yyyy")}</td>
                  <td className="py-2 whitespace-nowrap">{d.lastSeen ? format(new Date(d.lastSeen), "dd MMM HH:mm") : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground mt-3">Only iPhones where notifications were allowed appear here. Total downloads are in App Store Connect.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppMetrics;
