import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Achievement {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

const ACHIEVEMENT_DEFINITIONS = [
  {
    type: "first_redemption",
    title: "First Timer",
    description: "Redeemed your first offer",
    icon: "🎯",
  },
  {
    type: "5_redemptions",
    title: "Regular",
    description: "Redeemed 5 offers",
    icon: "⭐",
  },
  {
    type: "10_redemptions",
    title: "Deal Hunter",
    description: "Redeemed 10 offers",
    icon: "🏅",
  },
  {
    type: "25_redemptions",
    title: "Super Saver",
    description: "Redeemed 25 offers",
    icon: "🏆",
  },
  {
    type: "saved_100",
    title: "Century Club",
    description: "Saved €100 total",
    icon: "💯",
  },
  {
    type: "saved_250",
    title: "Quarter Grand",
    description: "Saved €250 total",
    icon: "💎",
  },
  {
    type: "saved_500",
    title: "Half Grand Hero",
    description: "Saved €500 total",
    icon: "👑",
  },
  {
    type: "loyal_customer",
    title: "Loyal Customer",
    description: "Returned to the same business 3+ times",
    icon: "❤️",
  },
  {
    type: "referral_master",
    title: "Referral Master",
    description: "Referred 3 friends to Woofy",
    icon: "🤝",
  },
  {
    type: "all_categories",
    title: "Explorer",
    description: "Redeemed offers from 5+ different categories",
    icon: "🧭",
  },
];

export const useAchievements = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAchievements();
    }
  }, [user]);

  const fetchAchievements = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", user.id);

      const unlockedMap = new Map(
        (data || []).map((a) => [a.achievement_type, a.unlocked_at])
      );

      const allAchievements: Achievement[] = ACHIEVEMENT_DEFINITIONS.map((def) => ({
        id: def.type,
        type: def.type,
        title: def.title,
        description: def.description,
        icon: def.icon,
        unlocked: unlockedMap.has(def.type),
        unlockedAt: unlockedMap.get(def.type),
      }));

      setAchievements(allAchievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAndUnlockAchievement = async (
    type: string,
    data: Record<string, unknown> = {}
  ) => {
    if (!user) return false;

    // Check if already unlocked
    const existing = achievements.find((a) => a.type === type);
    if (existing?.unlocked) return false;

    try {
      const insertData = {
        user_id: user.id,
        achievement_type: type,
        achievement_data: JSON.parse(JSON.stringify(data)),
      };
      const { error } = await supabase.from("user_achievements").insert([insertData]);

      if (error) {
        if (error.code === "23505") return false; // Already exists
        throw error;
      }

      const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.type === type);
      if (def) {
        toast.success(`🎉 Achievement Unlocked: ${def.title}!`, {
          description: def.description,
        });
      }

      await fetchAchievements();
      return true;
    } catch (error) {
      console.error("Error unlocking achievement:", error);
      return false;
    }
  };

  const getUnlockedCount = () => achievements.filter((a) => a.unlocked).length;
  const getTotalCount = () => achievements.length;

  return {
    achievements,
    isLoading,
    checkAndUnlockAchievement,
    getUnlockedCount,
    getTotalCount,
    refetch: fetchAchievements,
  };
};
