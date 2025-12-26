import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Filter, MapPin, Percent, Check, Tag, Building2, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Offer {
  id: string;
  title: string;
  description: string | null;
  discount_value: number | null;
  discount_type: string;
  terms: string | null;
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
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

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
      const { data: offersData, error } = await supabase
        .from("offers")
        .select(`
          id,
          title,
          description,
          discount_value,
          discount_type,
          terms,
          business:businesses(id, business_name, category, city)
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
        <title>Available Offers | PawPass</title>
        <meta
          name="description"
          content="Browse all available discounts and offers from PawPass partner businesses."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-paw-cream to-background">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link
              to="/member"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              Available Offers
            </h1>
            <p className="text-muted-foreground">
              {filteredOffers.length} offers from our partner businesses
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
            <div className="flex items-center gap-2">
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
                {showRedeemed ? "Show all" : "Hide redeemed"}
              </button>
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
              {filteredOffers.map((offer) => (
                <button
                  key={offer.id}
                  onClick={() => setSelectedOffer(offer)}
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
              ))}
            </div>
          )}
        </main>

        {/* Offer Detail Dialog */}
        <Dialog open={!!selectedOffer} onOpenChange={() => setSelectedOffer(null)}>
          <DialogContent className="sm:max-w-md">
            {selectedOffer && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">
                    {selectedOffer.title}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Business Info */}
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <Link
                        to={`/business/${selectedOffer.business.id}`}
                        className="font-semibold text-foreground hover:text-primary hover:underline transition-colors flex items-center gap-1"
                        onClick={() => setSelectedOffer(null)}
                      >
                        {selectedOffer.business.business_name}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {selectedOffer.business.city || "Location TBD"}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {getCategoryLabel(selectedOffer.business.category)}
                    </Badge>
                  </div>

                  {/* Discount */}
                  <div className="text-center py-4 bg-primary/10 rounded-xl">
                    <div className="flex items-center justify-center gap-2 text-2xl font-bold text-primary">
                      <Percent className="w-6 h-6" />
                      {formatDiscount(selectedOffer)}
                    </div>
                    {selectedOffer.isRedeemed && (
                      <Badge className="mt-2 bg-green-100 text-green-700 border-0">
                        <Check className="w-3 h-3 mr-1" />
                        Already Redeemed
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
                  {selectedOffer.description && (
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Description</h4>
                      <p className="text-muted-foreground text-sm">
                        {selectedOffer.description}
                      </p>
                    </div>
                  )}

                  {/* Terms */}
                  {selectedOffer.terms && (
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Terms & Conditions</h4>
                      <p className="text-muted-foreground text-sm italic">
                        {selectedOffer.terms}
                      </p>
                    </div>
                  )}

                  {/* View Business Button */}
                  <Link
                    to={`/business/${selectedOffer.business.id}`}
                    onClick={() => setSelectedOffer(null)}
                  >
                    <Button className="w-full" variant="default">
                      <Building2 className="w-4 h-4 mr-2" />
                      View Business Profile
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default MemberOffers;
