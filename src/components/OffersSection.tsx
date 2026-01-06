import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tag, Percent, ArrowRight, Store, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, isPast } from "date-fns";
import OfferDetailDialog, { OfferWithDetails } from "./OfferDetailDialog";

interface Offer {
  id: string;
  title: string;
  description: string | null;
  discount_type: string;
  discount_value: number | null;
  terms: string | null;
  business_id: string;
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
}

const OffersSection = () => {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<OfferWithDetails | null>(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from("offers")
        .select(`
          id,
          title,
          description,
          discount_type,
          discount_value,
          business_id,
          valid_from,
          valid_until,
          is_limited_time,
          limited_time_label,
          terms,
          businesses!inner (
            id,
            business_name,
            category,
            city
          )
        `)
        .eq("is_active", true)
        .limit(6);

      if (error) throw error;

      const formattedOffers: Offer[] = (data || []).map((offer: any) => ({
        id: offer.id,
        title: offer.title,
        description: offer.description,
        discount_type: offer.discount_type,
        discount_value: offer.discount_value,
        business_id: offer.business_id,
        valid_from: offer.valid_from,
        valid_until: offer.valid_until,
        is_limited_time: offer.is_limited_time,
        limited_time_label: offer.limited_time_label,
        terms: offer.terms,
        business: {
          id: offer.businesses.id,
          business_name: offer.businesses.business_name,
          category: offer.businesses.category,
          city: offer.businesses.city,
        },
      }));

      setOffers(formattedOffers);
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      trainer: "Dog Trainer",
      pet_shop: "Pet Shop",
      hotel: "Pet Hotel",
      grooming: "Grooming",
      vet: "Veterinarian",
      daycare: "Daycare",
      food: "Food & Treats",
      accessories: "Accessories",
      other: "Other",
    };
    return labels[category] || category;
  };

  const getDiscountDisplay = (type: string, value: number | null) => {
    if (type === "percentage" && value) {
      return `${value}% OFF`;
    }
    if (type === "fixed" && value) {
      return `€${value} OFF`;
    }
    if (type === "bogo") {
      return "Buy 1 Get 1";
    }
    if (type === "free_item" || type === "free_session") {
      return "Free";
    }
    return "Special Offer";
  };

  const getTimeIndicator = (offer: Offer) => {
    if (offer.is_limited_time) {
      return { type: "limited", label: offer.limited_time_label || "Limited Time" };
    }
    
    if (offer.valid_until) {
      const validUntil = new Date(offer.valid_until);
      if (isPast(validUntil)) {
        return null; // Don't show expired offers
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

  const handleOfferClick = (offer: Offer) => {
    setSelectedOffer({
      ...offer,
      business: offer.business,
    } as OfferWithDetails);
  };

  if (loading) {
    return (
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <Tag className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Offers</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Loading offers...</p>
          </div>
        </div>
      </section>
    );
  }

  if (offers.length === 0) {
    return null;
  }

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <Tag className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Offers</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Exclusive discounts from our partner businesses. Join Wooffy to unlock all offers!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {offers.map((offer) => {
            const timeIndicator = getTimeIndicator(offer);
            
            return (
              <Card
                key={offer.id}
                className="border-border/50 hover:border-primary/50 transition-all duration-300 cursor-pointer group"
                onClick={() => handleOfferClick(offer)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      <Percent className="w-3 h-3 mr-1" />
                      {getDiscountDisplay(offer.discount_type, offer.discount_value)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {getCategoryLabel(offer.business.category)}
                    </Badge>
                  </div>

                  {/* Time indicator */}
                  {timeIndicator && (
                    <Badge 
                      variant={timeIndicator.type === "expiring" ? "destructive" : "secondary"}
                      className={`mb-3 gap-1 ${
                        timeIndicator.type === "expiring" 
                          ? "bg-orange-100 text-orange-700 border-orange-200" 
                          : "bg-rose-100 text-rose-700 border-rose-200"
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

                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                    {offer.title}
                  </h3>

                  {offer.description && (
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {offer.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Store className="w-4 h-4" />
                    <span className="font-medium text-foreground">
                      {offer.business.business_name}
                    </span>
                    {offer.business.city && (
                      <>
                        <span>•</span>
                        <span>{offer.business.city}</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            onClick={() => navigate("/member/offers")}
            className="gap-2"
          >
            View All Offers
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Offer Detail Dialog */}
      <OfferDetailDialog
        offer={selectedOffer}
        onClose={() => setSelectedOffer(null)}
        showRedemptionStatus={false}
      />
    </section>
  );
};

export default OffersSection;
