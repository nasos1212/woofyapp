import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Star, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import PlaceReviewDialog from "@/components/PlaceReviewDialog";

interface PlaceRatingProps {
  placeId: string;
  placeName?: string;
  currentRating: number | null;
  onRatingChange?: () => void;
  size?: "sm" | "md";
}

interface ReviewData {
  rating: number;
  review_text: string | null;
  photo_url: string | null;
  photo_url_2: string | null;
  user_id: string;
  created_at: string;
  reviewer_name?: string | null;
}

const PlaceRating = ({ placeId, placeName, currentRating, onRatingChange, size = "md" }: PlaceRatingProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [userReview, setUserReview] = useState<ReviewData | null>(null);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [user, placeId]);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("pet_friendly_place_ratings")
      .select("rating, review_text, photo_url, photo_url_2, user_id, created_at")
      .eq("place_id", placeId)
      .order("created_at", { ascending: false });

    if (data) {
      const userIds = [...new Set(data.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles_limited")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.user_id, p.full_name])
      );

      const enriched = data.map((r) => ({
        ...r,
        reviewer_name: profileMap.get(r.user_id) || null,
      }));

      setReviews(enriched);
      setRatingCount(enriched.length);
      if (user) {
        const mine = enriched.find((r) => r.user_id === user.id);
        setUserReview(mine || null);
      }
    }
  };

  const reviewsWithContent = reviews.filter((r) => r.review_text || r.photo_url || r.photo_url_2);
  const starSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  const handleReviewSubmitted = () => {
    fetchReviews();
    onRatingChange?.();
  };

  return (
    <div className="flex flex-col gap-1">
      {/* Rating display */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              starSize,
              star <= (currentRating || 0)
                ? "text-amber-500 fill-amber-500"
                : "text-gray-300"
            )}
          />
        ))}
        {currentRating && (
          <span className="text-sm font-medium ml-1">
            {currentRating.toFixed(1)}
          </span>
        )}
      </div>

      {/* Info row */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
        {ratingCount > 0 && (
          <span>{ratingCount === 1 ? t("placeRating.reviewOne", { count: ratingCount }) : t("placeRating.reviewOther", { count: ratingCount })}</span>
        )}
        {userReview && (
          <span className="text-primary">{t("placeRating.yourRating", { rating: userReview.rating })}</span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 mt-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs px-2 gap-1"
          onClick={() => setReviewDialogOpen(true)}
        >
          <Star className="w-3 h-3" />
          {userReview ? t("placeRating.editReview") : t("placeRating.writeReview")}
        </Button>

        {reviewsWithContent.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2 gap-1"
            onClick={() => setShowReviews(!showReviews)}
          >
            <MessageSquare className="w-3 h-3" />
            {showReviews ? t("placeRating.hideReviews") : t("placeRating.viewReviews")}
          </Button>
        )}
      </div>

      {/* Reviews list */}
      {showReviews && reviewsWithContent.length > 0 && (
        <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
          {reviewsWithContent.map((review, i) => (
            <div key={i} className="bg-muted/50 rounded-lg p-2 text-xs space-y-1">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={cn(
                      "w-3 h-3",
                      s <= review.rating ? "text-amber-500 fill-amber-500" : "text-gray-300"
                    )}
                  />
                ))}
                <span className="ml-1 font-medium text-foreground">
                  {review.user_id === user?.id
                    ? t("placeRating.you")
                    : review.reviewer_name || t("placeRating.anonymous")}
                </span>
              </div>
              {review.review_text && (
                <p className="text-muted-foreground">{review.review_text}</p>
              )}
              {/* Review photos */}
              {(review.photo_url || review.photo_url_2) && (
                <div className="flex gap-1.5">
                  {review.photo_url && (
                    <img
                      src={review.photo_url}
                      alt={t("placeRating.reviewPhotoAlt", { n: 1 })}
                      className={cn(
                        "max-h-48 object-contain rounded-md bg-muted cursor-pointer hover:opacity-90 transition-opacity",
                        review.photo_url_2 ? "w-1/2" : "w-full"
                      )}
                      onClick={() => setLightboxUrl(review.photo_url)}
                    />
                  )}
                  {review.photo_url_2 && (
                    <img
                      src={review.photo_url_2}
                      alt={t("placeRating.reviewPhotoAlt", { n: 2 })}
                      className={cn(
                        "max-h-48 object-contain rounded-md bg-muted cursor-pointer hover:opacity-90 transition-opacity",
                        review.photo_url ? "w-1/2" : "w-full"
                      )}
                      onClick={() => setLightboxUrl(review.photo_url_2)}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <PlaceReviewDialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        placeId={placeId}
        placeName={placeName || t("placeRating.thisPlace")}
        existingRating={userReview?.rating}
        existingReviewText={userReview?.review_text}
        existingPhotoUrl={userReview?.photo_url}
        existingPhotoUrl2={userReview?.photo_url_2}
        onReviewSubmitted={handleReviewSubmitted}
      />
      {/* Photo Lightbox */}
      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-2 flex items-center justify-center">
          {lightboxUrl && (
            <img
              src={lightboxUrl}
              alt={t("placeRating.reviewFullSize")}
              className="max-w-full max-h-[85vh] object-contain rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlaceRating;
