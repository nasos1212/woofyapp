import { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertTriangle, MapPin, Clock, Phone, Mail, Plus, Search, CheckCircle2, Bell, BellOff, ArrowLeft, Upload, X, Calendar, Dog, Cat, HelpCircle, Heart, Eye, ChevronUp, ChevronDown, Filter, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useAccountType } from "@/hooks/useAccountType";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import DogLoader from "@/components/DogLoader";
import LocationSelector from "@/components/LocationSelector";
import CityMultiSelector from "@/components/CityMultiSelector";
import AlertPhotoCarousel from "@/components/AlertPhotoCarousel";
import { formatLocation, cyprusCitiesWithCoords } from "@/data/cyprusLocations";
import { format } from "date-fns";
import { formatRelative } from "@/lib/relativeTime";
import EditAlertDialog from "@/components/EditAlertDialog";
import { getBreedsByPetType } from "@/data/petBreeds";
import { useTranslation } from "react-i18next";
import { getCityDisplayName } from "@/lib/cityDisplay";

type AlertType = "lost" | "found";
type PetType = "dog" | "cat" | "other";

interface LostFoundAlert {
  id: string;
  pet_name: string;
  pet_description: string;
  pet_breed: string | null;
  pet_photo_url: string | null;
  pet_type: PetType;
  alert_type: AlertType;
  last_seen_location: string;
  last_seen_date: string;
  contact_phone: string | null;
  contact_email: string | null;
  reward_offered: string | null;
  microchip_status: string | null;
  status: "active" | "found" | "resolved";
  created_at: string;
  owner_user_id: string;
}

interface Pet {
  id: string;
  pet_name: string;
  pet_breed: string | null;
  pet_type: string;
}

interface NotificationPreferences {
  id: string;
  user_id: string;
  enabled: boolean;
  cities: string[];
}

