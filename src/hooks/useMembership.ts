import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Membership {
  id: string;
  member_number: string;
  plan_type: string;
  expires_at: string;
  is_active: boolean;
}

export const useMembership = () => {
  const { user, loading: authLoading } = useAuth();
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembership = async () => {
      if (!user) {
        setMembership(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("memberships")
          .select("id, member_number, plan_type, expires_at, is_active")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching membership:", error);
          setMembership(null);
        } else {
          setMembership(data);
        }
      } catch (err) {
        console.error("Error in useMembership:", err);
        setMembership(null);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchMembership();
    }
  }, [user, authLoading]);

  const hasMembership = !!membership && membership.is_active === true;
  const isExpired = membership ? new Date(membership.expires_at) < new Date() : false;

  return {
    membership,
    hasMembership,
    isExpired,
    loading: authLoading || loading,
  };
};
