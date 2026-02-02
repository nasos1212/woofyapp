import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Dog, Cat, Plus, Trash2, Check, ArrowRight, ArrowLeft, MapPin, ChevronDown, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronsUpDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAccountType } from "@/hooks/useAccountType";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PetType, getBreedsByPetType } from "@/data/petBreeds";
import { cyprusCityNames } from "@/data/cyprusLocations";
import DogLoader from "@/components/DogLoader";
import Header from "@/components/Header";

interface Pet {
  id: string;
  name: string;
  breed: string;
  petType: PetType;
  gender: "male" | "female" | "unknown";
  birthday: string;
  ageYears: number | "";
  knowsBirthday: boolean;
}

interface PlanOption {
  id: string;
  name: string;
  pets: number;
  price: number;
  pricePerPet: number;
  description: string;
  features: string[];
}

const plans: PlanOption[] = [
  {
    id: "single",
    name: "Solo Paw",
    pets: 1,
    price: 59,
    pricePerPet: 59,
    description: "Perfect for one furry friend",
    features: ["1 pet covered", "All member benefits included"],
  },
  {
    id: "duo",
    name: "Dynamic Duo",
    pets: 2,
    price: 99,
    pricePerPet: 49.5,
    description: "Ideal for households with two pets",
    features: ["2 pets covered", "Save €19 vs 2 single plans"],
  },
  {
    id: "family",
    name: "Pack Leader",
    pets: 5,
    price: 139,
    pricePerPet: 27.8,
    description: "Best value for 3-5 pets",
    features: ["Up to 5 pets covered", "Save up to €156 vs single plans"],
  },
];

interface ExistingMembership {
  id: string;
  plan_type: string;
  max_pets: number;
  is_active: boolean;
  expires_at: string;
}

