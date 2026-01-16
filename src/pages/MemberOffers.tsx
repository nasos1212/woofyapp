import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { Search, Filter, MapPin, Check, Tag, Building2, X, Clock, AlertTriangle, Heart, ArrowUpDown, Sparkles, ChevronDown, ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useMembership } from "@/hooks/useMembership";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import OfferDetailDialog, { OfferWithDetails } from "@/components/OfferDetailDialog";
import { formatDistanceToNow, isPast, differenceInDays } from "date-fns";
import DogLoader from "@/components/DogLoader";
import { useFavoriteOffers } from "@/hooks/useFavoriteOffers";
import { cyprusCityNames } from "@/data/cyprusLocations";
import { PetType } from "@/data/petBreeds";

interface Offer {
  id: string;
  title: string;
  description: string | null;
  discount_value: number | null;
  discount_type: string;
  terms: string | null;
  valid_from: string | null;
  valid_until: string | null;
  is_limited_time: boolean;
  limited_time_label: string | null;
  created_at: string;
  redemption_scope: 'per_member' | 'per_pet';
  redemption_frequency: 'one_time' | 'daily' | 'weekly' | 'monthly' | 'unlimited';
  valid_days: number[] | null;
  valid_hours_start: string | null;
  valid_hours_end: string | null;
  pet_type: PetType | null;
  business: {
    id: string;
    business_name: string;
    category: string;
    city: string | null;
  };
  isRedeemed: boolean;
}

type SortOption = "newest" | "discount_high" | "discount_low" | "expiry" | "business_name";

const categories = [
  { id: "all", label: "All" },
  { id: "veterinary", label: "Veterinary" },
  { id: "grooming", label: "Grooming" },
  { id: "pet_store", label: "Pet Store" },
  { id: "training", label: "Training" },
  { id: "boarding", label: "Boarding" },
  { id: "cafe_restaurant", label: "Café" },
  { id: "other", label: "Other" },
];

