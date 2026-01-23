import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Dog, Cat, ArrowLeft, Cake, Heart, Calendar, Edit2, Save, X, FileText, Trash2, Camera, Loader2, Lock, Clock, Gift, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useMembership } from "@/hooks/useMembership";
import { useAccountType } from "@/hooks/useAccountType";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Breadcrumbs from "@/components/Breadcrumbs";
import DogLoader from "@/components/DogLoader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Header from "@/components/Header";
import { format, differenceInYears, differenceInMonths, differenceInDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { validateImageFile } from "@/lib/fileValidation";

import { PetType, getPetTypeEmoji } from "@/data/petBreeds";

interface BirthdayOffer {
  id: string;
  business_id: string;
  pet_name: string;
  discount_value: number;
  discount_type: string;
  message: string | null;
  sent_at: string;
  redeemed_at: string | null;
  business?: {
    business_name: string;
    logo_url: string | null;
  };
}

interface Pet {
  id: string;
  pet_name: string;
  pet_breed: string | null;
  pet_type: PetType;
  birthday: string | null;
  gender: "male" | "female" | "unknown" | null;
  age_years: number | null;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
  owner_user_id: string;
  membership_id: string;
  birthday_locked: boolean;
}


const PetProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { hasMembership, loading: membershipLoading } = useMembership();
  const { isBusiness, isShelter, loading: accountTypeLoading } = useAccountType();
  const navigate = useNavigate();
  const [pet, setPet] = useState<Pet | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedNotes, setEditedNotes] = useState("");
  const [editedName, setEditedName] = useState("");
  const [editedBreed, setEditedBreed] = useState("");
  const [editedBirthday, setEditedBirthday] = useState("");
  const [editedGender, setEditedGender] = useState<"male" | "female" | "unknown">("unknown");
  const [editedAgeYears, setEditedAgeYears] = useState<number | "">("");
  const [knowsBirthday, setKnowsBirthday] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [canEditBirthday, setCanEditBirthday] = useState(true);
  const [birthdayLockReason, setBirthdayLockReason] = useState<string | null>(null);
  const [birthdayOffers, setBirthdayOffers] = useState<BirthdayOffer[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !accountTypeLoading) {
      if (!user) {
        navigate("/auth?type=member");
      } else if (isBusiness) {
        navigate("/business");
      } else if (isShelter) {
        navigate("/shelter-dashboard");
      } else if (!membershipLoading && !hasMembership) {
        navigate("/member/free");
      }
    }
  }, [user, authLoading, hasMembership, membershipLoading, isBusiness, isShelter, accountTypeLoading, navigate]);

  useEffect(() => {
    const fetchPet = async () => {
      if (!user || !id) return;

      try {
        const { data: petData, error: petError } = await supabase
          .from("pets")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (petError) throw petError;

        if (petData) {
          // Store last viewed pet ID for ordering on dashboard
          localStorage.setItem('lastViewedPetId', petData.id);
          
          const genderValue = (petData.gender === "male" || petData.gender === "female" || petData.gender === "unknown") 
            ? petData.gender 
            : "unknown";
          setPet({
            ...petData,
            gender: genderValue,
            birthday_locked: petData.birthday_locked ?? false,
          } as Pet);
          setEditedNotes(petData.notes || "");
          setEditedName(petData.pet_name);
          setEditedBreed(petData.pet_breed || "");
          setEditedBirthday(petData.birthday || "");
          setEditedGender(genderValue);
          setEditedAgeYears(petData.age_years ?? "");
          setKnowsBirthday(!!petData.birthday || !petData.age_years);

          // Check if birthday can be edited
          const daysSinceCreation = differenceInDays(new Date(), new Date(petData.created_at));
          const isLocked = petData.birthday_locked ?? false;
          
          // Check if any birthday offers have been received and fetch them
          const { data: birthdayOffersData } = await supabase
            .from('sent_birthday_offers')
            .select(`
              id, business_id, pet_name, discount_value, 
              discount_type, message, sent_at, redeemed_at,
              businesses:business_id(business_name, logo_url)
            `)
            .eq('pet_id', petData.id)
            .order('sent_at', { ascending: false });
          
          const hasReceivedOffer = (birthdayOffersData && birthdayOffersData.length > 0);
          
          // Transform offers data
          if (birthdayOffersData) {
            setBirthdayOffers(birthdayOffersData.map((offer: any) => ({
              ...offer,
              business: offer.businesses as { business_name: string; logo_url: string | null } | undefined
            })));
          }
          
          if (isLocked) {
            setCanEditBirthday(false);
            setBirthdayLockReason("Birthday has been locked");
          } else if (hasReceivedOffer) {
            setCanEditBirthday(false);
            setBirthdayLockReason("Birthday cannot be changed after receiving a birthday offer");
          } else if (daysSinceCreation > 14) {
            setCanEditBirthday(false);
            const daysAgo = daysSinceCreation - 14;
            setBirthdayLockReason(`The 14-day edit window has passed (${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago)`);
          } else {
            setCanEditBirthday(true);
            const daysRemaining = 14 - daysSinceCreation;
            setBirthdayLockReason(`${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left to edit birthday`);
          }
        }
      } catch (error) {
        console.error("Error fetching pet:", error);
        toast.error("Failed to load pet profile");
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user && hasMembership) {
      fetchPet();
    }
  }, [user, id, authLoading, hasMembership, membershipLoading]);

  const handleSave = async () => {
    if (!pet) return;
    setIsSaving(true);

    try {
      // If birthday is locked, don't allow birthday changes
      const birthdayChanged = pet.birthday !== (knowsBirthday && editedBirthday ? editedBirthday : null);
      const newBirthday = canEditBirthday && knowsBirthday && editedBirthday ? editedBirthday : pet.birthday;
      const newAgeYears = canEditBirthday && !knowsBirthday && editedAgeYears !== "" ? editedAgeYears : pet.age_years;

      const { error } = await supabase
        .from("pets")
        .update({
          pet_name: editedName.trim(),
          pet_breed: editedBreed.trim() || null,
          birthday: newBirthday,
          gender: editedGender,
          age_years: newAgeYears,
          notes: editedNotes.trim() || null,
        })
        .eq("id", pet.id);

      if (error) {
        // Check if it's a birthday lock error from the database trigger
        if (error.message?.includes('Birthday cannot be changed')) {
          toast.error(error.message);
          return;
        }
        throw error;
      }

      setPet({
        ...pet,
        pet_name: editedName.trim(),
        pet_breed: editedBreed.trim() || null,
        birthday: newBirthday,
        gender: editedGender,
        age_years: newAgeYears,
        notes: editedNotes.trim() || null,
      });
      setIsEditing(false);
      toast.success("Pet profile updated!");
    } catch (error: any) {
      console.error("Error updating pet:", error);
      toast.error(error.message || "Failed to update pet profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (pet) {
      setEditedNotes(pet.notes || "");
      setEditedName(pet.pet_name);
      setEditedBreed(pet.pet_breed || "");
      setEditedBirthday(pet.birthday || "");
      setEditedGender(pet.gender || "unknown");
      setEditedAgeYears(pet.age_years ?? "");
      setKnowsBirthday(!!pet.birthday || !pet.age_years);
    }
    setIsEditing(false);
  };

  const calculateAge = (birthday: string | null, ageYears: number | null) => {
    if (birthday) {
      const birthDate = new Date(birthday);
      const years = differenceInYears(new Date(), birthDate);
      const months = differenceInMonths(new Date(), birthDate) % 12;
      
      if (years === 0) {
        return `${months} month${months !== 1 ? "s" : ""} old`;
      } else if (months === 0) {
        return `${years} year${years !== 1 ? "s" : ""} old`;
      }
      return `${years} year${years !== 1 ? "s" : ""}, ${months} month${months !== 1 ? "s" : ""} old`;
    } else if (ageYears !== null) {
      return `~${ageYears} year${ageYears !== 1 ? "s" : ""} old`;
    }
    return "Unknown";
  };

  const getGenderDisplay = (gender: string | null) => {
    switch (gender) {
      case "male": return { label: "♂ Male", color: "bg-blue-100 text-blue-700" };
      case "female": return { label: "♀ Female", color: "bg-pink-100 text-pink-700" };
      default: return { label: "Unknown", color: "bg-gray-100 text-gray-700" };
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !pet) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploadingPhoto(true);
    try {
      // Delete old photo if exists
      if (pet.photo_url) {
        const oldPath = pet.photo_url.split('/pet-photos/')[1];
        if (oldPath) {
          await supabase.storage.from('pet-photos').remove([oldPath]);
        }
      }

      // Upload new photo
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const filePath = `${user.id}/${pet.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('pet-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pet-photos')
        .getPublicUrl(filePath);

      // Update pet record
      const { error: updateError } = await supabase
        .from('pets')
        .update({ photo_url: publicUrl })
        .eq('id', pet.id);

      if (updateError) throw updateError;

      setPet({ ...pet, photo_url: publicUrl });
      toast.success('Photo updated!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!pet) return;
    setIsDeleting(true);

    try {
      // First delete related health records
      await supabase
        .from("pet_health_records")
        .delete()
        .eq("pet_id", pet.id);

      // Then delete the pet
      const { error } = await supabase
        .from("pets")
        .delete()
        .eq("id", pet.id);

      if (error) throw error;

      toast.success(`${pet.pet_name} has been removed`);
      navigate("/member");
    } catch (error) {
      console.error("Error deleting pet:", error);
      toast.error("Failed to delete pet");
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader size="lg" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-paw-cream to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Dog className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Pet Not Found</h2>
            <p className="text-muted-foreground mb-4">This pet profile doesn't exist or you don't have access to it.</p>
            <Button onClick={() => navigate("/member")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{pet.pet_name}'s Profile | Wooffy</title>
        <meta name="description" content={`View and manage ${pet.pet_name}'s profile and notes.`} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-paw-cream to-background">
        <Header />

        <main className="container mx-auto px-4 py-8 pt-24 max-w-2xl">
          {/* Breadcrumbs */}
          <div className="mb-4">
            <Breadcrumbs
              items={[
                { label: "Dashboard", href: "/member" },
                { label: pet.pet_name },
              ]}
            />
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate("/member")}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          {/* Pet Header Card */}
          <Card className="mb-6 overflow-hidden">
            <div className="bg-gradient-hero p-6 text-white">
              <div className="flex items-center gap-4">
                {/* Pet Photo with Upload */}
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="pet-photo-upload"
                  />
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                    {isUploadingPhoto ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : pet.photo_url ? (
                      <img 
                        src={pet.photo_url} 
                        alt={pet.pet_name}
                        className="w-full h-full object-cover"
                      />
                    ) : pet.pet_type === "cat" ? (
                      <Cat className="w-10 h-10" />
                    ) : (
                      <Dog className="w-10 h-10" />
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-100 transition-colors disabled:opacity-50"
                    title="Upload photo"
                  >
                    <Camera className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
                <div className="flex-1">
                  {isEditing ? (
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="text-2xl font-display font-bold bg-white/20 border-white/30 text-white placeholder:text-white/50 mb-2"
                    />
                  ) : (
                    <h1 className="text-2xl font-display font-bold">{pet.pet_name}</h1>
                  )}
                  {isEditing ? (
                    <Input
                      value={editedBreed}
                      onChange={(e) => setEditedBreed(e.target.value)}
                      placeholder="Breed"
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                    />
                  ) : (
                    <p className="text-white/80">{pet.pet_breed || "Breed not specified"}</p>
                  )}
                </div>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-white/20 hover:bg-white/30 text-white gap-1"
                    >
                      {isSaving ? <DogLoader size="sm" /> : <Save className="w-4 h-4" />}
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleCancel}
                      className="bg-white/20 hover:bg-white/30 text-white gap-1"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => setIsEditing(true)}
                    className="bg-white/20 hover:bg-white/30 text-white"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Info Cards */}
          <div className={`grid gap-3 sm:gap-4 mb-4 ${isEditing || pet.birthday ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {/* Birthday Card - only show if editing OR if pet has a birthday */}
            {(isEditing || pet.birthday) && (
              <Card>
                <CardContent className="pt-3 sm:pt-4 px-3 sm:px-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-pink-100 rounded-full flex items-center justify-center shrink-0">
                      <Cake className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">Birthday</p>
                        {!canEditBirthday && (
                          <Lock className="w-3 h-3 text-muted-foreground" />
                        )}
                      </div>
                      {isEditing ? (
                        canEditBirthday ? (
                          <div className="mt-1 space-y-2">
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => setKnowsBirthday(true)}
                                className={cn(
                                  "text-xs px-2 py-1 rounded",
                                  knowsBirthday ? "bg-primary text-primary-foreground" : "bg-muted"
                                )}
                              >
                                Date
                              </button>
                              <button
                                type="button"
                                onClick={() => setKnowsBirthday(false)}
                                className={cn(
                                  "text-xs px-2 py-1 rounded",
                                  !knowsBirthday ? "bg-primary text-primary-foreground" : "bg-muted"
                                )}
                              >
                                Age
                              </button>
                            </div>
                            {knowsBirthday ? (
                              <Input
                                type="date"
                                value={editedBirthday}
                                onChange={(e) => setEditedBirthday(e.target.value)}
                                className="text-sm h-8"
                                max={new Date().toISOString().split('T')[0]}
                              />
                            ) : (
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  min="0"
                                  max="30"
                                  value={editedAgeYears}
                                  onChange={(e) => setEditedAgeYears(e.target.value ? parseInt(e.target.value) : "")}
                                  className="text-sm h-8 w-16"
                                  placeholder="Age"
                                />
                                <span className="text-xs text-muted-foreground">yrs</span>
                              </div>
                            )}
                            {canEditBirthday && birthdayLockReason && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {birthdayLockReason}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="mt-1">
                            <p className="font-medium text-sm sm:text-base truncate">
                              {pet.birthday 
                                ? format(new Date(pet.birthday), "MMM d, yyyy") 
                                : "Not set"}
                            </p>
                            <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                              <Lock className="w-3 h-3" />
                              {birthdayLockReason}
                            </p>
                          </div>
                        )
                      ) : (
                        <p className="font-medium text-sm sm:text-base truncate">
                          {pet.birthday 
                            ? format(new Date(pet.birthday), "MMM d, yyyy") 
                            : "Not set"}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Age Card */}
            <Card>
              <CardContent className="pt-3 sm:pt-4 px-3 sm:px-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">Age</p>
                    {/* Show age input when editing and user chose age instead of birthday */}
                    {isEditing && !knowsBirthday && !pet.birthday ? (
                      <div className="mt-1 space-y-2">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setKnowsBirthday(true)}
                            className={cn(
                              "text-xs px-2 py-1 rounded",
                              knowsBirthday ? "bg-primary text-primary-foreground" : "bg-muted"
                            )}
                          >
                            Date
                          </button>
                          <button
                            type="button"
                            onClick={() => setKnowsBirthday(false)}
                            className={cn(
                              "text-xs px-2 py-1 rounded",
                              !knowsBirthday ? "bg-primary text-primary-foreground" : "bg-muted"
                            )}
                          >
                            Age
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="0"
                            max="30"
                            value={editedAgeYears}
                            onChange={(e) => setEditedAgeYears(e.target.value ? parseInt(e.target.value) : "")}
                            className="text-sm h-8 w-16"
                            placeholder="Age"
                          />
                          <span className="text-xs text-muted-foreground">yrs</span>
                        </div>
                      </div>
                    ) : (
                      <p className="font-medium text-sm sm:text-base truncate">
                        {isEditing 
                          ? (knowsBirthday 
                              ? (editedBirthday ? calculateAge(editedBirthday, null) : "Set birthday") 
                              : (editedAgeYears !== "" ? `~${editedAgeYears} years old` : "Set age"))
                          : calculateAge(pet.birthday, pet.age_years)
                        }
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gender Card */}
          <Card className="mb-6">
            <CardContent className="pt-3 sm:pt-4 px-3 sm:px-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0",
                  pet.gender === "male" ? "bg-blue-100" : pet.gender === "female" ? "bg-pink-100" : "bg-gray-100"
                )}>
                  <span className="text-lg">
                    {pet.gender === "male" ? "♂" : pet.gender === "female" ? "♀" : "—"}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Gender</p>
                  {isEditing ? (
                    <div className="flex gap-1 mt-1">
                    {[
                      { value: "male" as const, label: "♂ Male" },
                      { value: "female" as const, label: "♀ Female" },
                    ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setEditedGender(option.value)}
                          className={cn(
                            "text-xs px-2 py-1 rounded border transition-all",
                            editedGender === option.value
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted border-border hover:border-primary/50"
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className={cn("font-medium text-sm sm:text-base", getGenderDisplay(pet.gender).color.replace("bg-", "text-").replace("-100", "-700"))}>
                      {getGenderDisplay(pet.gender).label}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium">
                    {format(new Date(pet.created_at), "MMMM d, yyyy")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Birthday Offers Section */}
          {birthdayOffers.length > 0 && (
            <Card className="mb-6 border-2 border-pink-200 bg-gradient-to-r from-pink-50 to-orange-50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Gift className="w-5 h-5 text-pink-500" />
                  Birthday Offers for {pet.pet_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {birthdayOffers.map((offer) => {
                  const isRedeemed = !!offer.redeemed_at;
                  
                  return (
                    <div
                      key={offer.id}
                      className={cn(
                        "p-3 rounded-lg border bg-white",
                        isRedeemed ? "border-green-200 bg-green-50/50" : "border-pink-200"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                          {offer.business?.logo_url ? (
                            <img 
                              src={offer.business.logo_url} 
                              alt={offer.business.business_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Building2 className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">
                              {offer.business?.business_name || "Partner Business"}
                            </p>
                            {isRedeemed ? (
                              <Badge className="bg-green-500 text-white text-xs">Redeemed</Badge>
                            ) : (
                              <Badge className="bg-pink-500 text-white text-xs">Active</Badge>
                            )}
                          </div>
                          {offer.message && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {offer.message}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="font-medium text-pink-600">
                              {offer.discount_type === 'percentage' 
                                ? `${offer.discount_value}% off` 
                                : `€${offer.discount_value} off`}
                            </span>
                            <span>•</span>
                            <span>
                              Sent {format(new Date(offer.sent_at), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                      </div>
                      {!isRedeemed && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-3 border-pink-300 text-pink-600 hover:bg-pink-50"
                          onClick={() => navigate(`/business/${offer.business_id}`)}
                        >
                          Visit Business to Redeem
                        </Button>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions - Health Records */}
          <div className="mb-6">
            <Button
              variant="default"
              size="lg"
              onClick={() => navigate(`/member/health-records?pet=${pet.id}`)}
              className="w-full h-auto py-3 sm:py-4 flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="font-semibold text-sm sm:text-base">Health Records & Reminders</span>
            </Button>
          </div>

          {/* Notes Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-primary" />
                  Notes
                </span>
                {!isEditing && !isEditingNotes && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingNotes(true)}
                    className="gap-1 text-primary hover:text-primary/80"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing || isEditingNotes ? (
                <div className="space-y-4">
                  <Textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    placeholder="Add notes about your pet... (medical info, preferences, quirks, etc.)"
                    className="min-h-[150px]"
                    autoFocus={isEditingNotes}
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={async () => {
                        if (!pet) return;
                        setIsSaving(true);
                        try {
                          const { error } = await supabase
                            .from("pets")
                            .update({ notes: editedNotes.trim() || null })
                            .eq("id", pet.id);
                          if (error) throw error;
                          setPet({ ...pet, notes: editedNotes.trim() || null });
                          setIsEditingNotes(false);
                          setIsEditing(false);
                          toast.success("Notes saved!");
                        } catch (error) {
                          console.error("Error saving notes:", error);
                          toast.error("Failed to save notes");
                        } finally {
                          setIsSaving(false);
                        }
                      }} 
                      disabled={isSaving} 
                      className="gap-2"
                    >
                      {isSaving ? <DogLoader size="sm" /> : <Save className="w-4 h-4" />}
                      Save Notes
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setEditedNotes(pet?.notes || "");
                        setIsEditingNotes(false);
                      }} 
                      className="gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  {pet.notes ? (
                    <p className="whitespace-pre-wrap text-foreground">{pet.notes}</p>
                  ) : (
                    <button
                      onClick={() => setIsEditingNotes(true)}
                      className="text-muted-foreground italic hover:text-primary cursor-pointer transition-colors"
                    >
                      No notes yet. Click here to add notes about {pet.pet_name}.
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delete Pet Section */}
          <div className="mt-8 pt-6 border-t border-destructive/20">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive gap-2"
                  disabled={isDeleting}
                >
                  {isDeleting ? <DogLoader size="sm" /> : <Trash2 className="w-4 h-4" />}
                  Remove {pet.pet_name} from your account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove {pet.pet_name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {pet.pet_name}'s profile and all associated health records. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, remove {pet.pet_name}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </main>
      </div>
    </>
  );
};

export default PetProfile;