const MemberOnboarding = () => {
  const { user, loading } = useAuth();
  const { isBusiness, loading: accountTypeLoading } = useAccountType();
  const navigate = useNavigate();
  const [step, setStep] = useState<"plan" | "pets" | "location">("plan");
  const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(null);
  const [pets, setPets] = useState<Pet[]>([{ id: "1", name: "", breed: "", petType: "dog", gender: "unknown", birthday: "", ageYears: "", knowsBirthday: true }]);
  const [breedPopoverOpen, setBreedPopoverOpen] = useState<Record<string, boolean>>({});
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [membershipId, setMembershipId] = useState<string | null>(null);
  const [existingMembership, setExistingMembership] = useState<ExistingMembership | null>(null);
  const [isReactivating, setIsReactivating] = useState(false);

  useEffect(() => {
    if (!loading && !accountTypeLoading) {
      if (!user) {
        navigate("/auth?type=member");
      } else if (isBusiness) {
        navigate("/business");
      }
    }
  }, [user, loading, accountTypeLoading, isBusiness, navigate]);

  useEffect(() => {
    // Check if user already has a membership set up
    const checkExistingSetup = async () => {
      if (!user) return;
      
      const { data: membership } = await supabase
        .from("memberships")
        .select("id, plan_type, max_pets, is_active, expires_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (membership) {
        if (membership.is_active) {
          // User has an active membership - redirect to dashboard
          navigate("/member");
        } else {
          // User has an inactive/expired membership - show reactivation option
          setExistingMembership(membership);
          setMembershipId(membership.id);
        }
      }
    };

    checkExistingSetup();
  }, [user, navigate]);

  const handleReactivate = async () => {
    if (!user || !existingMembership) return;
    
    setIsReactivating(true);
    try {
      const { error } = await supabase
        .from("memberships")
        .update({
          is_active: true,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        })
        .eq("id", existingMembership.id);

      if (error) throw error;

      toast.success("Welcome back! Your membership has been reactivated 🎉");
      navigate("/member");
    } catch (error: any) {
      console.error("Reactivation error:", error);
      toast.error(error.message || "Failed to reactivate membership");
    } finally {
      setIsReactivating(false);
    }
  };

  const addPet = () => {
    if (selectedPlan && pets.length < selectedPlan.pets) {
      setPets([...pets, { id: Date.now().toString(), name: "", breed: "", petType: "dog", gender: "unknown", birthday: "", ageYears: "", knowsBirthday: true }]);
    }
  };

  const removePet = (id: string) => {
    if (pets.length > 1) {
      setPets(pets.filter((p) => p.id !== id));
    }
  };

  const updatePet = (id: string, field: keyof Pet, value: string | number | boolean) => {
    setPets(pets.map((p) => {
      if (p.id === id) {
        // If changing pet type, reset breed
        if (field === "petType") {
          return { ...p, petType: value as PetType, breed: "" };
        }
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  const handlePlanSelect = (plan: PlanOption) => {
    setSelectedPlan(plan);
    // Adjust pets array to match plan
    if (pets.length > plan.pets) {
      setPets(pets.slice(0, plan.pets));
    }
    setStep("pets");
  };

  const handlePetsSubmit = () => {
    // Validate at least one pet has a name
    const validPets = pets.filter((p) => p.name.trim());
    if (validPets.length === 0) {
      toast.error("Please add at least one pet with a name");
      return;
    }
    setStep("location");
  };

  const handleFinalSubmit = async () => {
    if (!user || !selectedPlan) return;

    const validPets = pets.filter((p) => p.name.trim());
    setIsSubmitting(true);

    try {
      // Check for existing membership first
      let membership = membershipId;
      
      if (!membership) {
        const { data: existingMembership } = await supabase
          .from("memberships")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingMembership) {
          membership = existingMembership.id;
        }
      }

      // If no membership exists, create one (demo/free mode - no payment required)
      if (!membership) {
        const { data: newMembership, error: createError } = await supabase
          .from("memberships")
          .insert({
            user_id: user.id,
            plan_type: selectedPlan.id,
            max_pets: selectedPlan.pets,
            member_number: `WF-${new Date().getFullYear()}-${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`,
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
            is_active: true,
          })
          .select("id")
          .single();

        if (createError) throw createError;
        membership = newMembership.id;
      } else {
        // Update existing membership with plan details
        const { error: updateError } = await supabase
          .from("memberships")
          .update({
            plan_type: selectedPlan.id,
            max_pets: selectedPlan.pets,
          })
          .eq("id", membership);

        if (updateError) throw updateError;
      }

      // Insert pets
      const petsToInsert = validPets.map((p) => ({
        membership_id: membership,
        owner_user_id: user.id,
        pet_name: p.name.trim(),
        pet_breed: p.breed.trim() || null,
        pet_type: p.petType,
        gender: p.gender,
        birthday: p.knowsBirthday && p.birthday ? p.birthday : null,
        age_years: !p.knowsBirthday && p.ageYears !== "" ? p.ageYears : null,
      }));

      const { error: petsError } = await supabase.from("pets").insert(petsToInsert);

      if (petsError) throw petsError;

      // Save preferred city if selected
      if (selectedCity) {
        await supabase
          .from("profiles")
          .update({ preferred_city: selectedCity })
          .eq("user_id", user.id);
      }

      toast.success("Welcome to Wooffy! 🎉");
      navigate("/member");
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast.error(error.message || "Failed to complete setup");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader size="lg" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Complete Your Setup | Wooffy</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-paw-cream via-background to-paw-cream/50">
        <Header />
        <div className="container max-w-4xl mx-auto px-4 py-8 pt-[calc(6rem+env(safe-area-inset-top))]">
          {/* Only show step indicators when not in reactivation flow */}
          {!existingMembership && (
            <div className="flex items-center justify-center gap-2 sm:gap-4 mb-12">
              <div className={`flex items-center gap-2 ${step === "plan" ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "plan" ? "bg-primary text-primary-foreground" : "bg-green-500 text-white"}`}>
                  {step !== "plan" ? <Check className="w-4 h-4" /> : "1"}
                </div>
                <span className="text-sm font-medium hidden sm:inline">Choose Plan</span>
              </div>
              <div className="w-4 sm:w-8 h-0.5 bg-border" />
              <div className={`flex items-center gap-2 ${step === "pets" ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "pets" ? "bg-primary text-primary-foreground" : step === "location" ? "bg-green-500 text-white" : "bg-muted"}`}>
                  {step === "location" ? <Check className="w-4 h-4" /> : "2"}
                </div>
                <span className="text-sm font-medium hidden sm:inline">Add Pets</span>
              </div>
              <div className="w-4 sm:w-8 h-0.5 bg-border" />
              <div className={`flex items-center gap-2 ${step === "location" ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "location" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  3
                </div>
                <span className="text-sm font-medium hidden sm:inline">Your City</span>
              </div>
            </div>
          )}

          {/* Reactivation Flow for Expired Members */}
          {existingMembership && (
            <Card className="max-w-lg mx-auto mb-8 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="font-display text-2xl">Welcome Back! 🐾</CardTitle>
                <CardDescription className="text-base">
                  Your membership expired on {new Date(existingMembership.expires_at).toLocaleDateString()}. 
                  Reactivate now to continue enjoying exclusive discounts!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Previous Plan</span>
                    <span className="font-medium capitalize">{existingMembership.plan_type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pets Covered</span>
                    <span className="font-medium">{existingMembership.max_pets}</span>
                  </div>
                </div>
                
                <Button 
                  variant="hero" 
                  className="w-full gap-2" 
                  size="lg"
                  onClick={handleReactivate}
                  disabled={isReactivating}
                >
                  {isReactivating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Reactivating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Reactivate My Membership
                    </>
                  )}
                </Button>
                
                <div className="text-center">
                  <button 
                    onClick={() => setExistingMembership(null)}
                    className="text-sm text-muted-foreground hover:text-foreground underline"
                  >
                    Or start fresh with a new plan
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 1: Choose Plan */}
          {step === "plan" && !existingMembership && (
            <div className="space-y-8">
              <div className="text-center">
                <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
                  Choose Your Wooffy Plan
                </h1>
                <p className="text-muted-foreground text-lg">
                  Select the perfect plan for your furry family
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`relative cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 ${
                      plan.id === "duo" ? "border-primary ring-2 ring-primary/20" : ""
                    }`}
                    onClick={() => handlePlanSelect(plan)}
                  >
                    {plan.id === "duo" && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                          Most Popular
                        </span>
                      </div>
                    )}
                    {plan.id === "pack" && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-accent text-accent-foreground text-xs font-semibold px-3 py-1 rounded-full">
                          Best Value
                        </span>
                      </div>
                    )}
                    <CardHeader className="text-center pb-2">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Dog className="w-6 h-6 text-primary" />
                        {plan.pets > 1 && (
                          <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                            {plan.pets}
                          </span>
                        )}
                      </div>
                      <CardTitle className="font-display">{plan.name}</CardTitle>
                      <CardDescription className="min-h-[40px] flex items-center justify-center">{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                      <div>
                        <span className="text-4xl font-display font-bold text-gradient">€{plan.price}</span>
                        <span className="text-muted-foreground">/year</span>
                        <p className="text-sm text-muted-foreground mt-1">
                          €{plan.pricePerPet.toFixed(2)} per pet
                        </p>
                      </div>
                      <ul className="text-sm space-y-2 text-left">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button variant={plan.id === "duo" ? "hero" : "outline"} className="w-full">
                        Select Plan
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Add Pets */}
          {step === "pets" && selectedPlan && (
            <div className="space-y-8">
              <div className="text-center">
                <Button variant="ghost" onClick={() => setStep("plan")} className="mb-4">
                  ← Back to plans
                </Button>
                <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
                  Tell Us About Your Pets
                </h1>
                <p className="text-muted-foreground text-lg">
                  Add up to {selectedPlan.pets} pet{selectedPlan.pets > 1 ? "s" : ""} to your {selectedPlan.name} plan
                </p>
              </div>

              <Card className="max-w-xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Dog className="w-5 h-5 text-primary" />
                    Your Pets ({pets.length}/{selectedPlan.pets})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {pets.map((pet, index) => {
                    const breeds = getBreedsByPetType(pet.petType);
                    return (
                    <div key={pet.id} className="p-4 bg-muted/50 rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-muted-foreground">
                          Pet {index + 1}
                        </span>
                        {pets.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePet(pet.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      {/* Pet Type Selection */}
                      <div className="space-y-2">
                        <Label>Pet Type *</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={pet.petType === "dog" ? "default" : "outline"}
                            size="sm"
                            className="flex-1 gap-2"
                            onClick={() => updatePet(pet.id, "petType", "dog")}
                          >
                            <Dog className="w-4 h-4" />
                            Dog
                          </Button>
                          <Button
                            type="button"
                            variant={pet.petType === "cat" ? "default" : "outline"}
                            size="sm"
                            className="flex-1 gap-2"
                            onClick={() => updatePet(pet.id, "petType", "cat")}
                          >
                            <Cat className="w-4 h-4" />
                            Cat
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`name-${pet.id}`}>Pet Name *</Label>
                          <Input
                            id={`name-${pet.id}`}
                            placeholder={pet.petType === "cat" ? "e.g., Whiskers" : "e.g., Max"}
                            value={pet.name}
                            onChange={(e) => updatePet(pet.id, "name", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`breed-${pet.id}`}>Breed (optional)</Label>
                          <Popover 
                            open={breedPopoverOpen[pet.id] || false} 
                            onOpenChange={(open) => setBreedPopoverOpen(prev => ({ ...prev, [pet.id]: open }))}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between font-normal",
                                  !pet.breed && "text-muted-foreground"
                                )}
                              >
                                {pet.breed || "Select or type breed..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0 bg-background z-50" align="start">
                              <Command>
                                <CommandInput 
                                  placeholder="Search or type breed..." 
                                  onValueChange={(value) => {
                                    // Allow custom input - update directly if not selecting from list
                                    if (value && !breeds.includes(value)) {
                                      updatePet(pet.id, "breed", value);
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
                                          updatePet(pet.id, "breed", currentValue);
                                          setBreedPopoverOpen(prev => ({ ...prev, [pet.id]: false }));
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            pet.breed === breed ? "opacity-100" : "opacity-0"
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
                      </div>

                      {/* Gender Selection */}
                      <div className="space-y-2">
                        <Label>Gender</Label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => updatePet(pet.id, "gender", "male")}
                            className={cn(
                              "flex-1 py-2 px-3 rounded-lg border-2 font-medium transition-all text-sm",
                              pet.gender === "male"
                                ? "bg-blue-100 border-blue-300 text-blue-700 ring-2 ring-offset-2 ring-primary/50"
                                : "bg-background border-border hover:border-primary/50"
                            )}
                          >
                            ♂ Male
                          </button>
                          <button
                            type="button"
                            onClick={() => updatePet(pet.id, "gender", "female")}
                            className={cn(
                              "flex-1 py-2 px-3 rounded-lg border-2 font-medium transition-all text-sm",
                              pet.gender === "female"
                                ? "bg-pink-100 border-pink-300 text-pink-700 ring-2 ring-offset-2 ring-primary/50"
                                : "bg-background border-border hover:border-primary/50"
                            )}
                          >
                            ♀ Female
                          </button>
                        </div>
                      </div>

                      {/* Birthday / Age Section */}
                      <div className="space-y-3">
                        <Label>Birthday / Age</Label>
                        
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => updatePet(pet.id, "knowsBirthday", true)}
                            className={cn(
                              "flex-1 py-2 px-3 rounded-lg border-2 font-medium transition-all text-sm",
                              pet.knowsBirthday
                                ? "bg-primary/10 border-primary text-primary"
                                : "bg-background border-border hover:border-primary/50"
                            )}
                          >
                            I know the birthday
                          </button>
                          <button
                            type="button"
                            onClick={() => updatePet(pet.id, "knowsBirthday", false)}
                            className={cn(
                              "flex-1 py-2 px-3 rounded-lg border-2 font-medium transition-all text-sm",
                              !pet.knowsBirthday
                                ? "bg-primary/10 border-primary text-primary"
                                : "bg-background border-border hover:border-primary/50"
                            )}
                          >
                            I know approximate age
                          </button>
                        </div>

                        {pet.knowsBirthday ? (
                          <div className="space-y-2">
                            <Input
                              type="date"
                              value={pet.birthday}
                              onChange={(e) => updatePet(pet.id, "birthday", e.target.value)}
                              max={new Date().toISOString().split('T')[0]}
                              min={new Date(new Date().setFullYear(new Date().getFullYear() - 25)).toISOString().split('T')[0]}
                            />
                            <p className="text-xs text-muted-foreground">Select your pet's date of birth (within last 25 years)</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                max="25"
                                value={pet.ageYears}
                                onChange={(e) => {
                                  const value = e.target.value ? parseInt(e.target.value) : "";
                                  if (value === "" || (typeof value === "number" && value <= 25)) {
                                    updatePet(pet.id, "ageYears", value);
                                  }
                                }}
                                placeholder="e.g., 3"
                                className="w-24"
                              />
                              <span className="text-muted-foreground">years old</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Enter approximate age in years (max 25)</p>
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })}

                  {pets.length < selectedPlan.pets && (
                    <Button variant="outline" onClick={addPet} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Another Pet
                    </Button>
                  )}

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-medium">Total</span>
                      <span className="text-2xl font-display font-bold text-gradient">
                        €{selectedPlan.price}/year
                      </span>
                    </div>
                    <Button
                      variant="hero"
                      size="lg"
                      className="w-full"
                      onClick={handlePetsSubmit}
                      disabled={!pets.some((p) => p.name.trim())}
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Location */}
          {step === "location" && selectedPlan && (
            <div className="space-y-8">
              <div className="text-center">
                <Button variant="ghost" onClick={() => setStep("pets")} className="mb-4">
                  ← Back to pets
                </Button>
                <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
                  Where Are You Located?
                </h1>
                <p className="text-muted-foreground text-lg">
                  We'll show you offers from businesses near you
                </p>
              </div>

              <Card className="max-w-xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Select Your City
                  </CardTitle>
                  <CardDescription>
                    Your location is never tracked. You choose what to share.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full justify-between gap-2 h-12 text-left"
                      >
                        <span className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          {selectedCity || "Select your city..."}
                        </span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[320px] max-h-[300px] overflow-y-auto bg-card z-50">
                      {cyprusCityNames.map((city) => (
                        <DropdownMenuItem 
                          key={city}
                          onClick={() => setSelectedCity(city)}
                          className="flex items-center justify-between cursor-pointer"
                        >
                          {city}
                          {selectedCity === city && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-medium">Total</span>
                      <span className="text-2xl font-display font-bold text-gradient">
                        €{selectedPlan.price}/year
                      </span>
                    </div>
                    <Button
                      variant="hero"
                      size="lg"
                      className="w-full"
                      onClick={handleFinalSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        "Setting up..."
                      ) : (
                        <>
                          Continue to Payment
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                    <p className="text-center text-sm text-muted-foreground mt-3">
                      You'll be redirected to complete payment
                    </p>
                    {!selectedCity && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2 text-muted-foreground"
                        onClick={handleFinalSubmit}
                        disabled={isSubmitting}
                      >
                        Skip for now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MemberOnboarding;
