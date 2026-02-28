import { useState, useRef } from "react";
import { Star, X, Loader2, Camera } from "lucide-react";
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
  existingPhotoUrl2?: string | null;
  onReviewSubmitted?: () => void;
}

const MAX_PHOTOS = 2;

const PlaceReviewDialog = ({
  open,
  onClose,
  placeId,
  placeName,
  existingRating,
  existingReviewText,
  existingPhotoUrl,
  existingPhotoUrl2,
  onReviewSubmitted,
}: PlaceReviewDialogProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(existingRating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState(existingReviewText || "");

  // Track two photo slots
  const [photoPreviews, setPhotoPreviews] = useState<(string | null)[]>([
    existingPhotoUrl || null,
    existingPhotoUrl2 || null,
  ]);
  const [selectedFiles, setSelectedFiles] = useState<(File | null)[]>([null, null]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<number>(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    const newFiles = [...selectedFiles];
    const newPreviews = [...photoPreviews];
    newFiles[activeSlot] = file;
    newPreviews[activeSlot] = URL.createObjectURL(file);
    setSelectedFiles(newFiles);
    setPhotoPreviews(newPreviews);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearPhoto = (index: number) => {
    const newFiles = [...selectedFiles];
    const newPreviews = [...photoPreviews];
    newFiles[index] = null;
    newPreviews[index] = index === 0 ? (existingPhotoUrl || null) : (existingPhotoUrl2 || null);
    // If clearing, also clear the existing reference
    newPreviews[index] = null;
    setSelectedFiles(newFiles);
    setPhotoPreviews(newPreviews);
  };

  const openFilePicker = (slot: number) => {
    setActiveSlot(slot);
    fileInputRef.current?.click();
  };

  const uploadPhoto = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${user!.id}/${placeId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("place-review-photos")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("place-review-photos")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!user || rating === 0) return;

    setIsSubmitting(true);
    try {
      // Resolve photo URLs
      let photoUrl = photoPreviews[0] && !selectedFiles[0] ? photoPreviews[0] : null;
      let photoUrl2 = photoPreviews[1] && !selectedFiles[1] ? photoPreviews[1] : null;

      if (selectedFiles[0]) {
        photoUrl = await uploadPhoto(selectedFiles[0]);
      }
      if (selectedFiles[1]) {
        photoUrl2 = await uploadPhoto(selectedFiles[1]);
      }

      // If preview was cleared (null) and no new file, set to null
      if (!photoPreviews[0]) photoUrl = null;
      if (!photoPreviews[1]) photoUrl2 = null;

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
            photo_url_2: photoUrl2,
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
            photo_url_2: photoUrl2,
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

  const filledSlots = photoPreviews.filter(Boolean).length;

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

          {/* Photo Upload - Two slots */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
            />

            <div className="grid grid-cols-2 gap-2">
              {[0, 1].map((index) => (
                <div key={index}>
                  {photoPreviews[index] ? (
                    <div className="relative rounded-lg overflow-hidden">
                      <img
                        src={photoPreviews[index]!}
                        alt={`Review photo ${index + 1}`}
                        className="w-full h-28 object-cover rounded-lg"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => clearPhoto(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openFilePicker(index)}
                      className="w-full h-28 border-2 border-dashed border-border/50 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors"
                    >
                      <Camera className="w-5 h-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Photo {index + 1}
                      </span>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Add up to {MAX_PHOTOS} photos (optional)
            </p>
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
