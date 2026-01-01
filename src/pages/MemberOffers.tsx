import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { Search, Filter, MapPin, Percent, Check, Tag, Building2, X, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Breadcrumbs from "@/components/Breadcrumbs";
import OfferDetailDialog, { OfferWithDetails } from "@/components/OfferDetailDialog";
import { formatDistanceToNow, isPast } from "date-fns";
import DogLoader from "@/components/DogLoader";

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
  business: {
    id: string;
    business_name: string;
    category: string;
    city: string | null;
  };
  isRedeemed: boolean;
}

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
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showRedeemed, setShowRedeemed] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [membershipId, setMembershipId] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<OfferWithDetails | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?type=member");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchOffers();
    }
  }, [user]);

  useEffect(() => {
    filterOffers();
  }, [offers, searchQuery, selectedCategory, showRedeemed]);

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
          business:businesses_public(id, business_name, category, city)
        `)
        .eq("is_active", true);

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

  const filterOffers = () => {
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

    // Redeemed filter
    if (!showRedeemed) {
      filtered = filtered.filter((offer) => !offer.isRedeemed);
    }

    setFilteredOffers(filtered);
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
        <title>Available Offers | PawPass</title>
        <meta
          name="description"
          content="Browse all available discounts and offers from PawPass partner businesses."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-paw-cream to-background">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <Breadcrumbs 
              items={[
                { label: "Dashboard", href: "/member" },
                { label: "Offers" }
              ]} 
            />
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
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

            {/* Show Redeemed Toggle */}
            <div className="flex items-center justify-between">
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
              
              {offers.filter(o => o.isRedeemed).length > 0 && (
                <span className="text-sm text-muted-foreground">
                  <Check className="w-4 h-4 inline mr-1 text-green-500" />
                  {offers.filter(o => o.isRedeemed).length} redeemed
                </span>
              )}
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOffers.map((offer) => {
                const timeIndicator = getTimeIndicator(offer);
                
                return (
                  <button
                    key={offer.id}
                    onClick={() => setSelectedOffer(offer as OfferWithDetails)}
                    className={`bg-white rounded-2xl p-5 shadow-soft border transition-all hover:shadow-card text-left w-full ${
                      offer.isRedeemed
                        ? "border-muted opacity-75"
                        : "border-transparent hover:border-primary/30"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <Link 
                            to={`/business/${offer.business.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-medium text-foreground text-sm hover:text-primary hover:underline transition-colors"
                          >
                            {offer.business.business_name}
                          </Link>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {offer.business.city || "Location TBD"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {getCategoryLabel(offer.business.category)}
                      </Badge>
                    </div>

                    {/* Time indicator */}
                    {timeIndicator && (
                      <Badge 
                        variant={timeIndicator.type === "expiring" ? "destructive" : "secondary"}
                        className={`mb-3 gap-1 ${
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
                        <Percent className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-primary">
                          {formatDiscount(offer)}
                        </span>
                      </div>

                      {offer.isRedeemed ? (
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
