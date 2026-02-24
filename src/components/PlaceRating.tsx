import { useState, useEffect } from "react";
import { Star, MessageSquare, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  user_id: string;
  created_at: string;
}

const PlaceRating = ({ placeId, placeName, currentRating, onRatingChange, size = "md" }: PlaceRatingProps) => {
  const { user } = useAuth();
  const [userReview, setUserReview] = useState<ReviewData | null>(null);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [showReviews, setShowReviews] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [user, placeId]);

  const fetchReviews = async () => {
    // Fetch all reviews for this place
    const { data } = await supabase
      .from("pet_friendly_place_ratings")
      .select("rating, review_text, photo_url, user_id, created_at")
      .eq("place_id", placeId)
      .order("created_at", { ascending: false });

    if (data) {
      setReviews(data);
      setRatingCount(data.length);
      if (user) {
        const mine = data.find((r) => r.user_id === user.id);
        setUserReview(mine || null);
      }
    }
  };

  const reviewsWithContent = reviews.filter((r) => r.review_text || r.photo_url);
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
          <span>({ratingCount} {ratingCount === 1 ? "review" : "reviews"})</span>
        )}
        {userReview && (
          <span className="text-primary">• Your rating: {userReview.rating}★</span>
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
          {userReview ? "Edit Review" : "Write Review"}
        </Button>

        {reviewsWithContent.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2 gap-1"
            onClick={() => setShowReviews(!showReviews)}
          >
            <MessageSquare className="w-3 h-3" />
            {showReviews ? "Hide" : `${reviewsWithContent.length}`}
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
                {review.user_id === user?.id && (
                  <span className="text-primary ml-1 font-medium">You</span>
                )}
              </div>
              {review.review_text && (
                <p className="text-muted-foreground">{review.review_text}</p>
              )}
              {review.photo_url && (
                <img
                  src={review.photo_url}
                  alt="Review photo"
                  className="w-full h-24 object-cover rounded-md"
                />
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
        placeName={placeName || "this place"}
        existingRating={userReview?.rating}
        existingReviewText={userReview?.review_text}
        existingPhotoUrl={userReview?.photo_url}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  );
};

export default PlaceRating;
