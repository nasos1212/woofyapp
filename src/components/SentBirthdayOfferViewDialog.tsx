import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Cake, Gift, Calendar, User, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { format } from "date-fns";

interface SentBirthdayOffer {
  id: string;
  pet_name: string;
  owner_name: string | null;
  discount_value: number;
  discount_type: string;
  message: string;
  sent_at: string;
}

interface SentBirthdayOfferViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: SentBirthdayOffer | null;
}

export function SentBirthdayOfferViewDialog({
  open,
  onOpenChange,
  offer,
}: SentBirthdayOfferViewDialogProps) {
  if (!offer) return null;

  const discountText = offer.discount_type === 'percentage' 
    ? `${offer.discount_value}% off` 
    : `€${offer.discount_value} off`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-green-500" />
            Sent Birthday Offer
          </DialogTitle>
          <DialogDescription>
            Birthday offer details for {offer.pet_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Pet & Owner Info */}
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <Cake className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{offer.pet_name}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{offer.owner_name || "Pet Owner"}</span>
              </div>
            </div>
            <Badge className="bg-green-500 text-white text-xs">
              <Gift className="w-3 h-3 mr-1" />
              {discountText}
            </Badge>
          </div>

          {/* Full Message */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Your message:</h4>
            <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm max-h-[200px] overflow-y-auto">
              {offer.message}
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Sent on {formatDate(new Date(offer.sent_at))}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{format(new Date(offer.sent_at), "HH:mm")}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
