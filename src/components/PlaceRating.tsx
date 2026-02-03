import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface PlaceRatingProps {
  placeId: string;
  currentRating: number | null;
  onRatingChange?: () => void;
  size?: "sm" | "md";
}

const PlaceRating = ({ placeId, currentRating, onRatingChange, size = "md" }: PlaceRatingProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [ratingCount, setRatingCount] = useState<number>(0);

  useEffect(() => {
    if (user) {
      fetchUserRating();
    }
    fetchRatingCount();
  }, [user, placeId]);

  const fetchUserRating = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("pet_friendly_place_ratings")
      .select("rating")
      .eq("place_id", placeId)
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (data) {
      setUserRating(data.rating);
    }
  };

  const fetchRatingCount = async () => {
    const { count } = await supabase
      .from("pet_friendly_place_ratings")
      .select("*", { count: "exact", head: true })
      .eq("place_id", placeId);
    
    setRatingCount(count || 0);
  };

  const handleRate = async (rating: number) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to rate places.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (userRating) {
        // Update existing rating
        const { error } = await supabase
          .from("pet_friendly_place_ratings")
          .update({ rating, updated_at: new Date().toISOString() })
          .eq("place_id", placeId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Insert new rating
        const { error } = await supabase
          .from("pet_friendly_place_ratings")
          .insert({
            place_id: placeId,
            user_id: user.id,
            rating,
          });

        if (error) throw error;
      }

      setUserRating(rating);
      toast({
        title: "Thanks for rating! ⭐",
        description: userRating ? "Your rating has been updated." : "Your rating has been saved.",
      });
      
      onRatingChange?.();
      fetchRatingCount();
    } catch (error) {
      console.error("Error rating place:", error);
      toast({
        title: "Error",
        description: "Failed to save your rating. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const starSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const displayRating = hoveredRating || userRating || 0;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={isLoading}
            className={cn(
              "transition-transform hover:scale-110 disabled:opacity-50",
              isLoading && "cursor-not-allowed"
            )}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(null)}
            onClick={() => handleRate(star)}
          >
            <Star
              className={cn(
                starSize,
                "transition-colors",
                star <= displayRating
                  ? "text-amber-500 fill-amber-500"
                  : "text-gray-300"
              )}
            />
          </button>
        ))}
        {currentRating && (
          <span className="text-sm font-medium ml-1">
            {currentRating.toFixed(1)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {ratingCount > 0 && (
          <span>({ratingCount} {ratingCount === 1 ? "rating" : "ratings"})</span>
        )}
        {userRating && (
          <span className="text-primary">• Your rating: {userRating}★</span>
        )}
      </div>
    </div>
  );
};

export default PlaceRating;
