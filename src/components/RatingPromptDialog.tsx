import { useState } from "react";
import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface RatingPromptDialogProps {
  open: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
  promptId: string;
  onRated?: () => void;
  onDismiss?: () => void;
}

const RatingPromptDialog = ({
  open,
  onClose,
  businessId,
  businessName,
  promptId,
  onRated,
  onDismiss,
}: RatingPromptDialogProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || rating === 0) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("business_reviews").insert({
        business_id: businessId,
        user_id: user.id,
        rating,
        review_text: reviewText.trim() || null,
      });

      if (error) throw error;

      // Mark prompt as completed
      await supabase
        .from("rating_prompts")
        .update({ prompted_at: new Date().toISOString() })
        .eq("id", promptId);

      toast.success("Thanks for your review! 🎉");
      onRated?.();
      onClose();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = async () => {
    await supabase
      .from("rating_prompts")
      .update({ dismissed: true })
      .eq("id", promptId);

    onDismiss?.();
    onClose();
  };

  const handleLater = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            How was your experience?
          </DialogTitle>
          <DialogDescription>
            You recently visited <strong>{businessName}</strong>. Rate your experience to help other pet owners!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Star Rating */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-10 h-10 transition-colors ${
                    star <= (hoverRating || rating)
                      ? "fill-paw-gold text-paw-gold"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>

          {rating > 0 && (
            <p className="text-center text-sm text-muted-foreground">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent!"}
            </p>
          )}

          {/* Review Text */}
          <div>
            <Textarea
              placeholder="Share more about your experience (optional)"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleLater}
                className="flex-1"
              >
                Remind Me Later
              </Button>
              <Button
                variant="ghost"
                onClick={handleDismiss}
                className="flex-1 text-muted-foreground"
              >
                Don't Ask Again
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RatingPromptDialog;
