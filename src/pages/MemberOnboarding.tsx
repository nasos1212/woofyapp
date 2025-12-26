import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Dog, Plus, Trash2, Users, Check, ArrowRight, Gift, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { dogBreeds } from "@/data/dogBreeds";

interface Pet {
  id: string;
  name: string;
  breed: string;
}

interface PlanOption {
  id: string;
  name: string;
  pets: number;
  price: number;
  pricePerPet: number;
  description: string;
  features: string[];
  familySharing: boolean;
}

const plans: PlanOption[] = [
  {
    id: "single",
    name: "Solo Paw",
    pets: 1,
    price: 59,
    pricePerPet: 59,
    description: "Perfect for one furry friend",
    features: ["500+ partner discounts", "Digital membership card", "Monthly training session"],
    familySharing: false,
  },
  {
    id: "duo",
    name: "Dynamic Duo",
    pets: 2,
    price: 99,
    pricePerPet: 49.5,
    description: "Ideal for multi-pet households",
    features: ["Everything in Solo Paw", "Both pets covered", "Save €19 vs 2 single memberships"],
    familySharing: false,
  },
  {
    id: "family",
    name: "Family Pack",
    pets: 3,
    price: 129,
    pricePerPet: 43,
    description: "Share with family members",
    features: ["Everything in Dynamic Duo", "Share access code with family", "Save €48 vs 3 single memberships"],
    familySharing: true,
  },
];

