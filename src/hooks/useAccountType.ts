import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export type AccountType = "business" | "shelter" | "member" | "unknown";

export const useAccountType = () => {
  const { user, loading: authLoading } = useAuth();
  const [accountType, setAccountType] = useState<AccountType>("unknown");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccountType = async () => {
      if (!user) {
        setAccountType("unknown");
        setLoading(false);
        return;
      }

      try {
        // Check records, roles, and membership in parallel. Actual partner records take priority;
        // stray partner roles should not override a real pet-owner membership.
        const [businessRoleResult, shelterRoleResult, businessRecordResult, shelterRecordResult, membershipResult] = await Promise.all([
          supabase
            .from("user_roles")
            .select("id")
            .eq("user_id", user.id)
            .eq("role", "business")
            .maybeSingle(),
          supabase
            .from("user_roles")
            .select("id")
            .eq("user_id", user.id)
            .eq("role", "shelter")
            .maybeSingle(),
          supabase
            .from("businesses")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("shelters")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("memberships")
            .select("id, is_active")
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);

        const hasActiveMembership = membershipResult.data?.is_active === true;

        if (shelterRecordResult.data) {
          setAccountType("shelter");
        } else if (businessRecordResult.data) {
          setAccountType("business");
        } else if (shelterRoleResult.data && !hasActiveMembership) {
          setAccountType("shelter");
        } else if (businessRoleResult.data && !hasActiveMembership) {
          setAccountType("business");
        } else {
          setAccountType("member");
        }
      } catch (error) {
        console.error("Error checking account type:", error);
        setAccountType("unknown");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkAccountType();
    }
  }, [user, authLoading]);

  return {
    accountType,
    isBusiness: accountType === "business",
    isShelter: accountType === "shelter",
    isMember: accountType === "member",
    loading: authLoading || loading,
  };
};
