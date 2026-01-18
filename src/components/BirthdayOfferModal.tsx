import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Cake, Gift, Send, Sparkles, User, Dog } from "lucide-react";

interface BirthdayPet {
  pet_id: string;
  pet_name: string;
  pet_breed: string | null;
  owner_name: string | null;
  owner_email: string;
  owner_user_id: string;
  age: number;
  daysUntil: number;
}

interface Offer {
  id: string;
  title: string;
  discount_type: string;
  discount_value: number | null;
}

interface BirthdayOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pet: BirthdayPet | null;
  businessId: string;
  businessName: string;
  existingOffers: Offer[];
  onSuccess?: () => void;
}

export function BirthdayOfferModal({
  open,
  onOpenChange,
  pet,
  businessId,
  businessName,
  existingOffers,
  onSuccess,
}: BirthdayOfferModalProps) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [offerType, setOfferType] = useState<"existing" | "custom">("custom");
  const [selectedOfferId, setSelectedOfferId] = useState<string>("");
  const [customDiscount, setCustomDiscount] = useState("15");
  const [message, setMessage] = useState("");

  // Reset form when pet changes
  const resetForm = () => {
    setOfferType("custom");
    setSelectedOfferId("");
    setCustomDiscount("15");
    if (pet) {
      setMessage(
        `🎂 Happy ${pet.age}${getOrdinalSuffix(pet.age)} Birthday, ${pet.pet_name}! 🎉\n\nTo celebrate this special day, we'd like to offer you ${customDiscount}% off your next visit at ${businessName}.\n\nWe hope to see you soon! 🐾`
      );
    }
  };

  const getOrdinalSuffix = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  // Update message when discount changes
  const updateMessageWithDiscount = (discount: string) => {
    setCustomDiscount(discount);
    if (pet) {
      setMessage(
        `🎂 Happy ${pet.age}${getOrdinalSuffix(pet.age)} Birthday, ${pet.pet_name}! 🎉\n\nTo celebrate this special day, we'd like to offer you ${discount}% off your next visit at ${businessName}.\n\nWe hope to see you soon! 🐾`
      );
    }
  };

  const handleSend = async () => {
    if (!pet) return;

    setSending(true);
    try {
      // Build notification data
      const selectedOffer = existingOffers.find(o => o.id === selectedOfferId);
      const discountText = offerType === "existing" && selectedOffer
        ? `${selectedOffer.discount_value}% off - ${selectedOffer.title}`
        : `${customDiscount}% off birthday special`;

      // Create notification for the pet owner
      const { error } = await supabase.from("notifications").insert({
        user_id: pet.owner_user_id,
        title: `🎂 Birthday Surprise from ${businessName}!`,
        message: message,
        type: "birthday_offer",
        data: {
          business_id: businessId,
          business_name: businessName,
          pet_name: pet.pet_name,
          pet_id: pet.pet_id,
          discount: offerType === "existing" ? selectedOffer?.discount_value : parseInt(customDiscount),
          offer_id: offerType === "existing" ? selectedOfferId : null,
          offer_type: offerType,
        },
      });

      if (error) throw error;

      toast({
        title: "🎉 Birthday offer sent!",
        description: `${pet.owner_name || "The pet owner"} will receive your birthday message for ${pet.pet_name}.`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error sending offer",
        description: error.message || "Failed to send birthday offer",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // Initialize message when modal opens with a pet
  if (open && pet && !message) {
    resetForm();
  }

  if (!pet) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setMessage("");
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cake className="h-5 w-5 text-pink-500" />
            Send Birthday Offer
          </DialogTitle>
          <DialogDescription>
            Create a special birthday message for {pet.pet_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Pet Info Card */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 rounded-lg p-4 border border-pink-200 dark:border-pink-800">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
                <Dog className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{pet.pet_name}</h4>
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Turning {pet.age}!
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {pet.pet_breed && `${pet.pet_breed} • `}
                  <User className="inline h-3 w-3 mr-1" />
                  {pet.owner_name || pet.owner_email}
                </p>
              </div>
            </div>
          </div>

          {/* Offer Type Selection */}
          <div className="space-y-3">
            <Label>Offer Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={offerType === "custom" ? "default" : "outline"}
                size="sm"
                onClick={() => setOfferType("custom")}
              >
                <Gift className="h-4 w-4 mr-1" />
                Quick Discount
              </Button>
              {existingOffers.length > 0 && (
                <Button
                  type="button"
                  variant={offerType === "existing" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOfferType("existing")}
                >
                  Use Existing Offer
                </Button>
              )}
            </div>
          </div>

          {/* Discount Configuration */}
          {offerType === "custom" ? (
            <div className="space-y-2">
              <Label htmlFor="discount">Birthday Discount (%)</Label>
              <div className="flex gap-2">
                {["10", "15", "20", "25"].map((val) => (
                  <Button
                    key={val}
                    type="button"
                    variant={customDiscount === val ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateMessageWithDiscount(val)}
                  >
                    {val}%
                  </Button>
                ))}
                <Input
                  id="discount"
                  type="number"
                  min="1"
                  max="100"
                  value={customDiscount}
                  onChange={(e) => updateMessageWithDiscount(e.target.value)}
                  className="w-20"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Select Offer</Label>
              <Select value={selectedOfferId} onValueChange={setSelectedOfferId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an offer..." />
                </SelectTrigger>
                <SelectContent>
                  {existingOffers.map((offer) => (
                    <SelectItem key={offer.id} value={offer.id}>
                      {offer.title} ({offer.discount_value}% off)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Birthday Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="Write a special birthday message..."
            />
            <p className="text-xs text-muted-foreground">
              This message will be sent as a notification to the pet owner.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={sending || !message.trim() || (offerType === "existing" && !selectedOfferId)}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
          >
            {sending ? (
              "Sending..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Birthday Offer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
