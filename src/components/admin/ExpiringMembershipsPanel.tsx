import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Calendar, Clock, RefreshCw, Send, User } from "lucide-react";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import { formatDate } from "@/lib/utils";

interface ExpiringMembership {
  id: string;
  user_id: string;
  expires_at: string;
  plan_type: string;
  member_number: string;
  profiles: {
    full_name: string;
    email: string;
  } | null;
}

const ExpiringMembershipsPanel = () => {
  const [memberships, setMemberships] = useState<ExpiringMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggeringNotifications, setTriggeringNotifications] = useState(false);

  const fetchExpiringMemberships = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now);
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data, error } = await supabase
        .from("memberships")
        .select(`
          id,
          user_id,
          expires_at,
          plan_type,
          member_number,
          profiles!inner(full_name, email)
        `)
        .eq("is_active", true)
        .lte("expires_at", thirtyDaysFromNow.toISOString())
        .gt("expires_at", now.toISOString())
        .order("expires_at", { ascending: true });

      if (error) throw error;
      
      // Transform data to handle the profiles array from join
      const transformed = (data || []).map(m => ({
        ...m,
        profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
      }));
      
      setMemberships(transformed);
    } catch (error) {
      console.error("Error fetching expiring memberships:", error);
      toast.error("Failed to load expiring memberships");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpiringMemberships();
  }, []);

  const triggerNotifications = async () => {
    setTriggeringNotifications(true);
    try {
      const { data, error } = await supabase.functions.invoke("notify-expiring-memberships");
      
      if (error) throw error;
      
      toast.success(`Sent ${data?.notificationsSent || 0} notifications to expiring members`);
      fetchExpiringMemberships();
    } catch (error) {
      console.error("Error triggering notifications:", error);
      toast.error("Failed to send notifications");
    } finally {
      setTriggeringNotifications(false);
    }
  };

  const getDaysLeftBadge = (expiresAt: string) => {
    const daysLeft = differenceInDays(new Date(expiresAt), new Date());
    
    if (daysLeft <= 3) {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">⚠️ {daysLeft}d left</Badge>;
    } else if (daysLeft <= 7) {
      return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">{daysLeft}d left</Badge>;
    } else {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{daysLeft}d left</Badge>;
    }
  };

  const getPlanLabel = (planType: string) => {
    const labels: Record<string, string> = {
      single: "Solo Paw",
      duo: "Dynamic Duo",
      family: "Pack Leader",
    };
    return labels[planType] || planType;
  };

  const criticalCount = memberships.filter(m => differenceInDays(new Date(m.expires_at), new Date()) <= 3).length;
  const urgentCount = memberships.filter(m => {
    const days = differenceInDays(new Date(m.expires_at), new Date());
    return days > 3 && days <= 7;
  }).length;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-amber-500" />
            Expiring Memberships ({memberships.length})
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchExpiringMemberships} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button 
              size="sm" 
              onClick={triggerNotifications} 
              disabled={triggeringNotifications || memberships.length === 0}
              className="bg-amber-500 hover:bg-amber-600"
            >
              <Send className={`w-4 h-4 mr-1 ${triggeringNotifications ? "animate-pulse" : ""}`} />
              Send Reminders
            </Button>
          </div>
        </div>
        {(criticalCount > 0 || urgentCount > 0) && (
          <div className="flex gap-2 mt-2">
            {criticalCount > 0 && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {criticalCount} critical (≤3 days)
              </Badge>
            )}
            {urgentCount > 0 && (
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                {urgentCount} urgent (≤7 days)
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : memberships.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            🎉 No memberships expiring in the next 30 days!
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {memberships.map((membership) => (
                <div
                  key={membership.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{membership.profiles?.full_name || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">{membership.profiles?.email}</p>
                      <p className="text-xs text-muted-foreground">{membership.member_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <Badge variant="outline" className="mb-1">{getPlanLabel(membership.plan_type)}</Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {formatDate(new Date(membership.expires_at))}
                      </div>
                    </div>
                    {getDaysLeftBadge(membership.expires_at)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default ExpiringMembershipsPanel;
