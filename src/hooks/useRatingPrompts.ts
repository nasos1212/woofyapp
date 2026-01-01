import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface RatingPrompt {
  id: string;
  business_id: string;
  redemption_id: string;
  prompt_after: string;
  prompted_at: string | null;
  dismissed: boolean;
  business?: {
    business_name: string;
  };
}

export const useRatingPrompts = () => {
  const { user } = useAuth();
  const [pendingPrompts, setPendingPrompts] = useState<RatingPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPendingPrompts = useCallback(async () => {
    if (!user) return;

    try {
      const now = new Date().toISOString();

      // Get prompts that are due and not dismissed
      const { data } = await supabase
        .from("rating_prompts")
        .select(`
          id,
          business_id,
          redemption_id,
          prompt_after,
          prompted_at,
          dismissed,
          business:businesses(business_name)
        `)
        .eq("user_id", user.id)
        .eq("dismissed", false)
        .is("prompted_at", null)
        .lte("prompt_after", now);

      if (data) {
        // Check if user has already reviewed these businesses
        const businessIds = data.map((p) => p.business_id);
        const { data: existingReviews } = await supabase
          .from("business_reviews")
          .select("business_id")
          .eq("user_id", user.id)
          .in("business_id", businessIds);

        const reviewedBusinessIds = new Set(
          (existingReviews || []).map((r) => r.business_id)
        );

        // Filter out already reviewed
        const filtered = data.filter(
          (p) => !reviewedBusinessIds.has(p.business_id)
        );

        setPendingPrompts(
          filtered.map((p) => ({
            ...p,
            business: p.business as unknown as { business_name: string },
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching rating prompts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPendingPrompts();
    }
  }, [user, fetchPendingPrompts]);

  const dismissPrompt = async (promptId: string) => {
    if (!user) return;

    try {
      await supabase
        .from("rating_prompts")
        .update({ dismissed: true })
        .eq("id", promptId);

      setPendingPrompts((prev) => prev.filter((p) => p.id !== promptId));
    } catch (error) {
      console.error("Error dismissing prompt:", error);
    }
  };

  const markAsPrompted = async (promptId: string) => {
    if (!user) return;

    try {
      await supabase
        .from("rating_prompts")
        .update({ prompted_at: new Date().toISOString() })
        .eq("id", promptId);

      setPendingPrompts((prev) => prev.filter((p) => p.id !== promptId));
    } catch (error) {
      console.error("Error marking prompt:", error);
    }
  };

  const createRatingPrompt = async (
    businessId: string,
    redemptionId: string,
    hoursDelay: number = 2
  ) => {
    if (!user) return;

    try {
      const promptAfter = new Date();
      promptAfter.setHours(promptAfter.getHours() + hoursDelay);

      await supabase.from("rating_prompts").insert({
        user_id: user.id,
        business_id: businessId,
        redemption_id: redemptionId,
        prompt_after: promptAfter.toISOString(),
      });
    } catch (error) {
      console.error("Error creating rating prompt:", error);
    }
  };

  return {
    pendingPrompts,
    isLoading,
    dismissPrompt,
    markAsPrompted,
    createRatingPrompt,
    refetch: fetchPendingPrompts,
  };
};
