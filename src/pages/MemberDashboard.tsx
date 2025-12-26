import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Gift, MapPin, Calendar, Clock, Percent, QrCode, Shield, Bell, Users, Copy, Check, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import MembershipCardFull from "@/components/MembershipCardFull";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Pet {
  id: string;
  pet_name: string;
  pet_breed: string | null;
}

interface Membership {
  id: string;
  member_number: string;
  plan_type: string;
  expires_at: string;
  created_at: string;
  share_code: string | null;
  max_pets: number;
}

interface Profile {
  full_name: string | null;
  email: string;
}

const recentDeals = [
  { business: "Happy Paws Pet Shop", discount: "15% off", used: "2 days ago", saved: "€12.50" },
  { business: "Woof & Wag Grooming", discount: "Free nail trim", used: "1 week ago", saved: "€15.00" },
  { business: "Pet Paradise Hotel", discount: "10% off", used: "2 weeks ago", saved: "€45.00" },
];

const nearbyOffers = [
  { business: "Bark & Brew Café", distance: "0.3 km", offer: "Free puppuccino" },
  { business: "Canine Academy", distance: "1.2 km", offer: "20% off classes" },
  { business: "PetMed Clinic", distance: "2.1 km", offer: "Free checkup" },
];

const MemberDashboard = () => {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [codeCopied, setCodeCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileData) setProfile(profileData);

        // Fetch membership
        const { data: membershipData } = await supabase
          .from("memberships")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (membershipData) {
          setMembership(membershipData);

          // Fetch pets for this membership
          const { data: petsData } = await supabase
            .from("pets")
            .select("id, pet_name, pet_breed")
            .eq("membership_id", membershipData.id);

          if (petsData) setPets(petsData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!loading) {
      fetchData();
    }
  }, [user, loading]);

  const copyShareCode = () => {
    if (membership?.share_code) {
      navigator.clipboard.writeText(membership.share_code);
      setCodeCopied(true);
      toast.success("Share code copied!");
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const handleInviteByEmail = async () => {
    if (!inviteEmail.trim() || !membership?.share_code) return;
    
    setIsInviting(true);
    try {
      // For now, just copy the code and show instructions
      // In a real app, you'd send an email here
      await navigator.clipboard.writeText(
        `Join my PawPass Family! Use code: ${membership.share_code}\n\nSign up at: ${window.location.origin}/member/join-family`
      );
      toast.success(`Invite link copied! Share it with ${inviteEmail}`);
      setInviteEmail("");
      setInviteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to create invite");
    } finally {
      setIsInviting(false);
    }
  };

  const firstName = profile?.full_name?.split(" ")[0] || "Member";
  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "M";

  const expiryFormatted = membership?.expires_at
    ? format(new Date(membership.expires_at), "MMM d, yyyy")
    : "N/A";

  const memberSince = membership?.created_at
    ? format(new Date(membership.created_at), "yyyy")
    : "N/A";

  const daysLeft = membership?.expires_at
    ? Math.max(0, Math.ceil((new Date(membership.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My PawPass Dashboard | Member Area</title>
        <meta name="description" content="Access your PawPass membership card, view savings, and discover nearby pet deals." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-paw-cream to-background">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Breadcrumbs items={[{ label: "Member Dashboard" }]} />
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-muted rounded-full transition-colors">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
              </button>
              <div className="w-10 h-10 bg-gradient-hero rounded-full flex items-center justify-center text-white font-medium">
                {initials}
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              Welcome back, {firstName}! 👋
            </h1>
            <p className="text-muted-foreground">Here's your PawPass membership overview</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Card & Stats */}
            <div className="lg:col-span-2 space-y-8">
              {/* Membership Card */}
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-primary" />
                  Your Membership Card
                </h2>
                <MembershipCardFull 
                  memberName={profile?.full_name || "Member"}
                  petName={pets[0]?.pet_name || "Your Pet"}
                  memberId={membership?.member_number || "N/A"}
                  expiryDate={expiryFormatted}
                  memberSince={memberSince}
                />
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Show this QR code at any partner business to redeem your discounts
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-4 shadow-soft">
                  <div className="text-2xl font-display font-bold text-primary">€0</div>
                  <p className="text-sm text-muted-foreground">Total Saved</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-soft">
                  <div className="text-2xl font-display font-bold text-paw-gold">0</div>
                  <p className="text-sm text-muted-foreground">Deals Used</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-soft">
                  <div className="text-2xl font-display font-bold text-green-500">{daysLeft}</div>
                  <p className="text-sm text-muted-foreground">Days Left</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-soft">
                  <div className="text-2xl font-display font-bold text-rose-500">€0</div>
                  <p className="text-sm text-muted-foreground">To Shelters</p>
                </div>
              </div>

              {/* Family Share Code - Only for family plans */}
              {membership?.plan_type === "family" && membership.share_code && (
                <div className="bg-white rounded-2xl p-6 shadow-soft">
                  <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Family Sharing
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Share this code with family members so they can join your plan
                  </p>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 bg-muted rounded-lg px-4 py-3 font-mono text-lg font-semibold tracking-wider">
                      {membership.share_code}
                    </div>
                    <Button variant="outline" size="icon" onClick={copyShareCode}>
                      {codeCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  
                  <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full gap-2">
                        <Mail className="w-4 h-4" />
                        Invite by Email
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite Family Member</DialogTitle>
                        <DialogDescription>
                          Enter their email to send them an invite link with your share code.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="invite-email">Email Address</Label>
                          <Input
                            id="invite-email"
                            type="email"
                            placeholder="family@example.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                          />
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-sm text-muted-foreground">
                            They'll receive your share code: <strong>{membership.share_code}</strong>
                          </p>
                        </div>
                        <Button 
                          className="w-full" 
                          onClick={handleInviteByEmail}
                          disabled={!inviteEmail.trim() || isInviting}
                        >
                          {isInviting ? "Creating invite..." : "Copy Invite Link"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl p-6 shadow-soft">
                <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  {recentDeals.map((deal, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                      <div>
                        <p className="font-medium text-foreground">{deal.business}</p>
                        <p className="text-sm text-muted-foreground">{deal.discount} • {deal.used}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-green-500 font-semibold">{deal.saved}</span>
                        <p className="text-xs text-muted-foreground">saved</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Nearby & Info */}
            <div className="space-y-6">
              {/* Membership Status */}
              <div className="bg-gradient-hero rounded-2xl p-6 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">Active Membership</span>
                </div>
                <p className="text-white/80 text-sm mb-4">
                  Your membership is valid until <strong>{expiryFormatted}</strong>
                </p>
                <Button variant="secondary" size="sm" className="w-full bg-white text-primary hover:bg-white/90">
                  Renew Early & Save 10%
                </Button>
              </div>

              {/* Nearby Offers */}
              <div className="bg-white rounded-2xl p-6 shadow-soft">
                <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Nearby Offers
                </h3>
                <div className="space-y-4">
                  {nearbyOffers.map((offer, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors cursor-pointer">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Percent className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">{offer.business}</p>
                        <p className="text-xs text-muted-foreground">{offer.distance} away</p>
                      </div>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {offer.offer}
                      </span>
                    </div>
                  ))}
                </div>
                <Link to="/member/offers">
                  <Button variant="outline" size="sm" className="w-full mt-4">
                    View All Partners
                  </Button>
                </Link>
              </div>

              {/* Pet Profile */}
              <div className="bg-white rounded-2xl p-6 shadow-soft">
                <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  Your Pets
                </h3>
                {pets.length > 0 ? (
                  <div className="space-y-3">
                    {pets.map((pet) => (
                      <div key={pet.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-xl">
                        <div className="w-14 h-14 bg-paw-gold/20 rounded-full flex items-center justify-center text-2xl">
                          🐕
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{pet.pet_name}</p>
                          <p className="text-sm text-muted-foreground">{pet.pet_breed || "Mixed breed"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No pets added yet</p>
                  </div>
                )}
                <Link to="/member/family">
                  <Button variant="ghost" size="sm" className="w-full mt-4 text-primary">
                    + Add Another Pet
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default MemberDashboard;