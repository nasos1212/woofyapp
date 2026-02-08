import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Shield, TrendingUp, Clock, Gift, MessageCircleQuestion, MapPin, UserPlus, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import GiftMemberships from "@/components/admin/GiftMemberships";
import ExpiringMembershipsPanel from "@/components/admin/ExpiringMembershipsPanel";
import EngagementAnalytics from "@/components/admin/EngagementAnalytics";
import UserManagement from "@/components/admin/UserManagement";
import SupportManager from "@/components/admin/SupportManager";
import PlacesManager from "@/components/admin/PlacesManager";
import AffiliateManager from "@/components/admin/AffiliateManager";
import CommunityReportsManager from "@/components/admin/CommunityReportsManager";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 pt-[calc(6rem+env(safe-area-inset-top))]">

        <Breadcrumbs items={[{ label: "Admin Dashboard" }]} />
        
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>

        <Tabs defaultValue="support" className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1">
            <TabsTrigger value="support" className="gap-1">
              <MessageCircleQuestion className="w-4 h-4" />
              Support
            </TabsTrigger>
            <TabsTrigger value="affiliates" className="gap-1">
              <UserPlus className="w-4 h-4" />
              Affiliates
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="engagement" className="gap-1">
              <TrendingUp className="w-4 h-4" />
              Engagement
            </TabsTrigger>
            <TabsTrigger value="expiring" className="gap-1">
              <Clock className="w-4 h-4" />
              Expiring
            </TabsTrigger>
            <TabsTrigger value="gifts" className="gap-1">
              <Gift className="w-4 h-4" />
              Gifts
            </TabsTrigger>
            <TabsTrigger value="places" className="gap-1">
              <MapPin className="w-4 h-4" />
              Places
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-1">
              <Flag className="w-4 h-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="support">
            <SupportManager />
          </TabsContent>

          <TabsContent value="affiliates">
            <AffiliateManager />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="engagement">
            <EngagementAnalytics />
          </TabsContent>

          <TabsContent value="expiring">
            <ExpiringMembershipsPanel />
          </TabsContent>

          <TabsContent value="gifts">
            <GiftMemberships />
          </TabsContent>

          <TabsContent value="places">
            <PlacesManager />
          </TabsContent>

          <TabsContent value="reports">
            <CommunityReportsManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
