import { useState, useRef } from "react";
import { Star, Upload, X, Loader2, Camera } from "lucide-react";
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
import { validateImageFile } from "@/lib/fileValidation";

interface PlaceReviewDialogProps {
  open: boolean;
  onClose: () => void;
  placeId: string;
  placeName: string;
  existingRating?: number | null;
  existingReviewText?: string | null;
  existingPhotoUrl?: string | null;
  onReviewSubmitted?: () => void;
}

const PlaceReviewDialog = ({
  open,
  onClose,
  placeId,
  placeName,
  existingRating,
  existingReviewText,
  existingPhotoUrl,
  onReviewSubmitted,
}: PlaceReviewDialogProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(existingRating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState(existingReviewText || "");
  const [photoPreview, setPhotoPreview] = useState<string | null>(existingPhotoUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setSelectedFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const clearPhoto = () => {
    setSelectedFile(null);
    setPhotoPreview(existingPhotoUrl || null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!user || rating === 0) return;

    setIsSubmitting(true);
    try {
      let photoUrl = existingPhotoUrl || null;

      // Upload photo if a new one was selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${user.id}/${placeId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("place-review-photos")
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("place-review-photos")
          .getPublicUrl(fileName);

        photoUrl = publicUrl;
      }

      // Check if user already has a rating
      const { data: existing } = await supabase
        .from("pet_friendly_place_ratings")
        .select("id")
        .eq("place_id", placeId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("pet_friendly_place_ratings")
          .update({
            rating,
            review_text: reviewText.trim() || null,
            photo_url: photoUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("place_id", placeId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("pet_friendly_place_ratings")
          .insert({
            place_id: placeId,
            user_id: user.id,
            rating,
            review_text: reviewText.trim() || null,
            photo_url: photoUrl,
          });

        if (error) throw error;
      }

      toast.success(existing ? "Review updated! ⭐" : "Review submitted! ⭐");
      onReviewSubmitted?.();
      onClose();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            Review {placeName}
          </DialogTitle>
          <DialogDescription>
            Share your experience to help other pet owners!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
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
                      ? "fill-amber-500 text-amber-500"
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
          <Textarea
            placeholder="Tell us about your experience... (optional)"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={3}
            className="resize-none"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">
            {reviewText.length}/500
          </p>

          {/* Photo Upload */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
            />

            {photoPreview ? (
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={photoPreview}
                  alt="Review photo"
                  className="w-full h-40 object-cover rounded-lg"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={clearPhoto}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border/50 rounded-lg p-4 text-center hover:border-primary/50 transition-colors flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Add a photo (optional)</span>
              </button>
            )}
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : existingRating ? (
              "Update Review"
            ) : (
              "Submit Review"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlaceReviewDialog;
