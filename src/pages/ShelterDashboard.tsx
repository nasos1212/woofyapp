import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Home, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Save, 
  LogOut, 
  Heart,
  Dog,
  Globe,
  Facebook,
  Instagram,
  ExternalLink,
  ImagePlus
} from "lucide-react";

const ShelterDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
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
        donation_link: shelter.donation_link || "",
      });
    }
  }, [shelter]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('shelters')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', shelter?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-shelter'] });
      toast.success("Profile updated successfully!");
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error("Failed to update profile");
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
            <h2 className="text-xl font-semibold mb-2">No Shelter Application Found</h2>
            <p className="text-muted-foreground mb-4">
              You haven't submitted a shelter application yet. Apply on our homepage to become a partner.
            </p>
            <Button onClick={() => navigate('/#shelters')}>
              Apply as Shelter Partner
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
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-700 gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-700 gap-1">
            <Clock className="h-3 w-3" />
            Pending Review
          </Badge>
        );
    }
  };

  const isApproved = shelter.verification_status === 'approved';

  return (
    <>
      <Helmet>
        <title>Shelter Dashboard | Wooffy</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                  <Home className="h-5 w-5 text-rose-500" />
                </div>
                <div>
                  <h1 className="font-semibold text-foreground">{shelter.shelter_name}</h1>
                  <p className="text-sm text-muted-foreground">Shelter Dashboard</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge()}
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container max-w-4xl mx-auto px-4 py-8">
          {/* Status Card */}
          {!isApproved && (
            <Card className="mb-6 border-yellow-200 bg-yellow-50">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-800">Application Under Review</h3>
                    <p className="text-sm text-yellow-700">
                      Your shelter application is being reviewed. We'll notify you once it's approved.
                      You can update your profile information while waiting.
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
                      <h3 className="font-medium text-green-800">Your shelter is live!</h3>
                      <p className="text-sm text-green-700">
                        Your profile is visible to all Wooffy members.
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/shelter/${shelter.id}`} target="_blank" rel="noopener noreferrer">
                      View Public Profile
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          {isApproved && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="py-4 text-center">
                  <Dog className="h-6 w-6 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">{shelter.dogs_helped_count || 0}</div>
                  <div className="text-sm text-muted-foreground">Dogs Helped</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <Heart className="h-6 w-6 text-rose-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{shelter.dogs_in_care || '-'}</div>
                  <div className="text-sm text-muted-foreground">Dogs in Care</div>
                </CardContent>
              </Card>
              <Card className="col-span-2 md:col-span-1">
                <CardContent className="py-4 text-center">
                  <Globe className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{shelter.years_operating || '-'}</div>
                  <div className="text-sm text-muted-foreground">Years Operating</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle>Shelter Profile</CardTitle>
              <CardDescription>
                Update your shelter's information. Changes will be visible on your public profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic">
                <TabsList className="mb-6">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="social">Social & Links</TabsTrigger>
                </TabsList>

                <form onSubmit={handleSubmit}>
                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="shelter_name">Shelter Name</Label>
                        <Input
                          id="shelter_name"
                          value={formData.shelter_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, shelter_name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact_name">Contact Person</Label>
                        <Input
                          id="contact_name"
                          value={formData.contact_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Full Address</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="about" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="description">About Your Shelter</Label>
                      <Textarea
                        id="description"
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Tell visitors about your shelter, history, and what makes you special..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mission_statement">Mission Statement</Label>
                      <Textarea
                        id="mission_statement"
                        rows={3}
                        value={formData.mission_statement}
                        onChange={(e) => setFormData(prev => ({ ...prev, mission_statement: e.target.value }))}
                        placeholder="Your shelter's mission in a few sentences..."
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dogs_in_care">Dogs Currently in Care</Label>
                        <Input
                          id="dogs_in_care"
                          value={formData.dogs_in_care}
                          onChange={(e) => setFormData(prev => ({ ...prev, dogs_in_care: e.target.value }))}
                          placeholder="e.g., 25-30"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="years_operating">Years Operating</Label>
                        <Input
                          id="years_operating"
                          value={formData.years_operating}
                          onChange={(e) => setFormData(prev => ({ ...prev, years_operating: e.target.value }))}
                          placeholder="e.g., 5+"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="social" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="donation_link">Donation Link</Label>
                      <Input
                        id="donation_link"
                        type="url"
                        value={formData.donation_link}
                        onChange={(e) => setFormData(prev => ({ ...prev, donation_link: e.target.value }))}
                        placeholder="https://donate.yourwebsite.com"
                      />
                      <p className="text-xs text-muted-foreground">
                        This will show as a "Donate Now" button on your profile
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="facebook_url" className="flex items-center gap-2">
                          <Facebook className="h-4 w-4" />
                          Facebook URL
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
                          Instagram URL
                        </Label>
                        <Input
                          id="instagram_url"
                          type="url"
                          value={formData.instagram_url}
                          onChange={(e) => setFormData(prev => ({ ...prev, instagram_url: e.target.value }))}
                          placeholder="https://instagram.com/yourpage"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <div className="flex justify-end mt-6 pt-4 border-t">
                    <Button type="submit" disabled={updateMutation.isPending}>
                      <Save className="h-4 w-4 mr-2" />
                      {updateMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
};

export default ShelterDashboard;
