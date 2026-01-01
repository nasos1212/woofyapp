import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface ReturningCustomerData {
  businessId: string;
  redemptionCount: number;
}

export const useReturningCustomer = () => {
  const { user } = useAuth();
  const [returningData, setReturningData] = useState<Map<string, number>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReturningData();
    }
  }, [user]);

  const fetchReturningData = async () => {
    if (!user) return;

    try {
      // Get membership ID
      const { data: membership } = await supabase
        .from("memberships")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      let membershipId = membership?.id;

      if (!membershipId) {
        const { data: share } = await supabase
          .from("membership_shares")
          .select("membership_id")
          .eq("shared_with_user_id", user.id)
          .maybeSingle();
        membershipId = share?.membership_id;
      }

      if (!membershipId) {
        setIsLoading(false);
        return;
      }

      // Get redemption counts per business
      const { data } = await supabase
        .from("offer_redemptions")
        .select("business_id")
        .eq("membership_id", membershipId);

      if (data) {
        const countMap = new Map<string, number>();
        data.forEach((r) => {
          const current = countMap.get(r.business_id) || 0;
          countMap.set(r.business_id, current + 1);
        });
        setReturningData(countMap);
      }
    } catch (error) {
      console.error("Error fetching returning customer data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isReturningCustomer = (businessId: string) => {
    return (returningData.get(businessId) || 0) >= 2;
  };

  const getRedemptionCount = (businessId: string) => {
    return returningData.get(businessId) || 0;
  };

  return {
    isReturningCustomer,
    getRedemptionCount,
    isLoading,
    refetch: fetchReturningData,
  };
};
