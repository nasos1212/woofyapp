import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Users, Check, Dog, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const JoinFamily = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [shareCode, setShareCode] = useState("");
  const [petName, setPetName] = useState("");
  const [petBreed, setPetBreed] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"code" | "pet" | "success">("code");
  const [membershipId, setMembershipId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?type=member");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Check if user is already part of a membership
    const checkExisting = async () => {
      if (!user) return;

      // Check if user owns a membership
      const { data: ownMembership } = await supabase
        .from("memberships")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (ownMembership) {
        navigate("/member");
        return;
      }

      // Check if user has joined a family membership
      const { data: sharedMembership } = await supabase
        .from("membership_shares")
        .select("membership_id")
        .eq("shared_with_user_id", user.id)
        .maybeSingle();

      if (sharedMembership) {
        navigate("/member");
      }
    };

    checkExisting();
  }, [user, navigate]);

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

      // Check how many pets are already registered
      const { data: existingPets } = await supabase
        .from("pets")
        .select("id")
        .eq("membership_id", membership.id);

      const petCount = existingPets?.length || 0;
      if (petCount >= membership.max_pets) {
        toast.error("This family membership has reached its pet limit.");
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

      setMembershipId(membership.id);
      setStep("pet");
    } catch (error: any) {
      console.error("Code validation error:", error);
      toast.error(error.message || "Failed to validate code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !membershipId || !petName.trim()) return;

    setIsSubmitting(true);

    try {
      // Create membership share
      const { error: shareError } = await supabase.from("membership_shares").insert({
        membership_id: membershipId,
        shared_with_user_id: user.id,
      });

      if (shareError) throw shareError;

      // Add pet
      const { error: petError } = await supabase.from("pets").insert({
        membership_id: membershipId,
        owner_user_id: user.id,
        pet_name: petName.trim(),
        pet_breed: petBreed.trim() || null,
      });

      if (petError) throw petError;

      setStep("success");
    } catch (error: any) {
      console.error("Join error:", error);
      toast.error(error.message || "Failed to join family");
    } finally {
      setIsSubmitting(false);
    }
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
        <title>Join Family Membership | PawPass</title>
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

          {/* Step 2: Add Pet */}
          {step === "pet" && (
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="font-display text-2xl">Code Accepted!</CardTitle>
                <CardDescription>
                  Now tell us about your furry friend
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePetSubmit} className="space-y-6">
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
                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="w-full"
                    disabled={isSubmitting || !petName.trim()}
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
                    You and {petName} are now part of the PawPass family membership.
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
