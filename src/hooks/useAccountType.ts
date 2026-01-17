import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export type AccountType = "business" | "member" | "unknown";

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
        // Check if user has business role
        const { data: businessRole } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", user.id)
          .eq("role", "business")
          .maybeSingle();

        if (businessRole) {
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
    isMember: accountType === "member",
    loading: authLoading || loading,
  };
};
