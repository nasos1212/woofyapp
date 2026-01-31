import { useState, useEffect, useMemo } from "react";
import { Search, Users, Building2, Home, Crown, Bell, Send, Filter, CreditCard, UserCog, Mail, Calendar, ExternalLink, Phone, Globe, MapPin, Check, X, ChevronDown, ChevronUp, RefreshCw, UserX, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { ensureHttps } from "@/lib/utils";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const CHART_COLORS = ["#60a5fa", "#34d399", "#f472b6", "#fbbf24"];
// Full membership info
interface MembershipInfo {
  id: string;
  plan_type: string;
  is_active: boolean;
  expires_at: string;
  member_number: string;
  max_pets: number;
  created_at: string;
}

// Full business info
interface BusinessInfo {
  id: string;
  business_name: string;
  category: string;
  verification_status: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string;
  website: string | null;
  description: string | null;
  logo_url: string | null;
  created_at: string;
  verified_at: string | null;
}

// Full shelter info
interface ShelterInfo {
  id: string;
  shelter_name: string;
  contact_name: string;
  verification_status: string;
  city: string | null;
  location: string;
  address: string | null;
  phone: string | null;
  email: string;
  website: string | null;
  description: string | null;
  mission_statement: string | null;
  dogs_in_care: string | null;
  years_operating: string | null;
  dogs_helped_count: number;
  created_at: string;
  verified_at: string | null;
}

interface UserData {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  roles: string[];
  membership: MembershipInfo | null;
  business: BusinessInfo | null;
  shelter: ShelterInfo | null;
}

type UserCategory = "all" | "members" | "freemium" | "paid" | "businesses" | "shelters";
type MembershipFilter = "all" | "freemium" | "paid" | "expiring";
type BusinessFilter = "all" | "pending" | "approved" | "rejected";
type ShelterFilter = "all" | "pending" | "approved" | "rejected";

const ITEMS_PER_PAGE = 20;

const UserManagement = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<UserCategory>("all");
  const [membershipFilter, setMembershipFilter] = useState<MembershipFilter>("all");
  const [businessFilter, setBusinessFilter] = useState<BusinessFilter>("all");
  const [shelterFilter, setShelterFilter] = useState<ShelterFilter>("all");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  
  
  // Notification dialog state
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [notifyTarget, setNotifyTarget] = useState<UserCategory>("all");
  const [sending, setSending] = useState(false);
  const [notification, setNotification] = useState({
    title: "",
    message: "",
    type: "announcement",
  });
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, membershipFilter, businessFilter, shelterFilter, searchQuery]);

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel with full details
      const [profilesResult, rolesResult, membershipsResult, businessesResult, sheltersResult] = await Promise.all([
        supabase.from("profiles").select("id, user_id, full_name, email, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("memberships").select("*"),
        supabase.from("businesses").select("*"),
        supabase.from("shelters").select("*"),
      ]);

      if (profilesResult.error) throw profilesResult.error;

      // Create maps for quick lookups
      const rolesMap = new Map<string, string[]>();
      (rolesResult.data || []).forEach(r => {
        const existing = rolesMap.get(r.user_id) || [];
        existing.push(r.role);
        rolesMap.set(r.user_id, existing);
      });

      const membershipsMap = new Map<string, MembershipInfo>();
      (membershipsResult.data || []).forEach(m => membershipsMap.set(m.user_id, {
        id: m.id,
        plan_type: m.plan_type,
        is_active: m.is_active,
        expires_at: m.expires_at,
        member_number: m.member_number,
        max_pets: m.max_pets,
        created_at: m.created_at,
      }));

      const businessesMap = new Map<string, BusinessInfo>();
      (businessesResult.data || []).forEach(b => businessesMap.set(b.user_id, {
        id: b.id,
        business_name: b.business_name,
        category: b.category,
        verification_status: b.verification_status,
        city: b.city,
        address: b.address,
        phone: b.phone,
        email: b.email,
        website: b.website,
        description: b.description,
        logo_url: b.logo_url,
        created_at: b.created_at,
        verified_at: b.verified_at,
      }));

      const sheltersMap = new Map<string, ShelterInfo>();
      (sheltersResult.data || []).forEach(s => sheltersMap.set(s.user_id, {
        id: s.id,
        shelter_name: s.shelter_name,
        contact_name: s.contact_name,
        verification_status: s.verification_status,
        city: s.city,
        location: s.location,
        address: s.address,
        phone: s.phone,
        email: s.email,
        website: s.website,
        description: s.description,
        mission_statement: s.mission_statement,
        dogs_in_care: s.dogs_in_care,
        years_operating: s.years_operating,
        dogs_helped_count: s.dogs_helped_count,
        created_at: s.created_at,
        verified_at: s.verified_at,
      }));

      // Combine all data
      const combinedUsers: UserData[] = (profilesResult.data || []).map(profile => ({
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        email: profile.email,
        created_at: profile.created_at,
        roles: rolesMap.get(profile.user_id) || [],
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
        // CRITICAL: Only show users with "member" role AND no shelter/business records
        result = result.filter(u => u.roles.includes("member") && !u.shelter && !u.business);
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
        // CRITICAL: Exclude shelters (by record OR role) and businesses - they are NEVER freemium
        result = result.filter(u => u.roles.includes("member") && !u.shelter && !u.business && (!u.membership || !u.membership.is_active));
        break;
      case "paid":
        // CRITICAL: Exclude shelters (by record OR role) and businesses - they are NEVER paid members
        result = result.filter(u => u.roles.includes("member") && !u.shelter && !u.business && u.membership?.is_active);
        break;
      case "businesses":
        // IMPORTANT: Exclude users who have a shelter record - shelters should NEVER appear as businesses
        result = result.filter(u => (u.roles.includes("business") || u.business) && !u.shelter);
        if (businessFilter !== "all") {
          result = result.filter(u => u.business?.verification_status === businessFilter);
        }
        break;
      case "shelters":
        // Users with shelter records OR shelter role (incomplete onboarding) are shelters
        result = result.filter(u => u.shelter || u.roles.includes("shelter"));
        if (shelterFilter !== "all") {
          result = result.filter(u => u.shelter?.verification_status === shelterFilter);
        }
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
  }, [users, activeTab, membershipFilter, businessFilter, shelterFilter, searchQuery]);

  // Paginated users
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  // Calculate counts
  const counts = useMemo(() => {
    // CRITICAL: Members must exclude shelters (by role OR record) and businesses
    const members = users.filter(u => u.roles.includes("member") && !u.shelter && !u.business);
    const freemium = members.filter(u => !u.membership || !u.membership.is_active);
    const paid = members.filter(u => u.membership?.is_active);
    // IMPORTANT: Exclude users with shelter records OR shelter role from business count
    const businesses = users.filter(u => (u.roles.includes("business") || u.business) && !u.shelter && !u.roles.includes("shelter"));
    const pendingBusinesses = businesses.filter(u => u.business?.verification_status === "pending");
    // Users with shelter records OR shelter role are shelters
    const shelters = users.filter(u => u.shelter || u.roles.includes("shelter"));
    const pendingShelters = shelters.filter(u => u.shelter?.verification_status === "pending" || !u.shelter);
    
    return {
      all: users.length,
      members: members.length,
      freemium: freemium.length,
      paid: paid.length,
      businesses: businesses.length,
      pendingBusinesses: pendingBusinesses.length,
      shelters: shelters.length,
      pendingShelters: pendingShelters.length,
    };
  }, [users]);

  // Signups by month (last 6 months)
  const signupsByMonth = useMemo(() => {
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

    users.forEach((u) => {
      const created = new Date(u.created_at);
      const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
      if (monthCounts[key] !== undefined) {
        monthCounts[key]++;
      }
    });

    return months.map((m) => ({
      month: m.label,
      signups: monthCounts[m.key],
    }));
  }, [users]);

  // Plan distribution for paid members
  const planDistribution = useMemo(() => {
    const planCounts: Record<string, number> = {};
    const paidMembers = users.filter(u => u.roles.includes("member") && u.membership?.is_active);
    
    paidMembers.forEach((u) => {
      const plan = u.membership?.plan_type || "single";
      planCounts[plan] = (planCounts[plan] || 0) + 1;
    });

    const planLabels: Record<string, string> = {
      single: "Solo Paw",
      duo: "Dynamic Duo",
      family: "Pack Leader",
    };

    return Object.entries(planCounts).map(([key, value]) => ({
      name: planLabels[key] || key,
      value,
    }));
  }, [users]);

  const getPlanLabel = (planType: string) => {
    const labels: Record<string, string> = { single: "Solo Paw", duo: "Dynamic Duo", family: "Pack Leader" };
    return labels[planType] || planType;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      trainer: "Dog Trainer", pet_shop: "Pet Shop", hotel: "Pet Hotel", grooming: "Grooming",
      vet: "Veterinary", daycare: "Daycare", food: "Food & Treats", accessories: "Accessories",
      physio: "Physiotherapy", other: "Other",
    };
    return labels[category] || category;
  };

  const getExpiryStatus = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const daysUntil = differenceInDays(expiry, now);

    if (daysUntil < 0) {
      return { label: `Expired ${Math.abs(daysUntil)}d ago`, color: "bg-red-500/20 text-red-400 border-red-500/30", isExpired: true };
    } else if (daysUntil <= 7) {
      return { label: `Expires in ${daysUntil}d`, color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", isExpired: false };
    } else {
      return { label: format(expiry, "MMM d, yyyy"), color: "bg-muted text-muted-foreground", isExpired: false };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Approved</Badge>;
      case "rejected": return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejected</Badge>;
      default: return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
    }
  };

  // Actions
  const toggleMembershipStatus = async (membership: MembershipInfo) => {
    try {
      const newStatus = !membership.is_active;
      const { error } = await supabase.from("memberships").update({ is_active: newStatus }).eq("id", membership.id);
      if (error) throw error;
      toast.success(newStatus ? "Membership activated" : "Membership set to freemium");
      fetchAllUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to update membership");
    }
  };

  const updateBusinessStatus = async (businessId: string, status: "approved" | "rejected") => {
    try {
      const updateData: any = { verification_status: status };
      if (status === "approved") updateData.verified_at = new Date().toISOString();
      const { error } = await supabase.from("businesses").update(updateData).eq("id", businessId);
      if (error) throw error;
      toast.success(`Business ${status}!`);
      fetchAllUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to update business");
    }
  };

  const updateShelterStatus = async (shelterId: string, status: "approved" | "rejected") => {
    try {
      const updateData: any = { verification_status: status };
      if (status === "approved") updateData.verified_at = new Date().toISOString();
      const { error } = await supabase.from("shelters").update(updateData).eq("id", shelterId);
      if (error) throw error;
      toast.success(`Shelter ${status}!`);
      fetchAllUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to update shelter");
    }
  };


  const addRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: role as "admin" | "member" | "business" | "shelter",
      });
      if (error) throw error;
      toast.success(`Role "${role}" added`);
      fetchAllUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to add role");
    }
  };

  const removeRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase.from("user_roles").delete()
        .eq("user_id", userId)
        .eq("role", role as "admin" | "member" | "business" | "shelter");
      if (error) throw error;
      toast.success(`Role "${role}" removed`);
      fetchAllUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove role");
    }
  };

  const toggleRole = async (userId: string, role: string, hasRole: boolean) => {
    if (hasRole) {
      await removeRole(userId, role);
    } else {
      await addRole(userId, role);
    }
  };

  const openNotifyDialog = (target: UserCategory) => {
    setNotifyTarget(target);
    setNotifyDialogOpen(true);
  };

  const getTargetUserIds = (): string[] => {
    let targetUsers = users;
    switch (notifyTarget) {
      case "members": targetUsers = users.filter(u => u.roles.includes("member")); break;
      case "freemium": targetUsers = users.filter(u => u.roles.includes("member") && (!u.membership || !u.membership.is_active)); break;
      case "paid": targetUsers = users.filter(u => u.roles.includes("member") && u.membership?.is_active); break;
      case "businesses": 
        // Exclude rejected businesses from notifications
        targetUsers = users.filter(u => 
          (u.roles.includes("business") || u.business) && 
          u.business?.verification_status !== "rejected"
        ); 
        break;
      case "shelters": 
        // Exclude rejected shelters from notifications
        targetUsers = users.filter(u => 
          (u.roles.includes("shelter") || u.shelter) && 
          u.shelter?.verification_status !== "rejected"
        ); 
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
      toast.error(error.message || "Failed to send notifications");
    } finally {
      setSending(false);
    }
  };

  const getTargetLabel = (target: UserCategory) => {
    const labels: Record<UserCategory, string> = {
      all: "All Users", members: "All Members", freemium: "Freemium Members",
      paid: "Paid Members", businesses: "All Businesses", shelters: "All Shelters",
    };
    return labels[target];
  };

  const getTargetCount = (target: UserCategory) => {
    switch (target) {
      case "all": return counts.all;
      case "members": return counts.members;
      case "freemium": return counts.freemium;
      case "paid": return counts.paid;
      case "businesses": return counts.businesses;
      case "shelters": return counts.shelters;
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
        <Card className={`border-border/50 cursor-pointer hover:bg-muted/30 transition-colors ${activeTab === "all" ? "ring-2 ring-primary" : ""}`} onClick={() => setActiveTab("all")}>
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{counts.all}</p>
            <p className="text-xs text-muted-foreground">All Users</p>
          </CardContent>
        </Card>
        <Card className={`border-border/50 cursor-pointer hover:bg-muted/30 transition-colors ${activeTab === "members" ? "ring-2 ring-yellow-500" : ""}`} onClick={() => setActiveTab("members")}>
          <CardContent className="p-4 text-center">
            <Crown className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">{counts.members}</p>
            <p className="text-xs text-muted-foreground">Members</p>
          </CardContent>
        </Card>
        <Card className={`border-border/50 cursor-pointer hover:bg-muted/30 transition-colors ${activeTab === "freemium" ? "ring-2 ring-orange-500" : ""}`} onClick={() => setActiveTab("freemium")}>
          <CardContent className="p-4 text-center">
            <CreditCard className="w-6 h-6 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold">{counts.freemium}</p>
            <p className="text-xs text-muted-foreground">Freemium</p>
          </CardContent>
        </Card>
        <Card className={`border-border/50 cursor-pointer hover:bg-muted/30 transition-colors ${activeTab === "paid" ? "ring-2 ring-green-500" : ""}`} onClick={() => setActiveTab("paid")}>
          <CardContent className="p-4 text-center">
            <CreditCard className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{counts.paid}</p>
            <p className="text-xs text-muted-foreground">Paid</p>
          </CardContent>
        </Card>
        <Card className={`border-border/50 cursor-pointer hover:bg-muted/30 transition-colors ${activeTab === "businesses" ? "ring-2 ring-blue-500" : ""}`} onClick={() => setActiveTab("businesses")}>
          <CardContent className="p-4 text-center relative">
            <Building2 className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{counts.businesses}</p>
            <p className="text-xs text-muted-foreground">Businesses</p>
            {counts.pendingBusinesses > 0 && (
              <Badge className="absolute -top-1 -right-1 bg-yellow-500 text-white text-[10px] px-1.5">{counts.pendingBusinesses}</Badge>
            )}
          </CardContent>
        </Card>
        <Card className={`border-border/50 cursor-pointer hover:bg-muted/30 transition-colors ${activeTab === "shelters" ? "ring-2 ring-rose-500" : ""}`} onClick={() => setActiveTab("shelters")}>
          <CardContent className="p-4 text-center relative">
            <Home className="w-6 h-6 mx-auto mb-2 text-rose-500" />
            <p className="text-2xl font-bold">{counts.shelters}</p>
            <p className="text-xs text-muted-foreground">Shelters</p>
            {counts.pendingShelters > 0 && (
              <Badge className="absolute -top-1 -right-1 bg-yellow-500 text-white text-[10px] px-1.5">{counts.pendingShelters}</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Signups (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            {signupsByMonth.every(m => m.signups === 0) ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No signup data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={signupsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  />
                  <Bar dataKey="signups" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Plan Distribution (Paid Members)</CardTitle>
          </CardHeader>
          <CardContent>
            {planDistribution.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No paid members yet
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={planDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {planDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {planDistribution.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchAllUsers} className="gap-2">
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => openNotifyDialog(activeTab)} className="gap-2">
                <Bell className="w-4 h-4" />
                Notify {getTargetLabel(activeTab)}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, business, member number..."
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
            {activeTab === "businesses" && (
              <Select value={businessFilter} onValueChange={(v) => setBusinessFilter(v as BusinessFilter)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Businesses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            )}
            {activeTab === "shelters" && (
              <Select value={shelterFilter} onValueChange={(v) => setShelterFilter(v as ShelterFilter)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Shelters</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Category Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as UserCategory)} className="w-full">
            <TabsList className="flex flex-wrap gap-1 h-auto p-1 mb-4 w-full justify-start">
              <TabsTrigger value="all" className="text-xs sm:text-sm px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="members" className="text-xs sm:text-sm px-3 py-1.5 data-[state=active]:bg-yellow-500 data-[state=active]:text-white">Members ({counts.members})</TabsTrigger>
              <TabsTrigger value="freemium" className="text-xs sm:text-sm px-3 py-1.5 data-[state=active]:bg-orange-500 data-[state=active]:text-white">Freemium ({counts.freemium})</TabsTrigger>
              <TabsTrigger value="paid" className="text-xs sm:text-sm px-3 py-1.5 data-[state=active]:bg-green-500 data-[state=active]:text-white">Paid ({counts.paid})</TabsTrigger>
              <TabsTrigger value="businesses" className="text-xs sm:text-sm px-3 py-1.5 data-[state=active]:bg-blue-500 data-[state=active]:text-white">Business ({counts.businesses})</TabsTrigger>
              <TabsTrigger value="shelters" className="text-xs sm:text-sm px-3 py-1.5 data-[state=active]:bg-rose-500 data-[state=active]:text-white">Shelters ({counts.shelters})</TabsTrigger>
            </TabsList>

            {/* User List */}
            <div className="space-y-2">
              {/* Results info */}
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} users
                </span>
              </div>
              
              {paginatedUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No users found</p>
              ) : (
                paginatedUsers.map((user) => {
                  const isExpanded = expandedUser === user.id;
                  
                  return (
                    <div key={user.id} className="rounded-lg bg-muted/30 border border-border/50 overflow-hidden">
                      {/* Collapsed View */}
                      <div
                        className="flex flex-col lg:flex-row lg:items-center justify-between p-4 gap-3 cursor-pointer hover:bg-muted/50"
                        onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium truncate">{user.full_name || "No name"}</p>
                            
                            {/* Show ALL roles for the user */}
                            {user.roles.map((role) => (
                              <Badge 
                                key={role} 
                                variant="outline" 
                                className={`capitalize text-xs ${
                                  role === 'admin' ? 'bg-red-500/20 text-red-400 border-red-500/30' : ''
                                }`}
                              >
                                {role}
                              </Badge>
                            ))}
                            
                            {/* Membership Status - ONLY for actual members, NEVER for shelters or businesses */}
                            {user.roles.includes("member") && !user.shelter && !user.business && (
                              user.membership?.is_active ? (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">{getPlanLabel(user.membership.plan_type)}</Badge>
                              ) : (
                                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">Freemium</Badge>
                              )
                            )}
                            
                            {/* Business Status - only if NOT a shelter */}
                            {user.business && !user.shelter && getStatusBadge(user.business.verification_status)}
                            
                            {/* Shelter Status - show for shelter record OR shelter role without record */}
                            {user.shelter ? getStatusBadge(user.shelter.verification_status) : 
                              user.roles.includes("shelter") && <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Pending Onboarding</Badge>}
                          </div>
                          
                          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                          
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                            {user.business && (
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {user.business.business_name} • {getCategoryLabel(user.business.category)}
                              </span>
                            )}
                            {user.shelter && (
                              <span className="flex items-center gap-1">
                                <Home className="w-3 h-3" />
                                {user.shelter.shelter_name}
                              </span>
                            )}
                            {user.membership?.is_active && (
                              <span className="flex items-center gap-1">
                                <CreditCard className="w-3 h-3" />
                                {user.membership.member_number}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="border-t border-border/50 p-4 bg-background/50 space-y-4">
                          {/* Basic Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div><span className="text-muted-foreground">Email:</span> {user.email}</div>
                            <div><span className="text-muted-foreground">Joined:</span> {format(new Date(user.created_at), "MMM d, yyyy")}</div>
                          </div>
                          
                          {/* Role Management - Multiple roles */}
                          <div className="bg-muted/30 rounded-lg p-4">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <UserCog className="w-4 h-4 text-primary" />
                              Roles
                            </h4>
                            <div className="flex flex-wrap gap-3">
                              {["member", "business", "shelter", "admin"].map((role) => {
                                const hasRole = user.roles.includes(role);
                                return (
                                  <div key={role} className="flex items-center gap-2">
                                    <Switch 
                                      checked={hasRole} 
                                      onCheckedChange={() => toggleRole(user.user_id, role, hasRole)}
                                    />
                                    <span className={`capitalize text-sm ${hasRole ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                      {role}
                                    </span>
                                    {role === 'admin' && hasRole && (
                                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Admin</Badge>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Current roles: {user.roles.length > 0 ? user.roles.join(', ') : 'None'}
                            </p>
                          </div>

                          {/* Membership Details */}
                          {user.membership && (
                            <div className="bg-muted/50 rounded-lg p-4">
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Crown className="w-4 h-4 text-yellow-500" />
                                Membership Details
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div><span className="text-muted-foreground">Member #:</span> {user.membership.member_number}</div>
                                <div><span className="text-muted-foreground">Plan:</span> {getPlanLabel(user.membership.plan_type)}</div>
                                <div><span className="text-muted-foreground">Max Pets:</span> {user.membership.max_pets}</div>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">Expires:</span>
                                  <Badge className={getExpiryStatus(user.membership.expires_at).color}>
                                    {getExpiryStatus(user.membership.expires_at).label}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 mt-3">
                                <span className="text-sm text-muted-foreground">Status:</span>
                                <div className="flex items-center gap-2">
                                  <UserX className="w-4 h-4 text-muted-foreground" />
                                  <Switch checked={user.membership.is_active} onCheckedChange={() => toggleMembershipStatus(user.membership!)} />
                                  <Crown className={`w-4 h-4 ${user.membership.is_active ? "text-amber-400" : "text-muted-foreground"}`} />
                                  <Badge variant={user.membership.is_active ? "default" : "outline"} className={user.membership.is_active ? "bg-green-600" : "text-orange-400 border-orange-400"}>
                                    {user.membership.is_active ? "Paid" : "Freemium"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Business Details */}
                          {user.business && (
                            <div className="bg-blue-500/5 rounded-lg p-4">
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-blue-500" />
                                Business Details
                                {getStatusBadge(user.business.verification_status)}
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
                                <div><span className="text-muted-foreground">Name:</span> {user.business.business_name}</div>
                                <div><span className="text-muted-foreground">Category:</span> {getCategoryLabel(user.business.category)}</div>
                                <div><span className="text-muted-foreground">City:</span> {user.business.city || "N/A"}</div>
                                <div><span className="text-muted-foreground">Email:</span> {user.business.email}</div>
                                <div><span className="text-muted-foreground">Phone:</span> {user.business.phone || "N/A"}</div>
                                <div><span className="text-muted-foreground">Created:</span> {format(new Date(user.business.created_at), "MMM d, yyyy")}</div>
                              </div>
                              {user.business.description && (
                                <p className="text-sm text-muted-foreground mb-3">{user.business.description}</p>
                              )}
                              <div className="flex gap-2 flex-wrap">
                                {user.business.website && (
                                  <Button size="sm" variant="outline" onClick={() => window.open(ensureHttps(user.business!.website!), "_blank")}>
                                    <Globe className="w-4 h-4 mr-1" /> Website
                                  </Button>
                                )}
                                {user.business.verification_status !== "approved" && (
                                  <Button size="sm" onClick={() => updateBusinessStatus(user.business!.id, "approved")} className="bg-green-600 hover:bg-green-700">
                                    <Check className="w-4 h-4 mr-1" /> Approve
                                  </Button>
                                )}
                                {user.business.verification_status !== "rejected" && (
                                  <Button size="sm" variant="destructive" onClick={() => updateBusinessStatus(user.business!.id, "rejected")}>
                                    <X className="w-4 h-4 mr-1" /> Reject
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Pending Onboarding Business - Nudge Button */}
                          {user.roles.includes("business") && !user.business && (
                            <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-blue-500" />
                                Business Onboarding Incomplete
                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Pending Onboarding</Badge>
                              </h4>
                              <p className="text-sm text-muted-foreground mb-3">
                                This user has registered as a business but hasn't completed their application form yet.
                              </p>
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const { error } = await supabase.from("notifications").insert({
                                      user_id: user.user_id,
                                      type: "reminder",
                                      title: "Complete Your Business Application",
                                      message: "Your business registration is almost complete! Please finish your application to start offering deals to Woofy members.",
                                      data: { action_url: "/partner-register" },
                                    });
                                    if (error) throw error;
                                    toast.success(`Onboarding reminder sent to ${user.full_name || user.email}`);
                                  } catch (error: any) {
                                    toast.error("Failed to send reminder");
                                  }
                                }}
                              >
                                <Bell className="w-4 h-4 mr-1" />
                                Nudge to Complete Onboarding
                              </Button>
                            </div>
                          )}

                          {/* Shelter Details */}
                          {user.shelter && (
                            <div className="bg-rose-500/5 rounded-lg p-4">
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Home className="w-4 h-4 text-rose-500" />
                                Shelter Details
                                {getStatusBadge(user.shelter.verification_status)}
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
                                <div><span className="text-muted-foreground">Name:</span> {user.shelter.shelter_name}</div>
                                <div><span className="text-muted-foreground">Contact:</span> {user.shelter.contact_name}</div>
                                <div><span className="text-muted-foreground">Location:</span> {user.shelter.location}</div>
                                <div><span className="text-muted-foreground">Email:</span> {user.shelter.email}</div>
                                <div><span className="text-muted-foreground">Phone:</span> {user.shelter.phone || "N/A"}</div>
                                <div><span className="text-muted-foreground">Dogs in Care:</span> {user.shelter.dogs_in_care || "N/A"}</div>
                                <div><span className="text-muted-foreground">Years Operating:</span> {user.shelter.years_operating || "N/A"}</div>
                                <div><span className="text-muted-foreground">Created:</span> {format(new Date(user.shelter.created_at), "MMM d, yyyy")}</div>
                              </div>
                              
                              
                              {user.shelter.description && (
                                <p className="text-sm text-muted-foreground mb-3">{user.shelter.description}</p>
                              )}
                              <div className="flex gap-2 flex-wrap">
                                {user.shelter.website && (
                                  <Button size="sm" variant="outline" onClick={() => window.open(ensureHttps(user.shelter!.website!), "_blank")}>
                                    <Globe className="w-4 h-4 mr-1" /> Website
                                  </Button>
                                )}
                                {user.shelter.verification_status !== "approved" && (
                                  <Button size="sm" onClick={() => updateShelterStatus(user.shelter!.id, "approved")} className="bg-green-600 hover:bg-green-700">
                                    <Check className="w-4 h-4 mr-1" /> Approve
                                  </Button>
                                )}
                                {user.shelter.verification_status !== "rejected" && (
                                  <Button size="sm" variant="destructive" onClick={() => updateShelterStatus(user.shelter!.id, "rejected")}>
                                    <X className="w-4 h-4 mr-1" /> Reject
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Pending Onboarding Shelter - Nudge Button */}
                          {user.roles.includes("shelter") && !user.shelter && (
                            <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/30">
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Home className="w-4 h-4 text-purple-500" />
                                Shelter Onboarding Incomplete
                                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Pending Onboarding</Badge>
                              </h4>
                              <p className="text-sm text-muted-foreground mb-3">
                                This user has registered as a shelter but hasn't completed their application form yet.
                              </p>
                              <Button
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const { error } = await supabase.from("notifications").insert({
                                      user_id: user.user_id,
                                      type: "reminder",
                                      title: "Complete Your Shelter Application",
                                      message: "Your shelter registration is almost complete! Please finish your application to get your shelter listed on Woofy.",
                                      data: { action_url: "/shelter-onboarding" },
                                    });
                                    if (error) throw error;
                                    toast.success(`Onboarding reminder sent to ${user.full_name || user.email}`);
                                  } catch (error: any) {
                                    toast.error("Failed to send reminder");
                                  }
                                }}
                              >
                                <Bell className="w-4 h-4 mr-1" />
                                Nudge to Complete Onboarding
                              </Button>
                            </div>
                          )}

                          {/* Quick Notify */}
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                const title = prompt("Notification Title:");
                                if (!title) return;
                                const message = prompt("Notification Message:");
                                if (!message) return;
                                supabase.from("notifications").insert({
                                  user_id: user.user_id,
                                  type: "announcement",
                                  title,
                                  message,
                                  data: { single: true },
                                }).then(({ error }) => {
                                  if (error) toast.error("Failed to send notification");
                                  else toast.success(`Notification sent to ${user.full_name || user.email}`);
                                });
                              }}
                            >
                              <Mail className="w-4 h-4 mr-2" />
                              Send Notification
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {getPageNumbers().map((page, idx) => (
                    <PaginationItem key={idx}>
                      {page === "ellipsis" ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
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
              Send a notification to {getTargetLabel(notifyTarget)} ({getTargetCount(notifyTarget)} users)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Notification Type</Label>
              <Select value={notification.type} onValueChange={(v) => setNotification({ ...notification, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Input value={notification.title} onChange={(e) => setNotification({ ...notification, title: e.target.value })} placeholder="New Feature Available!" />
            </div>
            
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={notification.message} onChange={(e) => setNotification({ ...notification, message: e.target.value })} placeholder="We're excited to announce..." rows={4} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifyDialogOpen(false)}>Cancel</Button>
            <Button onClick={sendNotifications} disabled={sending || !notification.title || !notification.message}>
              {sending ? "Sending..." : <><Send className="w-4 h-4 mr-2" />Send</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
