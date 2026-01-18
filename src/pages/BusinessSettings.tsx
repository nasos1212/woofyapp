import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Globe,
  Mail,
  Map,
  Camera,
  Trash2,
  Image as ImageIcon,
  Save,
  Clock,
} from "lucide-react";
import DogLoader from "@/components/DogLoader";
import BusinessMobileNav from "@/components/BusinessMobileNav";
import BusinessHeader from "@/components/BusinessHeader";
import PendingApprovalBanner from "@/components/PendingApprovalBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessVerification } from "@/hooks/useBusinessVerification";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PhotoUpload } from "@/components/PhotoUpload";
import { BusinessHoursManager } from "@/components/BusinessHoursManager";
import { validateImageFile, MAX_IMAGE_SIZE } from "@/lib/fileValidation";
import { Database } from "@/integrations/supabase/types";

type BusinessCategory = Database["public"]["Enums"]["business_category"];

interface BusinessPhoto {
  id: string;
  photo_url: string;
  caption: string | null;
}

interface BusinessData {
  id: string;
  business_name: string;
  description: string | null;
  category: BusinessCategory;
  phone: string | null;
  email: string;
  address: string | null;
  city: string | null;
  website: string | null;
  google_maps_url: string | null;
  logo_url: string | null;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const categoryOptions = [
  { value: "trainer", label: "Trainer" },
  { value: "pet_shop", label: "Pet Shop" },
  { value: "hotel", label: "Hotel / Boarding" },
  { value: "grooming", label: "Grooming" },
  { value: "vet", label: "Veterinary" },
  { value: "daycare", label: "Daycare" },
  { value: "physio", label: "Physiotherapy" },
  { value: "accessories", label: "Accessories" },
  { value: "other", label: "Other" },
];

const BusinessSettings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isApproved, verificationStatus, loading: verificationLoading } = useBusinessVerification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [photos, setPhotos] = useState<BusinessPhoto[]>([]);
  
  const [formData, setFormData] = useState<BusinessData>({
    id: "",
    business_name: "",
    description: "",
    category: "other" as BusinessCategory,
    phone: "",
    email: "",
    address: "",
    city: "",
    website: "",
    google_maps_url: "",
    logo_url: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?type=business");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchBusinessData();
    }
  }, [user]);

  const fetchBusinessData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data: business, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!business) {
        navigate("/partner-register");
        return;
      }

      setFormData({
        id: business.id,
        business_name: business.business_name,
        description: business.description || "",
        category: business.category,
        phone: business.phone || "",
        email: business.email,
        address: business.address || "",
        city: business.city || "",
        website: business.website || "",
        google_maps_url: business.google_maps_url || "",
        logo_url: business.logo_url || "",
      });

      // Fetch photos
      const { data: photosData } = await supabase
        .from("business_photos")
        .select("id, photo_url, caption")
        .eq("business_id", business.id)
        .order("display_order", { ascending: true });

      setPhotos(photosData || []);
    } catch (error) {
      console.error("Error fetching business:", error);
      toast.error("Failed to load business data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.business_name.trim()) {
      toast.error("Business name is required");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("businesses")
        .update({
          business_name: formData.business_name.trim(),
          description: formData.description?.trim() || null,
          category: formData.category,
          phone: formData.phone?.trim() || null,
          email: formData.email.trim(),
          address: formData.address?.trim() || null,
          city: formData.city?.trim() || null,
          website: formData.website?.trim() || null,
          google_maps_url: formData.google_maps_url?.trim() || null,
        })
        .eq("id", formData.id);

      if (error) throw error;

      toast.success("Business profile updated!");
    } catch (error: any) {
      console.error("Error updating business:", error);
      toast.error(error.message || "Failed to update business");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setIsUploadingLogo(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${formData.id}-logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("business-photos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("business-photos")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("businesses")
        .update({ logo_url: publicUrl })
        .eq("id", formData.id);

      if (updateError) throw updateError;

      setFormData(prev => ({ ...prev, logo_url: publicUrl }));
      toast.success("Logo updated!");
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast.error(error.message || "Failed to upload logo");
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeLogo = async () => {
    try {
      const { error } = await supabase
        .from("businesses")
        .update({ logo_url: null })
        .eq("id", formData.id);

      if (error) throw error;

      setFormData(prev => ({ ...prev, logo_url: "" }));
      toast.success("Logo removed");
    } catch (error: any) {
      console.error("Error removing logo:", error);
      toast.error(error.message || "Failed to remove logo");
    }
  };

  const deletePhoto = async (photoId: string) => {
    try {
      const { error } = await supabase
        .from("business_photos")
        .delete()
        .eq("id", photoId);

      if (error) throw error;
      toast.success("Photo deleted");
      setPhotos(prev => prev.filter(p => p.id !== photoId));
    } catch (error: any) {
      console.error("Error deleting photo:", error);
      toast.error(error.message || "Failed to delete photo");
    }
  };

  if (authLoading || isLoading || verificationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader size="lg" />
      </div>
    );
  }

  if (!isApproved) {
    return (
      <>
        <Helmet>
          <title>Business Settings | Wooffy Business</title>
        </Helmet>
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
          <BusinessHeader />
          <main className="container mx-auto px-4 py-8 pt-24 md:pt-28">
            <PendingApprovalBanner status={verificationStatus} />
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-200 text-center">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-display font-semibold text-lg mb-2">Profile Settings Unavailable</h3>
              <p className="text-slate-500">Edit your business profile once your account is approved.</p>
            </div>
          </main>
          <BusinessMobileNav />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Business Settings | Wooffy Business</title>
        <meta name="description" content="Manage your Wooffy business profile settings." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <BusinessHeader />

        <main className="container mx-auto px-4 py-8 pt-24 md:pt-28 max-w-3xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/business")}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              Business Settings
            </h1>
            <p className="text-slate-500">Manage your business profile and photos</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="gap-2">
                <Building2 className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="hours" className="gap-2">
                <Clock className="w-4 h-4" />
                Hours
              </TabsTrigger>
              <TabsTrigger value="photos" className="gap-2">
                <ImageIcon className="w-4 h-4" />
                Photos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Business Profile</CardTitle>
                  <CardDescription>
                    Update your business information visible to Wooffy members
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Logo Upload */}
                  <div className="space-y-3">
                    <Label>Business Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300">
                        {formData.logo_url ? (
                          <img
                            src={formData.logo_url}
                            alt="Business logo"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Building2 className="w-8 h-8 text-slate-400" />
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingLogo}
                          className="gap-2"
                        >
                          <Camera className="w-4 h-4" />
                          {isUploadingLogo ? "Uploading..." : "Upload Logo"}
                        </Button>
                        {formData.logo_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={removeLogo}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">
                      Recommended: Square image, max {formatFileSize(MAX_IMAGE_SIZE)}
                    </p>
                  </div>

                  {/* Business Name */}
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      placeholder="Your Business Name"
                      value={formData.business_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                      required
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as BusinessCategory }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Tell pet owners about your services..."
                      value={formData.description || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                    />
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="contact@business.com"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          id="phone"
                          placeholder="+357 99 123 456"
                          value={formData.phone || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          id="address"
                          placeholder="Street address"
                          value={formData.address || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="City"
                        value={formData.city || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Website */}
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="website"
                        placeholder="https://www.yourbusiness.com"
                        value={formData.website || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Google Maps */}
                  <div className="space-y-2">
                    <Label htmlFor="googleMapsUrl">Google Maps Link</Label>
                    <div className="relative">
                      <Map className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="googleMapsUrl"
                        placeholder="https://maps.google.com/..."
                        value={formData.google_maps_url || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, google_maps_url: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      Paste your Google Maps share link so customers can find you easily
                    </p>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                      <Save className="w-4 h-4" />
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hours">
              <Card>
                <CardHeader>
                  <CardTitle>Business Hours</CardTitle>
                  <CardDescription>
                    Set your opening hours so customers know when to visit
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BusinessHoursManager businessId={formData.id} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="photos">
              <Card>
                <CardHeader>
                  <CardTitle>Business Photos</CardTitle>
                  <CardDescription>
                    Add photos to showcase your business to potential customers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <PhotoUpload
                    businessId={formData.id}
                    onUploadComplete={() => fetchBusinessData()}
                  />

                  {photos.length > 0 && (
                    <div className="space-y-3">
                      <Label>Current Photos</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {photos.map((photo) => (
                          <div key={photo.id} className="relative group">
                            <img
                              src={photo.photo_url}
                              alt={photo.caption || "Business photo"}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => deletePhoto(photo.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {photos.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <ImageIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p>No photos uploaded yet</p>
                      <p className="text-sm">Add photos to make your profile stand out</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

        <BusinessMobileNav />
      </div>
    </>
  );
};

export default BusinessSettings;
