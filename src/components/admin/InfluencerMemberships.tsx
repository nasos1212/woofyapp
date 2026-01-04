import { useState, useEffect } from "react";
import { Plus, Crown, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface PromoMembership {
  id: string;
  user_id: string;
  membership_id: string | null;
  reason: string;
  granted_at: string;
  expires_at: string;
  notes: string | null;
  user_email?: string;
  user_name?: string;
}

interface Profile {
  user_id: string;
  email: string;
  full_name: string | null;
}

const InfluencerMemberships = () => {
  const { user } = useAuth();
  const [promoMemberships, setPromoMemberships] = useState<PromoMembership[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [newMembership, setNewMembership] = useState({
    reason: "influencer",
    duration_months: "12",
    plan_type: "family",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [promoRes, profilesRes] = await Promise.all([
        supabase.from("promo_memberships").select("*").order("granted_at", { ascending: false }),
        supabase.from("profiles").select("user_id, email, full_name"),
      ]);

      if (promoRes.error) throw promoRes.error;
      if (profilesRes.error) throw profilesRes.error;

      const profilesMap = new Map(profilesRes.data?.map((p) => [p.user_id, p]));
      
      const enrichedMemberships = (promoRes.data || []).map((pm) => ({
        ...pm,
        user_email: profilesMap.get(pm.user_id)?.email,
        user_name: profilesMap.get(pm.user_id)?.full_name,
      }));

      setPromoMemberships(enrichedMemberships);
      setProfiles(profilesRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = () => {
    const found = profiles.find(
      (p) => p.email.toLowerCase().includes(searchEmail.toLowerCase())
    );
    if (found) {
      setSelectedUser(found);
    } else {
      toast.error("User not found");
    }
  };

  const grantMembership = async () => {
    if (!selectedUser) {
      toast.error("Please select a user");
      return;
    }

    try {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + parseInt(newMembership.duration_months));

      // First create a membership for the user
      const memberNumber = `PP-${new Date().getFullYear()}-${Math.floor(Math.random() * 999999).toString().padStart(6, "0")}`;
      
      const { data: membershipData, error: membershipError } = await supabase
        .from("memberships")
        .insert({
          user_id: selectedUser.user_id,
          member_number: memberNumber,
          plan_type: newMembership.plan_type,
          max_pets: newMembership.plan_type === "family" ? 5 : newMembership.plan_type === "duo" ? 2 : 1,
          expires_at: expiresAt.toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (membershipError) throw membershipError;

      // Then track the promo membership
      const { error: promoError } = await supabase.from("promo_memberships").insert({
        user_id: selectedUser.user_id,
        membership_id: membershipData.id,
        reason: newMembership.reason,
        granted_by: user?.id,
        expires_at: expiresAt.toISOString(),
        notes: newMembership.notes || null,
      });

      if (promoError) throw promoError;

      toast.success("Free membership granted!");
      setDialogOpen(false);
      setSelectedUser(null);
      setSearchEmail("");
      setNewMembership({
        reason: "influencer",
        duration_months: "12",
        plan_type: "family",
        notes: "",
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to grant membership");
    }
  };

  const revokeMembership = async (promoId: string, membershipId: string | null) => {
    try {
      // Deactivate the membership if it exists
      if (membershipId) {
        await supabase
          .from("memberships")
          .update({ is_active: false })
          .eq("id", membershipId);
      }

      // Delete the promo record
      const { error } = await supabase.from("promo_memberships").delete().eq("id", promoId);
      if (error) throw error;

      toast.success("Membership revoked");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to revoke membership");
    }
  };

  const getReasonBadge = (reason: string) => {
    const colors: Record<string, string> = {
      influencer: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      partner: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      contest_winner: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      employee: "bg-green-500/20 text-green-400 border-green-500/30",
      other: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };
    return <Badge className={colors[reason] || colors.other}>{reason.replace("_", " ")}</Badge>;
  };

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Crown className="w-5 h-5" />
          Influencer / Free Memberships
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Grant Membership
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grant Free Membership</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Find User by Email</Label>
                <div className="flex gap-2">
                  <Input
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    placeholder="user@email.com"
                  />
                  <Button variant="outline" onClick={searchUsers}>
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
                {selectedUser && (
                  <div className="mt-2 p-2 rounded bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                    Selected: {selectedUser.full_name || selectedUser.email}
                  </div>
                )}
              </div>
              <div>
                <Label>Reason</Label>
                <Select
                  value={newMembership.reason}
                  onValueChange={(v) => setNewMembership({ ...newMembership, reason: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="influencer">Influencer</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                    <SelectItem value="contest_winner">Contest Winner</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Plan Type</Label>
                <Select
                  value={newMembership.plan_type}
                  onValueChange={(v) => setNewMembership({ ...newMembership, plan_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Solo Paw (1 pet)</SelectItem>
                    <SelectItem value="duo">Dynamic Duo (2 pets)</SelectItem>
                    <SelectItem value="family">Family Pack (5 pets)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Duration</Label>
                <Select
                  value={newMembership.duration_months}
                  onValueChange={(v) => setNewMembership({ ...newMembership, duration_months: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Month</SelectItem>
                    <SelectItem value="3">3 Months</SelectItem>
                    <SelectItem value="6">6 Months</SelectItem>
                    <SelectItem value="12">1 Year</SelectItem>
                    <SelectItem value="24">2 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Textarea
                  value={newMembership.notes}
                  onChange={(e) => setNewMembership({ ...newMembership, notes: e.target.value })}
                  placeholder="Instagram: @username, Followers: 50k"
                />
              </div>
              <Button onClick={grantMembership} className="w-full" disabled={!selectedUser}>
                Grant Free Membership
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {promoMemberships.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No promo memberships granted yet</p>
        ) : (
          <div className="space-y-3">
            {promoMemberships.map((pm) => (
              <div
                key={pm.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{pm.user_name || pm.user_email}</span>
                    {getReasonBadge(pm.reason)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Expires: {new Date(pm.expires_at).toLocaleDateString()}
                    {pm.notes && <span className="ml-2">• {pm.notes}</span>}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => revokeMembership(pm.id, pm.membership_id)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Revoke
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InfluencerMemberships;
