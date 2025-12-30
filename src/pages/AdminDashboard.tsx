import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, Building2, Users, Shield, Eye, ChevronDown, ChevronUp, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Constants } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { Database } from "@/integrations/supabase/types";

type Business = Database["public"]["Tables"]["businesses"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];

interface UserWithRoles extends Profile {
  roles: UserRole[];
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBusiness, setExpandedBusiness] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      checkAdminStatus();
    }
  }, [user, authLoading, navigate]);

  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (error) throw error;

      setIsAdmin(data);

      if (data) {
        fetchData();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all businesses
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .order("created_at", { ascending: false });

      if (businessError) throw businessError;
      setBusinesses(businessData || []);

      // Fetch all profiles
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profileError) throw profileError;

      // Fetch all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersWithRoles: UserWithRoles[] = (profileData || []).map((profile) => ({
        ...profile,
        roles: (rolesData || []).filter((role) => role.user_id === profile.user_id),
      }));

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const updateBusinessStatus = async (
    businessId: string,
    status: "approved" | "rejected"
  ) => {
    try {
      const updateData: { verification_status: "approved" | "rejected"; verified_at?: string } = {
        verification_status: status,
      };

      if (status === "approved") {
        updateData.verified_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("businesses")
        .update(updateData)
        .eq("id", businessId);

      if (error) throw error;

      toast.success(`Business ${status}!`);
      fetchData();
    } catch (error: any) {
      console.error("Error updating business:", error);
      toast.error(error.message || "Failed to update business");
    }
  };

  const updateUserRole = async (userId: string, currentRoles: UserRole[], newRole: string) => {
    try {
      // Remove existing roles for this user
      if (currentRoles.length > 0) {
        const { error: deleteError } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId);

        if (deleteError) throw deleteError;
      }

      // Add new role if not "none"
      if (newRole !== "none") {
        const { error: insertError } = await supabase
          .from("user_roles")
          .insert([{ user_id: userId, role: newRole as "admin" | "member" | "business" }]);

        if (insertError) throw insertError;
      }

      toast.success(`User role updated to ${newRole === "none" ? "no role" : newRole}`);
      fetchData();
    } catch (error: any) {
      console.error("Error updating user role:", error);
      toast.error(error.message || "Failed to update user role");
    }
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
      other: "Other",
    };
    return labels[category] || category;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const pendingBusinesses = businesses.filter(
    (b) => b.verification_status === "pending"
  );
  const approvedBusinesses = businesses.filter(
    (b) => b.verification_status === "approved"
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: "Admin Dashboard" }]} />
        
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{businesses.length}</p>
                  <p className="text-muted-foreground text-sm">Total Businesses</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <span className="text-yellow-400 font-bold">{pendingBusinesses.length}</span>
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingBusinesses.length}</p>
                  <p className="text-muted-foreground text-sm">Pending Approval</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{approvedBusinesses.length}</p>
                  <p className="text-muted-foreground text-sm">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{users.length}</p>
                  <p className="text-muted-foreground text-sm">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="pending" className="gap-2">
              Pending ({pendingBusinesses.length})
            </TabsTrigger>
            <TabsTrigger value="businesses">All Businesses</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingBusinesses.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="py-12 text-center">
                  <Check className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending approvals!</p>
                </CardContent>
              </Card>
            ) : (
              pendingBusinesses.map((business) => (
                <Card key={business.id} className="border-border/50">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{business.business_name}</h3>
                          <Badge variant="outline">{getCategoryLabel(business.category)}</Badge>
                          {getStatusBadge(business.verification_status)}
                        </div>
                        <p className="text-muted-foreground text-sm mb-2">
                          {business.email} • {business.city || "No city"}
                        </p>
                        {business.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {business.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Registered: {new Date(business.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/business/${business.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateBusinessStatus(business.id, "rejected")}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateBusinessStatus(business.id, "approved")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="businesses" className="space-y-4">
            {businesses.map((business) => (
              <Card key={business.id} className="border-border/50">
                <CardContent className="p-4">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() =>
                      setExpandedBusiness(
                        expandedBusiness === business.id ? null : business.id
                      )
                    }
                  >
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{business.business_name}</h3>
                      <Badge variant="outline">{getCategoryLabel(business.category)}</Badge>
                      {getStatusBadge(business.verification_status)}
                    </div>
                    {expandedBusiness === business.id ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  {expandedBusiness === business.id && (
                    <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Email:</span> {business.email}
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Phone:</span>{" "}
                        {business.phone || "Not provided"}
                      </p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Location:</span>{" "}
                        {business.address}, {business.city}
                      </p>
                      {business.description && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Description:</span>{" "}
                          {business.description}
                        </p>
                      )}
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/business/${business.id}`)}>
                          View Profile
                        </Button>
                        {business.verification_status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateBusinessStatus(business.id, "rejected")}
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => updateBusinessStatus(business.id, "approved")}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Approve
                            </Button>
                          </>
                        )}
                        {business.verification_status === "approved" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateBusinessStatus(business.id, "rejected")}
                          >
                            Revoke Approval
                          </Button>
                        )}
                        {business.verification_status === "rejected" && (
                          <Button
                            size="sm"
                            onClick={() => updateBusinessStatus(business.id, "approved")}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="w-5 h-5" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map((userItem) => (
                    <div
                      key={userItem.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted/30 gap-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{userItem.full_name || "No name"}</p>
                        <p className="text-sm text-muted-foreground">{userItem.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {userItem.roles.map((role) => (
                            <Badge key={role.id} variant="outline" className="capitalize">
                              {role.role}
                            </Badge>
                          ))}
                          {userItem.roles.length === 0 && (
                            <Badge variant="outline" className="text-muted-foreground">
                              No roles
                            </Badge>
                          )}
                        </div>
                        <Select
                          value={userItem.roles[0]?.role || "none"}
                          onValueChange={(value) => updateUserRole(userItem.user_id, userItem.roles, value)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Set role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No role</SelectItem>
                            {Constants.public.Enums.app_role.map((role) => (
                              <SelectItem key={role} value={role} className="capitalize">
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
