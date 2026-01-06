import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Gift, MapPin, Clock, Percent, QrCode, Shield, Bot, AlertTriangle, Syringe, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import MembershipCardFull from "@/components/MembershipCardFull";
import DogLoader from "@/components/DogLoader";
import ReferralSection from "@/components/ReferralSection";
import RatingPromptDialog from "@/components/RatingPromptDialog";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useRatingPrompts } from "@/hooks/useRatingPrompts";
import { useFavoriteOffers } from "@/hooks/useFavoriteOffers";
import AIProactiveAlerts from "@/components/AIProactiveAlerts";

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

interface Redemption {
  id: string;
  redeemed_at: string;
  offer: {
    title: string;
    discount_value: number | null;
    discount_type: string;
  };
  business: {
    business_name: string;
  };
}

const nearbyOffers = [
  { business: "Bark & Brew Café", distance: "0.3 km", offer: "Free puppuccino" },
  { business: "Canine Academy", distance: "1.2 km", offer: "20% off classes" },
  { business: "PetMed Clinic", distance: "2.1 km", offer: "Free checkup" },
];

const MemberDashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [stats, setStats] = useState({ totalSaved: 0, dealsUsed: 0, toShelters: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [ratingPromptOpen, setRatingPromptOpen] = useState(false);
  
  const { pendingPrompts, dismissPrompt, refetch: refetchPrompts } = useRatingPrompts();
  const { favoriteIds } = useFavoriteOffers();
  const currentPrompt = pendingPrompts[0];

  // Show rating prompt when available
  useEffect(() => {
    if (pendingPrompts.length > 0 && !ratingPromptOpen) {
      setRatingPromptOpen(true);
    }
  }, [pendingPrompts]);

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

          // Fetch redemptions for this membership
          const { data: redemptionsData } = await supabase
            .from("offer_redemptions")
            .select(`
              id,
              redeemed_at,
              offer:offers(title, discount_value, discount_type),
              business:businesses(business_name)
            `)
            .eq("membership_id", membershipData.id)
            .order("redeemed_at", { ascending: false })
            .limit(5);

          if (redemptionsData) {
            const transformed = redemptionsData.map((r) => ({
              id: r.id,
              redeemed_at: r.redeemed_at,
              offer: r.offer as unknown as Redemption["offer"],
              business: r.business as unknown as Redemption["business"],
            }));
            setRedemptions(transformed);

            // Calculate stats
            const totalSaved = transformed.reduce((sum, r) => {
              const value = r.offer?.discount_value || 0;
              if (r.offer?.discount_type === "percentage") {
                return sum + (value / 100) * 50; // Estimate €50 avg transaction
              }
              return sum + value;
            }, 0);

            setStats({
              totalSaved: Math.round(totalSaved),
              dealsUsed: transformed.length,
              toShelters: Math.round(totalSaved * 0.05), // 5% donation estimate
            });
          }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader size="lg" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Wooffy Dashboard | Member Area</title>
        <meta name="description" content="Access your Wooffy membership card, view savings, and discover nearby pet deals." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-wooffy-light to-background">
        <Header />
        {/* Rating Prompt Dialog */}
        {currentPrompt && (
          <RatingPromptDialog
            open={ratingPromptOpen}
            onClose={() => setRatingPromptOpen(false)}
            businessId={currentPrompt.business_id}
            businessName={currentPrompt.business?.business_name || "this business"}
            promptId={currentPrompt.id}
            onRated={() => refetchPrompts()}
            onDismiss={() => dismissPrompt(currentPrompt.id)}
          />
        )}

        <main className="container mx-auto px-4 py-8 pt-24">
          {/* Proactive AI Alerts */}
          <AIProactiveAlerts />

          {/* Welcome */}
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              Welcome back, {firstName}! 👋
            </h1>
            <p className="text-muted-foreground">Here's your Wooffy membership overview</p>
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
                <Link to="/member/history" className="bg-white rounded-2xl p-4 shadow-soft hover:shadow-md transition-shadow group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xl font-display font-bold text-primary">€{stats.totalSaved}</span>
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Percent className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Total Saved</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Click to view history</p>
                </Link>
                <Link to="/member/history" className="bg-white rounded-2xl p-4 shadow-soft hover:shadow-md transition-shadow group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xl font-display font-bold text-yellow-500">{stats.dealsUsed}</span>
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                      <Gift className="w-4 h-4 text-yellow-500" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Deals Used</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">{stats.dealsUsed === 0 ? "Start saving today!" : "Keep it up!"}</p>
                </Link>
                <div className="bg-white rounded-2xl p-4 shadow-soft">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-2xl font-display font-bold ${daysLeft <= 30 ? 'text-amber-500' : 'text-green-500'}`}>{daysLeft}</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${daysLeft <= 30 ? 'bg-amber-100' : 'bg-green-100'}`}>
                      <Clock className={`w-4 h-4 ${daysLeft <= 30 ? 'text-amber-500' : 'text-green-500'}`} />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Days Left</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">{daysLeft <= 30 ? "Renew soon!" : "Plenty of time"}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-soft">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xl font-display font-bold text-rose-500">€{stats.toShelters}</span>
                    <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                      <Shield className="w-4 h-4 text-rose-500" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">To Shelters</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">5% of your savings</p>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl p-6 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Recent Activity
                  </h3>
                  {redemptions.length > 0 && (
                    <Link to="/member/history" className="text-sm text-primary hover:underline">
                      View all
                    </Link>
                  )}
                </div>
                <div className="space-y-4">
                  {redemptions.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Gift className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No redemptions yet</p>
                      <Link to="/member/offers" className="text-primary text-sm hover:underline">
                        Browse offers
                      </Link>
                    </div>
                  ) : (
                    redemptions.map((redemption) => {
                      const savedAmount = redemption.offer?.discount_type === "percentage"
                        ? `${redemption.offer.discount_value}%`
                        : `€${redemption.offer?.discount_value || 0}`;
                      return (
                        <div key={redemption.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                          <div>
                            <p className="font-medium text-foreground">{redemption.business?.business_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {redemption.offer?.title} • {format(new Date(redemption.redeemed_at), "MMM d")}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-green-500 font-semibold">{savedAmount}</span>
                            <p className="text-xs text-muted-foreground">saved</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Nearby & Info */}
            <div className="space-y-6">
              {/* Your Pets - Most Important */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 shadow-lg border border-amber-200">
                <h3 className="font-display text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-lg">🐾</span>
                  </div>
                  Your Pets
                </h3>
                {pets.length > 0 ? (
                  <div className="space-y-3">
                    {pets.map((pet) => (
                      <Link key={pet.id} to={`/member/pet/${pet.id}`}>
                        <div className="flex items-center gap-4 p-4 bg-white rounded-xl hover:shadow-md transition-all cursor-pointer border border-amber-100 hover:border-amber-300">
                          <div className="w-14 h-14 bg-gradient-to-br from-amber-300 to-orange-300 rounded-full flex items-center justify-center text-2xl shadow-sm">
                            🐕
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-amber-900 text-lg">{pet.pet_name}</p>
                            <p className="text-sm text-amber-700/70">{pet.pet_breed || "Mixed breed"}</p>
                          </div>
                          <div className="text-amber-500">→</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-white rounded-xl border border-amber-100">
                    <div className="text-4xl mb-2">🐶</div>
                    <p className="text-amber-700/70">No pets added yet</p>
                  </div>
                )}
              </div>

              {/* Quick Access - New Features */}
              <div className="bg-white rounded-2xl p-6 shadow-soft">
                <h3 className="font-display font-semibold text-foreground mb-4">Quick Access</h3>
                <div className="space-y-3">
                  <Link to="/member/health-assistant" className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">AI Health Assistant</p>
                      <p className="text-xs text-muted-foreground">Ask pet health questions</p>
                    </div>
                  </Link>
                  <Link to="/member/vaccinations" className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <Bell className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Vaccination Reminders</p>
                      <p className="text-xs text-muted-foreground">Never miss a due date</p>
                    </div>
                  </Link>
                  <Link to="/member/health-records" className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Syringe className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Health Records</p>
                      <p className="text-xs text-muted-foreground">Vaccinations & vet visits</p>
                    </div>
                  </Link>
                  <Link to="/member/lost-pets" className="flex items-center gap-3 p-3 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Lost Pet Alerts</p>
                      <p className="text-xs text-muted-foreground">Community lost & found</p>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Referral Section */}
              <ReferralSection userName={profile?.full_name || "Member"} />
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

            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default MemberDashboard;