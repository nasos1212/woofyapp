import { useState, useEffect, useRef } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Dog, Cat, Check, ArrowRight, ArrowLeft, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChevronsUpDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMembership } from "@/hooks/useMembership";
import { useAccountType } from "@/hooks/useAccountType";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getBreedsByPetType, PetType, getPetTypeEmoji } from "@/data/petBreeds";
import DogLoader from "@/components/DogLoader";
import Header from "@/components/Header";
import { validateImageFile } from "@/lib/fileValidation";

const AddPet = () => {
  const { user, loading } = useAuth();
  const { hasMembership, loading: membershipLoading } = useMembership();
  const { isBusiness, loading: accountTypeLoading } = useAccountType();
  const navigate = useNavigate();
  const [petType, setPetType] = useState<PetType>("dog");
  const [petName, setPetName] = useState("");
  const [petBreed, setPetBreed] = useState("");
  const [petGender, setPetGender] = useState<"male" | "female" | "unknown">("unknown");
  const [petBirthday, setPetBirthday] = useState("");
  const [petAgeYears, setPetAgeYears] = useState<number | "">("");
  const [knowsBirthday, setKnowsBirthday] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [membership, setMembership] = useState<{ id: string; max_pets: number } | null>(null);
  const [currentPetCount, setCurrentPetCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [breedPopoverOpen, setBreedPopoverOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get breeds based on selected pet type
  const breeds = getBreedsByPetType(petType);

  // Reset breed when pet type changes
  useEffect(() => {
    setPetBreed("");
  }, [petType]);

  useEffect(() => {
    // Redirect business users
    if (!loading && !accountTypeLoading && isBusiness) {
      navigate("/business");
      return;
    }

    const checkMembership = async () => {
      if (!user) return;

      try {
        // Get membership
        const { data: membershipData } = await supabase
          .from("memberships")
          .select("id, max_pets")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!membershipData) {
          toast.error("No membership found");
          navigate("/member");
          return;
        }

        setMembership(membershipData);

        // Get current pet count
        const { count } = await supabase
          .from("pets")
          .select("*", { count: "exact", head: true })
          .eq("membership_id", membershipData.id);

        setCurrentPetCount(count || 0);

        // Check if at max pets
        if ((count || 0) >= membershipData.max_pets) {
          if (membershipData.max_pets >= 5) {
            toast.error("You've reached the maximum of 5 pets allowed.");
          } else {
            toast.error("You've reached your pet limit. Upgrade your plan to add more pets!");
          }
          navigate("/member");
          return;
        }
      } catch (error) {
        console.error("Error checking membership:", error);
        toast.error("Something went wrong");
        navigate("/member");
      } finally {
        setIsLoading(false);
      }
    };

    if (!loading && !accountTypeLoading && !isBusiness) {
      checkMembership();
    }
  }, [user, loading, accountTypeLoading, isBusiness, navigate]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadPhoto = async (petId: string): Promise<string | null> => {
    if (!photoFile || !user) return null;

    const fileExt = photoFile.name.split(".").pop();
    const filePath = `${user.id}/${petId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("pet-photos")
      .upload(filePath, photoFile, { upsert: true });

    if (uploadError) {
      console.error("Photo upload error:", uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("pet-photos")
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !membership) return;

    if (!petName.trim()) {
      toast.error("Please enter a pet name");
      return;
    }

    setIsSubmitting(true);

    try {
      // First create the pet
      const { data: newPet, error } = await supabase.from("pets").insert({
        membership_id: membership.id,
        owner_user_id: user.id,
        pet_name: petName.trim(),
        pet_breed: petBreed.trim() || null,
        pet_type: petType,
        gender: petGender,
        birthday: knowsBirthday && petBirthday ? petBirthday : null,
        age_years: !knowsBirthday && petAgeYears !== "" ? petAgeYears : null,
      }).select("id").single();

      if (error) throw error;

      // Upload photo if selected
      if (photoFile && newPet) {
        setIsUploadingPhoto(true);
        const photoUrl = await uploadPhoto(newPet.id);
        
        if (photoUrl) {
          await supabase
            .from("pets")
            .update({ photo_url: photoUrl })
            .eq("id", newPet.id);
        }
        setIsUploadingPhoto(false);
      }

      toast.success(`${petName} has been added! 🐾`);
      navigate("/member");
    } catch (error: any) {
      console.error("Error adding pet:", error);
      toast.error(error.message || "Failed to add pet");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || isLoading || membershipLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasMembership) {
    return <Navigate to="/member/free" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Add a Pet | Wooffy</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-paw-cream via-background to-paw-cream/50">
        <Header />
        <div className="container max-w-xl mx-auto px-4 py-8 pt-24">
          <Button variant="ghost" onClick={() => navigate("/member")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              {petType === "dog" ? (
                <Dog className="w-8 h-8 text-primary" />
              ) : (
                <Cat className="w-8 h-8 text-primary" />
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-2">
              Add a New Pet
            </h1>
            <p className="text-muted-foreground">
              {membership && `You can add ${membership.max_pets - currentPetCount} more pet${membership.max_pets - currentPetCount !== 1 ? 's' : ''}`}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="text-2xl">{getPetTypeEmoji(petType)}</span>
                Pet Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Photo */}
                <div className="space-y-2">
                  <Label>Profile Photo (optional)</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div 
                        className={cn(
                          "w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition-all hover:border-primary",
                          photoPreview ? "border-solid border-primary" : "border-border"
                        )}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {photoPreview ? (
                          <img src={photoPreview} alt="Pet preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center">
                            <Camera className="w-8 h-8 text-muted-foreground mx-auto" />
                            <span className="text-xs text-muted-foreground">Add photo</span>
                          </div>
                        )}
                      </div>
                      {photoPreview && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removePhoto();
                          }}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Click to upload a photo of your pet</p>
                      <p className="text-xs">JPG, PNG or WebP. Max 5MB.</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Pet Type Selection */}
                <div className="space-y-2">
                  <Label>Pet Type</Label>
                  <div className="flex gap-2">
                    {[
                      { value: "dog" as PetType, label: "🐕 Dog", icon: Dog },
                      { value: "cat" as PetType, label: "🐱 Cat", icon: Cat },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPetType(option.value)}
                        className={cn(
                          "flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all text-sm flex items-center justify-center gap-2",
                          petType === option.value
                            ? "bg-primary/10 border-primary text-primary ring-2 ring-offset-2 ring-primary/50"
                            : "bg-background border-border hover:border-primary/50"
                        )}
                      >
                        <option.icon className="w-5 h-5" />
                        {option.value === "dog" ? "Dog" : "Cat"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pet-name">Pet Name *</Label>
                  <Input
                    id="pet-name"
                    placeholder="e.g., Max, Bella, Charlie..."
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pet-breed">Breed (optional)</Label>
                  <Popover open={breedPopoverOpen} onOpenChange={setBreedPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between font-normal",
                          !petBreed && "text-muted-foreground"
                        )}
                      >
                        {petBreed || "Select or type breed..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-background z-50" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search or type breed..."
                          onValueChange={(value) => {
                            if (value && !breeds.includes(value)) {
                              setPetBreed(value);
                            }
                          }}
                        />
                        <CommandList>
                          <CommandEmpty>
                            <span className="text-sm text-muted-foreground">
                              No breed found. Your input will be used.
                            </span>
                          </CommandEmpty>
                          <CommandGroup className="max-h-[200px] overflow-auto">
                            {breeds.map((breed) => (
                              <CommandItem
                                key={breed}
                                value={breed}
                                onSelect={(currentValue) => {
                                  setPetBreed(currentValue);
                                  setBreedPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    petBreed === breed ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {breed}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Gender Selection */}
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <div className="flex gap-2">
                    {[
                      { value: "male" as const, label: "♂ Male", color: "bg-blue-100 border-blue-300 text-blue-700" },
                      { value: "female" as const, label: "♀ Female", color: "bg-pink-100 border-pink-300 text-pink-700" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPetGender(option.value)}
                        className={cn(
                          "flex-1 py-2 px-3 rounded-lg border-2 font-medium transition-all text-sm",
                          petGender === option.value
                            ? option.color + " ring-2 ring-offset-2 ring-primary/50"
                            : "bg-background border-border hover:border-primary/50"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Birthday / Age Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label>Birthday / Age</Label>
                  </div>
                  
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setKnowsBirthday(true)}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-lg border-2 font-medium transition-all text-sm",
                        knowsBirthday
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-background border-border hover:border-primary/50"
                      )}
                    >
                      I know the birthday
                    </button>
                    <button
                      type="button"
                      onClick={() => setKnowsBirthday(false)}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-lg border-2 font-medium transition-all text-sm",
                        !knowsBirthday
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-background border-border hover:border-primary/50"
                      )}
                    >
                      I know approximate age
                    </button>
                  </div>

                  {knowsBirthday ? (
                    <div className="space-y-2">
                      <Input
                        type="date"
                        value={petBirthday}
                        onChange={(e) => setPetBirthday(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                      />
                      <p className="text-xs text-muted-foreground">Select your pet's date of birth</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="30"
                          value={petAgeYears}
                          onChange={(e) => setPetAgeYears(e.target.value ? parseInt(e.target.value) : "")}
                          placeholder="e.g., 3"
                          className="w-24"
                        />
                        <span className="text-muted-foreground">years old</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Enter approximate age in years</p>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting || isUploadingPhoto || !petName.trim()}
                >
                  {isSubmitting || isUploadingPhoto ? (
                    isUploadingPhoto ? "Uploading photo..." : "Adding..."
                  ) : (
                    <>
                      Add Pet
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AddPet;
