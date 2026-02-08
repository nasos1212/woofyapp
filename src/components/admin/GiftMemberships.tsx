import { useState, useEffect } from "react";
import { Plus, Gift, Trash2, Search, Loader2, AlertCircle, CheckCircle2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

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
  plan_type?: string;
}

interface Profile {
  user_id: string;
  email: string;
  full_name: string | null;
}

interface Membership {
  id: string;
  user_id: string;
  is_active: boolean;
  plan_type: string;
  expires_at: string;
}

const InfluencerMemberships = () => {
  const { user } = useAuth();
  const [promoMemberships, setPromoMemberships] = useState<PromoMembership[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [granting, setGranting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [existingMembership, setExistingMembership] = useState<Membership | null>(null);
  const [checkingMembership, setCheckingMembership] = useState(false);
  const [editingMembership, setEditingMembership] = useState<PromoMembership | null>(null);
  const [updating, setUpdating] = useState(false);
  const [newMembership, setNewMembership] = useState({
    reason: "gift",
    duration_months: "12",
    plan_type: "family",
    notes: "",
  });
  const [editForm, setEditForm] = useState({
    extend_months: "0",
    plan_type: "family",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Reset dialog state when closed
  useEffect(() => {
    if (!dialogOpen) {
      setSearchEmail("");
      setSearchResults([]);
      setSelectedUser(null);
      setExistingMembership(null);
      setNewMembership({
        reason: "gift",
        duration_months: "12",
        plan_type: "family",
        notes: "",
      });
    }
  }, [dialogOpen]);

  // Reset edit dialog state when closed
  useEffect(() => {
    if (!editDialogOpen) {
      setEditingMembership(null);
      setEditForm({
        extend_months: "0",
        plan_type: "family",
        notes: "",
      });
    }
  }, [editDialogOpen]);

  const fetchData = async () => {
    try {
      const [promoRes, profilesRes, membershipsRes] = await Promise.all([
        supabase.from("promo_memberships").select("*").order("granted_at", { ascending: false }),
        supabase.from("profiles").select("user_id, email, full_name"),
        supabase.from("memberships").select("id, user_id, plan_type"),
      ]);

      if (promoRes.error) throw promoRes.error;
      if (profilesRes.error) throw profilesRes.error;

      const profilesMap = new Map(profilesRes.data?.map((p) => [p.user_id, p]));
      const membershipsMap = new Map(membershipsRes.data?.map((m) => [m.id, m]));
      
      const enrichedMemberships = (promoRes.data || []).map((pm) => ({
        ...pm,
        user_email: profilesMap.get(pm.user_id)?.email,
        user_name: profilesMap.get(pm.user_id)?.full_name,
        plan_type: pm.membership_id ? membershipsMap.get(pm.membership_id)?.plan_type : undefined,
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
    if (!searchEmail.trim()) {
      setSearchResults([]);
      return;
    }
    
    const found = profiles.filter(
      (p) => p.email.toLowerCase().includes(searchEmail.toLowerCase()) ||
             p.full_name?.toLowerCase().includes(searchEmail.toLowerCase())
    ).slice(0, 5);
    
    setSearchResults(found);
    
    if (found.length === 0) {
      toast.error("No users found");
    }
  };

  const selectUser = async (profile: Profile) => {
    setSelectedUser(profile);
    setSearchResults([]);
    setSearchEmail(profile.email);
    setCheckingMembership(true);
    
    try {
      // Check if user already has an active membership
      const { data: membership } = await supabase
        .from("memberships")
        .select("*")
        .eq("user_id", profile.user_id)
        .eq("is_active", true)
        .single();
      
      setExistingMembership(membership || null);
    } catch (error) {
      setExistingMembership(null);
    } finally {
      setCheckingMembership(false);
    }
  };

  const grantMembership = async () => {
    if (!selectedUser) {
      toast.error("Please select a user");
      return;
    }

    if (existingMembership) {
      toast.error("User already has an active membership");
      return;
    }

    setGranting(true);
    
    try {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + parseInt(newMembership.duration_months));

      // Generate sequential member number using database function
      const { data: memberNumberData } = await supabase.rpc('generate_member_number');
      const memberNumber = memberNumberData || `WF-${new Date().getFullYear()}-1`;
      
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

      // Ensure user has the member role
      await supabase.from("user_roles").upsert(
        { user_id: selectedUser.user_id, role: "member" },
        { onConflict: "user_id,role" }
      );

      // Track the promo membership
      const { error: promoError } = await supabase.from("promo_memberships").insert({
        user_id: selectedUser.user_id,
        membership_id: membershipData.id,
        reason: newMembership.reason,
        granted_by: user?.id,
        expires_at: expiresAt.toISOString(),
        notes: newMembership.notes || null,
      });

      if (promoError) throw promoError;

      // Create a notification for the user
      await supabase.from("notifications").insert({
        user_id: selectedUser.user_id,
        type: "gift_membership",
        title: "🎁 You received a gift membership!",
        message: `You've been granted a free ${getPlanLabel(newMembership.plan_type)} membership. Enjoy your benefits!`,
        data: { reason: newMembership.reason, plan_type: newMembership.plan_type },
      });

      toast.success("Free membership granted successfully!");
      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Grant error:", error);
      toast.error(error.message || "Failed to grant membership");
    } finally {
      setGranting(false);
    }
  };

  const openEditDialog = (pm: PromoMembership) => {
    setEditingMembership(pm);
    setEditForm({
      extend_months: "0",
      plan_type: pm.plan_type || "family",
      notes: pm.notes || "",
    });
    setEditDialogOpen(true);
  };

  const updateMembership = async () => {
    if (!editingMembership || !editingMembership.membership_id) {
      toast.error("Invalid membership");
      return;
    }

    setUpdating(true);

    try {
      const currentExpiry = new Date(editingMembership.expires_at);
      const extendMonths = parseInt(editForm.extend_months);
      
      // Calculate new expiry date
      let newExpiryDate = currentExpiry;
      if (extendMonths > 0) {
        newExpiryDate = new Date(currentExpiry);
        newExpiryDate.setMonth(newExpiryDate.getMonth() + extendMonths);
      }

      // Update the membership table
      const { error: membershipError } = await supabase
        .from("memberships")
        .update({
          plan_type: editForm.plan_type,
          max_pets: editForm.plan_type === "family" ? 5 : editForm.plan_type === "duo" ? 2 : 1,
          expires_at: newExpiryDate.toISOString(),
        })
        .eq("id", editingMembership.membership_id);

      if (membershipError) throw membershipError;

      // Update the promo membership record
      const { error: promoError } = await supabase
        .from("promo_memberships")
        .update({
          expires_at: newExpiryDate.toISOString(),
          notes: editForm.notes || null,
        })
        .eq("id", editingMembership.id);

      if (promoError) throw promoError;

      // Notify the user about the update
      const changes = [];
      if (extendMonths > 0) changes.push(`extended by ${extendMonths} month(s)`);
      if (editForm.plan_type !== editingMembership.plan_type) changes.push(`upgraded to ${getPlanLabel(editForm.plan_type)}`);
      
      if (changes.length > 0) {
        await supabase.from("notifications").insert({
          user_id: editingMembership.user_id,
          type: "gift_membership_updated",
          title: "🎁 Your membership was updated!",
          message: `Your gift membership has been ${changes.join(" and ")}. New expiry: ${formatDate(newExpiryDate)}.`,
          data: { plan_type: editForm.plan_type, expires_at: newExpiryDate.toISOString() },
        });
      }

      toast.success("Membership updated successfully!");
      setEditDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(error.message || "Failed to update membership");
    } finally {
      setUpdating(false);
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

  const getPlanLabel = (planType: string) => {
    const labels: Record<string, string> = {
      single: "Solo Paw",
      duo: "Dynamic Duo",
      family: "Pack Leader",
    };
    return labels[planType] || planType;
  };

  const getReasonBadge = (reason: string) => {
    const colors: Record<string, string> = {
      gift: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      partner: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      contest_winner: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      employee: "bg-green-500/20 text-green-400 border-green-500/30",
      other: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      influencer: "bg-purple-500/20 text-purple-400 border-purple-500/30", // legacy support
    };
    return <Badge className={colors[reason] || colors.other}>{reason.replace("_", " ")}</Badge>;
  };

  const getPlanBadge = (planType?: string) => {
    if (!planType) return null;
    const colors: Record<string, string> = {
      single: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      duo: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      family: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    };
    return <Badge className={colors[planType] || "bg-gray-500/20 text-gray-400 border-gray-500/30"}>{getPlanLabel(planType)}</Badge>;
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5" />
          Gift Memberships
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Grant Membership
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Grant Free Membership</DialogTitle>
              <DialogDescription>
                Search for a user and grant them a complimentary membership.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Find User by Email or Name</Label>
                <div className="flex gap-2">
                  <Input
                    value={searchEmail}
                    onChange={(e) => {
                      setSearchEmail(e.target.value);
                      setSelectedUser(null);
                      setExistingMembership(null);
                    }}
                    placeholder="user@email.com or name"
                    onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                  />
                  <Button variant="outline" onClick={searchUsers}>
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-2 border rounded-md overflow-hidden">
                    {searchResults.map((profile) => (
                      <button
                        key={profile.user_id}
                        onClick={() => selectUser(profile)}
                        className="w-full px-3 py-2 text-left hover:bg-muted/50 border-b last:border-b-0 text-sm"
                      >
                        <div className="font-medium">{profile.full_name || "No name"}</div>
                        <div className="text-muted-foreground text-xs">{profile.email}</div>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Selected User Display */}
                {selectedUser && (
                  <div className="mt-2 p-3 rounded-md bg-green-500/10 border border-green-500/30">
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="font-medium">Selected User</span>
                    </div>
                    <div className="mt-1 text-sm">
                      <div>{selectedUser.full_name || "No name"}</div>
                      <div className="text-muted-foreground text-xs">{selectedUser.email}</div>
                    </div>
                  </div>
                )}

                {/* Checking membership status */}
                {checkingMembership && (
                  <div className="mt-2 flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking existing membership...
                  </div>
                )}

                {/* Existing membership warning */}
                {existingMembership && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This user already has an active {getPlanLabel(existingMembership.plan_type)} membership 
                      (expires {formatDate(new Date(existingMembership.expires_at))}).
                    </AlertDescription>
                  </Alert>
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
                    <SelectItem value="gift">Gift</SelectItem>
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
                    <SelectItem value="family">Pack Leader (3-5 pets)</SelectItem>
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
                  placeholder="Any additional notes..."
                />
              </div>
              
              <Button 
                onClick={grantMembership} 
                className="w-full" 
                disabled={!selectedUser || granting || !!existingMembership}
              >
                {granting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Granting...
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4 mr-2" />
                    Grant Free Membership
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {promoMemberships.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No gift memberships granted yet</p>
        ) : (
          <div className="space-y-3">
            {promoMemberships.map((pm) => (
              <div
                key={pm.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  isExpired(pm.expires_at) 
                    ? "bg-red-500/5 border-red-500/30" 
                    : "bg-muted/30 border-border/50"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium truncate">{pm.user_name || pm.user_email}</span>
                    {getReasonBadge(pm.reason)}
                    {getPlanBadge(pm.plan_type)}
                    {isExpired(pm.expires_at) && (
                      <Badge variant="destructive" className="text-xs">Expired</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Expires: {formatDate(new Date(pm.expires_at))}
                    {pm.notes && <span className="ml-2">• {pm.notes}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(pm)}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => revokeMembership(pm.id, pm.membership_id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Revoke
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Gift Membership</DialogTitle>
            <DialogDescription>
              Extend duration or change plan type for {editingMembership?.user_name || editingMembership?.user_email}
            </DialogDescription>
          </DialogHeader>
          {editingMembership && (
            <div className="space-y-4 mt-4">
              <div className="p-3 rounded-md bg-muted/50 border text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-muted-foreground">Current Expiry:</span>
                  <span className={isExpired(editingMembership.expires_at) ? "text-red-400" : ""}>
                    {formatDate(new Date(editingMembership.expires_at))}
                    {isExpired(editingMembership.expires_at) && " (Expired)"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Current Plan:</span>
                  <span>{getPlanLabel(editingMembership.plan_type || "family")}</span>
                </div>
              </div>

              <div>
                <Label>Extend Duration</Label>
                <Select
                  value={editForm.extend_months}
                  onValueChange={(v) => setEditForm({ ...editForm, extend_months: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No extension</SelectItem>
                    <SelectItem value="1">+1 Month</SelectItem>
                    <SelectItem value="3">+3 Months</SelectItem>
                    <SelectItem value="6">+6 Months</SelectItem>
                    <SelectItem value="12">+1 Year</SelectItem>
                    <SelectItem value="24">+2 Years</SelectItem>
                  </SelectContent>
                </Select>
                {parseInt(editForm.extend_months) > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    New expiry: {(() => {
                      const newDate = new Date(editingMembership.expires_at);
                      newDate.setMonth(newDate.getMonth() + parseInt(editForm.extend_months));
                      return formatDate(newDate);
                    })()}
                  </p>
                )}
              </div>

              <div>
                <Label>Plan Type</Label>
                <Select
                  value={editForm.plan_type}
                  onValueChange={(v) => setEditForm({ ...editForm, plan_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Solo Paw (1 pet)</SelectItem>
                    <SelectItem value="duo">Dynamic Duo (2 pets)</SelectItem>
                    <SelectItem value="family">Pack Leader (3-5 pets)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Update notes..."
                />
              </div>

              <Button 
                onClick={updateMembership} 
                className="w-full" 
                disabled={updating}
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default InfluencerMemberships;
