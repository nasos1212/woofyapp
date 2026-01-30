import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LandingStats {
  partnerBusinesses: number;
  happyMembers: number;
  partnerShelters: number;
  isLoading: boolean;
}

export const useLandingStats = (): LandingStats => {
  const [stats, setStats] = useState<LandingStats>({
    partnerBusinesses: 0,
    happyMembers: 0,
    partnerShelters: 0,
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

        setStats({
          partnerBusinesses: businessesResult.count || 0,
          happyMembers: membersResult.count || 0,
          partnerShelters: sheltersResult.count || 0,
          isLoading: false,
        });
      } catch (error) {
        console.error("Error fetching landing stats:", error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchStats();
  }, []);

  return stats;
};
