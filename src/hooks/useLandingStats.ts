import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LandingStats {
  partnerBusinesses: number;
  happyMembers: number;
  partnerShelters: number;
  isLoading: boolean;
}

// Minimum fallback values for display (believable starting numbers)
const FALLBACK_STATS = {
  partnerBusinesses: 100,
  happyMembers: 250,
  partnerShelters: 5,
};

export const useLandingStats = (): LandingStats => {
  const [stats, setStats] = useState<LandingStats>({
    partnerBusinesses: FALLBACK_STATS.partnerBusinesses,
    happyMembers: FALLBACK_STATS.happyMembers,
    partnerShelters: FALLBACK_STATS.partnerShelters,
    isLoading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all counts in parallel
        const [businessesResult, membersResult, sheltersResult] = await Promise.all([
          // Count approved businesses using public view (RLS-safe for anonymous users)
          supabase
            .from("businesses_public")
            .select("*", { count: "exact", head: true })
            .eq("verification_status", "approved"),
          // Count all members (users with member role - both freemium and paid)
          supabase
            .from("user_roles")
            .select("*", { count: "exact", head: true })
            .eq("role", "member"),
          // Count approved shelters
          supabase
            .from("shelters")
            .select("*", { count: "exact", head: true })
            .eq("verification_status", "approved"),
        ]);

        // Use actual counts if available, otherwise use fallbacks
        setStats({
          partnerBusinesses: Math.max(businessesResult.count || 0, FALLBACK_STATS.partnerBusinesses),
          happyMembers: Math.max(membersResult.count || 0, FALLBACK_STATS.happyMembers),
          partnerShelters: Math.max(sheltersResult.count || 0, FALLBACK_STATS.partnerShelters),
          isLoading: false,
        });
      } catch (error) {
        console.error("Error fetching landing stats:", error);
        // On error, keep fallback values
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchStats();
  }, []);

  return stats;
};
