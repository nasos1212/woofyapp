import { useState, useEffect, useMemo } from "react";
import { Search, Users, Building2, Home, Crown, Bell, Send, Filter, CreditCard, UserCog, Mail, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MembershipInfo {
  id: string;
  plan_type: string;
  is_active: boolean;
  expires_at: string;
  member_number: string;
}

interface BusinessInfo {
  id: string;
  business_name: string;
  category: string;
  verification_status: string;
  city: string | null;
}

interface ShelterInfo {
  id: string;
  shelter_name: string;
  verification_status: string;
  city: string | null;
}

interface UserData {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  role: string | null;
  membership: MembershipInfo | null;
  business: BusinessInfo | null;
  shelter: ShelterInfo | null;
}

type UserCategory = "all" | "members" | "freemium" | "paid" | "businesses" | "shelters";
type MembershipFilter = "all" | "freemium" | "paid" | "expiring";

const UserManagement = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<UserCategory>("all");
  const [membershipFilter, setMembershipFilter] = useState<MembershipFilter>("all");
  
  // Notification dialog state
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [notifyTarget, setNotifyTarget] = useState<UserCategory>("all");
  const [sending, setSending] = useState(false);
  const [notification, setNotification] = useState({
    title: "",
    message: "",
    type: "announcement",
  });

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [profilesResult, rolesResult, membershipsResult, businessesResult, sheltersResult] = await Promise.all([
        supabase.from("profiles").select("id, user_id, full_name, email, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("memberships").select("id, user_id, plan_type, is_active, expires_at, member_number"),
        supabase.from("businesses").select("id, user_id, business_name, category, verification_status, city"),
        supabase.from("shelters").select("id, user_id, shelter_name, verification_status, city"),
      ]);

      if (profilesResult.error) throw profilesResult.error;

      // Create maps for quick lookups
      const rolesMap = new Map<string, string>();
      (rolesResult.data || []).forEach(r => rolesMap.set(r.user_id, r.role));

      const membershipsMap = new Map<string, MembershipInfo>();
      (membershipsResult.data || []).forEach(m => membershipsMap.set(m.user_id, {
        id: m.id,
        plan_type: m.plan_type,
        is_active: m.is_active,
        expires_at: m.expires_at,
        member_number: m.member_number,
      }));

      const businessesMap = new Map<string, BusinessInfo>();
      (businessesResult.data || []).forEach(b => businessesMap.set(b.user_id, {
        id: b.id,
        business_name: b.business_name,
        category: b.category,
        verification_status: b.verification_status,
        city: b.city,
      }));

      const sheltersMap = new Map<string, ShelterInfo>();
      (sheltersResult.data || []).forEach(s => sheltersMap.set(s.user_id, {
        id: s.id,
        shelter_name: s.shelter_name,
        verification_status: s.verification_status,
        city: s.city,
      }));

      // Combine all data
      const combinedUsers: UserData[] = (profilesResult.data || []).map(profile => ({
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        email: profile.email,
        created_at: profile.created_at,
        role: rolesMap.get(profile.user_id) || null,
        membership: membershipsMap.get(profile.user_id) || null,
        business: businessesMap.get(profile.user_id) || null,
        shelter: sheltersMap.get(profile.user_id) || null,
      }));

      setUsers(combinedUsers);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on active tab and search
  const filteredUsers = useMemo(() => {
    let result = users;

    // Filter by category/tab
    switch (activeTab) {
      case "members":
        result = result.filter(u => u.role === "member");
        // Apply membership sub-filter
        if (membershipFilter === "freemium") {
          result = result.filter(u => !u.membership || !u.membership.is_active);
        } else if (membershipFilter === "paid") {
          result = result.filter(u => u.membership?.is_active);
        } else if (membershipFilter === "expiring") {
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
          result = result.filter(u => {
            if (!u.membership?.is_active) return false;
            const expiresAt = new Date(u.membership.expires_at);
            return expiresAt <= thirtyDaysFromNow && expiresAt > new Date();
          });
        }
        break;
      case "freemium":
        result = result.filter(u => u.role === "member" && (!u.membership || !u.membership.is_active));
        break;
      case "paid":
        result = result.filter(u => u.role === "member" && u.membership?.is_active);
        break;
      case "businesses":
        result = result.filter(u => u.role === "business" || u.business);
        break;
      case "shelters":
        result = result.filter(u => u.role === "shelter" || u.shelter);
        break;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(u =>
        u.full_name?.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.business?.business_name?.toLowerCase().includes(query) ||
        u.shelter?.shelter_name?.toLowerCase().includes(query) ||
        u.membership?.member_number?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [users, activeTab, membershipFilter, searchQuery]);

  // Calculate counts for each category
  const counts = useMemo(() => {
    const members = users.filter(u => u.role === "member");
    const freemium = members.filter(u => !u.membership || !u.membership.is_active);
    const paid = members.filter(u => u.membership?.is_active);
    const businesses = users.filter(u => u.role === "business" || u.business);
    const shelters = users.filter(u => u.role === "shelter" || u.shelter);
    
    return {
      all: users.length,
      members: members.length,
      freemium: freemium.length,
      paid: paid.length,
      businesses: businesses.length,
      shelters: shelters.length,
    };
  }, [users]);

  const getPlanLabel = (planType: string) => {
    const labels: Record<string, string> = {
      single: "Solo Paw",
      duo: "Dynamic Duo",
      family: "Pack Leader",
    };
    return labels[planType] || planType;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      trainer: "Dog Trainer",
      pet_shop: "Pet Shop",
      hotel: "Pet Hotel",
      grooming: "Grooming",
      vet: "Veterinarian",
      daycare: "Daycare",
      food: "Food & Treats",
      accessories: "Accessories",
      physio: "Physiotherapy",
      other: "Other",
    };
    return labels[category] || category;
  };

  const openNotifyDialog = (target: UserCategory) => {
    setNotifyTarget(target);
    setNotifyDialogOpen(true);
  };

  const getTargetUserIds = (): string[] => {
    let targetUsers = users;

    switch (notifyTarget) {
      case "members":
        targetUsers = users.filter(u => u.role === "member");
        break;
      case "freemium":
        targetUsers = users.filter(u => u.role === "member" && (!u.membership || !u.membership.is_active));
        break;
      case "paid":
        targetUsers = users.filter(u => u.role === "member" && u.membership?.is_active);
        break;
      case "businesses":
        targetUsers = users.filter(u => u.role === "business" || u.business);
        break;
      case "shelters":
        targetUsers = users.filter(u => u.role === "shelter" || u.shelter);
        break;
    }

    return targetUsers.map(u => u.user_id);
  };

  const sendNotifications = async () => {
    if (!notification.title || !notification.message) {
      toast.error("Please fill in title and message");
      return;
    }

    setSending(true);
    try {
      const userIds = getTargetUserIds();

      if (userIds.length === 0) {
        toast.error("No users found for this audience");
        setSending(false);
        return;
      }

      const notifications = userIds.map(userId => ({
        user_id: userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: { bulk: true, target: notifyTarget },
      }));

      // Insert in batches
      const batchSize = 100;
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize);
        const { error } = await supabase.from("notifications").insert(batch);
        if (error) throw error;
      }

      toast.success(`Notification sent to ${userIds.length} users!`);
      setNotifyDialogOpen(false);
      setNotification({ title: "", message: "", type: "announcement" });
    } catch (error: any) {
      console.error("Notification error:", error);
      toast.error(error.message || "Failed to send notifications");
    } finally {
      setSending(false);
    }
  };

  const getTargetLabel = (target: UserCategory) => {
    const labels: Record<UserCategory, string> = {
      all: "All Users",
      members: "All Members",
      freemium: "Freemium Members",
      paid: "Paid Members",
      businesses: "All Businesses",
      shelters: "All Shelters",
    };
    return labels[target];
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // Delete existing roles
      await supabase.from("user_roles").delete().eq("user_id", userId);
      
      // Insert new role
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: newRole as "admin" | "member" | "business" | "shelter",
      });

      if (error) throw error;

      toast.success(`Role updated to ${newRole}`);
      fetchAllUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    }
  };

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading users...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-border/50 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setActiveTab("all")}>
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{counts.all}</p>
            <p className="text-xs text-muted-foreground">All Users</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setActiveTab("members")}>
          <CardContent className="p-4 text-center">
            <Crown className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">{counts.members}</p>
            <p className="text-xs text-muted-foreground">Members</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setActiveTab("freemium")}>
          <CardContent className="p-4 text-center">
            <CreditCard className="w-6 h-6 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold">{counts.freemium}</p>
            <p className="text-xs text-muted-foreground">Freemium</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setActiveTab("paid")}>
          <CardContent className="p-4 text-center">
            <CreditCard className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{counts.paid}</p>
            <p className="text-xs text-muted-foreground">Paid</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setActiveTab("businesses")}>
          <CardContent className="p-4 text-center">
            <Building2 className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{counts.businesses}</p>
            <p className="text-xs text-muted-foreground">Businesses</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setActiveTab("shelters")}>
          <CardContent className="p-4 text-center">
            <Home className="w-6 h-6 mx-auto mb-2 text-rose-500" />
            <p className="text-2xl font-bold">{counts.shelters}</p>
            <p className="text-xs text-muted-foreground">Shelters</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5" />
              User Management
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openNotifyDialog(activeTab)}
              className="gap-2"
            >
              <Bell className="w-4 h-4" />
              Notify {getTargetLabel(activeTab)}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, business name, member number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {activeTab === "members" && (
              <Select value={membershipFilter} onValueChange={(v) => setMembershipFilter(v as MembershipFilter)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members</SelectItem>
                  <SelectItem value="freemium">Freemium Only</SelectItem>
                  <SelectItem value="paid">Paid Only</SelectItem>
                  <SelectItem value="expiring">Expiring Soon</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Category Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as UserCategory)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-4">
              <TabsTrigger value="all" className="text-xs sm:text-sm">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="members" className="text-xs sm:text-sm">Members ({counts.members})</TabsTrigger>
              <TabsTrigger value="freemium" className="text-xs sm:text-sm">Freemium ({counts.freemium})</TabsTrigger>
              <TabsTrigger value="paid" className="text-xs sm:text-sm">Paid ({counts.paid})</TabsTrigger>
              <TabsTrigger value="businesses" className="text-xs sm:text-sm">Business ({counts.businesses})</TabsTrigger>
              <TabsTrigger value="shelters" className="text-xs sm:text-sm">Shelters ({counts.shelters})</TabsTrigger>
            </TabsList>

            {/* User List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No users found</p>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col lg:flex-row lg:items-center justify-between p-4 rounded-lg bg-muted/30 gap-3 border border-border/50"
                  >
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{user.full_name || "No name"}</p>
                        
                        {/* Role Badge */}
                        {user.role && (
                          <Badge variant="outline" className="capitalize text-xs">
                            {user.role}
                          </Badge>
                        )}
                        
                        {/* Membership Status for Members */}
                        {user.role === "member" && (
                          user.membership?.is_active ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                              {getPlanLabel(user.membership.plan_type)}
                            </Badge>
                          ) : (
                            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                              Freemium
                            </Badge>
                          )
                        )}
                        
                        {/* Business Status */}
                        {user.business && (
                          <Badge 
                            className={`text-xs ${
                              user.business.verification_status === "approved" 
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : user.business.verification_status === "pending"
                                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                : "bg-red-500/20 text-red-400 border-red-500/30"
                            }`}
                          >
                            {user.business.verification_status}
                          </Badge>
                        )}
                        
                        {/* Shelter Status */}
                        {user.shelter && (
                          <Badge 
                            className={`text-xs ${
                              user.shelter.verification_status === "approved" 
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : user.shelter.verification_status === "pending"
                                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                : "bg-red-500/20 text-red-400 border-red-500/30"
                            }`}
                          >
                            {user.shelter.verification_status}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      
                      {/* Additional Info */}
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        {user.business && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {user.business.business_name} • {getCategoryLabel(user.business.category)}
                            {user.business.city && ` • ${user.business.city}`}
                          </span>
                        )}
                        {user.shelter && (
                          <span className="flex items-center gap-1">
                            <Home className="w-3 h-3" />
                            {user.shelter.shelter_name}
                            {user.shelter.city && ` • ${user.shelter.city}`}
                          </span>
                        )}
                        {user.membership?.is_active && (
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            {user.membership.member_number} • Expires {new Date(user.membership.expires_at).toLocaleDateString()}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Select
                        value={user.role || "member"}
                        onValueChange={(v) => updateUserRole(user.user_id, v)}
                      >
                        <SelectTrigger className="w-[130px] h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="shelter">Shelter</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setNotifyTarget("all"); // Will be overridden
                          setNotification({
                            title: "",
                            message: "",
                            type: "announcement",
                          });
                          // Send to single user
                          const sendSingleNotification = async () => {
                            const title = prompt("Notification Title:");
                            if (!title) return;
                            const message = prompt("Notification Message:");
                            if (!message) return;
                            
                            try {
                              await supabase.from("notifications").insert({
                                user_id: user.user_id,
                                type: "announcement",
                                title,
                                message,
                                data: { single: true },
                              });
                              toast.success(`Notification sent to ${user.full_name || user.email}`);
                            } catch (error: any) {
                              toast.error("Failed to send notification");
                            }
                          };
                          sendSingleNotification();
                        }}
                        className="h-9 w-9"
                        title="Send notification"
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Bulk Notification Dialog */}
      <Dialog open={notifyDialogOpen} onOpenChange={setNotifyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Send Notification
            </DialogTitle>
            <DialogDescription>
              Send a notification to {getTargetLabel(notifyTarget)} ({
                notifyTarget === "all" ? counts.all :
                notifyTarget === "members" ? counts.members :
                notifyTarget === "freemium" ? counts.freemium :
                notifyTarget === "paid" ? counts.paid :
                notifyTarget === "businesses" ? counts.businesses :
                counts.shelters
              } users)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Notification Type</Label>
              <Select
                value={notification.type}
                onValueChange={(v) => setNotification({ ...notification, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">📢 Announcement</SelectItem>
                  <SelectItem value="promotion">🎉 Promotion</SelectItem>
                  <SelectItem value="reminder">⏰ Reminder</SelectItem>
                  <SelectItem value="update">🆕 App Update</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={notification.title}
                onChange={(e) => setNotification({ ...notification, title: e.target.value })}
                placeholder="New Feature Available!"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={notification.message}
                onChange={(e) => setNotification({ ...notification, message: e.target.value })}
                placeholder="We're excited to announce..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifyDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={sendNotifications} 
              disabled={sending || !notification.title || !notification.message}
            >
              {sending ? "Sending..." : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
