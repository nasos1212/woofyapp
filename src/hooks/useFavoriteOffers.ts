import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useFavoriteOffers = () => {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from("favorite_offers")
        .select("offer_id")
        .eq("user_id", user.id);

      if (data) {
        setFavoriteIds(new Set(data.map((f) => f.offer_id)));
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async (offerId: string) => {
    if (!user) return;

    const isFavorited = favoriteIds.has(offerId);

    if (isFavorited) {
      // Remove favorite
      setFavoriteIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(offerId);
        return newSet;
      });

      await supabase
        .from("favorite_offers")
        .delete()
        .eq("user_id", user.id)
        .eq("offer_id", offerId);
    } else {
      // Add favorite
      setFavoriteIds((prev) => new Set(prev).add(offerId));

      await supabase
        .from("favorite_offers")
        .insert({ user_id: user.id, offer_id: offerId });
    }
  };

  const isFavorite = (offerId: string) => favoriteIds.has(offerId);

  return { favoriteIds, toggleFavorite, isFavorite, isLoading, refetch: fetchFavorites };
};
