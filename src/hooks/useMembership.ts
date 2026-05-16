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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const useMembership = () => {
  const { user, loading: authLoading } = useAuth();
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchMembership = async () => {
      if (!user) {
        setMembership(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      // Retry on transient network errors ("TypeError: Load failed", aborted fetches, etc.)
      const MAX_ATTEMPTS = 4;
      let lastError: unknown = null;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          const { data, error } = await supabase
            .from("memberships")
            .select("id, member_number, plan_type, expires_at, is_active")
            .eq("user_id", user.id)
            .maybeSingle();

          if (cancelled) return;

          if (error) {
            lastError = error;
          } else {
            setMembership(data);
            setLoading(false);
            return;
          }
        } catch (err) {
          lastError = err;
        }

        if (cancelled) return;
        // Exponential backoff: 300ms, 600ms, 1200ms
        await sleep(300 * Math.pow(2, attempt - 1));
      }

      if (cancelled) return;
      console.error("Error fetching membership after retries:", lastError);
      // Keep previous membership state (don't downgrade on transient errors)
      setLoading(false);
    };

    if (!authLoading) {
      fetchMembership();
    }

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const hasMembership = !!membership && membership.is_active === true;
  const isPaidMember = hasMembership && membership!.plan_type !== 'free';
  const isFreeMember = hasMembership && membership!.plan_type === 'free';
  const isExpired = membership ? new Date(membership.expires_at) < new Date() : false;

  return {
    membership,
    hasMembership,
    isPaidMember,
    isFreeMember,
    isExpired,
    loading: authLoading || loading,
  };
};
