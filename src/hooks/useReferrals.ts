import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface Referral {
  id: string;
  referred_user_id: string;
  status: string;
  created_at: string;
}

export const useReferrals = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    if (!user) return;

    try {
      // Get or create referral code
      const { data: codeData } = await supabase
        .from("referral_codes")
        .select("code")
        .eq("user_id", user.id)
        .maybeSingle();

      if (codeData) {
        setReferralCode(codeData.code);
      }

      // Get referrals made
      const { data: referralsData } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_user_id", user.id)
        .order("created_at", { ascending: false });

      if (referralsData) {
        setReferrals(referralsData);
      }
    } catch (error) {
      console.error("Error fetching referral data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReferralCode = async (userName: string) => {
    if (!user || referralCode) return referralCode;

    try {
      // Generate code using DB function
      const { data: codeResult } = await supabase.rpc("generate_referral_code", {
        user_name: userName,
      });

      const newCode = codeResult as string;

      // Insert the code
      const { error } = await supabase.from("referral_codes").insert({
        user_id: user.id,
        code: newCode,
      });

      if (error) {
        // Code might exist, regenerate
        const retryCode = `${newCode.slice(0, 4)}${Math.floor(Math.random() * 9999)
          .toString()
          .padStart(4, "0")}`;
        await supabase.from("referral_codes").insert({
          user_id: user.id,
          code: retryCode,
        });
        setReferralCode(retryCode);
        return retryCode;
      }

      setReferralCode(newCode);
      return newCode;
    } catch (error) {
      console.error("Error generating referral code:", error);
      return null;
    }
  };

  const applyReferralCode = async (code: string) => {
    if (!user) return false;

    try {
      // Find the referrer
      const { data: codeData } = await supabase
        .from("referral_codes")
        .select("user_id")
        .eq("code", code.toUpperCase())
        .maybeSingle();

      if (!codeData) {
        toast.error("Invalid referral code");
        return false;
      }

      if (codeData.user_id === user.id) {
        toast.error("You can't use your own referral code");
        return false;
      }

      // Check if already referred
      const { data: existingReferral } = await supabase
        .from("referrals")
        .select("id")
        .eq("referred_user_id", user.id)
        .maybeSingle();

      if (existingReferral) {
        toast.error("You've already used a referral code");
        return false;
      }

      // Create referral
      const { error } = await supabase.from("referrals").insert({
        referrer_user_id: codeData.user_id,
        referred_user_id: user.id,
        referral_code: code.toUpperCase(),
      });

      if (error) throw error;

      toast.success("Referral code applied successfully!");
      return true;
    } catch (error) {
      console.error("Error applying referral code:", error);
      toast.error("Failed to apply referral code");
      return false;
    }
  };

  const copyReferralCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      toast.success("Referral code copied!");
    }
  };

  const getCompletedReferrals = () =>
    referrals.filter((r) => r.status === "completed" || r.status === "rewarded").length;

  return {
    referralCode,
    referrals,
    isLoading,
    generateReferralCode,
    applyReferralCode,
    copyReferralCode,
    getCompletedReferrals,
    refetch: fetchReferralData,
  };
};
