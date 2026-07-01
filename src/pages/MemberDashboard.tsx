import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Gift, MapPin, Clock, QrCode, Shield, Bot, AlertTriangle, Syringe, PlusCircle, Sparkles, ChevronDown, Check, History, Heart, Building2, BookOpen, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { localized, formatDate as formatBlogDate, type BlogPost } from "@/lib/blog";
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
import { useAccountType } from "@/hooks/useAccountType";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/utils";
import { useRatingPrompts } from "@/hooks/useRatingPrompts";
import { useFavoriteOffers } from "@/hooks/useFavoriteOffers";
import AIProactiveAlerts from "@/components/AIProactiveAlerts";
import PaidMemberOnboardingTour from "@/components/PaidMemberOnboardingTour";
import { PAID_MEMBERSHIP_ENABLED } from "@/lib/featureFlags";

import CityPromptBanner from "@/components/CityPromptBanner";
import { cyprusCityNames } from "@/data/cyprusLocations";
import { getCityDisplayName } from "@/lib/cityDisplay";

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
  isBirthday?: boolean;
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
  const { t, i18n } = useTranslation();
  const { user, loading, signOut } = useAuth();
  const { isBusiness, isShelter, loading: accountTypeLoading } = useAccountType();
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
  const [cityPromptDismissed, setCityPromptDismissed] = useState(() => {
    return sessionStorage.getItem('wooffy_city_prompt_dismissed') === 'true';
  });
  const [hasMembership, setHasMembership] = useState<boolean | null>(null);
  const [showAllServices, setShowAllServices] = useState(false);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [blogLoading, setBlogLoading] = useState(true);
  const [blogCarouselApi, setBlogCarouselApi] = useState<CarouselApi | null>(null);

  // Auto-advance blog carousel every 6 seconds
  useEffect(() => {
    if (!blogCarouselApi) return;
    const interval = setInterval(() => {
      blogCarouselApi.scrollNext();
    }, 6000);
    return () => clearInterval(interval);
  }, [blogCarouselApi]);

  // Fetch latest blog posts
  useEffect(() => {
    const fetchBlog = async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(5);
      if (!error && data) setBlogPosts(data as unknown as BlogPost[]);
      setBlogLoading(false);
    };
    fetchBlog();
  }, []);

  
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

        // Fetch membership with retry on transient network errors
        // (avoids bouncing paid users to /member/free → /member loop)
        const MAX_ATTEMPTS = 4;
        let membershipData: any = null;
        let membershipError: any = null;
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
          try {
            const res = await supabase
              .from("memberships")
              .select("*")
              .eq("user_id", user.id)
              .maybeSingle();
            membershipError = res.error;
            if (!res.error) {
              membershipData = res.data;
              break;
            }
          } catch (err) {
            membershipError = err;
          }
          if (attempt < MAX_ATTEMPTS) {
            await new Promise(r => setTimeout(r, 300 * Math.pow(2, attempt - 1)));
          }
        }

        // If the request kept failing, don't downgrade to /member/free — just stop loading.
        if (membershipError && !membershipData) {
          console.error("Membership fetch failed after retries:", membershipError);
          setIsLoading(false);
          return;
        }

        // Check if user has a valid active PAID membership
        if (!membershipData || !membershipData.is_active || membershipData.plan_type === 'free') {
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

        // Fetch regular redemptions for this membership
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

        const regularRedemptions = (redemptionsData || []).map((r) => ({
          id: r.id,
          redeemed_at: r.redeemed_at,
          offer: r.offer as unknown as Redemption["offer"],
          business: r.business as unknown as Redemption["business"],
          isBirthday: false,
        }));

        // Fetch birthday offer redemptions - use redeemed_by_business_id for the business that actually redeemed it
        const { data: birthdayData } = await supabase
          .from("sent_birthday_offers")
          .select(`
            id,
            redeemed_at,
            pet_name,
            discount_value,
            discount_type,
            redeemed_by_business:businesses!sent_birthday_offers_redeemed_by_business_id_fkey(business_name)
          `)
          .eq("owner_user_id", user.id)
          .not("redeemed_at", "is", null)
          .order("redeemed_at", { ascending: false })
          .limit(5);

        const birthdayRedemptions = (birthdayData || []).map((r) => ({
          id: r.id,
          redeemed_at: r.redeemed_at!,
          offer: {
            title: `🎂 Birthday: ${r.pet_name}`,
            discount_value: r.discount_value,
            discount_type: r.discount_type,
          },
          business: r.redeemed_by_business as unknown as Redemption["business"],
          isBirthday: true,
        }));

        // Combine and sort by date, take top 3
        const allRedemptions = [...regularRedemptions, ...birthdayRedemptions]
          .sort((a, b) => new Date(b.redeemed_at).getTime() - new Date(a.redeemed_at).getTime())
          .slice(0, 3);

        setRedemptions(allRedemptions);

        setStats({
          dealsUsed: allRedemptions.length,
        });
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

  const firstName = profile?.full_name?.split(" ")[0] || t("memberDashboard.member");
  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "M";

  const expiryFormatted = membership?.expires_at
    ? formatDate(new Date(membership.expires_at))
    : "N/A";

  const memberSince = membership?.created_at
    ? new Date(membership.created_at).getFullYear().toString()
    : "N/A";

  const daysLeft = membership?.expires_at
    ? Math.max(0, Math.ceil((new Date(membership.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  if (loading || accountTypeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect business users to their dashboard
  if (isBusiness) {
    return <Navigate to="/business" replace />;
  }

  // Redirect shelter users to their dashboard
  if (isShelter) {
    return <Navigate to="/shelter-dashboard" replace />;
  }

  if (isLoading || hasMembership === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader size="lg" />
      </div>
    );
  }

  // Redirect users without membership to the free member dashboard
  if (hasMembership === false) {
    return <Navigate to="/member/free" replace />;
  }

  return (
    <>
      <Helmet>
        <title>{t("memberDashboard.pageTitle")}</title>
        <meta name="description" content={t("memberDashboard.pageDescription")} />
      </Helmet>

        <div className="min-h-screen bg-gradient-to-b from-wooffy-light to-background w-screen max-w-[100vw] overflow-x-hidden">
        <Header />
        <PaidMemberOnboardingTour />
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

        <main className="w-full max-w-[100vw] px-4 sm:px-6 lg:px-8 py-8 pt-[calc(6rem+env(safe-area-inset-top))]">
          <div className="max-w-7xl mx-auto w-full">
          {/* Proactive AI Alerts */}
          <AIProactiveAlerts />

          {/* One-time city prompt for existing users */}
          {user && profile && !profile.preferred_city && !cityPromptDismissed && (
            <CityPromptBanner
              userId={user.id}
              onCitySet={(city) => {
                setProfile(prev => prev ? { ...prev, preferred_city: city } : null);
                setCityPromptDismissed(true);
              }}
              onDismiss={() => {
                setCityPromptDismissed(true);
                sessionStorage.setItem('wooffy_city_prompt_dismissed', 'true');
              }}
            />
          )}


          {/* Welcome */}
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              {t("memberDashboard.hello", { name: firstName })}
            </h1>
            
          </div>

          <div className="grid lg:grid-cols-3 gap-8 w-full">
            {/* Left Column - Card & Stats */}
            <div className="lg:col-span-2 space-y-8 min-w-0">
              {/* Membership Card */}
              <div className="min-w-0 overflow-hidden">
                <div className="flex items-center justify-between mb-4 gap-2">
                  <h2 className="font-display text-base sm:text-lg font-semibold text-foreground flex items-center gap-2 min-w-0">
                    <QrCode className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="truncate">{t("memberDashboard.card.title")}</span>
                  </h2>
                  {PAID_MEMBERSHIP_ENABLED && (
                    <Link to="/member/upgrade" className="flex-shrink-0">
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        {membership?.plan_type === "family" ? (
                          <span>{t("memberDashboard.card.plans")}</span>
                        ) : (
                          <span>{t("memberDashboard.card.upgrade")}</span>
                        )}
                      </Button>
                    </Link>
                  )}
                </div>
                <MembershipCardFull 
                  memberName={profile?.full_name || "Member"}
                  petNames={pets.map(p => p.pet_name)}
                  memberId={membership?.member_number || "N/A"}
                  expiryDate={expiryFormatted}
                  memberSince={memberSince}
                />
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  {t("memberDashboard.card.qrHint")}
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
                  <p className="text-xs sm:text-sm text-muted-foreground">{t("memberDashboard.stats.dealsUsed")}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1 hidden sm:block">{stats.dealsUsed === 0 ? t("memberDashboard.stats.dealsUsedEmpty") : t("memberDashboard.stats.dealsUsedView")}</p>
                </Link>
                <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-soft">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xl sm:text-2xl font-display font-bold ${daysLeft <= 30 ? 'text-amber-600' : 'text-foreground'}`}>{daysLeft}</span>
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${daysLeft <= 30 ? 'bg-amber-100' : 'bg-primary/10'}`}>
                      <Clock className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${daysLeft <= 30 ? 'text-amber-600' : 'text-primary'}`} />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t("memberDashboard.stats.daysLeft")}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1 hidden sm:block">{daysLeft <= 30 ? t("memberDashboard.stats.renewSoon") : t("memberDashboard.stats.plentyOfTime")}</p>
                </div>
                <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-soft">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xl sm:text-2xl font-display font-bold text-foreground">10%</span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t("memberDashboard.stats.toShelters")}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1 hidden sm:block">{t("memberDashboard.stats.fromYourFee")}</p>
                </div>
              </div>

              {/* Your Pets - Most Important */}
              <div className="bg-card rounded-2xl p-4 sm:p-6 lg:p-8 shadow-soft border border-border">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="font-display text-lg sm:text-xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-lg sm:text-xl">🐾</span>
                    </div>
                    {t("memberDashboard.pets.title")}
                  </h3>
{membership && pets.length < membership.max_pets && (
                    <Link to="/member/add-pet">
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <PlusCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">{t("memberDashboard.pets.addPet")}</span>
                        <span className="sm:hidden">{t("memberDashboard.pets.add")}</span>
                      </Button>
                    </Link>
                  )}
                </div>
                {pets.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {pets.map((pet) => (
                      <Link key={pet.id} to={`/member/pet/${pet.id}`}>
                        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-5 bg-muted/40 rounded-xl hover:shadow-md transition-all cursor-pointer border border-border hover:border-primary/30">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center text-2xl sm:text-3xl shrink-0 overflow-hidden">
                            {pet.photo_url ? (
                              <img src={pet.photo_url} alt={pet.pet_name} className="w-full h-full object-cover" />
                            ) : (
                              getPetTypeEmoji(pet.pet_type)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground text-base sm:text-lg truncate">{pet.pet_name}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{pet.pet_breed || t("memberDashboard.pets.mixedBreed")}</p>
                          </div>
                          <div className="text-muted-foreground text-lg sm:text-xl shrink-0">→</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8 bg-muted/40 rounded-xl border border-border">
                    <div className="text-4xl sm:text-5xl mb-3">🐾</div>
                    <p className="text-muted-foreground text-base sm:text-lg">{t("memberDashboard.pets.empty")}</p>
                  </div>
                )}
                
                {/* Upgrade prompt when at max pets but not on highest plan (Pack Leader / family) */}
                {PAID_MEMBERSHIP_ENABLED && membership && pets.length >= membership.max_pets && membership.plan_type !== "family" && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-primary/10 to-amber-100 rounded-xl border border-primary/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">{t("memberDashboard.pets.anotherFriend")}</p>
                        <p className="text-xs text-muted-foreground">{t("memberDashboard.pets.upgradePrompt")}</p>
                      </div>
                      <Link to="/member/upgrade">
                        <Button size="sm" variant="hero" className="shrink-0">
                          {t("memberDashboard.pets.upgrade")}
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Nearby Offers */}
              <div className="bg-white rounded-2xl p-6 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    {t("memberDashboard.nearby.title")}
                  </h3>
                </div>
                
                {/* City Selector */}
                <div className="mb-4" data-city-selector>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full justify-between gap-2 bg-muted/50"
                        disabled={isSavingCity}
                      >
                        <span className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          {profile?.preferred_city ? getCityDisplayName(profile.preferred_city, i18n.language) : t("memberDashboard.nearby.selectCity")}
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
                          {getCityDisplayName(city, i18n.language)}
                          {profile?.preferred_city === city && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t("memberDashboard.nearby.privacyNote")}
                  </p>
                </div>

                <div className="space-y-3">
                  {!profile?.preferred_city ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{t("memberDashboard.nearby.selectAbove")}</p>
                    </div>
                  ) : nearbyOffers.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Gift className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{t("memberDashboard.nearby.noneInCity", { city: getCityDisplayName(profile.preferred_city, i18n.language) })}</p>
                      <Link to="/member/offers" className="text-primary text-sm hover:underline">
                        {t("memberDashboard.nearby.browseAll")}
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
                            ? t("memberDashboard.nearby.percentOff", { value: offer.discount_value })
                            : t("memberDashboard.nearby.euroOff", { value: offer.discount_value })}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
                <Link to="/member/partners">
                  <Button variant="outline" size="sm" className="w-full mt-4">
                    {t("memberDashboard.nearby.viewAllPartners")}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column - Quick Access & Activity */}
            <div className="space-y-6">

              {/* Quick Access - New Features */}
              <div className="bg-white rounded-2xl p-6 shadow-soft">
                <h3 className="font-display font-semibold text-foreground mb-4">{t("memberDashboard.quickAccess.title")}</h3>
                <div className="space-y-2">
                  <Link to="/member/partners" className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl hover:bg-muted transition-colors">
                    <div className="w-10 h-10 flex-shrink-0 bg-sky-100 rounded-full flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-sky-600" />
                    </div>
                    <p className="font-medium text-foreground text-sm">{t("memberDashboard.quickAccess.partners")}</p>
                  </Link>
                  <Link to="/member/offers" className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl hover:bg-muted transition-colors">
                    <div className="w-10 h-10 flex-shrink-0 bg-purple-100 rounded-full flex items-center justify-center">
                      <Gift className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="font-medium text-foreground text-sm">{t("memberDashboard.quickAccess.browseOffers")}</p>
                  </Link>
                  <Link to="/member/health-records" className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl hover:bg-muted transition-colors">
                    <div className="w-10 h-10 flex-shrink-0 bg-emerald-100 rounded-full flex items-center justify-center">
                      <Syringe className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="font-medium text-foreground text-sm">{t("memberDashboard.quickAccess.healthRecords")}</p>
                  </Link>
                  <Link to="/member/pet-friendly-places" className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl hover:bg-muted transition-colors">
                    <div className="w-10 h-10 flex-shrink-0 bg-teal-100 rounded-full flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-teal-600" />
                    </div>
                    <p className="font-medium text-foreground text-sm">{t("memberDashboard.quickAccess.places")}</p>
                  </Link>

                  {showAllServices && (
                    <>
                      <Link to="/member/shelters" className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl hover:bg-muted transition-colors">
                        <div className="w-10 h-10 flex-shrink-0 bg-rose-100 rounded-full flex items-center justify-center">
                          <Heart className="w-5 h-5 text-rose-600" />
                        </div>
                        <p className="font-medium text-foreground text-sm">{t("memberDashboard.quickAccess.shelters")}</p>
                      </Link>
                      <Link to="/member/lost-found" className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl hover:bg-muted transition-colors">
                        <div className="w-10 h-10 flex-shrink-0 bg-amber-100 rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                        </div>
                        <p className="font-medium text-foreground text-sm">{t("memberDashboard.quickAccess.lostFound")}</p>
                      </Link>
                      <Link to="/member/health-assistant" className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl hover:bg-muted transition-colors">
                        <div className="w-10 h-10 flex-shrink-0 bg-violet-100 rounded-full flex items-center justify-center">
                          <Bot className="w-5 h-5 text-violet-600" />
                        </div>
                        <p className="font-medium text-foreground text-sm">{t("memberDashboard.quickAccess.aiAssistant")}</p>
                      </Link>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setShowAllServices((v) => !v)}
                  className="mt-3 w-full text-sm text-primary hover:underline font-medium"
                >
                  {showAllServices ? t("common.showLess") : t("common.seeMoreServices")}
                </button>
              </div>

              {/* Blog Carousel */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg md:text-xl font-bold text-foreground">
                    {t("blog.discoverCardTitle")}
                  </h2>
                  <button
                    onClick={() => navigate("/blog")}
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    {t("blog.viewAll")}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {blogLoading ? (
                  <div className="flex gap-4 overflow-hidden">
                    <div className="min-w-full rounded-xl border bg-card p-3 animate-pulse">
                      <div className="aspect-[16/9] bg-muted rounded-lg mb-3" />
                      <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                      <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-4 bg-muted rounded w-full" />
                    </div>
                  </div>
                ) : blogPosts.length === 0 ? (
                  <Card className="border-border shadow-soft">
                    <CardContent className="p-6 text-center text-muted-foreground text-sm">
                      {t("blog.empty")}
                    </CardContent>
                  </Card>
                ) : (
                  <Carousel
                    opts={{ align: "start", loop: true }}
                    setApi={setBlogCarouselApi}
                    className="w-full"
                  >
                    <CarouselContent className="-ml-4">
                      {blogPosts.map((post) => {
                        const title = localized(post.title_en, post.title_el);
                        const excerpt = localized(post.excerpt_en, post.excerpt_el);
                        return (
                          <CarouselItem key={post.id} className="pl-4 basis-full">
                            <Link to={`/blog/${post.slug}`} className="group block h-full">
                              <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col border-border/60">
                                {post.cover_image_url ? (
                                  <div className="aspect-[16/9] overflow-hidden bg-muted">
                                    <img
                                      src={post.cover_image_url}
                                      alt={title}
                                      loading="lazy"
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                  </div>
                                ) : (
                                  <div className="aspect-[16/9] bg-gradient-to-br from-primary/10 to-accent/20" />
                                )}
                                <div className="p-4 flex flex-col flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="secondary" className="capitalize text-xs">
                                      {t(`blog.categories.${post.category}`)}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {post.reading_minutes} {t("blog.minRead")}
                                    </span>
                                  </div>
                                  <h3 className="font-display font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                                    {title}
                                  </h3>
                                  {excerpt && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 flex-1">
                                      {excerpt}
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-3">
                                    {formatBlogDate(post.published_at)}
                                  </p>
                                </div>
                              </Card>
                            </Link>
                          </CarouselItem>
                        );
                      })}
                    </CarouselContent>
                    <div className="flex items-center justify-center gap-3 mt-4">
                      <CarouselPrevious className="static translate-x-0 translate-y-0 h-7 w-7" />
                      <CarouselNext className="static translate-x-0 translate-y-0 h-7 w-7" />
                    </div>
                  </Carousel>
                )}
              </div>



              {/* Recent Activity */}
              <div className="bg-white rounded-2xl p-6 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    {t("memberDashboard.activity.title")}
                  </h3>
                  {redemptions.length > 0 && (
                    <Link to="/member/history" className="text-sm text-primary hover:underline">
                      {t("memberDashboard.activity.viewAll")}
                    </Link>
                  )}
                </div>
                <div className="space-y-4">
                  {redemptions.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Gift className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{t("memberDashboard.activity.empty")}</p>
                      <Link to="/member/offers" className="text-primary text-sm hover:underline">
                        {t("memberDashboard.activity.browseOffers")}
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
                              {redemption.offer?.title} • {formatDate(new Date(redemption.redeemed_at))}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-green-500 font-semibold">{savedAmount}</span>
                            <p className="text-xs text-muted-foreground">{t("memberDashboard.activity.saved")}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default MemberDashboard;