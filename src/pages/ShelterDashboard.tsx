import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Helmet } from "react-helmet-async";
import ShelterOnboardingTour from "@/components/ShelterOnboardingTour";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ensureHttps } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ShelterHeaderUpload from "@/components/ShelterHeaderUpload";
import ShelterGalleryUpload from "@/components/ShelterGalleryUpload";
import ShelterAdoptablePets from "@/components/ShelterAdoptablePets";
import ShelterAdoptionInquiries from "@/components/ShelterAdoptionInquiries";
import NotificationBell from "@/components/NotificationBell";
import { 
  Home, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Save, 
  LogOut, 
  Heart,
  Globe,
  Facebook,
  Instagram,
  ExternalLink,
  ImageIcon,
  ChevronRight,
  User,
  MessageCircle,
  Bell,
  Shield
} from "lucide-react";

const ShelterDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState({
    shelter_name: "",
    contact_name: "",
    email: "",
    phone: "",
    location: "",
    city: "",
    address: "",
    website: "",
    description: "",
    mission_statement: "",
    dogs_in_care: "",
    years_operating: "",
    facebook_url: "",
    tiktok_url: "",
    instagram_url: "",
    donation_link: "",
  });

  // Fetch shelter data for the logged-in user
  const { data: shelter, isLoading } = useQuery({
    queryKey: ['my-shelter', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shelters')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch pending inquiry count for badge
  const { data: pendingInquiryCount = 0 } = useQuery({
    queryKey: ['pending-inquiry-count', shelter?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('adoption_inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('shelter_id', shelter!.id)
        .eq('status', 'pending');
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!shelter?.id,
  });

  // Fetch profile for avatar dropdown
  const { data: profile } = useQuery({
    queryKey: ['shelter-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  // Check admin status
  const { data: isAdmin } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      const { data } = await supabase.rpc('has_role', { _user_id: user!.id, _role: 'admin' });
      return !!data;
    },
    enabled: !!user?.id,
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Update form when shelter data loads
  useEffect(() => {
    if (shelter) {
      setFormData({
        shelter_name: shelter.shelter_name || "",
        contact_name: shelter.contact_name || "",
        email: shelter.email || "",
        phone: shelter.phone || "",
        location: shelter.location || "",
        city: shelter.city || "",
        address: shelter.address || "",
        website: shelter.website || "",
        description: shelter.description || "",
        mission_statement: shelter.mission_statement || "",
        dogs_in_care: shelter.dogs_in_care || "",
        years_operating: shelter.years_operating || "",
        facebook_url: shelter.facebook_url || "",
        instagram_url: shelter.instagram_url || "",
        tiktok_url: shelter.tiktok_url || "",
        donation_link: shelter.donation_link || "",
      });
    }
  }, [shelter]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Normalize all URL fields to ensure they have https://
      const normalizedData = {
        ...data,
        website: data.website ? ensureHttps(data.website) : null,
        donation_link: data.donation_link ? ensureHttps(data.donation_link) : null,
        facebook_url: data.facebook_url ? ensureHttps(data.facebook_url) : null,
        instagram_url: data.instagram_url ? ensureHttps(data.instagram_url) : null,
        tiktok_url: data.tiktok_url ? ensureHttps(data.tiktok_url) : null,
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('shelters')
        .update(normalizedData)
        .eq('id', shelter?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-shelter'] });
      toast.success(t("shelter.toasts.profileUpdated"));
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error(t("shelter.toasts.profileUpdateFailed"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) {
    navigate('/auth?redirect=/shelter-dashboard');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container max-w-4xl mx-auto">
          <Skeleton className="h-8 w-64 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!shelter) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t("shelter.noApplicationFound")}</h2>
            <p className="text-muted-foreground mb-4">
              {t("shelter.noApplicationDesc")}
            </p>
            <Button onClick={() => navigate('/#shelters')}>
              {t("shelter.applyAsPartner")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (shelter.verification_status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-700 gap-1">
            <CheckCircle className="h-3 w-3" />
            {t("shelter.status.approved")}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-700 gap-1">
            <XCircle className="h-3 w-3" />
            {t("shelter.status.rejected")}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-700 gap-1">
            <Clock className="h-3 w-3" />
            {t("shelter.status.pending")}
          </Badge>
        );
    }
  };

  const isApproved = shelter.verification_status === 'approved';

  return (
    <>
      <Helmet>
        <title>{t("shelter.pageTitle")}</title>
      </Helmet>

      <div className="min-h-screen bg-background overflow-x-hidden">
        <ShelterOnboardingTour />
        {/* Header */}
        <header className="border-b bg-card pt-[env(safe-area-inset-top)]">
          <div className="w-full max-w-4xl mx-auto px-4 py-4 box-border">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <Home className="h-5 w-5 text-rose-500" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-semibold text-foreground truncate">{shelter.shelter_name}</h1>
                  <p className="text-sm text-muted-foreground">{t("shelter.dashboard")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {getStatusBadge()}
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || t("shelter.user")} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                          {profile?.full_name ? getInitials(profile.full_name) : user?.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{profile?.full_name || t("shelter.user")}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/shelter-dashboard")}>
                      <User className="mr-2 h-4 w-4" />
                      {t("shelter.myDashboard")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/community")}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      {t("shelter.communityHub")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/member/notifications")}>
                      <Bell className="mr-2 h-4 w-4" />
                      {t("shelter.notifications")}
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate("/admin")} className="text-primary">
                          <Shield className="mr-2 h-4 w-4" />
                          {t("shelter.adminDashboard")}
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      {t("shelter.signOut")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        <main className="w-full max-w-4xl mx-auto px-4 py-8 box-border">
          {/* Status Card */}
          {!isApproved && (
            <Card className="mb-6 border-yellow-200 bg-yellow-50">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-800">{t("shelter.underReview")}</h3>
                    <p className="text-sm text-yellow-700">
                      {t("shelter.underReviewDesc")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isApproved && (
            <Card className="mb-6 border-green-200 bg-green-50">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-green-800">{t("shelter.isLive")}</h3>
                      <p className="text-sm text-green-700">
                        {t("shelter.isLiveDesc")}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/shelter/${shelter.id}`} target="_blank" rel="noopener noreferrer">
                      {t("shelter.viewPublicProfile")}
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          {isApproved && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card>
                <CardContent className="py-4 text-center">
                  <Heart className="h-6 w-6 text-rose-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{shelter.dogs_in_care || '-'}</div>
                  <div className="text-sm text-muted-foreground">{t("shelter.dogsInCare")}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <Globe className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{shelter.years_operating ? t("shelter.since", { year: shelter.years_operating }) : '-'}</div>
                  <div className="text-sm text-muted-foreground">{t("shelter.operatingSince")}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle>{t("shelter.shelterProfile")}</CardTitle>
              <CardDescription>
                {t("shelter.shelterProfileDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" onValueChange={setActiveTab}>
                <div className="relative mb-6">
                  {/* Left fade gradient */}
                  <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none sm:hidden" />
                  {/* Right fade gradient with blue arrow */}
                  <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-card via-card/80 to-transparent z-10 pointer-events-none sm:hidden flex items-center justify-end pr-1">
                    <div className="bg-primary rounded-full p-0.5 animate-pulse">
                      <ChevronRight className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="overflow-x-auto -mx-4 px-4 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <TabsList className="inline-flex w-max gap-1">
                      <TabsTrigger value="basic">{t("shelter.tabs.basic")}</TabsTrigger>
                      <TabsTrigger value="about">{t("shelter.tabs.about")}</TabsTrigger>
                      <TabsTrigger value="social">{t("shelter.tabs.social")}</TabsTrigger>
                      <TabsTrigger value="branding" className="gap-1">
                        <ImageIcon className="h-3 w-3" />
                        {t("shelter.tabs.branding")}
                      </TabsTrigger>
                      <TabsTrigger value="adoptable-pets">
                        {t("shelter.tabs.pets")}
                      </TabsTrigger>
                      <TabsTrigger value="inquiries" className="relative">
                        {t("shelter.tabs.inquiries")}
                        {pendingInquiryCount > 0 && (
                          <span className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                            {pendingInquiryCount}
                          </span>
                        )}
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="shelter_name">{t("shelter.fields.shelterName")}</Label>
                        <Input
                          id="shelter_name"
                          value={formData.shelter_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, shelter_name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact_name">{t("shelter.fields.contactPerson")}</Label>
                        <Input
                          id="contact_name"
                          value={formData.contact_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">{t("shelter.fields.email")}</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">{t("shelter.fields.phone")}</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">{t("shelter.fields.location")}</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">{t("shelter.fields.city")}</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">{t("shelter.fields.fullAddress")}</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="about" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="description">{t("shelter.fields.aboutShelter")}</Label>
                      <Textarea
                        id="description"
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder={t("shelter.fields.aboutPlaceholder")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mission_statement">{t("shelter.fields.missionStatement")}</Label>
                      <Textarea
                        id="mission_statement"
                        rows={3}
                        value={formData.mission_statement}
                        onChange={(e) => setFormData(prev => ({ ...prev, mission_statement: e.target.value }))}
                        placeholder={t("shelter.fields.missionPlaceholder")}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dogs_in_care">{t("shelter.fields.dogsInCare")}</Label>
                        <Input
                          id="dogs_in_care"
                          value={formData.dogs_in_care}
                          onChange={(e) => setFormData(prev => ({ ...prev, dogs_in_care: e.target.value }))}
                          placeholder={t("shelter.fields.dogsInCarePlaceholder")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="years_operating">{t("shelter.fields.operatingSinceLabel")}</Label>
                        <Input
                          id="years_operating"
                          value={formData.years_operating}
                          onChange={(e) => setFormData(prev => ({ ...prev, years_operating: e.target.value }))}
                          placeholder={t("shelter.fields.operatingSincePlaceholder")}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="social" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="website">{t("shelter.fields.website")}</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                        placeholder={t("shelter.fields.websitePlaceholder")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="donation_link">{t("shelter.fields.donationLink")}</Label>
                      <Input
                        id="donation_link"
                        type="url"
                        value={formData.donation_link}
                        onChange={(e) => setFormData(prev => ({ ...prev, donation_link: e.target.value }))}
                        placeholder={t("shelter.fields.donationLinkPlaceholder")}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("shelter.fields.donationHelp")}
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="facebook_url" className="flex items-center gap-2">
                          <Facebook className="h-4 w-4" />
                          {t("shelter.fields.facebookUrl")}
                        </Label>
                        <Input
                          id="facebook_url"
                          type="url"
                          value={formData.facebook_url}
                          onChange={(e) => setFormData(prev => ({ ...prev, facebook_url: e.target.value }))}
                          placeholder="https://facebook.com/yourpage"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="instagram_url" className="flex items-center gap-2">
                          <Instagram className="h-4 w-4" />
                          {t("shelter.fields.instagramUrl")}
                        </Label>
                        <Input
                          id="instagram_url"
                          type="url"
                          value={formData.instagram_url}
                          onChange={(e) => setFormData(prev => ({ ...prev, instagram_url: e.target.value }))}
                          placeholder="https://instagram.com/yourpage"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tiktok_url" className="flex items-center gap-2">
                          {t("shelter.fields.tiktokUrl")}
                        </Label>
                        <Input
                          id="tiktok_url"
                          type="url"
                          value={formData.tiktok_url}
                          onChange={(e) => setFormData(prev => ({ ...prev, tiktok_url: e.target.value }))}
                          placeholder="https://tiktok.com/@yourpage"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {["basic", "about", "social"].includes(activeTab) && (
                    <div className="flex justify-start mt-6 pt-4 border-t">
                      <Button type="submit" disabled={updateMutation.isPending}>
                        <Save className="h-4 w-4 mr-2" />
                        {updateMutation.isPending ? t("shelter.saving") : t("shelter.saveChanges")}
                      </Button>
                    </div>
                  )}
                </form>

                  <TabsContent value="branding" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-1">{t("shelter.branding.coverPhoto")}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {t("shelter.branding.coverPhotoDesc")}
                      </p>
                      <ShelterHeaderUpload shelterId={shelter.id} currentLogoUrl={shelter.logo_url} currentCoverUrl={shelter.cover_photo_url} currentCoverPosition={shelter.cover_photo_position} />
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-1">{t("shelter.branding.photoGallery")}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {t("shelter.branding.photoGalleryDesc")}
                      </p>
                      <ShelterGalleryUpload shelterId={shelter.id} />
                    </div>
                  </TabsContent>

                  <TabsContent value="adoptable-pets">
                    <ShelterAdoptablePets shelterId={shelter.id} />
                  </TabsContent>

                  <TabsContent value="inquiries">
                    <ShelterAdoptionInquiries shelterId={shelter.id} />
                  </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
};

export default ShelterDashboard;
