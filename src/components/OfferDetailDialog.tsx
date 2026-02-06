import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow, isPast, isFuture } from "date-fns";
import { formatDate } from "@/lib/utils";
import { Building2, MapPin, Percent, Check, ExternalLink, Clock, AlertTriangle, Lock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMembership } from "@/hooks/useMembership";
import { useAnalyticsTracking } from "@/hooks/useAnalyticsTracking";

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
  redemption_scope?: 'per_member' | 'per_pet';
  redemption_frequency?: 'one_time' | 'daily' | 'weekly' | 'monthly' | 'unlimited';
  valid_days?: number[] | null;
  valid_hours_start?: string | null;
  valid_hours_end?: string | null;
  pet_type?: 'dog' | 'cat' | null;
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
  trainer: "Dog Trainer",
  pet_shop: "Pet Shop",
  hotel: "Pet Hotel",
  grooming: "Grooming",
  vet: "Veterinary",
  daycare: "Daycare",
  food: "Food & Treats",
  accessories: "Accessories",
  physio: "Physiotherapy",
  other: "Other",
};

const OfferDetailDialog = ({ offer, onClose, showRedemptionStatus = true }: OfferDetailDialogProps) => {
  const { hasMembership } = useMembership();
  const navigate = useNavigate();
  const { trackOfferClick } = useAnalyticsTracking();
  
  // Track offer click when dialog opens
  useEffect(() => {
    if (offer) {
      trackOfferClick(offer.id, offer.title, offer.business.business_name);
    }
  }, [offer?.id]);
  
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
      label: `Valid until ${formatDate(validUntil)}` 
    };
  };

  const timeStatus = getTimeStatus();

  return (
    <Dialog open={!!offer} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border/50 shrink-0">
          <DialogTitle className="font-display text-lg leading-tight pr-6">
            {offer.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Time-sensitive badges */}
          {(offer.is_limited_time || offer.limited_time_label || timeStatus) && (
            <div className="flex flex-wrap gap-1.5">
              {offer.is_limited_time && (
                <Badge variant="destructive" className="gap-1 text-xs">
                  <Clock className="w-3 h-3" />
                  Limited Time
                </Badge>
              )}
              {offer.limited_time_label && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Clock className="w-3 h-3" />
                  {offer.limited_time_label}
                </Badge>
              )}
              {timeStatus && (
                <Badge 
                  variant={timeStatus.type === "expiring" ? "destructive" : "outline"}
                  className={`gap-1 text-xs ${
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
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <Link
                to={`/business/${offer.business.id}?from=offers`}
                className="font-semibold text-foreground hover:text-primary hover:underline transition-colors flex items-center gap-1 text-sm sm:text-base"
                onClick={onClose}
              >
                <span className="truncate">{offer.business.business_name}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </Link>
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{offer.business.city || "Location TBD"}</span>
              </p>
            </div>
            <Badge variant="secondary" className="text-xs shrink-0 hidden sm:inline-flex">
              {getCategoryLabel(offer.business.category)}
            </Badge>
          </div>

          {/* Discount */}
          <div className="text-center py-3 sm:py-4 bg-primary/10 rounded-xl">
            <div className="flex items-center justify-center gap-2 text-xl sm:text-2xl font-bold text-primary">
              {formatDiscount()}
            </div>
            {showRedemptionStatus && offer.isRedeemed && (
              <Badge className="mt-2 bg-green-100 text-green-700 border-0 text-xs">
                <Check className="w-3 h-3 mr-1" />
                Already Redeemed
              </Badge>
            )}
          </div>

          {/* Validity Period */}
          {(offer.valid_from || offer.valid_until) && (
            <div className="bg-muted/30 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {offer.valid_from && offer.valid_until ? (
                    <>
                      {formatDate(new Date(offer.valid_from))} - {formatDate(new Date(offer.valid_until))}
                    </>
                  ) : offer.valid_until ? (
                    <>Valid until {formatDate(new Date(offer.valid_until))}</>
                  ) : null}
                </span>
              </div>
            </div>
          )}

          {/* Redemption Rules */}
          {(offer.redemption_scope || offer.redemption_frequency || offer.valid_days?.length || offer.valid_hours_start) && (
            <div className="space-y-1.5">
              <h4 className="font-medium text-foreground text-sm">Redemption Rules</h4>
              <div className="flex flex-wrap gap-1.5">
                {offer.redemption_scope && offer.redemption_scope !== 'per_member' && (
                  <Badge variant="outline" className={`text-xs ${
                    offer.redemption_scope === 'per_pet' 
                      ? 'bg-teal-50 text-teal-700 border-teal-200' 
                      : 'bg-purple-50 text-purple-700 border-purple-200'
                  }`}>
                    {offer.redemption_scope === 'per_pet' 
                      ? (offer.pet_type === 'cat' ? '🐱 Per Cat' : offer.pet_type === 'dog' ? '🐕 Per Dog' : '🐾 Per Pet')
                      : '♾️ Unlimited'}
                  </Badge>
                )}
                {offer.redemption_frequency && offer.redemption_frequency !== 'one_time' && (
                  <Badge variant="outline" className={`text-xs ${
                    offer.redemption_frequency === 'unlimited' 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {offer.redemption_frequency === 'daily' ? '📅 Daily' :
                     offer.redemption_frequency === 'weekly' ? '📆 Weekly' :
                     offer.redemption_frequency === 'monthly' ? '🗓️ Monthly' : '♾️ Anytime'}
                  </Badge>
                )}
                {offer.valid_days && offer.valid_days.length > 0 && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                    {offer.valid_days.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}
                  </Badge>
                )}
                {offer.valid_hours_start && offer.valid_hours_end && (
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                    ⏰ {offer.valid_hours_start} - {offer.valid_hours_end}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {offer.redemption_scope === 'per_pet' && offer.redemption_frequency === 'monthly'
                  ? 'Each of your pets can use this offer once per month'
                  : offer.redemption_frequency === 'unlimited'
                    ? 'Use this offer anytime with no limits!'
                    : offer.redemption_frequency === 'one_time'
                      ? 'This is a one-time offer'
                      : null}
              </p>
            </div>
          )}

          {/* Description */}
          {offer.description && (
            <div className="space-y-1.5">
              <h4 className="font-medium text-foreground text-sm">Description</h4>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                {offer.description}
              </p>
            </div>
          )}

          {/* Terms */}
          {offer.terms && (
            <div className="space-y-1.5">
              <h4 className="font-medium text-foreground text-sm">Terms & Conditions</h4>
              <p className="text-muted-foreground text-xs sm:text-sm italic leading-relaxed">
                {offer.terms}
              </p>
            </div>
          )}

          {/* Upgrade CTA for Free Members */}
          {!hasMembership && (
            <div className="bg-gradient-to-r from-primary/10 to-amber-100 rounded-xl p-3 sm:p-4 border border-primary/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-foreground text-sm">Upgrade to Redeem</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">Become a member to use this offer</p>
                </div>
              </div>
              <Button 
                className="w-full" 
                variant="hero"
                size="sm"
                onClick={() => {
                  onClose();
                  navigate("/member/upgrade");
                }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
            </div>
          )}
        </div>

        {/* Fixed Footer Button */}
        <div className="px-4 py-3 border-t border-border/50 bg-background shrink-0">
          <Link
            to={`/business/${offer.business.id}?from=offers`}
            onClick={onClose}
            className="block"
          >
            <Button className="w-full" variant={hasMembership ? "default" : "outline"} size="sm">
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
