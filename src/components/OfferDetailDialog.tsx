import { Link } from "react-router-dom";
import { format, formatDistanceToNow, isPast, isFuture } from "date-fns";
import { Building2, MapPin, Percent, Check, ExternalLink, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface OfferWithDetails {
  id: string;
  title: string;
  description: string | null;
  discount_value: number | null;
  discount_type: string;
  terms?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
  is_limited_time?: boolean;
  limited_time_label?: string | null;
  business: {
    id: string;
    business_name: string;
    category: string;
    city: string | null;
  };
  isRedeemed?: boolean;
}

interface OfferDetailDialogProps {
  offer: OfferWithDetails | null;
  onClose: () => void;
  showRedemptionStatus?: boolean;
}

const categories: Record<string, string> = {
  veterinary: "Veterinary",
  grooming: "Grooming",
  pet_store: "Pet Store",
  pet_shop: "Pet Shop",
  training: "Training",
  boarding: "Boarding",
  cafe_restaurant: "Café",
  trainer: "Dog Trainer",
  hotel: "Pet Hotel",
  vet: "Veterinarian",
  daycare: "Daycare",
  food: "Food & Treats",
  accessories: "Accessories",
  other: "Other",
};

const OfferDetailDialog = ({ offer, onClose, showRedemptionStatus = true }: OfferDetailDialogProps) => {
  if (!offer) return null;

  const formatDiscount = () => {
    if (!offer.discount_value) return "Special Offer";
    if (offer.discount_type === "percentage") {
      return `${offer.discount_value}% off`;
    }
    if (offer.discount_type === "fixed") {
      return `€${offer.discount_value} off`;
    }
    if (offer.discount_type === "bogo") {
      return "Buy 1 Get 1";
    }
    if (offer.discount_type === "free_item" || offer.discount_type === "free_session") {
      return "Free";
    }
    return `€${offer.discount_value} off`;
  };

  const getCategoryLabel = (category: string) => {
    return categories[category] || category;
  };

  const getTimeStatus = () => {
    if (!offer.valid_until) return null;
    
    const validUntil = new Date(offer.valid_until);
    const now = new Date();
    
    if (isPast(validUntil)) {
      return { type: "expired", label: "Expired" };
    }
    
    // Less than 7 days left
    const daysLeft = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 7) {
      return { 
        type: "expiring", 
        label: `Expires ${formatDistanceToNow(validUntil, { addSuffix: true })}` 
      };
    }
    
    return { 
      type: "valid", 
      label: `Valid until ${format(validUntil, "MMM d, yyyy")}` 
    };
  };

  const timeStatus = getTimeStatus();

  return (
    <Dialog open={!!offer} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {offer.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Time-sensitive badges */}
          {(offer.is_limited_time || offer.limited_time_label || timeStatus) && (
            <div className="flex flex-wrap gap-2">
              {offer.is_limited_time && (
                <Badge variant="destructive" className="gap-1">
                  <Clock className="w-3 h-3" />
                  Limited Time
                </Badge>
              )}
              {offer.limited_time_label && (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="w-3 h-3" />
                  {offer.limited_time_label}
                </Badge>
              )}
              {timeStatus && (
                <Badge 
                  variant={timeStatus.type === "expiring" ? "destructive" : "outline"}
                  className={`gap-1 ${
                    timeStatus.type === "expired" ? "bg-muted text-muted-foreground" :
                    timeStatus.type === "expiring" ? "bg-orange-100 text-orange-700 border-orange-200" :
                    ""
                  }`}
                >
                  {timeStatus.type === "expiring" && <AlertTriangle className="w-3 h-3" />}
                  {timeStatus.label}
                </Badge>
              )}
            </div>
          )}

          {/* Business Info */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <Link
                to={`/business/${offer.business.id}`}
                className="font-semibold text-foreground hover:text-primary hover:underline transition-colors flex items-center gap-1"
                onClick={onClose}
              >
                {offer.business.business_name}
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {offer.business.city || "Location TBD"}
              </p>
            </div>
            <Badge variant="secondary">
              {getCategoryLabel(offer.business.category)}
            </Badge>
          </div>

          {/* Discount */}
          <div className="text-center py-4 bg-primary/10 rounded-xl">
            <div className="flex items-center justify-center gap-2 text-2xl font-bold text-primary">
              <Percent className="w-6 h-6" />
              {formatDiscount()}
            </div>
            {showRedemptionStatus && offer.isRedeemed && (
              <Badge className="mt-2 bg-green-100 text-green-700 border-0">
                <Check className="w-3 h-3 mr-1" />
                Already Redeemed
              </Badge>
            )}
          </div>

          {/* Validity Period */}
          {(offer.valid_from || offer.valid_until) && (
            <div className="bg-muted/30 rounded-lg p-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>
                  {offer.valid_from && offer.valid_until ? (
                    <>
                      {format(new Date(offer.valid_from), "MMM d")} - {format(new Date(offer.valid_until), "MMM d, yyyy")}
                    </>
                  ) : offer.valid_until ? (
                    <>Valid until {format(new Date(offer.valid_until), "MMM d, yyyy")}</>
                  ) : null}
                </span>
              </div>
            </div>
          )}

          {/* Description */}
          {offer.description && (
            <div>
              <h4 className="font-medium text-foreground mb-1">Description</h4>
              <p className="text-muted-foreground text-sm">
                {offer.description}
              </p>
            </div>
          )}

          {/* Terms */}
          {offer.terms && (
            <div>
              <h4 className="font-medium text-foreground mb-1">Terms & Conditions</h4>
              <p className="text-muted-foreground text-sm italic">
                {offer.terms}
              </p>
            </div>
          )}

          {/* View Business Button */}
          <Link
            to={`/business/${offer.business.id}`}
            onClick={onClose}
          >
            <Button className="w-full" variant="default">
              <Building2 className="w-4 h-4 mr-2" />
              View Business Profile
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OfferDetailDialog;