const LostFoundAlerts = () => {
  const { user, loading } = useAuth();
  const { isBusiness, loading: accountTypeLoading } = useAccountType();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Redirect business users
  useEffect(() => {
    if (!loading && !accountTypeLoading && isBusiness) {
      navigate("/business");
    }
  }, [loading, accountTypeLoading, isBusiness, navigate]);

  const [alerts, setAlerts] = useState<LostFoundAlert[]>([]);
  const [myPets, setMyPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterBreed, setFilterBreed] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [editingAlert, setEditingAlert] = useState<LostFoundAlert | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: "lost" | "found" | "reunited" = 
    tabParam === "found" || tabParam === "reunited" ? tabParam : "lost";

  const setActiveTab = (tab: "lost" | "found" | "reunited") => {
    setSearchParams(tab === "lost" ? {} : { tab }, { replace: true });
  };

  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  // Form state
  const [alertType, setAlertType] = useState<AlertType>("lost");
  const [petType, setPetType] = useState<PetType>("dog");
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
  const [microchipStatus, setMicrochipStatus] = useState<string>("unknown");
  const [petPhotos, setPetPhotos] = useState<File[]>([]);
  const [petPhotoPreviews, setPetPhotoPreviews] = useState<string[]>([]);
  const [photoPositions, setPhotoPositions] = useState<number[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);
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
      const { data, error } = await supabase
        .from("lost_pet_alerts_public")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAlerts((data || []) as LostFoundAlert[]);
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
        .select("id, pet_name, pet_breed, pet_type")
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
        const { error } = await supabase
          .from("lost_pet_notification_preferences")
          .update({
            enabled: notificationsEnabled,
            cities: selectedCities,
          })
          .eq("id", notificationPrefs.id);

        if (error) throw error;
      } else {
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

      toast.success(t("lostFound.toasts.prefsSaved"));
      setShowSettingsDialog(false);
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error(t("lostFound.toasts.prefsError"));
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
      setPetType((pet.pet_type as PetType) || "dog");
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    for (let i = 0; i < files.length; i++) {
      if (petPhotos.length + newFiles.length >= MAX_PHOTOS) {
        toast.error(t("lostFound.toasts.maxPhotos", { max: MAX_PHOTOS }));
        break;
      }

      const file = files[i];

      if (!file.type.startsWith("image/")) {
        toast.error(t("lostFound.toasts.imagesOnly"));
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t("lostFound.toasts.tooLarge", { name: file.name }));
        continue;
      }

      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setPetPhotos((prev) => [...prev, ...newFiles]);
    setPetPhotoPreviews((prev) => [...prev, ...newPreviews]);
    setPhotoPositions((prev) => [...prev, ...newFiles.map(() => 50)]);
    e.target.value = "";
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(petPhotoPreviews[index]);
    setPetPhotos((prev) => prev.filter((_, i) => i !== index));
    setPetPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
    setPhotoPositions((prev) => prev.filter((_, i) => i !== index));
    if (editingPhotoIndex === index) {
      setEditingPhotoIndex(null);
    }
  };

  const clearAllPhotos = () => {
    petPhotoPreviews.forEach((preview) => URL.revokeObjectURL(preview));
    setPetPhotos([]);
    setPetPhotoPreviews([]);
    setPhotoPositions([]);
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error(t("lostFound.toasts.loginToCreate"));
      return;
    }

    // For lost pets, name is required. For found pets, description is the key field
    if (alertType === "lost" && !petName) {
      toast.error(t("lostFound.toasts.needsName"));
      return;
    }

    if (!petDescription || !lastSeenCity || !lastSeenDate || !contactPhone) {
      toast.error(t("lostFound.toasts.needsFields"));
      return;
    }

    if (petPhotos.length === 0) {
      toast.error(t("lostFound.toasts.needsPhoto"));
      return;
    }

    const locationParts = [formatLocation(lastSeenCity, lastSeenArea === "all-areas" ? "" : lastSeenArea)];
    if (lastSeenDetails.trim()) {
      locationParts.push(lastSeenDetails.trim());
    }
    const lastSeenLocation = locationParts.join(" - ");

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const lastSeenDateTime = new Date(`${lastSeenDate}T${hours}:${minutes}:00`);

    setIsCreating(true);
    try {
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

      const mainPhotoUrl = uploadedPhotoUrls[0];

      // For found pets without a name, use a descriptive name
      const finalPetName = petName || `Found ${petType === "dog" ? "Dog" : petType === "cat" ? "Cat" : "Pet"}`;

      const { data: alertData, error } = await supabase.from("lost_pet_alerts").insert({
        owner_user_id: user.id,
        pet_id: selectedPetId || null,
        pet_name: finalPetName,
        pet_description: petDescription,
        pet_breed: petBreed || null,
        pet_type: petType,
        alert_type: alertType,
        pet_photo_url: mainPhotoUrl,
        last_seen_location: lastSeenLocation,
        last_seen_date: lastSeenDateTime.toISOString(),
        contact_phone: contactPhone,
        contact_email: contactEmail || null,
        reward_offered: alertType === "lost" ? rewardOffered || null : null,
        microchip_status: microchipStatus,
        status: "active",
      }).select("id").single();

      if (error) throw error;

      if (alertData && uploadedPhotoUrls.length > 0) {
        const photoInserts = uploadedPhotoUrls.map((url, index) => ({
          alert_id: alertData.id,
          photo_url: url,
          display_order: index,
          photo_position: photoPositions[index] ?? 50,
        }));

        await supabase.from("lost_pet_alert_photos").insert(photoInserts);
      }

      toast.success(
        alertType === "lost"
          ? t("lostFound.toasts.createdLost")
          : t("lostFound.toasts.createdFound")
      );
      setShowCreateDialog(false);
      resetForm();
      fetchAlerts();
    } catch (error) {
      console.error("Error creating alert:", error);
      toast.error(t("lostFound.toasts.createFailed"));
    } finally {
      setIsCreating(false);
      setIsUploadingPhoto(false);
    }
  };

  const resetForm = () => {
    setAlertType("lost");
    setPetType("dog");
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
    setMicrochipStatus("unknown");
    setEditingPhotoIndex(null);
    clearAllPhotos();
  };

  const markAsResolved = async (alertId: string, alertType: AlertType) => {
    try {
      const { error } = await supabase
        .from("lost_pet_alerts")
        .update({ status: "resolved", resolved_at: new Date().toISOString() })
        .eq("id", alertId);

      if (error) throw error;
      toast.success(
        alertType === "lost"
          ? t("lostFound.toasts.resolvedLost")
          : t("lostFound.toasts.resolvedFound")
      );
      fetchAlerts();
    } catch (error) {
      console.error("Error updating alert:", error);
      toast.error(t("lostFound.toasts.updateFailed"));
    }
  };

  const canSeeContactInfo = user && notificationPrefs?.enabled && (notificationPrefs?.cities?.length || 0) > 0;

  // Extract unique breeds from alerts for filter
  const uniqueBreeds = [...new Set(alerts.map(a => a.pet_breed).filter(Boolean) as string[])].sort();

  // Known city names for filter
  const cityNames = cyprusCitiesWithCoords.map(c => c.name);

  const filteredAlerts = alerts.filter((alert) => {
    const matchesCity =
      filterCity === "all" ||
      alert.last_seen_location.toLowerCase().includes(filterCity.toLowerCase());

    const matchesBreed =
      filterBreed === "all" ||
      alert.pet_breed?.toLowerCase() === filterBreed.toLowerCase();

    return matchesCity && matchesBreed;
  });

  const lostAlerts = filteredAlerts.filter((a) => a.alert_type === "lost" && a.status === "active");
  const foundAlerts = filteredAlerts.filter((a) => a.alert_type === "found" && a.status === "active");
  const reunitedAlerts = filteredAlerts.filter((a) => a.status === "found" || a.status === "resolved");

  const getPetTypeIcon = (type: PetType) => {
    switch (type) {
      case "dog":
        return <Dog className="w-4 h-4" />;
      case "cat":
        return <Cat className="w-4 h-4" />;
      default:
        return <HelpCircle className="w-4 h-4" />;
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader size="lg" />
      </div>
    );
  }

  const renderAlertCard = (alert: LostFoundAlert) => {
    const isLost = alert.alert_type === "lost";
    const borderColor = isLost ? "border-l-red-500" : "border-l-blue-500";
    const statusBadgeColor = isLost ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700";

    return (
      <div
        key={alert.id}
        className={`bg-white rounded-2xl shadow-soft border-l-4 ${borderColor} overflow-hidden`}
      >
        <AlertPhotoCarousel
          alertId={alert.id}
          mainPhotoUrl={alert.pet_photo_url}
          petName={alert.pet_name}
          badge={{
            text: isLost ? t("lostFound.card.lost") : t("lostFound.card.found"),
            className: statusBadgeColor
          }}
        />

        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                {getPetTypeIcon(alert.pet_type || "dog")}
                <h3 className="font-display font-semibold text-foreground text-lg">
                  {alert.pet_name}
                </h3>
              </div>
              {alert.pet_breed && (
                <p className="text-sm text-muted-foreground">{alert.pet_breed}</p>
              )}
              {alert.microchip_status && alert.microchip_status !== "unknown" && (
                <Badge variant="outline" className={alert.microchip_status === "yes" ? "text-green-700 border-green-200 bg-green-50" : "text-muted-foreground"}>
                  {t("lostFound.card.microchipLabel")} {alert.microchip_status === "yes" ? t("lostFound.card.microchipYes") : t("lostFound.card.microchipNo")}
                </Badge>
              )}
            </div>
            {isLost && alert.reward_offered && (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                {t("lostFound.card.rewardLabel")} {alert.reward_offered}
              </Badge>
            )}
          </div>

          <p className="text-sm text-foreground mb-4">{alert.pet_description}</p>

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
              <span>{formatRelative(alert.last_seen_date)}</span>
            </div>
          </div>

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
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <a href={`mailto:${alert.contact_email}`} className="text-primary hover:underline font-medium truncate">
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
                  {t("lostFound.card.callNow")}
                </a>
                {alert.contact_email && (
                  <a
                    href={`mailto:${alert.contact_email}`}
                    className="flex items-center justify-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                )}
              </div>
              {alert.owner_user_id === user?.id && alert.status === "active" && (
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => {
                      setEditingAlert(alert);
                      setShowEditDialog(true);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                    {t("lostFound.card.edit")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-green-600 border-green-200 hover:bg-green-50 gap-2"
                    onClick={() => markAsResolved(alert.id, alert.alert_type)}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isLost ? t("lostFound.card.markAsFound") : t("lostFound.card.markAsReunited")}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground text-center">
                {t("lostFound.card.enableToSeeContact")}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>{t("lostFound.pageTitle")}</title>
        <meta name="description" content={t("lostFound.metaDescription")} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-wooffy-soft to-background overflow-x-hidden">
        <Header />

        <main className="w-full max-w-7xl mx-auto px-4 py-8 pt-[calc(6rem+env(safe-area-inset-top))] box-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/member")}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("lostFound.backToDashboard")}
          </Button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                {t("lostFound.title")}
              </h1>
              <p className="text-muted-foreground">
                {t("lostFound.subtitleCounts", { lost: lostAlerts.length, found: foundAlerts.length })}
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    {notificationPrefs?.enabled ? (
                      <Bell className="w-4 h-4 text-primary" />
                    ) : (
                      <BellOff className="w-4 h-4" />
                    )}
                    {t("lostFound.notifications")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t("lostFound.settingsDialog.title")}</DialogTitle>
                  </DialogHeader>

                  {!user ? (
                    <div className="py-8 text-center">
                      <BellOff className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        {t("lostFound.settingsDialog.loginPrompt")}
                      </p>
                      <Button onClick={() => navigate("/auth")}>{t("lostFound.settingsDialog.logIn")}</Button>
                    </div>
                  ) : (
                    <div className="space-y-6 pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-medium">{t("lostFound.settingsDialog.enableLabel")}</Label>
                          <p className="text-sm text-muted-foreground">
                            {t("lostFound.settingsDialog.enableDesc")}
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
                            label={t("lostFound.settingsDialog.citiesLabel")}
                            description={t("lostFound.settingsDialog.citiesDesc")}
                          />

                          <div className="bg-primary/10 rounded-lg p-4">
                            <p className="text-sm text-foreground">
                              {t("lostFound.settingsDialog.infoBox")}
                            </p>
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={saveNotificationPreferences}
                        className="w-full"
                        disabled={isSavingPrefs}
                      >
                        {isSavingPrefs ? t("lostFound.settingsDialog.saving") : t("lostFound.settingsDialog.save")}
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    {t("lostFound.reportPet")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t("lostFound.form.title")}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateAlert} className="space-y-4 pt-4">
                    {/* Alert Type Selection */}
                    <div className="space-y-2">
                      <Label>{t("lostFound.form.whatReporting")}</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant={alertType === "lost" ? "default" : "outline"}
                          className={`h-auto py-4 flex flex-col gap-1 ${alertType === "lost" ? "bg-red-500 hover:bg-red-600" : ""}`}
                          onClick={() => setAlertType("lost")}
                        >
                          <AlertTriangle className="w-5 h-5" />
                          <span>{t("lostFound.form.lostPet")}</span>
                          <span className="text-xs opacity-75">{t("lostFound.form.lostPetDesc")}</span>
                        </Button>
                        <Button
                          type="button"
                          variant={alertType === "found" ? "default" : "outline"}
                          className={`h-auto py-4 flex flex-col gap-1 ${alertType === "found" ? "bg-blue-500 hover:bg-blue-600" : ""}`}
                          onClick={() => setAlertType("found")}
                        >
                          <Eye className="w-5 h-5" />
                          <span>{t("lostFound.form.foundPet")}</span>
                          <span className="text-xs opacity-75">{t("lostFound.form.foundPetDesc")}</span>
                        </Button>
                      </div>
                    </div>

                    {/* Pet Type Selection */}
                    <div className="space-y-2">
                      <Label>{t("lostFound.form.petTypeLabel")}</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={petType === "dog" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPetType("dog")}
                          className="gap-1"
                        >
                          <Dog className="w-4 h-4" /> {t("lostFound.form.dog")}
                        </Button>
                        <Button
                          type="button"
                          variant={petType === "cat" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPetType("cat")}
                          className="gap-1"
                        >
                          <Cat className="w-4 h-4" /> {t("lostFound.form.cat")}
                        </Button>
                        <Button
                          type="button"
                          variant={petType === "other" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPetType("other")}
                          className="gap-1"
                        >
                          <HelpCircle className="w-4 h-4" /> {t("lostFound.form.other")}
                        </Button>
                      </div>
                    </div>

                    {/* For Lost pets - select from my pets */}
                    {alertType === "lost" && myPets.length > 0 && (
                      <div className="space-y-2">
                        <Label>{t("lostFound.form.selectPetOptional")}</Label>
                        <select
                          value={selectedPetId}
                          onChange={(e) => handlePetSelect(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg bg-background"
                        >
                          <option value="">{t("lostFound.form.manualEntry")}</option>
                          {myPets.map((pet) => (
                            <option key={pet.id} value={pet.id}>
                              {pet.pet_name} ({pet.pet_breed || t("lostFound.form.unknownBreed")})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>
                        {alertType === "lost" ? t("lostFound.form.petNameLost") : t("lostFound.form.petNameFound")}
                      </Label>
                      <Input
                        value={petName}
                        onChange={(e) => setPetName(e.target.value)}
                        placeholder={alertType === "lost" ? t("lostFound.form.petNamePlaceholderLost") : t("lostFound.form.petNamePlaceholderFound")}
                        required={alertType === "lost"}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t("lostFound.form.breedLabel")}</Label>
                      <Select value={petBreed || "_none"} onValueChange={(v) => setPetBreed(v === "_none" ? "" : v)}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("lostFound.form.breedPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-[40vh]">
                          <SelectItem value="_none">{t("lostFound.form.breedUnknown")}</SelectItem>
                          {getBreedsByPetType(petType === "other" ? "dog" : petType).map((breed) => (
                            <SelectItem key={breed} value={breed}>{breed}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("lostFound.form.descriptionLabel")}</Label>
                      <Textarea
                        value={petDescription}
                        onChange={(e) => setPetDescription(e.target.value)}
                        placeholder={
                          alertType === "lost"
                            ? t("lostFound.form.descriptionPlaceholderLost")
                            : t("lostFound.form.descriptionPlaceholderFound")
                        }
                        required
                      />
                    </div>

                    {/* Microchip Status */}
                    <div className="space-y-2">
                      <Label>{t("lostFound.form.microchipLabel")}</Label>
                      <RadioGroup value={microchipStatus} onValueChange={setMicrochipStatus} className="flex gap-4">
                        <div className="flex items-center gap-1.5">
                          <RadioGroupItem value="unknown" id="chip-unknown" />
                          <Label htmlFor="chip-unknown" className="font-normal cursor-pointer">{t("lostFound.form.microchipUnknown")}</Label>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <RadioGroupItem value="yes" id="chip-yes" />
                          <Label htmlFor="chip-yes" className="font-normal cursor-pointer">{t("lostFound.form.microchipYes")}</Label>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <RadioGroupItem value="no" id="chip-no" />
                          <Label htmlFor="chip-no" className="font-normal cursor-pointer">{t("lostFound.form.microchipNo")}</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <LocationSelector
                      selectedCity={lastSeenCity}
                      selectedArea={lastSeenArea}
                      onCityChange={setLastSeenCity}
                      onAreaChange={setLastSeenArea}
                      showAreaSelector={true}
                      required={true}
                      cityLabel={alertType === "lost" ? t("lostFound.form.lastSeenCity") : t("lostFound.form.foundCity")}
                      areaLabel={t("lostFound.form.areaLabel")}
                    />

                    <div className="space-y-2">
                      <Label>{t("lostFound.form.additionalLocation")}</Label>
                      <Input
                        value={lastSeenDetails}
                        onChange={(e) => setLastSeenDetails(e.target.value)}
                        placeholder={t("lostFound.form.additionalLocationPlaceholder")}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{alertType === "lost" ? t("lostFound.form.lastSeenDate") : t("lostFound.form.dateFound")}</Label>
                        <Input
                          type="date"
                          value={lastSeenDate}
                          onChange={(e) => {
                            const selectedDate = e.target.value;
                            const today = new Date().toISOString().split('T')[0];
                            // Prevent future dates
                            if (selectedDate > today) {
                              toast.error(t("lostFound.toasts.futureDate"));
                              return;
                            }
                            setLastSeenDate(selectedDate);
                          }}
                          max={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Photos * (up to {MAX_PHOTOS})</Label>

                      {petPhotoPreviews.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mb-2">
                          {petPhotoPreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                              {/* Square photo frame */}
                              <div 
                                className="relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 border-border shadow-sm hover:shadow-md transition-shadow bg-muted"
                                onClick={() => setEditingPhotoIndex(editingPhotoIndex === index ? null : index)}
                              >
                                <img
                                  src={preview}
                                  alt={`Photo ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  style={{ objectPosition: `center ${photoPositions[index] ?? 50}%` }}
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-1.5 right-1.5 h-6 w-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removePhoto(index);
                                  }}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                                {index === 0 && (
                                  <span className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] font-medium px-1.5 py-0.5 rounded-md shadow">
                                    Main
                                  </span>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {editingPhotoIndex === index ? "Close" : "Adjust"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Position adjuster - shown below the grid when editing */}
                      {editingPhotoIndex !== null && petPhotoPreviews[editingPhotoIndex] && (
                        <div className="p-4 bg-muted/50 border rounded-xl mb-2">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-primary flex-shrink-0">
                              <img
                                src={petPhotoPreviews[editingPhotoIndex]}
                                alt="Editing"
                                className="w-full h-full object-cover"
                                style={{ objectPosition: `center ${photoPositions[editingPhotoIndex] ?? 50}%` }}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <Label className="text-sm font-medium">Adjust Photo {editingPhotoIndex + 1}</Label>
                                <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded">{photoPositions[editingPhotoIndex]}%</span>
                              </div>
                              <p className="text-xs text-muted-foreground">Slide to adjust which part of the photo is visible</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setPhotoPositions((prev) => {
                                  const newPositions = [...prev];
                                  newPositions[editingPhotoIndex] = Math.max(0, (newPositions[editingPhotoIndex] ?? 50) - 10);
                                  return newPositions;
                                });
                              }}
                            >
                              <ChevronUp className="w-4 h-4" />
                            </Button>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={photoPositions[editingPhotoIndex] ?? 50}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                setPhotoPositions((prev) => {
                                  const newPositions = [...prev];
                                  newPositions[editingPhotoIndex] = value;
                                  return newPositions;
                                });
                              }}
                              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setPhotoPositions((prev) => {
                                  const newPositions = [...prev];
                                  newPositions[editingPhotoIndex] = Math.min(100, (newPositions[editingPhotoIndex] ?? 50) + 10);
                                  return newPositions;
                                });
                              }}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full mt-3 text-muted-foreground"
                            onClick={() => setEditingPhotoIndex(null)}
                          >
                            Done adjusting
                          </Button>
                        </div>
                      )}

                      {petPhotoPreviews.length < MAX_PHOTOS && (
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                          <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                          <span className="text-sm text-muted-foreground">
                            {petPhotoPreviews.length === 0
                              ? "Click to upload photos"
                              : `Add more (${petPhotoPreviews.length}/${MAX_PHOTOS})`}
                          </span>
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

                    {alertType === "lost" && (
                      <div className="space-y-2">
                        <Label>Reward Offered (optional)</Label>
                        <Input
                          value={rewardOffered}
                          onChange={(e) => setRewardOffered(e.target.value)}
                          placeholder="e.g., €100"
                        />
                      </div>
                    )}

                    <Button type="submit" className="w-full" disabled={isCreating || isUploadingPhoto}>
                      {isUploadingPhoto
                        ? "Uploading photos..."
                        : isCreating
                        ? "Creating..."
                        : alertType === "lost"
                        ? "Create Lost Pet Alert"
                        : "Report Found Pet"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Notification CTA */}
          {user && !canSeeContactInfo && (
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-6 mb-6 border border-primary/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bell className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-foreground mb-1">
                    Want to help find and reunite pets?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Enable notifications and add your cities to see contact information.
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
                    Log in to help pets in Cyprus
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Create an account to report lost or found pets and help reunite them with families.
                  </p>
                  <Button size="sm" onClick={() => navigate("/auth")}>
                    Log In or Sign Up
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-3">
              <Select value={filterCity} onValueChange={setFilterCity}>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="All Cities" />
                  </div>
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[40vh]">
                  <SelectItem value="all">All Cities</SelectItem>
                  {cityNames.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterBreed} onValueChange={setFilterBreed}>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="All Breeds" />
                  </div>
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[40vh]">
                  <SelectItem value="all">All Breeds</SelectItem>
                  {uniqueBreeds.map((breed) => (
                    <SelectItem key={breed} value={breed}>{breed}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(filterCity !== "all" || filterBreed !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setFilterCity("all"); setFilterBreed("all"); }}
                  className="text-muted-foreground"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear filters
                </Button>
              )}
            </div>
          </div>

          {/* Tabs for Lost / Found / Reunited */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="lost" className="gap-2">
                <AlertTriangle className="w-4 h-4" />
                Lost ({lostAlerts.length})
              </TabsTrigger>
              <TabsTrigger value="found" className="gap-2">
                <Eye className="w-4 h-4" />
                Found ({foundAlerts.length})
              </TabsTrigger>
              <TabsTrigger value="reunited" className="gap-2">
                <Heart className="w-4 h-4" />
                Reunited ({reunitedAlerts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lost">
              {lostAlerts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl">
                  <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active lost pet alerts</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lostAlerts.map(renderAlertCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="found">
              {foundAlerts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl">
                  <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active found pet reports</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Found an abandoned pet? Click "Report Pet" to help find its owner!
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {foundAlerts.map(renderAlertCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="reunited">
              {reunitedAlerts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl">
                  <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No reunited pets yet</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reunitedAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="bg-white rounded-2xl shadow-soft border-l-4 border-l-green-500 overflow-hidden opacity-75"
                    >
                      <AlertPhotoCarousel
                        alertId={alert.id}
                        mainPhotoUrl={alert.pet_photo_url}
                        petName={alert.pet_name}
                        badge={{
                          text: "Reunited",
                          className: "bg-green-100 text-green-700"
                        }}
                      />
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          {getPetTypeIcon(alert.pet_type || "dog")}
                          <h3 className="font-display font-semibold text-foreground">
                            {alert.pet_name}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {alert.last_seen_location}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {alert.alert_type === "lost" ? "Found!" : "Owner Found!"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <EditAlertDialog
        alert={editingAlert}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSaved={fetchAlerts}
      />
    </>
  );
};

export default LostFoundAlerts;
