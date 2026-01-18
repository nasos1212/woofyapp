import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export type VerificationStatus = "pending" | "approved" | "rejected" | "unknown";

interface BusinessInfo {
  id: string;
  business_name: string;
  verification_status: VerificationStatus;
}

export const useBusinessVerification = () => {
  const { user, loading: authLoading } = useAuth();
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!user) {
        setBusiness(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("businesses")
          .select("id, business_name, verification_status")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching business:", error);
          setBusiness(null);
        } else if (data) {
          setBusiness({
            id: data.id,
            business_name: data.business_name,
            verification_status: data.verification_status as VerificationStatus,
          });
        } else {
          setBusiness(null);
        }
      } catch (error) {
        console.error("Error fetching business:", error);
        setBusiness(null);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchBusiness();
    }
  }, [user, authLoading]);

  return {
    business,
    isApproved: business?.verification_status === "approved",
    isPending: business?.verification_status === "pending",
    isRejected: business?.verification_status === "rejected",
    verificationStatus: business?.verification_status || "unknown",
    loading: authLoading || loading,
  };
};
