import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Users, Check, Dog, ArrowRight, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DogLoader from "@/components/DogLoader";

interface ExistingPet {
  id: string;
  pet_name: string;
  pet_breed: string | null;
}

const JoinFamily = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [shareCode, setShareCode] = useState("");
  const [petName, setPetName] = useState("");
  const [petBreed, setPetBreed] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"code" | "pet" | "success">("code");
  const [membershipId, setMembershipId] = useState<string | null>(null);
  const [existingPets, setExistingPets] = useState<ExistingPet[]>([]);
  const [petOption, setPetOption] = useState<"existing" | "new">("existing");
  const [selectedPetId, setSelectedPetId] = useState<string>("");

  // Auto-fill share code from URL
  useEffect(() => {
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl) {
      setShareCode(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?type=member", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !shareCode.trim()) return;

    setIsSubmitting(true);

    try {
      // Find membership with this share code
      const { data: membership, error } = await supabase
        .from("memberships")
        .select("id, user_id, plan_type, max_pets")
        .eq("share_code", shareCode.trim().toUpperCase())
        .maybeSingle();

      if (error) throw error;

      if (!membership) {
        toast.error("Invalid share code. Please check and try again.");
        return;
      }

      if (membership.user_id === user.id) {
        toast.error("You can't join your own membership!");
        return;
      }

      // Check if already a member
      const { data: existingShare } = await supabase
        .from("membership_shares")
        .select("id")
        .eq("membership_id", membership.id)
        .eq("shared_with_user_id", user.id)
        .maybeSingle();

      if (existingShare) {
        toast.error("You're already part of this family membership!");
        navigate("/member");
        return;
      }

      // Fetch existing pets in this membership
      const { data: petsData } = await supabase
        .from("pets")
        .select("id, pet_name, pet_breed")
        .eq("membership_id", membership.id);

      if (petsData && petsData.length > 0) {
        setExistingPets(petsData);
        setSelectedPetId(petsData[0].id);
        setPetOption("existing");
      } else {
        setPetOption("new");
      }

      setMembershipId(membership.id);
      setStep("pet");
    } catch (error: unknown) {
      console.error("Code validation error:", error);
      toast.error((error as Error).message || "Failed to validate code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !membershipId) return;

    // Validate based on option
    if (petOption === "new" && !petName.trim()) {
      toast.error("Please enter a pet name");
      return;
    }

    if (petOption === "existing" && !selectedPetId) {
      toast.error("Please select a pet");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create membership share
      const { error: shareError } = await supabase.from("membership_shares").insert({
        membership_id: membershipId,
        shared_with_user_id: user.id,
      });

      if (shareError) throw shareError;

      // Only add a new pet if that option was selected
      if (petOption === "new") {
        const { error: petError } = await supabase.from("pets").insert({
          membership_id: membershipId,
          owner_user_id: user.id,
          pet_name: petName.trim(),
          pet_breed: petBreed.trim() || null,
        });

        if (petError) throw petError;
      }

      // If they selected an existing pet, we just join the membership 
      // They'll share access to that pet through the membership

      setStep("success");
    } catch (error: unknown) {
      console.error("Join error:", error);
      toast.error((error as Error).message || "Failed to join family");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPet = existingPets.find(p => p.id === selectedPetId);

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
        <title>Join Family Membership | Wooffy</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-paw-cream via-background to-paw-cream/50 py-12 px-4">
        <div className="container max-w-md mx-auto">
          {/* Step 1: Enter Code */}
          {step === "code" && (
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="font-display text-2xl">Join Family Membership</CardTitle>
                <CardDescription>
                  Enter the share code you received from your family member
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCodeSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="shareCode">Share Code</Label>
                    <Input
                      id="shareCode"
                      placeholder="FAM-XXXXXX"
                      value={shareCode}
                      onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                      className="text-center text-lg font-mono tracking-wider"
                      maxLength={10}
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="w-full"
                    disabled={isSubmitting || !shareCode.trim()}
                  >
                    {isSubmitting ? "Validating..." : "Continue"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Pet Selection */}
          {step === "pet" && (
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="font-display text-2xl">Code Accepted!</CardTitle>
                <CardDescription>
                  {existingPets.length > 0 
                    ? "Do you share a pet that's already registered, or would you like to add a new one?"
                    : "Tell us about your furry friend"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePetSubmit} className="space-y-6">
                  {existingPets.length > 0 && (
                    <RadioGroup 
                      value={petOption} 
                      onValueChange={(v) => setPetOption(v as "existing" | "new")}
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="existing" id="existing" />
                        <Label htmlFor="existing" className="flex-1 cursor-pointer">
                          <span className="font-medium">We share an existing pet</span>
                          <p className="text-sm text-muted-foreground">Select a pet already in the family</p>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="new" id="new" />
                        <Label htmlFor="new" className="flex-1 cursor-pointer">
                          <span className="font-medium">I have a different pet</span>
                          <p className="text-sm text-muted-foreground">Add a new pet to the family</p>
                        </Label>
                      </div>
                    </RadioGroup>
                  )}

                  {/* Select existing pet */}
                  {petOption === "existing" && existingPets.length > 0 && (
                    <div className="space-y-3">
                      <Label>Select your shared pet</Label>
                      <div className="space-y-2">
                        {existingPets.map((pet) => (
                          <div
                            key={pet.id}
                            onClick={() => setSelectedPetId(pet.id)}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              selectedPetId === pet.id 
                                ? "border-primary bg-primary/5" 
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <div className="w-12 h-12 bg-paw-gold/20 rounded-full flex items-center justify-center text-xl">
                              🐕
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{pet.pet_name}</p>
                              <p className="text-sm text-muted-foreground">{pet.pet_breed || "Mixed breed"}</p>
                            </div>
                            {selectedPetId === pet.id && (
                              <Check className="w-5 h-5 text-primary" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add new pet form */}
                  {(petOption === "new" || existingPets.length === 0) && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="petName">Pet Name *</Label>
                        <Input
                          id="petName"
                          placeholder="e.g., Buddy"
                          value={petName}
                          onChange={(e) => setPetName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="petBreed">Breed (optional)</Label>
                        <Input
                          id="petBreed"
                          placeholder="e.g., Labrador"
                          value={petBreed}
                          onChange={(e) => setPetBreed(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="w-full"
                    disabled={isSubmitting || (petOption === "new" && !petName.trim()) || (petOption === "existing" && !selectedPetId)}
                  >
                    {isSubmitting ? "Joining..." : "Join Family"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Success */}
          {step === "success" && (
            <Card>
              <CardContent className="pt-8 text-center space-y-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Dog className="w-10 h-10 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                    Welcome to the Family! 🎉
                  </h2>
                  <p className="text-muted-foreground">
                    {petOption === "existing" && selectedPet
                      ? `You now share ${selectedPet.pet_name} with your family on Wooffy!`
                      : `You and ${petName} are now part of the Wooffy family membership.`
                    }
                  </p>
                </div>
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={() => navigate("/member")}
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default JoinFamily;
