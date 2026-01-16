import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, MapPin, Clock, Phone, Mail, Plus, Search, CheckCircle2, Bell, BellOff, ArrowLeft, Upload, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import DogLoader from "@/components/DogLoader";
import LocationSelector from "@/components/LocationSelector";
import CityMultiSelector from "@/components/CityMultiSelector";
import { formatLocation } from "@/data/cyprusLocations";
import { formatDistanceToNow, format } from "date-fns";

interface LostPetAlert {
  id: string;
  pet_name: string;
  pet_description: string;
  pet_breed: string | null;
  pet_photo_url: string | null;
  last_seen_location: string;
  last_seen_date: string;
  contact_phone: string | null;
  contact_email: string | null;
  reward_offered: string | null;
  status: "active" | "found" | "resolved";
  created_at: string;
  owner_user_id: string;
}

interface Pet {
  id: string;
  pet_name: string;
  pet_breed: string | null;
}

interface NotificationPreferences {
  id: string;
  user_id: string;
  enabled: boolean;
  cities: string[];
}

const LostPetAlerts = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<LostPetAlert[]>([]);
  const [myPets, setMyPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  // Form state
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [petName, setPetName] = useState("");
  const [petDescription, setPetDescription] = useState("");
  const [petBreed, setPetBreed] = useState("");
  const [lastSeenCity, setLastSeenCity] = useState("");
  const [lastSeenArea, setLastSeenArea] = useState("");
  const [lastSeenDetails, setLastSeenDetails] = useState("");
  const [lastSeenDate, setLastSeenDate] = useState("");
  const [lastSeenTime, setLastSeenTime] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [rewardOffered, setRewardOffered] = useState("");
  const [petPhotos, setPetPhotos] = useState<File[]>([]);
  const [petPhotoPreviews, setPetPhotoPreviews] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const MAX_PHOTOS = 3;

  useEffect(() => {
    fetchAlerts();
    if (user) {
      fetchMyPets();
      fetchNotificationPreferences();
    }
  }, [user]);

  const fetchAlerts = async () => {
    try {
      // Use public view that masks contact info based on user's notification preferences
      const { data, error } = await supabase
        .from("lost_pet_alerts_public")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAlerts((data || []) as LostPetAlert[]);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyPets = async () => {
    if (!user) return;

    const { data: membership } = await supabase
      .from("memberships")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (membership) {
      const { data: pets } = await supabase
        .from("pets")
        .select("id, pet_name, pet_breed")
        .eq("membership_id", membership.id);

      setMyPets(pets || []);
    }
  };

  const fetchNotificationPreferences = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("lost_pet_notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setNotificationPrefs(data as NotificationPreferences);
      setNotificationsEnabled(data.enabled);
      setSelectedCities(data.cities || []);
    }
  };

  const saveNotificationPreferences = async () => {
    if (!user) return;

    setIsSavingPrefs(true);
    try {
      if (notificationPrefs) {
        // Update existing
        const { error } = await supabase
          .from("lost_pet_notification_preferences")
          .update({
            enabled: notificationsEnabled,
            cities: selectedCities,
          })
          .eq("id", notificationPrefs.id);

        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("lost_pet_notification_preferences")
          .insert({
            user_id: user.id,
            enabled: notificationsEnabled,
            cities: selectedCities,
          })
          .select()
          .single();

        if (error) throw error;
        setNotificationPrefs(data as NotificationPreferences);
      }

      toast.success("Notification preferences saved!");
      setShowSettingsDialog(false);
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setIsSavingPrefs(false);
    }
  };


  const handlePetSelect = (petId: string) => {
    setSelectedPetId(petId);
    const pet = myPets.find((p) => p.id === petId);
    if (pet) {
      setPetName(pet.pet_name);
      setPetBreed(pet.pet_breed || "");
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newFiles: File[] = [];
    const newPreviews: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      if (petPhotos.length + newFiles.length >= MAX_PHOTOS) {
        toast.error(`Maximum ${MAX_PHOTOS} photos allowed`);
        break;
      }
      
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select image files only");
        continue;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        continue;
      }
      
      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }
    
    setPetPhotos(prev => [...prev, ...newFiles]);
    setPetPhotoPreviews(prev => [...prev, ...newPreviews]);
    
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(petPhotoPreviews[index]);
    setPetPhotos(prev => prev.filter((_, i) => i !== index));
    setPetPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllPhotos = () => {
    petPhotoPreviews.forEach(preview => URL.revokeObjectURL(preview));
    setPetPhotos([]);
    setPetPhotoPreviews([]);
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to create an alert");
      return;
    }

    if (!petName || !petDescription || !lastSeenCity || !lastSeenDate || !contactPhone) {
      toast.error("Please fill in all required fields including contact phone");
      return;
    }

    if (petPhotos.length === 0) {
      toast.error("Please upload at least one photo of your pet");
      return;
    }

    // Build location string
    const locationParts = [formatLocation(lastSeenCity, lastSeenArea === "all-areas" ? "" : lastSeenArea)];
    if (lastSeenDetails.trim()) {
      locationParts.push(lastSeenDetails.trim());
    }
    const lastSeenLocation = locationParts.join(" - ");

    // Build the date/time - time is optional
    let lastSeenDateTime: Date;
    if (lastSeenTime) {
      lastSeenDateTime = new Date(`${lastSeenDate}T${lastSeenTime}`);
    } else {
      lastSeenDateTime = new Date(`${lastSeenDate}T12:00:00`);
    }

    setIsCreating(true);
    try {
      // Upload all photos first
      setIsUploadingPhoto(true);
      const uploadedPhotoUrls: string[] = [];
      
      for (let i = 0; i < petPhotos.length; i++) {
        const photo = petPhotos[i];
        const fileExt = photo.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}-${i}.${fileExt}`;
        const filePath = `lost-pets/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("lost-pet-photos")
          .upload(filePath, photo);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("lost-pet-photos")
          .getPublicUrl(filePath);

        uploadedPhotoUrls.push(urlData.publicUrl);
      }
      
      setIsUploadingPhoto(false);
      
      // Use first photo as the main photo_url for backwards compatibility
      const mainPhotoUrl = uploadedPhotoUrls[0];

      // Create the alert with main photo
      const { data: alertData, error } = await supabase.from("lost_pet_alerts").insert({
        owner_user_id: user.id,
        pet_id: selectedPetId || null,
        pet_name: petName,
        pet_description: petDescription,
        pet_breed: petBreed || null,
        pet_photo_url: mainPhotoUrl,
        last_seen_location: lastSeenLocation,
        last_seen_date: lastSeenDateTime.toISOString(),
        contact_phone: contactPhone,
        contact_email: contactEmail || null,
        reward_offered: rewardOffered || null,
        status: "active",
      }).select("id").single();

      if (error) throw error;
      
      // Insert additional photos into the photos table
      if (alertData && uploadedPhotoUrls.length > 0) {
        const photoInserts = uploadedPhotoUrls.map((url, index) => ({
          alert_id: alertData.id,
          photo_url: url,
          display_order: index,
        }));
        
        await supabase.from("lost_pet_alert_photos").insert(photoInserts);
      }

      toast.success("Alert created! The community will help find your pet.");
      setShowCreateDialog(false);
      resetForm();
      fetchAlerts();
    } catch (error) {
      console.error("Error creating alert:", error);
      toast.error("Failed to create alert");
    } finally {
      setIsCreating(false);
      setIsUploadingPhoto(false);
    }
  };

  const resetForm = () => {
    setSelectedPetId("");
    setPetName("");
    setPetDescription("");
    setPetBreed("");
    setLastSeenCity("");
    setLastSeenArea("");
    setLastSeenDetails("");
    setLastSeenDate("");
    setLastSeenTime("");
    setContactPhone("");
    setContactEmail("");
    setRewardOffered("");
    clearAllPhotos();
  };

  const markAsFound = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from("lost_pet_alerts")
        .update({ status: "found", resolved_at: new Date().toISOString() })
        .eq("id", alertId);

      if (error) throw error;
      toast.success("Wonderful news! So glad your pet is found! 🎉");
      fetchAlerts();
    } catch (error) {
      console.error("Error updating alert:", error);
      toast.error("Failed to update alert");
    }
  };

  // Check if user can see contact info (logged in + notifications enabled with cities)
  const canSeeContactInfo = user && notificationPrefs?.enabled && (notificationPrefs?.cities?.length || 0) > 0;

  const filteredAlerts = alerts.filter(
    (alert) =>
      alert.pet_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.last_seen_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (alert.pet_breed?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const activeAlerts = filteredAlerts.filter((a) => a.status === "active");
  const foundAlerts = filteredAlerts.filter((a) => a.status === "found" || a.status === "resolved");

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader size="lg" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Lost Pet Alerts | Wooffy Community</title>
        <meta name="description" content="Community-powered lost pet alert system. Help reunite pets with their families." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-wooffy-soft to-background">
        <Header />

        <main className="container mx-auto px-4 py-8 pt-24">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/member")}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                Lost Pet Alerts 🚨
              </h1>
              <p className="text-muted-foreground">
                Help reunite pets with their families. {activeAlerts.length} active alerts.
              </p>
            </div>

            <div className="flex gap-2">
              {/* Notification Settings Button */}
              <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    {notificationPrefs?.enabled ? (
                      <Bell className="w-4 h-4 text-primary" />
                    ) : (
                      <BellOff className="w-4 h-4" />
                    )}
                    Notifications
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Lost Pet Notification Settings</DialogTitle>
                  </DialogHeader>
                  
                  {!user ? (
                    <div className="py-8 text-center">
                      <BellOff className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Please log in to enable notifications and help find lost pets in your area.
                      </p>
                      <Button onClick={() => navigate("/auth")}>
                        Log In
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6 pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-medium">Enable Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Get notified when pets are lost in your selected cities
                          </p>
                        </div>
                        <Switch
                          checked={notificationsEnabled}
                          onCheckedChange={setNotificationsEnabled}
                        />
                      </div>

                      {notificationsEnabled && (
                        <div className="space-y-4">
                          <CityMultiSelector
                            selectedLocations={selectedCities}
                            onLocationsChange={setSelectedCities}
                            label="Your Cities/Areas"
                            description="Select cities or specific areas where you'd like to help find lost pets"
                          />

                          <div className="bg-primary/10 rounded-lg p-4">
                            <p className="text-sm text-foreground">
                              <strong>Privacy Note:</strong> By enabling notifications and selecting locations, 
                              you'll be able to see contact information for lost pet alerts to help reunite pets with their families.
                            </p>
                          </div>
                        </div>
                      )}

                      <Button 
                        onClick={saveNotificationPreferences} 
                        className="w-full"
                        disabled={isSavingPrefs}
                      >
                        {isSavingPrefs ? "Saving..." : "Save Preferences"}
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Report Lost Pet
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Report a Lost Pet</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateAlert} className="space-y-4 pt-4">
                    {myPets.length > 0 && (
                      <div className="space-y-2">
                        <Label>Select your pet (optional)</Label>
                        <select
                          value={selectedPetId}
                          onChange={(e) => handlePetSelect(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg"
                        >
                          <option value="">-- Manual entry --</option>
                          {myPets.map((pet) => (
                            <option key={pet.id} value={pet.id}>
                              {pet.pet_name} ({pet.pet_breed || "Unknown breed"})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Pet Name *</Label>
                      <Input
                        value={petName}
                        onChange={(e) => setPetName(e.target.value)}
                        placeholder="e.g., Max"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Breed</Label>
                      <Input
                        value={petBreed}
                        onChange={(e) => setPetBreed(e.target.value)}
                        placeholder="e.g., Golden Retriever"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Description *</Label>
                      <Textarea
                        value={petDescription}
                        onChange={(e) => setPetDescription(e.target.value)}
                        placeholder="Color, size, distinguishing features, collar info..."
                        required
                      />
                    </div>

                    <LocationSelector
                      selectedCity={lastSeenCity}
                      selectedArea={lastSeenArea}
                      onCityChange={setLastSeenCity}
                      onAreaChange={setLastSeenArea}
                      showAreaSelector={true}
                      required={true}
                      cityLabel="Last Seen City"
                      areaLabel="Area"
                    />

                    <div className="space-y-2">
                      <Label>Additional Location Details</Label>
                      <Input
                        value={lastSeenDetails}
                        onChange={(e) => setLastSeenDetails(e.target.value)}
                        placeholder="e.g., Near the central park, by the fountain"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Last Seen Date *</Label>
                        <Input
                          type="date"
                          value={lastSeenDate}
                          onChange={(e) => setLastSeenDate(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Time (optional) - 24h format</Label>
                        <Input
                          type="text"
                          placeholder="HH:MM (e.g. 14:30)"
                          value={lastSeenTime}
                          onChange={(e) => {
                            // Allow only valid 24h time format
                            const value = e.target.value;
                            if (value === "" || /^([0-1]?[0-9]|2[0-3])?:?[0-5]?[0-9]?$/.test(value)) {
                              setLastSeenTime(value);
                            }
                          }}
                          onBlur={(e) => {
                            // Format on blur to ensure HH:MM format
                            const value = e.target.value;
                            if (value && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
                              const [hours, mins] = value.split(":");
                              setLastSeenTime(`${hours.padStart(2, "0")}:${mins}`);
                            }
                          }}
                          maxLength={5}
                        />
                      </div>
                    </div>

                    {/* Photo upload - up to 3 photos */}
                    <div className="space-y-2">
                      <Label>Pet Photos * (up to {MAX_PHOTOS} photos - helps others identify your pet)</Label>
                      
                      {/* Photo previews grid */}
                      {petPhotoPreviews.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          {petPhotoPreviews.map((preview, index) => (
                            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                              <img
                                src={preview}
                                alt={`Pet photo ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6"
                                onClick={() => removePhoto(index)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                              {index === 0 && (
                                <span className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                                  Main
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Add more photos button */}
                      {petPhotoPreviews.length < MAX_PHOTOS && (
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                          <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                          <span className="text-sm text-muted-foreground">
                            {petPhotoPreviews.length === 0 
                              ? "Click to upload photos" 
                              : `Add more (${petPhotoPreviews.length}/${MAX_PHOTOS})`}
                          </span>
                          <span className="text-xs text-muted-foreground mt-1">Max 5MB each, JPG/PNG</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handlePhotoSelect}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Contact Phone *</Label>
                        <Input
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="Your phone"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Email</Label>
                        <Input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="Your email"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Reward Offered (optional)</Label>
                      <Input
                        value={rewardOffered}
                        onChange={(e) => setRewardOffered(e.target.value)}
                        placeholder="e.g., €100"
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={isCreating || isUploadingPhoto}>
                      {isUploadingPhoto ? "Uploading photo..." : isCreating ? "Creating..." : "Create Alert"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Notification CTA for non-subscribers */}
          {user && !canSeeContactInfo && (
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-6 mb-6 border border-primary/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bell className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-foreground mb-1">
                    Want to help find lost pets?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Enable notifications and add your cities to see contact information and help reunite pets with their families.
                  </p>
                  <Button size="sm" onClick={() => setShowSettingsDialog(true)}>
                    Enable Notifications
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!user && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 mb-6 border border-amber-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-foreground mb-1">
                    Log in to help find lost pets
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Create an account and enable notifications to see contact information and help reunite pets with their families.
                  </p>
                  <Button size="sm" onClick={() => navigate("/auth")}>
                    Log In or Sign Up
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by pet name, breed, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Active Alerts */}
          <div className="space-y-4 mb-8">
            <h2 className="font-display font-semibold text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Active Alerts
            </h2>

            {activeAlerts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl">
                <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No active alerts at the moment</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="bg-white rounded-2xl shadow-soft border-l-4 border-l-red-500 overflow-hidden"
                  >
                    {/* Pet Photo */}
                    {alert.pet_photo_url && (
                      <div className="w-full h-48 bg-muted">
                        <img
                          src={alert.pet_photo_url}
                          alt={alert.pet_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-display font-semibold text-foreground text-lg">
                            {alert.pet_name}
                          </h3>
                          {alert.pet_breed && (
                            <p className="text-sm text-muted-foreground">{alert.pet_breed}</p>
                          )}
                        </div>
                        {alert.reward_offered && (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            Reward: {alert.reward_offered}
                          </Badge>
                        )}
                      </div>

                      {/* Full description - no truncation */}
                      <p className="text-sm text-foreground mb-4">
                        {alert.pet_description}
                      </p>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>{alert.last_seen_location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>{format(new Date(alert.last_seen_date), "dd/MM/yyyy HH:mm")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span>{formatDistanceToNow(new Date(alert.last_seen_date), { addSuffix: true })}</span>
                        </div>
                      </div>

                      {/* Contact info - only show to users with notifications enabled */}
                      {(canSeeContactInfo || alert.owner_user_id === user?.id) ? (
                        <div className="mt-4 pt-4 border-t space-y-2">
                          {alert.contact_phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-primary" />
                              <a href={`tel:${alert.contact_phone}`} className="text-primary hover:underline font-medium">
                                {alert.contact_phone}
                              </a>
                            </div>
                          )}
                          {alert.contact_email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <a href={`mailto:${alert.contact_email}`} className="text-foreground hover:underline">
                                {alert.contact_email}
                              </a>
                            </div>
                          )}
                          <div className="flex gap-2 pt-2">
                            <a
                              href={`tel:${alert.contact_phone}`}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
                            >
                              <Phone className="w-4 h-4" />
                              Call Now
                            </a>
                            {alert.contact_email && (
                              <a
                                href={`mailto:${alert.contact_email}`}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium"
                              >
                                <Mail className="w-4 h-4" />
                                Email
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 pt-4 border-t">
                          <button
                            onClick={() => user ? setShowSettingsDialog(true) : navigate("/auth")}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-muted text-muted-foreground rounded-lg text-sm"
                          >
                            <Bell className="w-4 h-4" />
                            Enable notifications to see contact info
                          </button>
                        </div>
                      )}

                      {user && alert.owner_user_id === user.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-3 text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => markAsFound(alert.id)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Mark as Found
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recently Found */}
          {foundAlerts.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Recently Reunited 🎉
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {foundAlerts.slice(0, 6).map((alert) => (
                  <div
                    key={alert.id}
                    className="bg-white rounded-2xl p-4 shadow-soft opacity-75 border-l-4 border-l-green-500"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{alert.pet_name}</h3>
                        <p className="text-xs text-muted-foreground">Found & reunited!</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default LostPetAlerts;