const MemberOffers = () => {
  const { user, loading } = useAuth();
  const { hasMembership, loading: membershipLoading } = useMembership();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedPetType, setSelectedPetType] = useState<"all" | PetType>("all");
  const [showRedeemed, setShowRedeemed] = useState(true);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [membershipId, setMembershipId] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<OfferWithDetails | null>(null);
  const [userPetTypes, setUserPetTypes] = useState<PetType[]>([]);
  
  const { isFavorite, toggleFavorite } = useFavoriteOffers();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?type=member");
    }
    // Allow free members to browse - they'll see upgrade prompts
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchOffers();
      fetchUserCity();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortOffers();
  }, [offers, searchQuery, selectedCategory, selectedCity, selectedPetType, showRedeemed, showFavoritesOnly, sortBy, isFavorite]);

  const fetchUserCity = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("preferred_city")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (data?.preferred_city) {
      setSelectedCity(data.preferred_city);
    }
  };

  const fetchOffers = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Get user's membership
      const { data: membership } = await supabase
        .from("memberships")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      // Also check if user is part of a shared membership
      let effectiveMembershipId = membership?.id;
      
      if (!effectiveMembershipId) {
        const { data: share } = await supabase
          .from("membership_shares")
          .select("membership_id")
          .eq("shared_with_user_id", user.id)
          .maybeSingle();
        
        effectiveMembershipId = share?.membership_id;
      }

      setMembershipId(effectiveMembershipId || null);

      // Fetch all active offers from approved businesses
      // Use businesses_public view to avoid exposing sensitive business owner data
      const now = new Date().toISOString();
      const { data: offersData, error } = await supabase
        .from("offers")
        .select(`
          id,
          title,
          description,
          discount_value,
          discount_type,
          terms,
          valid_from,
          valid_until,
          is_limited_time,
          limited_time_label,
          created_at,
          redemption_scope,
          redemption_frequency,
          valid_days,
          valid_hours_start,
          valid_hours_end,
          pet_type,
          business:businesses_public(id, business_name, category, city)
        `)
        .eq("is_active", true)
        .or(`valid_until.is.null,valid_until.gte.${now}`);

      if (error) throw error;

      // Fetch redemptions for this membership
      let redeemedOfferIds: string[] = [];
      if (effectiveMembershipId) {
        const { data: redemptions } = await supabase
          .from("offer_redemptions")
          .select("offer_id")
          .eq("membership_id", effectiveMembershipId);

        redeemedOfferIds = redemptions?.map((r) => r.offer_id) || [];
      }

      // Transform data
      const transformedOffers: Offer[] = (offersData || [])
        .filter((o) => o.business) // Only include offers with valid business
        .map((offer) => ({
          id: offer.id,
          title: offer.title,
          description: offer.description,
          discount_value: offer.discount_value,
          discount_type: offer.discount_type,
          terms: offer.terms,
          valid_from: offer.valid_from,
          valid_until: offer.valid_until,
          is_limited_time: offer.is_limited_time || false,
          limited_time_label: offer.limited_time_label,
          created_at: offer.created_at,
          redemption_scope: (offer.redemption_scope as Offer['redemption_scope']) || 'per_member',
          redemption_frequency: (offer.redemption_frequency as Offer['redemption_frequency']) || 'one_time',
          valid_days: offer.valid_days || null,
          valid_hours_start: offer.valid_hours_start || null,
          valid_hours_end: offer.valid_hours_end || null,
          pet_type: (offer.pet_type === 'dog' || offer.pet_type === 'cat') ? offer.pet_type : null,
          business: offer.business as unknown as Offer["business"],
          isRedeemed: redeemedOfferIds.includes(offer.id),
        }));

      setOffers(transformedOffers);
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortOffers = () => {
    let filtered = [...offers];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (offer) =>
          offer.title.toLowerCase().includes(query) ||
          offer.business.business_name.toLowerCase().includes(query) ||
          offer.description?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (offer) => offer.business.category === selectedCategory
      );
    }

    // City filter
    if (selectedCity !== "all") {
      const citySearch = selectedCity.split(" (")[0].toLowerCase();
      filtered = filtered.filter(
        (offer) => offer.business.city?.toLowerCase().includes(citySearch)
      );
    }

    // Pet type filter
    if (selectedPetType !== "all") {
      filtered = filtered.filter(
        (offer) => offer.pet_type === null || offer.pet_type === selectedPetType
      );
    }

    // Redeemed filter
    if (!showRedeemed) {
      filtered = filtered.filter((offer) => !offer.isRedeemed);
    }

    // Favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter((offer) => isFavorite(offer.id));
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "discount_high":
          return (b.discount_value || 0) - (a.discount_value || 0);
        case "discount_low":
          return (a.discount_value || 0) - (b.discount_value || 0);
        case "expiry":
          if (!a.valid_until && !b.valid_until) return 0;
          if (!a.valid_until) return 1;
          if (!b.valid_until) return -1;
          return new Date(a.valid_until).getTime() - new Date(b.valid_until).getTime();
        case "business_name":
          return a.business.business_name.localeCompare(b.business.business_name);
        default:
          return 0;
      }
    });

    setFilteredOffers(filtered);
  };

  const isNewOffer = (createdAt: string) => {
    return differenceInDays(new Date(), new Date(createdAt)) <= 7;
  };

  const formatDiscount = (offer: Offer) => {
    if (!offer.discount_value) return "Special Offer";
    return offer.discount_type === "percentage"
      ? `${offer.discount_value}% off`
      : `€${offer.discount_value} off`;
  };

  const getCategoryLabel = (category: string) => {
    return categories.find((c) => c.id === category)?.label || category;
  };

  const getTimeIndicator = (offer: Offer) => {
    if (offer.is_limited_time) {
      return { type: "limited", label: offer.limited_time_label || "Limited Time" };
    }
    
    if (offer.valid_until) {
      const validUntil = new Date(offer.valid_until);
      if (isPast(validUntil)) {
        return { type: "expired", label: "Expired" };
      }
      
      const daysLeft = Math.ceil((validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 7) {
        return { 
          type: "expiring", 
          label: `Ends ${formatDistanceToNow(validUntil, { addSuffix: true })}` 
        };
      }
    }
    
    return null;
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader size="lg" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Available Offers | Wooffy</title>
        <meta
          name="description"
          content="Browse all available discounts and offers from Wooffy partner businesses."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-paw-cream to-background">
        <Header />

        <main className="container mx-auto px-4 py-8 pt-24">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate(hasMembership ? "/member" : "/member/free")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          {/* Free Member Banner */}
          {!membershipLoading && !hasMembership && (
            <div className="bg-gradient-to-r from-primary/10 to-amber-100 rounded-2xl p-4 mb-6 border border-primary/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                    <Tag className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Preview Mode</h3>
                    <p className="text-sm text-muted-foreground">Upgrade to redeem these exclusive offers</p>
                  </div>
                </div>
                <Button 
                  variant="hero" 
                  size="sm"
                  onClick={() => navigate("/member/upgrade")}
                >
                  Upgrade Now
                </Button>
              </div>
            </div>
          )}

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              Available Offers
            </h1>
            <p className="text-muted-foreground">
              {filteredOffers.length} offer{filteredOffers.length !== 1 ? 's' : ''} from our partner businesses
              {filteredOffers.filter(o => !o.isRedeemed).length > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-primary font-medium">
                  • {filteredOffers.filter(o => !o.isRedeemed).length} available to redeem
                </span>
              )}
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl p-4 shadow-soft mb-6 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search offers or businesses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>

            {/* City Filter */}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="justify-between gap-2 min-w-[180px]"
                  >
                    <span className="truncate">
                      {selectedCity === "all" ? "All Cities" : selectedCity}
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[280px] max-h-[300px] overflow-y-auto bg-card z-50">
                  <DropdownMenuItem 
                    onClick={() => setSelectedCity("all")}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    All Cities
                    {selectedCity === "all" && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </DropdownMenuItem>
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
              <p className="text-xs text-muted-foreground hidden sm:block">
                Filter by location
              </p>
            </div>

            {/* Pet Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-lg">🐾</span>
              <div className="flex gap-1">
                {[
                  { value: "all" as const, label: "All Pets" },
                  { value: "dog" as const, label: "🐕 Dogs" },
                  { value: "cat" as const, label: "🐱 Cats" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedPetType(option.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedPetType === option.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Toggles and Sort */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowRedeemed(!showRedeemed)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  showRedeemed
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {showRedeemed ? (
                  <Filter className="w-4 h-4" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                {showRedeemed ? "Showing all" : "Hiding redeemed"}
              </button>
              
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  showFavoritesOnly
                    ? "bg-rose-100 text-rose-600"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Heart className={`w-4 h-4 ${showFavoritesOnly ? "fill-current" : ""}`} />
                {showFavoritesOnly ? "Favorites only" : "Show favorites"}
              </button>
              
              <div className="flex items-center gap-2 ml-auto">
                
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-[160px] h-9">
                    <ArrowUpDown className="w-3.5 h-3.5 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="discount_high">Highest Discount</SelectItem>
                    <SelectItem value="discount_low">Lowest Discount</SelectItem>
                    <SelectItem value="expiry">Expiring Soon</SelectItem>
                    <SelectItem value="business_name">Business Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Offers Grid */}
          {filteredOffers.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display font-semibold text-lg mb-2">
                No offers found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search query
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredOffers.map((offer) => {
                const timeIndicator = getTimeIndicator(offer);
                
                return (
                  <button
                    key={offer.id}
                    onClick={() => setSelectedOffer(offer as OfferWithDetails)}
                    className={`bg-white rounded-2xl p-4 sm:p-5 shadow-soft border transition-all hover:shadow-card text-left w-full ${
                      offer.isRedeemed
                        ? "border-muted opacity-75"
                        : "border-transparent hover:border-primary/30"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <Link 
                              to={`/business/${offer.business.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-medium text-foreground text-xs sm:text-sm hover:text-primary hover:underline transition-colors truncate"
                            >
                              {offer.business.business_name}
                            </Link>
                          </div>
                          <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            <span className="truncate">{offer.business.city || "Location TBD"}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(offer.id);
                          }}
                          className="p-1 sm:p-1.5 hover:bg-muted rounded-lg transition-colors"
                        >
                          <Heart
                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
                              isFavorite(offer.id)
                                ? "fill-rose-500 text-rose-500"
                                : "text-muted-foreground hover:text-rose-500"
                            }`}
                          />
                        </button>
                        <Badge variant="secondary" className="text-[10px] sm:text-xs hidden sm:inline-flex">
                          {getCategoryLabel(offer.business.category)}
                        </Badge>
                      </div>
                    </div>

                    {/* Time indicator or New badge */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {isNewOffer(offer.created_at) && (
                        <Badge className="gap-1 bg-emerald-100 text-emerald-700 border-emerald-200">
                          <Sparkles className="w-3 h-3" />
                          New
                        </Badge>
                      )}
                      {timeIndicator && (
                        <Badge 
                          variant={timeIndicator.type === "expiring" ? "destructive" : "secondary"}
                          className={`gap-1 ${
                            timeIndicator.type === "expired" ? "bg-muted text-muted-foreground" :
                            timeIndicator.type === "expiring" ? "bg-orange-100 text-orange-700 border-orange-200" :
                            "bg-rose-100 text-rose-700 border-rose-200"
                          }`}
                        >
                          {timeIndicator.type === "expiring" ? (
                            <AlertTriangle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {timeIndicator.label}
                        </Badge>
                      )}
                      {/* Redemption rules badges */}
                      {offer.pet_type && (
                        <Badge variant="outline" className={`text-[10px] ${
                          offer.pet_type === 'dog' 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>
                          {offer.pet_type === 'dog' ? '🐕 Dogs Only' : '🐱 Cats Only'}
                        </Badge>
                      )}
                      {(offer.redemption_scope !== 'per_member' || offer.redemption_frequency !== 'one_time') && (
                        <>
                          {offer.redemption_scope === 'per_pet' && (
                            <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-[10px]">
                              🐾 Per Pet
                            </Badge>
                          )}
                          {offer.redemption_frequency === 'monthly' && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                              🗓️ Monthly
                            </Badge>
                          )}
                          {offer.redemption_frequency === 'weekly' && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                              📆 Weekly
                            </Badge>
                          )}
                          {offer.redemption_frequency === 'daily' && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                              📅 Daily
                            </Badge>
                          )}
                          {offer.redemption_frequency === 'unlimited' && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                              ♾️ Anytime
                            </Badge>
                          )}
                        </>
                      )}
                    </div>

                    {/* Offer Details */}
                    <div className="mb-4">
                      <h3 className="font-display font-semibold text-foreground mb-1">
                        {offer.title}
                      </h3>
                      {offer.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {offer.description}
                        </p>
                      )}
                    </div>

                    {/* Discount Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-primary">
                          {formatDiscount(offer)}
                        </span>
                      </div>

                      {!hasMembership ? (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                          <Lock className="w-3 h-3 mr-1" />
                          Upgrade to Redeem
                        </Badge>
                      ) : offer.isRedeemed && offer.redemption_frequency === 'one_time' ? (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Redeemed
                        </Badge>
                      ) : (
                        <Badge className="bg-primary/10 text-primary border-0">
                          Available
                        </Badge>
                      )}
                    </div>

                    {/* Terms */}
                    {offer.terms && (
                      <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                        {offer.terms}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </main>

        {/* Offer Detail Dialog */}
        <OfferDetailDialog
          offer={selectedOffer}
          onClose={() => setSelectedOffer(null)}
        />
      </div>
    </>
  );
};

export default MemberOffers;
