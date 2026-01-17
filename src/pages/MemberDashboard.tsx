import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Gift, MapPin, Clock, QrCode, Shield, Bot, AlertTriangle, Syringe, PlusCircle, Sparkles, ChevronDown, Check, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import MembershipCardFull from "@/components/MembershipCardFull";
import DogLoader from "@/components/DogLoader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import RatingPromptDialog from "@/components/RatingPromptDialog";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useRatingPrompts } from "@/hooks/useRatingPrompts";
import { useFavoriteOffers } from "@/hooks/useFavoriteOffers";
import AIProactiveAlerts from "@/components/AIProactiveAlerts";
import { cyprusCityNames } from "@/data/cyprusLocations";

import { PetType, getPetTypeEmoji } from "@/data/petBreeds";

interface Pet {
  id: string;
  pet_name: string;
  pet_breed: string | null;
  pet_type: PetType;
  photo_url: string | null;
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
  preferred_city: string | null;
  login_count: number | null;
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

interface NearbyOffer {
  id: string;
  title: string;
  discount_value: number | null;
  discount_type: string;
  business: {
    id: string;
    business_name: string;
    city: string | null;
  };
}

const MemberDashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [nearbyOffers, setNearbyOffers] = useState<NearbyOffer[]>([]);
  const [stats, setStats] = useState({ dealsUsed: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [ratingPromptOpen, setRatingPromptOpen] = useState(false);
  const [isSavingCity, setIsSavingCity] = useState(false);
  const [hasMembership, setHasMembership] = useState<boolean | null>(null);
  
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
          .select("full_name, email, preferred_city, login_count")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileData) setProfile(profileData);

        // Fetch membership
        const { data: membershipData } = await supabase
          .from("memberships")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        // Check if user has a valid active membership
        if (!membershipData || !membershipData.is_active) {
          setHasMembership(false);
          setIsLoading(false);
          return;
        }

        setHasMembership(true);
        setMembership(membershipData);

        // Fetch pets for this membership
        const { data: petsData } = await supabase
          .from("pets")
          .select("id, pet_name, pet_breed, pet_type, photo_url")
          .eq("membership_id", membershipData.id);

        if (petsData) {
          // Cast pet_type to PetType and sort pets so last viewed pet comes first
          const typedPets = petsData.map(p => ({
            ...p,
            pet_type: (p.pet_type === 'cat' ? 'cat' : 'dog') as PetType
          }));
          const lastViewedPetId = localStorage.getItem('lastViewedPetId');
          if (lastViewedPetId) {
            const sortedPets = [...typedPets].sort((a, b) => {
              if (a.id === lastViewedPetId) return -1;
              if (b.id === lastViewedPetId) return 1;
              return 0;
            });
            setPets(sortedPets);
          } else {
            setPets(typedPets);
          }
        }

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

          setStats({
            dealsUsed: transformed.length,
          });
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

  // Fetch nearby offers when preferred city changes
  useEffect(() => {
    const fetchNearbyOffers = async () => {
      if (!profile?.preferred_city) {
        setNearbyOffers([]);
        return;
      }

      try {
        // Extract the main city name (before parenthesis)
        const citySearch = profile.preferred_city.split(" (")[0];
        
        const { data, error } = await supabase
          .from("offers")
          .select(`
            id,
            title,
            discount_value,
            discount_type,
            business:businesses!inner(id, business_name, city)
          `)
          .eq("is_active", true)
          .ilike("business.city", `%${citySearch}%`)
          .limit(5);

        if (error) throw error;

        const transformedOffers = (data || []).map((offer) => ({
          id: offer.id,
          title: offer.title,
          discount_value: offer.discount_value,
          discount_type: offer.discount_type,
          business: offer.business as unknown as NearbyOffer["business"],
        }));

        setNearbyOffers(transformedOffers);
      } catch (error) {
        console.error("Error fetching nearby offers:", error);
        setNearbyOffers([]);
      }
    };

    fetchNearbyOffers();
  }, [profile?.preferred_city]);

  const handleCityChange = async (city: string) => {
    if (!user) return;
    setIsSavingCity(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ preferred_city: city })
        .eq("user_id", user.id);

      if (error) throw error;

      setProfile((prev) => prev ? { ...prev, preferred_city: city } : null);
    } catch (error) {
      console.error("Error saving city preference:", error);
    } finally {
      setIsSavingCity(false);
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

  // Redirect free users to the free member dashboard
  if (hasMembership === false) {
    return <Navigate to="/member/free" replace />;
  }

  if (isLoading || hasMembership === null) {
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
              {(profile?.login_count ?? 0) <= 1 ? `Hello, ${firstName}!` : `Hello again, ${firstName}!`} 👋
            </h1>
            <p className="text-muted-foreground">Here's your Wooffy membership overview</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Card & Stats */}
            <div className="lg:col-span-2 space-y-8">
              {/* Membership Card */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-primary" />
                    Your Membership Card
                  </h2>
                  <Link to="/member/upgrade">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      {membership?.plan_type === "family" ? (
                        <>
                          <span className="hidden sm:inline">View Plans</span>
                          <span className="sm:hidden">Plans</span>
                        </>
                      ) : (
                        <>
                          <span className="hidden sm:inline">Upgrade Plan</span>
                          <span className="sm:hidden">Upgrade</span>
                        </>
                      )}
                    </Button>
                  </Link>
                </div>
                <MembershipCardFull 
                  memberName={profile?.full_name || "Member"}
                  petNames={pets.map(p => p.pet_name)}
                  memberId={membership?.member_number || "N/A"}
                  expiryDate={expiryFormatted}
                  memberSince={memberSince}
                />
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Show this QR code at any partner business to redeem your discounts
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <Link to="/member/history" className="bg-white rounded-2xl p-3 sm:p-4 shadow-soft hover:shadow-md transition-shadow group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xl sm:text-2xl font-display font-bold text-primary">{stats.dealsUsed}</span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Deals Used</p>
                  <p className="text-xs text-muted-foreground/70 mt-1 hidden sm:block">{stats.dealsUsed === 0 ? "Start saving!" : "View history"}</p>
                </Link>
                <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-soft">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xl sm:text-2xl font-display font-bold ${daysLeft <= 30 ? 'text-amber-500' : 'text-green-500'}`}>{daysLeft}</span>
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${daysLeft <= 30 ? 'bg-amber-100' : 'bg-green-100'}`}>
                      <Clock className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${daysLeft <= 30 ? 'text-amber-500' : 'text-green-500'}`} />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Days Left</p>
                  <p className="text-xs text-muted-foreground/70 mt-1 hidden sm:block">{daysLeft <= 30 ? "Renew soon!" : "Plenty of time"}</p>
                </div>
                <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-soft">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xl sm:text-2xl font-display font-bold text-rose-500">10%</span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-rose-100 rounded-full flex items-center justify-center">
                      <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">To Shelters</p>
                  <p className="text-xs text-muted-foreground/70 mt-1 hidden sm:block">From your fee</p>
                </div>
              </div>

              {/* Your Pets - Most Important */}
              <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-cyan-200">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="font-display text-lg sm:text-xl font-bold text-teal-800 flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-400 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-lg sm:text-xl">🐾</span>
                    </div>
                    Your Pets
                  </h3>
{membership && pets.length < membership.max_pets && (
                    <Link to="/member/add-pet">
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <PlusCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Pet</span>
                        <span className="sm:hidden">Add</span>
                      </Button>
                    </Link>
                  )}
                </div>
                {pets.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {pets.map((pet) => (
                      <Link key={pet.id} to={`/member/pet/${pet.id}`}>
                        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-5 bg-white rounded-xl hover:shadow-md transition-all cursor-pointer border border-cyan-100 hover:border-teal-300">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-cyan-300 to-teal-400 rounded-full flex items-center justify-center text-2xl sm:text-3xl shadow-sm shrink-0 overflow-hidden">
                            {pet.photo_url ? (
                              <img src={pet.photo_url} alt={pet.pet_name} className="w-full h-full object-cover" />
                            ) : (
                              getPetTypeEmoji(pet.pet_type)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-teal-800 text-base sm:text-lg truncate">{pet.pet_name}</p>
                            <p className="text-xs sm:text-sm text-teal-600/70 truncate">{pet.pet_breed || "Mixed breed"}</p>
                          </div>
                          <div className="text-teal-500 text-lg sm:text-xl shrink-0">→</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8 bg-white rounded-xl border border-cyan-100">
                    <div className="text-4xl sm:text-5xl mb-3">🐾</div>
                    <p className="text-teal-600/70 text-base sm:text-lg">No pets added yet</p>
                  </div>
                )}
                
                {/* Upgrade prompt when at max pets but not on highest plan (Pack Leader / family) */}
                {membership && pets.length >= membership.max_pets && membership.plan_type !== "family" && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-primary/10 to-amber-100 rounded-xl border border-primary/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">Got another furry friend?</p>
                        <p className="text-xs text-muted-foreground">Upgrade your plan to add more pets and unlock family benefits!</p>
                      </div>
                      <Link to="/member/upgrade">
                        <Button size="sm" variant="hero" className="shrink-0">
                          Upgrade
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
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

              {/* Quick Access - New Features */}
              <div className="bg-white rounded-2xl p-6 shadow-soft">
                <h3 className="font-display font-semibold text-foreground mb-4">Quick Access</h3>
                <div className="space-y-3">
                  <Link to="/member/health-assistant" className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">AI Pet Assistant</p>
                      <p className="text-xs text-muted-foreground">Ask pet questions</p>
                    </div>
                  </Link>
                  <Link to="/member/health-records" className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Syringe className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Health Records</p>
                      <p className="text-xs text-muted-foreground">Vaccinations, reminders & vet visits</p>
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
                  <Link to="/member/history" className="flex items-center gap-3 p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <History className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Redemption History</p>
                      <p className="text-xs text-muted-foreground">View your savings & activity</p>
                    </div>
                  </Link>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Nearby Offers
                  </h3>
                </div>
                
                {/* City Selector */}
                <div className="mb-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full justify-between gap-2 bg-muted/50"
                        disabled={isSavingCity}
                      >
                        <span className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          {profile?.preferred_city || "Select your city"}
                        </span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[280px] max-h-[300px] overflow-y-auto bg-card z-50">
                      {cyprusCityNames.map((city) => (
                        <DropdownMenuItem 
                          key={city}
                          onClick={() => handleCityChange(city)}
                          className="flex items-center justify-between cursor-pointer"
                        >
                          {city}
                          {profile?.preferred_city === city && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <p className="text-xs text-muted-foreground mt-2">
                    Your location is never tracked. You choose what to share.
                  </p>
                </div>

                <div className="space-y-3">
                  {!profile?.preferred_city ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Select your city above to see nearby offers</p>
                    </div>
                  ) : nearbyOffers.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Gift className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No offers in {profile.preferred_city} yet</p>
                      <Link to="/member/offers" className="text-primary text-sm hover:underline">
                        Browse all offers
                      </Link>
                    </div>
                  ) : (
                    nearbyOffers.slice(0, 3).map((offer) => (
                      <Link 
                        key={offer.id} 
                        to={`/business/${offer.business.id}`}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
                      >
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Gift className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">{offer.business.business_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{offer.title}</p>
                        </div>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full whitespace-nowrap">
                          {offer.discount_type === "percentage" 
                            ? `${offer.discount_value}% off` 
                            : `€${offer.discount_value} off`}
                        </span>
                      </Link>
                    ))
                  )}
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