import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { Users, Dog, Copy, Trash2, UserPlus, Crown, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import Breadcrumbs from "@/components/Breadcrumbs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

interface Pet {
  id: string;
  pet_name: string;
  pet_breed: string | null;
  owner_user_id: string;
}

interface FamilyMember {
  id: string;
  user_id: string;
  profile: {
    full_name: string | null;
    email: string;
  } | null;
  pets: Pet[];
  isOwner: boolean;
}

const FamilyManagement = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [membership, setMembership] = useState<{
    id: string;
    plan_type: string;
    max_pets: number;
    share_code: string | null;
  } | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?type=member");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchFamilyData();
    }
  }, [user]);

  const fetchFamilyData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // First check if user owns a membership
      const { data: ownMembership } = await supabase
        .from("memberships")
        .select("id, plan_type, max_pets, share_code, user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      let effectiveMembership = ownMembership;
      let userIsOwner = !!ownMembership;

      // If not owner, check if they're part of a shared membership
      if (!effectiveMembership) {
        const { data: share } = await supabase
          .from("membership_shares")
          .select("membership_id")
          .eq("shared_with_user_id", user.id)
          .maybeSingle();

        if (share) {
          const { data: sharedMembership } = await supabase
            .from("memberships")
            .select("id, plan_type, max_pets, share_code, user_id")
            .eq("id", share.membership_id)
            .maybeSingle();

          effectiveMembership = sharedMembership;
          userIsOwner = false;
        }
      }

      if (!effectiveMembership) {
        setIsLoading(false);
        return;
      }

      setMembership({
        id: effectiveMembership.id,
        plan_type: effectiveMembership.plan_type,
        max_pets: effectiveMembership.max_pets,
        share_code: effectiveMembership.share_code,
      });
      setIsOwner(userIsOwner);

      // Get owner's profile
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("full_name, email, user_id")
        .eq("user_id", effectiveMembership.user_id)
        .maybeSingle();

      // Get owner's pets
      const { data: ownerPets } = await supabase
        .from("pets")
        .select("id, pet_name, pet_breed, owner_user_id")
        .eq("membership_id", effectiveMembership.id)
        .eq("owner_user_id", effectiveMembership.user_id);

      // Get shared members
      const { data: shares } = await supabase
        .from("membership_shares")
        .select("id, shared_with_user_id")
        .eq("membership_id", effectiveMembership.id);

      const members: FamilyMember[] = [];

      // Add owner
      members.push({
        id: effectiveMembership.user_id,
        user_id: effectiveMembership.user_id,
        profile: ownerProfile,
        pets: ownerPets || [],
        isOwner: true,
      });

      // Add shared members
      if (shares && shares.length > 0) {
        for (const share of shares) {
          const { data: memberProfile } = await supabase
            .from("profiles")
            .select("full_name, email, user_id")
            .eq("user_id", share.shared_with_user_id)
            .maybeSingle();

          const { data: memberPets } = await supabase
            .from("pets")
            .select("id, pet_name, pet_breed, owner_user_id")
            .eq("membership_id", effectiveMembership.id)
            .eq("owner_user_id", share.shared_with_user_id);

          members.push({
            id: share.id,
            user_id: share.shared_with_user_id,
            profile: memberProfile,
            pets: memberPets || [],
            isOwner: false,
          });
        }
      }

      setFamilyMembers(members);
    } catch (error) {
      console.error("Error fetching family data:", error);
      toast.error("Failed to load family data");
    } finally {
      setIsLoading(false);
    }
  };

  const copyShareCode = () => {
    if (membership?.share_code) {
      navigator.clipboard.writeText(membership.share_code);
      toast.success("Share code copied to clipboard!");
    }
  };

  const removeMember = async (shareId: string, memberName: string) => {
    try {
      const { error } = await supabase
        .from("membership_shares")
        .delete()
        .eq("id", shareId);

      if (error) throw error;

      toast.success(`${memberName || "Member"} has been removed from the family`);
      fetchFamilyData();
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
    }
  };

  const totalPets = familyMembers.reduce((sum, m) => sum + m.pets.length, 0);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-display text-xl font-semibold mb-2">No Membership Found</h2>
          <p className="text-muted-foreground mb-4">
            You need an active membership to manage your family.
          </p>
          <Link to="/member/onboarding">
            <Button variant="hero">Get Started</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Family Management | PawPass</title>
        <meta
          name="description"
          content="Manage your PawPass family membership and shared access."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-paw-cream to-background">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <Breadcrumbs 
              items={[
                { label: "Dashboard", href: "/member" },
                { label: "Family" }
              ]} 
            />
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              Family Management
            </h1>
            <p className="text-muted-foreground">
              {membership.plan_type === "family"
                ? "Manage your family membership and shared access"
                : "Upgrade to a Family Pack to share with others"}
            </p>
          </div>

          {/* Share Code Card (for family plans) */}
          {membership.share_code && isOwner && (
            <div className="bg-gradient-hero rounded-2xl p-6 text-white mb-6">
              <div className="flex items-center gap-2 mb-4">
                <UserPlus className="w-5 h-5" />
                <span className="font-medium">Invite Family Members</span>
              </div>
              <p className="text-white/80 text-sm mb-4">
                Share this code with family members so they can join your membership
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white/20 rounded-xl px-4 py-3 font-mono text-lg tracking-wider">
                  {membership.share_code}
                </div>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={copyShareCode}
                  className="bg-white text-primary hover:bg-white/90"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Plan Status */}
          <div className="bg-white rounded-2xl p-6 shadow-soft mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Membership Status
              </h2>
              <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full font-medium capitalize">
                {membership.plan_type} Plan
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-xl p-4 text-center">
                <div className="text-2xl font-display font-bold text-foreground">
                  {familyMembers.length}
                </div>
                <p className="text-sm text-muted-foreground">Members</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 text-center">
                <div className="text-2xl font-display font-bold text-foreground">
                  {totalPets}/{membership.max_pets}
                </div>
                <p className="text-sm text-muted-foreground">Pets Registered</p>
              </div>
            </div>
          </div>

          {/* Family Members */}
          <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Family Members
              </h2>
            </div>

            <div className="divide-y divide-border">
              {familyMembers.map((member) => (
                <div key={member.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-hero rounded-full flex items-center justify-center text-white font-medium">
                        {(member.profile?.full_name || member.profile?.email || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-foreground flex items-center gap-2">
                          {member.profile?.full_name || member.profile?.email || "Unknown"}
                          {member.isOwner && (
                            <span className="text-xs bg-paw-gold/20 text-paw-gold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Crown className="w-3 h-3" />
                              Owner
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.pets.length} pet{member.pets.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    {isOwner && !member.isOwner && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove family member?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove {member.profile?.full_name || "this member"} and
                              their pets from your family membership. They won't be able to use
                              PawPass benefits anymore.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                removeMember(member.id, member.profile?.full_name || "Member")
                              }
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>

                  {/* Pets */}
                  {member.pets.length > 0 && (
                    <div className="ml-13 space-y-2">
                      {member.pets.map((pet) => (
                        <div
                          key={pet.id}
                          className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2"
                        >
                          <Dog className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">{pet.pet_name}</span>
                          {pet.pet_breed && (
                            <span className="text-sm text-muted-foreground">
                              • {pet.pet_breed}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade prompt for non-family plans */}
          {membership.plan_type !== "family" && (
            <div className="mt-6 bg-accent/10 rounded-2xl p-6 text-center">
              <Users className="w-10 h-10 text-accent mx-auto mb-3" />
              <h3 className="font-display font-semibold text-foreground mb-2">
                Want to share with family?
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upgrade to the Family Pack to add more pets and share access with family members
              </p>
              <Button variant="outline">Upgrade to Family Pack</Button>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default FamilyManagement;
