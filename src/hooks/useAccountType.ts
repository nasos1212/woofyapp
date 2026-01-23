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
        // Check roles and records in parallel for efficiency
        const [businessRoleResult, shelterRoleResult, shelterRecordResult] = await Promise.all([
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
            .from("shelters")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);

        // Shelter takes priority (check both role AND record)
        if (shelterRoleResult.data || shelterRecordResult.data) {
          setAccountType("shelter");
        } else if (businessRoleResult.data) {
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
