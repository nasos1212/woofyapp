import { useState, useEffect } from "react";
import { Search, Users, Crown, UserX, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";

interface MembershipWithUser {
  id: string;
  user_id: string;
  member_number: string;
  plan_type: string;
  is_active: boolean;
  expires_at: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

const MembershipManager = () => {
  const [memberships, setMemberships] = useState<MembershipWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    fetchMemberships();
  }, []);

  const fetchMemberships = async () => {
    setLoading(true);
    try {
      const [membershipsRes, profilesRes] = await Promise.all([
        supabase
          .from("memberships")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("profiles").select("user_id, email, full_name"),
      ]);

      if (membershipsRes.error) throw membershipsRes.error;
      if (profilesRes.error) throw profilesRes.error;

      const profilesMap = new Map(
        profilesRes.data?.map((p) => [p.user_id, p])
      );

      const enrichedMemberships = (membershipsRes.data || []).map((m) => ({
        ...m,
        user_email: profilesMap.get(m.user_id)?.email,
        user_name: profilesMap.get(m.user_id)?.full_name,
      }));

      setMemberships(enrichedMemberships);
    } catch (error) {
      console.error("Error fetching memberships:", error);
      toast.error("Failed to load memberships");
    } finally {
      setLoading(false);
    }
  };

  const toggleMembershipStatus = async (membership: MembershipWithUser) => {
    try {
      const newStatus = !membership.is_active;
      
      const { error } = await supabase
        .from("memberships")
        .update({ is_active: newStatus })
        .eq("id", membership.id);

      if (error) throw error;

      setMemberships((prev) =>
        prev.map((m) =>
          m.id === membership.id ? { ...m, is_active: newStatus } : m
        )
      );

      toast.success(
        newStatus
          ? `${membership.user_name || membership.user_email} is now a paid member`
          : `${membership.user_name || membership.user_email} is now freemium`
      );
    } catch (error: any) {
      console.error("Error toggling membership:", error);
      toast.error(error.message || "Failed to update membership");
    }
  };

  const getExpiryStatus = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const daysUntil = differenceInDays(expiry, now);

    if (daysUntil < 0) {
      const daysExpired = Math.abs(daysUntil);
      return {
        label: `Expired ${daysExpired}d ago`,
        color: "bg-red-500/20 text-red-400 border-red-500/30",
        isExpired: true,
        daysExpired,
      };
    } else if (daysUntil <= 7) {
      return {
        label: `Expires in ${daysUntil}d`,
        color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        isExpired: false,
        daysExpired: 0,
      };
    } else {
      return {
        label: `Expires ${format(expiry, "MMM d, yyyy")}`,
        color: "bg-green-500/20 text-green-400 border-green-500/30",
        isExpired: false,
        daysExpired: 0,
      };
    }
  };

  const getPlanBadge = (planType: string) => {
    const colors: Record<string, string> = {
      single: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      duo: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      family: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    };
    const labels: Record<string, string> = {
      single: "Solo Paw",
      duo: "Dynamic Duo",
      family: "Family Pack",
    };
    return (
      <Badge className={colors[planType] || colors.single}>
        {labels[planType] || planType}
      </Badge>
    );
  };

  const filteredMemberships = memberships.filter((m) => {
    const matchesSearch =
      !searchQuery ||
      m.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.member_number.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" && m.is_active) ||
      (filterStatus === "inactive" && !m.is_active);

    return matchesSearch && matchesFilter;
  });

  const activeCount = memberships.filter((m) => m.is_active).length;
  const freemiumCount = memberships.filter((m) => !m.is_active).length;

  if (loading) {
    return <p className="text-muted-foreground">Loading memberships...</p>;
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Membership Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-muted/30 text-center">
            <p className="text-2xl font-bold">{memberships.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 text-center">
            <p className="text-2xl font-bold text-green-400">{activeCount}</p>
            <p className="text-xs text-muted-foreground">Paid</p>
          </div>
          <div className="p-3 rounded-lg bg-orange-500/10 text-center">
            <p className="text-2xl font-bold text-orange-400">{freemiumCount}</p>
            <p className="text-xs text-muted-foreground">Freemium</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by email, name, or member number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-1">
            {(["all", "active", "inactive"] as const).map((status) => (
              <Button
                key={status}
                size="sm"
                variant={filterStatus === status ? "default" : "outline"}
                onClick={() => setFilterStatus(status)}
                className="capitalize"
              >
                {status === "inactive" ? "Freemium" : status}
              </Button>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={fetchMemberships}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Memberships List */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filteredMemberships.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No memberships found
            </p>
          ) : (
            filteredMemberships.map((membership) => {
              const expiryStatus = getExpiryStatus(membership.expires_at);
              return (
                <div
                  key={membership.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted/30 gap-3 border border-border/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">
                        {membership.user_name || membership.user_email || "Unknown"}
                      </p>
                      {getPlanBadge(membership.plan_type)}
                      <Badge className={expiryStatus.color}>
                        {expiryStatus.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {membership.user_email} • {membership.member_number}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <UserX className="w-4 h-4 text-muted-foreground" />
                      <Switch
                        checked={membership.is_active}
                        onCheckedChange={() => toggleMembershipStatus(membership)}
                      />
                      <Crown
                        className={`w-4 h-4 ${
                          membership.is_active
                            ? "text-amber-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <Badge
                      variant={membership.is_active ? "default" : "outline"}
                      className={
                        membership.is_active
                          ? "bg-green-600"
                          : "text-orange-400 border-orange-400"
                      }
                    >
                      {membership.is_active ? "Paid" : "Freemium"}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MembershipManager;