const MemberOnboarding = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"plan" | "pets" | "share">("plan");
  const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(null);
  const [pets, setPets] = useState<Pet[]>([{ id: "1", name: "", breed: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [membershipId, setMembershipId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?type=member");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Check if user already has pets set up
    const checkExistingSetup = async () => {
      if (!user) return;
      
      const { data: membership } = await supabase
        .from("memberships")
        .select("id, plan_type, max_pets")
        .eq("user_id", user.id)
        .maybeSingle();

      if (membership) {
        setMembershipId(membership.id);
        
        const { data: existingPets } = await supabase
          .from("pets")
          .select("*")
          .eq("membership_id", membership.id);

        if (existingPets && existingPets.length > 0) {
          // User already completed onboarding
          navigate("/member");
        }
      }
    };

    checkExistingSetup();
  }, [user, navigate]);

  const addPet = () => {
    if (selectedPlan && pets.length < selectedPlan.pets) {
      setPets([...pets, { id: Date.now().toString(), name: "", breed: "" }]);
    }
  };

  const removePet = (id: string) => {
    if (pets.length > 1) {
      setPets(pets.filter((p) => p.id !== id));
    }
  };

  const updatePet = (id: string, field: "name" | "breed", value: string) => {
    setPets(pets.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handlePlanSelect = (plan: PlanOption) => {
    setSelectedPlan(plan);
    // Adjust pets array to match plan
    if (pets.length > plan.pets) {
      setPets(pets.slice(0, plan.pets));
    }
    setStep("pets");
  };

  const handlePetsSubmit = async () => {
    if (!user || !selectedPlan) return;

    // Validate at least one pet has a name
    const validPets = pets.filter((p) => p.name.trim());
    if (validPets.length === 0) {
      toast.error("Please add at least one pet with a name");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get or create membership
      let membership = membershipId;
      
      if (!membership) {
        // Check for existing membership
        const { data: existingMembership } = await supabase
          .from("memberships")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingMembership) {
          membership = existingMembership.id;
        }
      }

      if (!membership) {
        toast.error("No membership found. Please contact support.");
        return;
      }

      // Generate share code for family plan
      let generatedShareCode: string | null = null;
      if (selectedPlan.familySharing) {
        const { data: codeData } = await supabase.rpc("generate_share_code");
        generatedShareCode = codeData as string;
      }

      // Update membership with plan details
      const { error: updateError } = await supabase
        .from("memberships")
        .update({
          plan_type: selectedPlan.id,
          max_pets: selectedPlan.pets,
          share_code: generatedShareCode,
        })
        .eq("id", membership);

      if (updateError) throw updateError;

      // Insert pets
      const petsToInsert = validPets.map((p) => ({
        membership_id: membership,
        owner_user_id: user.id,
        pet_name: p.name.trim(),
        pet_breed: p.breed.trim() || null,
      }));

      const { error: petsError } = await supabase.from("pets").insert(petsToInsert);

      if (petsError) throw petsError;

      if (selectedPlan.familySharing && generatedShareCode) {
        setShareCode(generatedShareCode);
        setStep("share");
      } else {
        toast.success("Welcome to PawPass! 🎉");
        navigate("/member");
      }
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast.error(error.message || "Failed to complete setup");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = () => {
    toast.success("Welcome to PawPass! 🎉");
    navigate("/member");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Complete Your Setup | PawPass</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-paw-cream via-background to-paw-cream/50 py-12 px-4">
        <div className="container max-w-4xl mx-auto">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <div className={`flex items-center gap-2 ${step === "plan" ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "plan" ? "bg-primary text-primary-foreground" : "bg-green-500 text-white"}`}>
                {step !== "plan" ? <Check className="w-4 h-4" /> : "1"}
              </div>
              <span className="text-sm font-medium hidden sm:inline">Choose Plan</span>
            </div>
            <div className="w-8 h-0.5 bg-border" />
            <div className={`flex items-center gap-2 ${step === "pets" ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "pets" ? "bg-primary text-primary-foreground" : step === "share" ? "bg-green-500 text-white" : "bg-muted"}`}>
                {step === "share" ? <Check className="w-4 h-4" /> : "2"}
              </div>
              <span className="text-sm font-medium hidden sm:inline">Add Pets</span>
            </div>
            {selectedPlan?.familySharing && (
              <>
                <div className="w-8 h-0.5 bg-border" />
                <div className={`flex items-center gap-2 ${step === "share" ? "text-primary" : "text-muted-foreground"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "share" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    3
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">Share</span>
                </div>
              </>
            )}
          </div>

          {/* Step 1: Choose Plan */}
          {step === "plan" && (
            <div className="space-y-8">
              <div className="text-center">
                <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
                  Choose Your PawPass Plan
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
                    {plan.id === "family" && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-accent text-accent-foreground text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                          <Users className="w-3 h-3" /> Family
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
                      <CardDescription>{plan.description}</CardDescription>
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
                  {pets.map((pet, index) => (
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
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`name-${pet.id}`}>Pet Name *</Label>
                          <Input
                            id={`name-${pet.id}`}
                            placeholder="e.g., Max"
                            value={pet.name}
                            onChange={(e) => updatePet(pet.id, "name", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`breed-${pet.id}`}>Breed (optional)</Label>
                          <Select
                            value={pet.breed}
                            onValueChange={(value) => updatePet(pet.id, "breed", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a breed..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {dogBreeds.map((breed) => (
                                <SelectItem key={breed} value={breed}>
                                  {breed}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}

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
                      disabled={isSubmitting || !pets.some((p) => p.name.trim())}
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
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Share Code (Family Plan only) */}
          {step === "share" && shareCode && (
            <div className="space-y-8 max-w-xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Gift className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
                  You're All Set! 🎉
                </h1>
                <p className="text-muted-foreground text-lg">
                  Share this code with your family member so they can link their account
                </p>
              </div>

              <Card>
                <CardContent className="pt-6 text-center space-y-6">
                  <div className="p-6 bg-primary/5 rounded-xl border-2 border-dashed border-primary/30">
                    <p className="text-sm text-muted-foreground mb-2">Your Family Share Code</p>
                    <p className="text-3xl font-mono font-bold text-primary tracking-wider">
                      {shareCode}
                    </p>
                  </div>

                  <div className="text-left space-y-3">
                    <p className="font-medium flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      How it works:
                    </p>
                    <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                      <li>Share this code with your family member</li>
                      <li>They sign up for a PawPass account</li>
                      <li>They enter this code to join your membership</li>
                      <li>They can add their pet and enjoy all benefits!</li>
                    </ol>
                  </div>

                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(shareCode);
                      toast.success("Code copied to clipboard!");
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Copy Code
                  </Button>

                  <Button variant="hero" size="lg" className="w-full" onClick={handleComplete}>
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
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
