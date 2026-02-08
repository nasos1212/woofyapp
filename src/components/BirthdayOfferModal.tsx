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
import { Cake, Gift, Send, Sparkles, User, Dog, Percent, Euro } from "lucide-react";

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
  const [discountMode, setDiscountMode] = useState<"percentage" | "fixed">("percentage");
  const [selectedOfferId, setSelectedOfferId] = useState<string>("");
  const [customDiscount, setCustomDiscount] = useState("15");
  const [fixedAmount, setFixedAmount] = useState("5");
  const [message, setMessage] = useState("");

  // Reset form when pet changes
  const resetForm = () => {
    setOfferType("custom");
    setDiscountMode("percentage");
    setSelectedOfferId("");
    setCustomDiscount("15");
    setFixedAmount("5");
    if (pet) {
      setMessage(
        `🎂 Happy ${pet.age}${getOrdinalSuffix(pet.age)} Birthday, ${pet.pet_name}! 🎉\n\nTo celebrate this special day, we'd like to offer you 15% off your next visit at ${businessName}.\n\nWe hope to see you soon! 🐾`
      );
    }
  };

  const getOrdinalSuffix = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  // Update message when discount changes
  const updateMessageWithDiscount = (discount: string, mode: "percentage" | "fixed" = discountMode) => {
    if (mode === "percentage") {
      setCustomDiscount(discount);
    } else {
      setFixedAmount(discount);
    }
    if (pet) {
      const discountText = mode === "percentage" ? `${discount}% off` : `€${discount} off`;
      setMessage(
        `🎂 Happy ${pet.age}${getOrdinalSuffix(pet.age)} Birthday, ${pet.pet_name}! 🎉\n\nTo celebrate this special day, we'd like to offer you ${discountText} your next visit at ${businessName}.\n\nWe hope to see you soon! 🐾`
      );
    }
  };

  const handleDiscountModeChange = (mode: "percentage" | "fixed") => {
    setDiscountMode(mode);
    const value = mode === "percentage" ? customDiscount : fixedAmount;
    updateMessageWithDiscount(value, mode);
  };

  const handleSend = async () => {
    if (!pet) return;

    setSending(true);
    try {
      // Build notification data
      const selectedOffer = existingOffers.find(o => o.id === selectedOfferId);
      const discountValue = discountMode === "percentage" ? parseInt(customDiscount) : parseInt(fixedAmount);
      const finalDiscountType = offerType === "existing" ? selectedOffer?.discount_type || "percentage" : discountMode;
      const finalDiscountValue = offerType === "existing" ? (selectedOffer?.discount_value || 0) : discountValue;

      // Create notification for the pet owner
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: pet.owner_user_id,
        title: `🎂 Birthday Surprise from ${businessName}!`,
        message: message,
        type: "birthday_offer",
        data: {
          business_id: businessId,
          business_name: businessName,
          pet_name: pet.pet_name,
          pet_id: pet.pet_id,
          discount: finalDiscountValue,
          discount_type: finalDiscountType,
          offer_id: offerType === "existing" ? selectedOfferId : null,
          offer_type: offerType,
        },
      });

      if (notifError) throw notifError;

      // Also save to sent_birthday_offers for tracking (expires in 30 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      const { error: trackError } = await supabase.from("sent_birthday_offers").insert({
        business_id: businessId,
        pet_id: pet.pet_id,
        pet_name: pet.pet_name,
        owner_user_id: pet.owner_user_id,
        owner_name: pet.owner_name,
        discount_value: finalDiscountValue,
        discount_type: finalDiscountType,
        message: message,
        expires_at: expiresAt.toISOString(),
      });

      if (trackError) {
        console.error("Failed to track sent offer:", trackError);
        // Don't throw - notification was sent successfully
      }

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
            <div className="space-y-4">
              {/* Discount Mode Toggle */}
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={discountMode === "percentage" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleDiscountModeChange("percentage")}
                  >
                    <Percent className="h-4 w-4 mr-1" />
                    Percentage
                  </Button>
                  <Button
                    type="button"
                    variant={discountMode === "fixed" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleDiscountModeChange("fixed")}
                  >
                    <Euro className="h-4 w-4 mr-1" />
                    Fixed Amount
                  </Button>
                </div>
              </div>

              {/* Discount Value */}
              {discountMode === "percentage" ? (
                <div className="space-y-2">
                  <Label htmlFor="discount">Birthday Discount (%)</Label>
                  <div className="flex gap-2 flex-wrap">
                    {["10", "15", "20", "25"].map((val) => (
                      <Button
                        key={val}
                        type="button"
                        variant={customDiscount === val ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateMessageWithDiscount(val, "percentage")}
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
                      onChange={(e) => updateMessageWithDiscount(e.target.value, "percentage")}
                      className="w-20"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="fixedAmount">Birthday Gift (€)</Label>
                  <div className="flex gap-2 flex-wrap">
                    {["5", "10", "15", "20"].map((val) => (
                      <Button
                        key={val}
                        type="button"
                        variant={fixedAmount === val ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateMessageWithDiscount(val, "fixed")}
                      >
                        €{val}
                      </Button>
                    ))}
                    <div className="relative">
                      <Euro className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fixedAmount"
                        type="number"
                        min="1"
                        max="500"
                        value={fixedAmount}
                        onChange={(e) => updateMessageWithDiscount(e.target.value, "fixed")}
                        className="w-24 pl-7"
                      />
                    </div>
                  </div>
                </div>
              )}
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
