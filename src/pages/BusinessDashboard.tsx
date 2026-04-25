import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ScanLine, CheckCircle2, XCircle, Clock, Users, TrendingUp, Gift, Building2, Bell, AlertCircle, Camera, X, BarChart3, Tag, Cake, HelpCircle, Dog, Cat, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Scanner } from "@yudiel/react-qr-scanner";
import ConfettiCelebration from "@/components/ConfettiCelebration";
import { useSuccessSound } from "@/hooks/useSuccessSound";
import BusinessMobileNav from "@/components/BusinessMobileNav";
import BusinessHeader from "@/components/BusinessHeader";
import { useBusinessVerification } from "@/hooks/useBusinessVerification";
import PendingApprovalBanner from "@/components/PendingApprovalBanner";
import ContactPopover from "@/components/ContactPopover";
import { formatDate } from "@/lib/utils";
import BusinessOnboardingTour from "@/components/BusinessOnboardingTour";

interface AvailablePet {
  id: string;
  name: string;
}

interface PendingBirthdayOffer {
  id: string;
  pet_name: string;
  discount_value: number;
  discount_type: string;
  message: string;
  business_id: string;
  sent_at: string;
}

interface ScanResult {
  status: 'valid' | 'expired' | 'invalid' | 'already_redeemed' | 'rate_limited' | 'limit_reached';
  memberName?: string;
  petName?: string;
  memberId?: string;
  membershipId?: string;
  expiryDate?: string;
  discount?: string;
  offerId?: string;
  offerTitle?: string;
  attemptsRemaining?: number;
  lockoutExpiresAt?: string;
  remainingMinutes?: number;
  message?: string;
  offerType?: 'per_member' | 'per_pet';
  offerPetType?: 'dog' | 'cat' | null;
  availablePets?: AvailablePet[];
  totalPets?: number;
  redeemedPetsCount?: number;
  pendingBirthdayOffers?: PendingBirthdayOffer[];
}

interface Redemption {
  id: string;
  redeemed_at: string;
  member_name: string | null;
  pet_names: string | null;
  member_number: string | null;
  membership_id?: string | null;
  isBirthday?: boolean;
  offer: {
    title: string;
    discount_value: number;
    discount_type: string;
  };
}

const BusinessDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { playSuccessSound } = useSuccessSound();
  const { isApproved, verificationStatus, loading: verificationLoading } = useBusinessVerification();
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [memberIdInput, setMemberIdInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [business, setBusiness] = useState<{ id: string; business_name: string } | null>(null);
  const [offers, setOffers] = useState<{ id: string; title: string; discount_value: number; discount_type: string }[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string>("");
  const [recentRedemptions, setRecentRedemptions] = useState<Redemption[]>([]);
  const [stats, setStats] = useState({ redemptions: 0, newCustomers: 0 });
  const [isCheckingBusiness, setIsCheckingBusiness] = useState(true);
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [isRedeemingBirthday, setIsRedeemingBirthday] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?type=business");
      return;
    }
    if (user) {
      fetchBusinessData();
    }
  }, [user, loading, navigate]);

  const fetchBusinessData = async () => {
    if (!user) return;

    setIsCheckingBusiness(true);
    
    // Fetch business
    const { data: businessData } = await supabase
      .from('businesses')
      .select('id, business_name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!businessData) {
      // User doesn't have a business - redirect to registration
      navigate("/partner-register");
      return;
    }
    
    setBusiness(businessData);
    setIsCheckingBusiness(false);

    // Fetch active offers for the business
    const { data: offersData, error: offersError } = await supabase
      .from('offers')
      .select('id, title, discount_value, discount_type, is_active')
      .eq('business_id', businessData.id)
      .eq('is_active', true);

    console.log('Offers query result:', { offersData, offersError, businessId: businessData.id });

    if (offersError) {
      console.error('Error fetching offers:', offersError);
    }

    if (offersData && offersData.length > 0) {
      setOffers(offersData);
      // Default to "birthday" verification option
      setSelectedOfferId("birthday");
    } else {
      setOffers([]);
      setSelectedOfferId("birthday");
    }

    // Fetch ALL regular redemptions for this business
    const { data: allRedemptionsData } = await supabase
      .from('offer_redemptions')
      .select(`
        id,
        redeemed_at,
        member_name,
        pet_names,
        member_number,
        membership_id,
        offer:offers(title, discount_value, discount_type)
      `)
      .eq('business_id', businessData.id)
      .order('redeemed_at', { ascending: true });

    // Fetch ALL birthday redemptions for this business (with pet_id to get membership)
    const { data: birthdayRedemptionsData } = await supabase
      .from('sent_birthday_offers')
      .select(`
        id,
        redeemed_at,
        pet_name,
        pet_id,
        owner_name,
        owner_user_id,
        discount_value,
        discount_type
      `)
      .eq('redeemed_by_business_id', businessData.id)
      .not('redeemed_at', 'is', null)
      .order('redeemed_at', { ascending: true });

    // Get pet IDs from birthday redemptions to lookup their membership_ids
    const petIds = [...new Set((birthdayRedemptionsData || []).map(r => r.pet_id).filter(Boolean))];
    let petToMembershipMap: Record<string, string> = {};
    
    if (petIds.length > 0) {
      const { data: petsData } = await supabase
        .from('pets')
        .select('id, membership_id')
        .in('id', petIds);
      
      (petsData || []).forEach(pet => {
        petToMembershipMap[pet.id] = pet.membership_id;
      });
    }

    // Also build a mapping from owner_user_id to membership_id using regular redemptions + pets
    // Collect all membership_ids from regular redemptions
    const membershipIds = [...new Set((allRedemptionsData || []).map(r => r.membership_id))];
    let userToMembershipMap: Record<string, string> = {};
    
    if (membershipIds.length > 0) {
      // Get the user_id for each membership
      const { data: membershipsData } = await supabase
        .from('memberships')
        .select('id, user_id')
        .in('id', membershipIds);
      
      (membershipsData || []).forEach(m => {
        userToMembershipMap[m.user_id] = m.id;
      });
    }

    // Get all unique membership IDs from birthday redemptions to fetch member_numbers
    const birthdayMembershipIds = [...new Set(
      (birthdayRedemptionsData || [])
        .map(r => r.pet_id ? petToMembershipMap[r.pet_id] : null)
        .filter(Boolean)
    )];
    let membershipToNumberMap: Record<string, string> = {};
    
    if (birthdayMembershipIds.length > 0) {
      const { data: membershipNumbersData } = await supabase
        .from('memberships')
        .select('id, member_number')
        .in('id', birthdayMembershipIds);
      
      (membershipNumbersData || []).forEach(m => {
        membershipToNumberMap[m.id] = m.member_number;
      });
    }

    // Combine regular and birthday redemptions
    const regularRedemptions: Redemption[] = (allRedemptionsData || []).map(r => ({
      id: r.id,
      redeemed_at: r.redeemed_at,
      member_name: r.member_name,
      pet_names: r.pet_names,
      member_number: r.member_number,
      membership_id: r.membership_id,
      isBirthday: false,
      offer: r.offer as unknown as Redemption['offer'],
    }));

    // For birthday redemptions, use pet_id to get membership_id for proper customer tracking
    const birthdayRedemptions: Redemption[] = (birthdayRedemptionsData || []).map(r => {
      // Try to get membership_id from pet first
      let membershipId = r.pet_id ? petToMembershipMap[r.pet_id] : null;
      
      // If not found, try user_id mapping
      if (!membershipId && r.owner_user_id) {
        membershipId = userToMembershipMap[r.owner_user_id];
      }

      // Get member_number from the membership
      const memberNumber = membershipId ? membershipToNumberMap[membershipId] : null;
      
      return {
        id: r.id,
        redeemed_at: r.redeemed_at!,
        member_name: r.owner_name,
        pet_names: r.pet_name,
        member_number: memberNumber,
        // Use the looked-up membership_id for proper customer tracking
        membership_id: membershipId || r.owner_user_id, // Fallback to owner_user_id
        isBirthday: true,
        offer: {
          title: t("businessDashboard.recent.birthdayOfferTitle", { pet: r.pet_name }),
          discount_value: r.discount_value,
          discount_type: r.discount_type,
        },
      };
    });

    // Combine all redemptions
    const allCombinedRedemptions = [...regularRedemptions, ...birthdayRedemptions];

    // Get recent 10 for display (sorted by most recent first)
    const recentCombined = [...allCombinedRedemptions]
      .sort((a, b) => new Date(b.redeemed_at).getTime() - new Date(a.redeemed_at).getTime())
      .slice(0, 10);
    setRecentRedemptions(recentCombined);

    // Calculate stats - include both regular and birthday redemptions
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlyRedemptions = allCombinedRedemptions.filter(r => 
      new Date(r.redeemed_at) >= thisMonth
    );

    // Calculate first-time customers this month
    // Track when each membership/user first redeemed at this business
    const firstRedemptionByMember: Record<string, Date> = {};
    allCombinedRedemptions
      .sort((a, b) => new Date(a.redeemed_at).getTime() - new Date(b.redeemed_at).getTime())
      .forEach(r => {
        const memberKey = r.membership_id || r.id; // Use id as fallback
        if (memberKey && !firstRedemptionByMember[memberKey]) {
          firstRedemptionByMember[memberKey] = new Date(r.redeemed_at);
        }
      });

    // Count members whose first redemption was this month
    const newCustomersThisMonth = Object.values(firstRedemptionByMember).filter(
      firstDate => firstDate >= thisMonth
    ).length;

    setStats({
      redemptions: monthlyRedemptions.length,
      newCustomers: newCustomersThisMonth,
    });
  };

  const verifyMember = async () => {
    if (!memberIdInput.trim() || !business) {
      toast({
        title: t("businessDashboard.verification.missingTitle"),
        description: t("businessDashboard.verification.missingDesc"),
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    setScanResult(null);

    try {
      // Get current session to ensure we have a valid token
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session) {
        console.error('No active session - user needs to re-login');
        toast({
          title: t("businessDashboard.verification.sessionExpiredTitle"),
          description: t("businessDashboard.verification.sessionExpiredDesc"),
          variant: "destructive",
        });
        return;
      }

      console.log('Calling verify-member with session:', !!sessionData.session);

      // Use edge function for rate-limited verification
      // Pass null for offerId when "birthday" is selected (birthday-only verification)
      const actualOfferId = selectedOfferId === "birthday" ? null : selectedOfferId;
      const { data, error } = await supabase.functions.invoke('verify-member', {
        body: {
          memberId: memberIdInput.trim(),
          offerId: actualOfferId,
          businessId: business.id,
        },
      });

      console.log('verify-member response:', { data, error });

      if (error) {
        console.error('Verification error:', error);
        
        // Check if it's an auth error
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          toast({
            title: t("businessDashboard.verification.authErrorTitle"),
            description: t("businessDashboard.verification.authErrorDesc"),
            variant: "destructive",
          });
          return;
        }
        
        // Check if it's a rate limit error
        if (error.message?.includes('429') || error.message?.includes('rate')) {
          setScanResult({ 
            status: 'rate_limited',
            remainingMinutes: 30,
          });
          toast({
            title: t("businessDashboard.verification.tooManyTitle"),
            description: t("businessDashboard.verification.tooManyDesc"),
            variant: "destructive",
          });
          return;
        }
        
        setScanResult({ status: 'invalid' });
        return;
      }

      // Handle rate limit response
      if (data.code === 'RATE_LIMITED') {
        setScanResult({
          status: 'rate_limited',
          lockoutExpiresAt: data.lockoutExpiresAt,
          remainingMinutes: data.remainingMinutes,
        });
        toast({
          title: t("businessDashboard.verification.tooManyFailedTitle"),
          description: t("businessDashboard.verification.tooManyFailedDesc", { minutes: data.remainingMinutes }),
          variant: "destructive",
        });
        return;
      }

      // Set the scan result from the edge function response
      setScanResult(data);

      // Show warning if running low on attempts
      if (data.attemptsRemaining !== undefined && data.attemptsRemaining <= 3) {
        toast({
          title: t("businessDashboard.verification.warningTitle"),
          description: t("businessDashboard.verification.attemptsRemaining", { count: data.attemptsRemaining }),
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Verification error:', error);
      setScanResult({ status: 'invalid' });
    } finally {
      setIsVerifying(false);
    }
  };

  const confirmRedemption = async () => {
    if (!scanResult || scanResult.status !== 'valid' || !business || !user) return;

    // For per-pet offers, require pet selection (optional for per-member offers)
    if (scanResult.offerType === 'per_pet' && !selectedPetId) {
      toast({
        title: t("businessDashboard.result.selectPetTitle"),
        description: t("businessDashboard.result.selectPetDesc"),
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        toast({
          title: t("businessDashboard.verification.sessionExpiredTitle"),
          description: t("businessDashboard.verification.sessionExpiredDesc"),
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('confirm-redemption', {
        body: {
          membershipId: scanResult.membershipId,
          offerId: scanResult.offerId,
          businessId: business.id,
          petId: selectedPetId || null,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (error) {
        console.error('Redemption error:', error);
        throw error;
      }

      if (data.error) {
        if (data.code === 'ALREADY_REDEEMED') {
          toast({
            title: t("businessDashboard.result.alreadyRedeemedTitle"),
            description: t("businessDashboard.result.alreadyRedeemedDescOffer"),
            variant: "destructive",
          });
        } else {
          throw new Error(data.error);
        }
        return;
      }

      // Trigger celebration animation and sound
      setShowCelebration(true);
      playSuccessSound();

      toast({
        title: t("businessDashboard.result.redemptionConfirmedTitle"),
        description: t("businessDashboard.result.redemptionConfirmedDesc", { name: scanResult.memberName, discount: data.redemption.discount }),
      });

      setScanResult(null);
      setMemberIdInput("");
      setSelectedPetId("");
      fetchBusinessData();

    } catch (error) {
      console.error('Redemption error:', error);
      toast({
        title: t("businessDashboard.result.redemptionFailedTitle"),
        description: t("businessDashboard.result.redemptionFailedDesc"),
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const redeemBirthdayOffer = async (birthdayOfferId: string) => {
    if (!business) return;

    setIsRedeemingBirthday(birthdayOfferId);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        toast({
          title: t("businessDashboard.verification.sessionExpiredTitle"),
          description: t("businessDashboard.verification.sessionExpiredDesc"),
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('redeem-birthday-offer', {
        body: {
          birthdayOfferId,
          businessId: business.id,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (error) {
        console.error('Birthday redemption error:', error);
        throw error;
      }

      if (data.error) {
        if (data.code === 'ALREADY_REDEEMED') {
          toast({
            title: t("businessDashboard.birthdayOffers.alreadyRedeemedTitle"),
            description: t("businessDashboard.birthdayOffers.alreadyRedeemedDesc"),
            variant: "destructive",
          });
        } else {
          throw new Error(data.error);
        }
        return;
      }

      // Trigger celebration
      setShowCelebration(true);
      playSuccessSound();

      toast({
        title: t("businessDashboard.birthdayOffers.successTitle"),
        description: t("businessDashboard.birthdayOffers.successDesc", { pet: data.redemption.pet_name, discount: data.redemption.discount }),
      });

      // Remove this birthday offer from the scan result
      if (scanResult && scanResult.pendingBirthdayOffers) {
        setScanResult({
          ...scanResult,
          pendingBirthdayOffers: scanResult.pendingBirthdayOffers.filter(o => o.id !== birthdayOfferId),
        });
      }

    } catch (error) {
      console.error('Birthday redemption error:', error);
      toast({
        title: t("businessDashboard.birthdayOffers.failTitle"),
        description: t("businessDashboard.birthdayOffers.failDesc"),
        variant: "destructive",
      });
    } finally {
      setIsRedeemingBirthday(null);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return t("businessDashboard.time.justNow");
    if (diffMins < 60) return t("businessDashboard.time.minsAgo", { count: diffMins });
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return t("businessDashboard.time.hoursAgo", { count: diffHours });
    return formatDate(date);
  };

  const handleQrScan = (result: { rawValue: string }[]) => {
    if (result && result.length > 0) {
      const scannedValue = result[0].rawValue;
      // Extract member ID from QR code URL or direct value
      let memberId = scannedValue;
      
      // If it's a verification URL, extract the member ID
      if (scannedValue.includes('/verify/')) {
        const parts = scannedValue.split('/verify/');
        memberId = parts[parts.length - 1];
      } else if (scannedValue.startsWith('WF-') || scannedValue.startsWith('PP-')) {
        memberId = scannedValue;
      }
      
      setMemberIdInput(memberId);
      setIsScannerOpen(false);
      
      toast({
        title: t("businessDashboard.verification.qrScannedTitle"),
        description: t("businessDashboard.verification.qrScannedDesc", { id: memberId }),
      });
    }
  };

  // Show loading while checking for business
  if (loading || isCheckingBusiness || verificationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("businessDashboard.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{business?.business_name ? t("businessDashboard.metaTitle", { name: business.business_name }) : t("businessDashboard.metaTitleFallback")}</title>
        <meta name="description" content={t("businessDashboard.metaDesc")} />
      </Helmet>

      {/* Celebration Animation */}
      <ConfettiCelebration 
        isActive={showCelebration} 
        onComplete={() => setShowCelebration(false)} 
      />

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <BusinessHeader />
        <BusinessOnboardingTour />

        <main className="container mx-auto px-4 py-8 pt-[calc(6rem+env(safe-area-inset-top))] md:pt-[calc(7rem+env(safe-area-inset-top))]">
          {/* Pending Approval Banner */}
          <PendingApprovalBanner status={verificationStatus} />

          {/* Welcome */}
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              {business?.business_name || t("businessDashboard.fallbackTitle")}
            </h1>
            <p className="text-slate-500">{t("businessDashboard.subtitle")}</p>
          </div>


          {/* Quick Navigation */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {isApproved ? (
              <Link 
                to="/business/offers" 
                className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl border border-slate-200 hover:border-primary hover:shadow-md transition-all group text-center sm:text-left"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Tag className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{t("businessDashboard.nav.offers")}</h3>
                  <p className="text-xs sm:text-sm text-slate-500">{t("businessDashboard.nav.offersActive", { count: offers.length })}</p>
                </div>
              </Link>
            ) : (
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200 text-center sm:text-left opacity-60 cursor-not-allowed">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                  <Tag className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-500 text-sm sm:text-base">{t("businessDashboard.nav.offers")}</h3>
                  <p className="text-xs sm:text-sm text-slate-400">{t("businessDashboard.nav.pending")}</p>
                </div>
              </div>
            )}
            {isApproved ? (
              <Link 
                to="/business/history" 
                className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl border border-slate-200 hover:border-primary hover:shadow-md transition-all group text-center sm:text-left"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{t("businessDashboard.nav.redemptions")}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">{t("businessDashboard.nav.viewHistory")}</p>
                </div>
              </Link>
            ) : (
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200 text-center sm:text-left opacity-60 cursor-not-allowed">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-500 text-sm sm:text-base">{t("businessDashboard.nav.redemptions")}</h3>
                  <p className="text-xs sm:text-sm text-slate-400 hidden sm:block">{t("businessDashboard.nav.pending")}</p>
                </div>
              </div>
            )}
            {isApproved ? (
              <Link 
                to="/business/analytics" 
                className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl border border-slate-200 hover:border-primary hover:shadow-md transition-all group text-center sm:text-left"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{t("businessDashboard.nav.analytics")}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">{t("businessDashboard.nav.insights")}</p>
                </div>
              </Link>
            ) : (
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200 text-center sm:text-left opacity-60 cursor-not-allowed">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-500 text-sm sm:text-base">{t("businessDashboard.nav.analytics")}</h3>
                  <p className="text-xs sm:text-sm text-slate-400 hidden sm:block">{t("businessDashboard.nav.pending")}</p>
                </div>
              </div>
            )}
            {isApproved ? (
              <Link 
                to="/business/birthdays" 
                className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl border border-slate-200 hover:border-pink-400 hover:shadow-md transition-all group text-center sm:text-left"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-100 rounded-lg flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                  <Cake className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{t("businessDashboard.nav.birthdays")}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">{t("businessDashboard.nav.celebrate")}</p>
                </div>
              </Link>
            ) : (
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200 text-center sm:text-left opacity-60 cursor-not-allowed">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                  <Cake className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-500 text-sm sm:text-base">{t("businessDashboard.nav.birthdays")}</h3>
                  <p className="text-xs sm:text-sm text-slate-400 hidden sm:block">{t("businessDashboard.nav.pending")}</p>
                </div>
              </div>
            )}
            {/* Settings - Always accessible */}
            <Link 
              to="/business/settings" 
              className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl border border-slate-200 hover:border-primary hover:shadow-md transition-all group text-center sm:text-left"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{t("businessDashboard.nav.settings")}</h3>
                <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">{t("businessDashboard.nav.profile")}</p>
              </div>
            </Link>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Scanner */}
            <div className="lg:col-span-2 space-y-8">
              {/* Member Verification */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h2 className="font-display text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <ScanLine className="w-5 h-5 text-primary" />
                  {t("businessDashboard.verification.title")}
                </h2>
                <p className="text-sm text-slate-500 mb-6">
                  <Trans i18nKey="businessDashboard.verification.tip" components={{ strong: <span className="font-medium" /> }} />
                </p>

                {!isApproved ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="font-semibold text-slate-600 mb-2">{t("businessDashboard.verification.unavailableTitle")}</h3>
                    <p className="text-sm text-slate-500">
                      {t("businessDashboard.verification.unavailableDesc")}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* QR Scanner Modal */}
                {isScannerOpen && (
                  <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
                      <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="font-display font-semibold text-slate-900">{t("businessDashboard.verification.scanQr")}</h3>
                        <button 
                          onClick={() => setIsScannerOpen(false)}
                          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                        >
                          <X className="w-5 h-5 text-slate-500" />
                        </button>
                      </div>
                      <div className="p-4">
                        <div className="aspect-square rounded-xl overflow-hidden bg-black">
                          <Scanner
                            onScan={handleQrScan}
                            onError={(error) => {
                              console.error('Scanner error:', error);
                              toast({
                                title: t("businessDashboard.verification.cameraErrorTitle"),
                                description: t("businessDashboard.verification.cameraErrorDesc"),
                                variant: "destructive",
                              });
                            }}
                            styles={{
                              container: { width: '100%', height: '100%' },
                              video: { width: '100%', height: '100%', objectFit: 'cover' },
                            }}
                          />
                        </div>
                        <p className="text-center text-sm text-slate-500 mt-4">
                          {t("businessDashboard.verification.pointCamera")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Verification Form */}
                <div className="space-y-4 mb-6">
                  {/* Camera Scanner Button */}
                  <Button 
                    onClick={() => setIsScannerOpen(true)}
                    variant="outline"
                    className="w-full gap-2 border-primary text-primary hover:bg-primary/5"
                  >
                    <Camera className="w-5 h-5" />
                    {t("businessDashboard.verification.openCamera")}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-slate-500">{t("businessDashboard.verification.orManual")}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t("businessDashboard.verification.memberId")}
                    </label>
                    <Input
                      placeholder={t("businessDashboard.verification.memberIdPlaceholder")}
                      value={memberIdInput}
                      onChange={(e) => setMemberIdInput(e.target.value)}
                      className="font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t("businessDashboard.verification.verificationType")}
                    </label>
                    <select
                      value={selectedOfferId}
                      onChange={(e) => setSelectedOfferId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                    >
                      <option value="birthday">{t("businessDashboard.verification.birthdayVerification")}</option>
                      {offers.map(offer => (
                        <option key={offer.id} value={offer.id}>
                          {t("businessDashboard.verification.offerOption", { title: offer.title, value: offer.discount_value, symbol: offer.discount_type === 'percentage' ? '%' : '€' })}
                        </option>
                      ))}
                    </select>
                    {selectedOfferId === "birthday" && (
                      <p className="text-xs text-pink-600 mt-1">
                        {t("businessDashboard.verification.birthdayHint", "Check for birthday offers available for this member")}
                      </p>
                    )}
                  </div>

                  <Button 
                    onClick={verifyMember} 
                    disabled={isVerifying || !memberIdInput.trim()}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {isVerifying ? t("businessDashboard.verification.verifying") : t("businessDashboard.verification.verifyBtn")}
                  </Button>
                </div>

                {/* Scan Result */}
                {scanResult && (
                  <div className={`rounded-xl p-6 ${
                    scanResult.status === 'valid' ? 'bg-green-50 border border-green-200' :
                    scanResult.status === 'expired' ? 'bg-amber-50 border border-amber-200' :
                    scanResult.status === 'already_redeemed' ? 'bg-orange-50 border border-orange-200' :
                    scanResult.status === 'limit_reached' ? 'bg-purple-50 border border-purple-200' :
                    'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-start gap-4">
                      {scanResult.status === 'valid' && <CheckCircle2 className="w-8 h-8 text-green-500 flex-shrink-0" />}
                      {scanResult.status === 'expired' && <Clock className="w-8 h-8 text-amber-500 flex-shrink-0" />}
                      {scanResult.status === 'already_redeemed' && <AlertCircle className="w-8 h-8 text-orange-500 flex-shrink-0" />}
                      {scanResult.status === 'limit_reached' && <AlertCircle className="w-8 h-8 text-purple-500 flex-shrink-0" />}
                      {scanResult.status === 'invalid' && <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />}
                      
                      <div className="flex-1">
                        <h3 className={`font-display font-semibold text-lg mb-2 ${
                          scanResult.status === 'valid' ? 'text-green-700' :
                          scanResult.status === 'expired' ? 'text-amber-700' :
                          scanResult.status === 'already_redeemed' ? 'text-orange-700' :
                          scanResult.status === 'limit_reached' ? 'text-purple-700' :
                          'text-red-700'
                        }`}>
                          {scanResult.status === 'valid' && t("businessDashboard.result.valid")}
                          {scanResult.status === 'expired' && t("businessDashboard.result.expired")}
                          {scanResult.status === 'already_redeemed' && t("businessDashboard.result.alreadyRedeemed")}
                          {scanResult.status === 'limit_reached' && t("businessDashboard.result.limitReached")}
                          {scanResult.status === 'invalid' && t("businessDashboard.result.invalid")}
                        </h3>

                        {scanResult.status !== 'invalid' && (
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-slate-500">{t("businessDashboard.result.member")}</p>
                              <p className="font-medium text-slate-900">{scanResult.memberName}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">{t("businessDashboard.result.pet")}</p>
                              <p className="font-medium text-slate-900">{scanResult.petName}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">{t("businessDashboard.result.memberIdLabel")}</p>
                              <p className="font-mono text-xs text-slate-900">{scanResult.memberId}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">{t("businessDashboard.result.expiryDate")}</p>
                              <p className={`font-medium ${scanResult.status === 'expired' ? 'text-red-600' : 'text-slate-900'}`}>
                                {scanResult.expiryDate}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Only show Apply Discount section when a regular offer is selected (not birthday verification) */}
                        {scanResult.status === 'valid' && scanResult.offerId && (
                          <div className="mt-4 p-3 bg-green-100 rounded-lg">
                            <p className="text-green-800 font-medium">
                              {t("businessDashboard.result.applyDiscount", { discount: scanResult.discount })}
                            </p>
                            {scanResult.offerType === 'per_pet' && scanResult.availablePets && (
                              <p className="text-green-700 text-sm mt-1">
                                {t("businessDashboard.result.perPetInfo", { icon: scanResult.offerPetType === 'cat' ? '🐱' : '🐕', used: scanResult.redeemedPetsCount, total: scanResult.totalPets })}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Pet selector - only show for regular offers, not birthday verification */}
                        {scanResult.status === 'valid' && scanResult.offerId && scanResult.availablePets && scanResult.availablePets.length > 0 && (
                          <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-lg">
                            <label className="block text-sm font-medium text-teal-800 mb-2 flex items-center gap-2">
                              {scanResult.offerPetType === 'cat' ? <Cat className="w-4 h-4" /> : <Dog className="w-4 h-4" />}
                              {scanResult.offerType === 'per_pet' 
                                ? t("businessDashboard.result.selectPetPerPet", { type: scanResult.offerPetType === 'cat' ? t("businessDashboard.result.catLabel") : t("businessDashboard.result.petLabel") })
                                : t("businessDashboard.result.selectPetOptional")}
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {scanResult.availablePets.map((pet) => (
                                <button
                                  key={pet.id}
                                  onClick={() => setSelectedPetId(pet.id)}
                                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                                    selectedPetId === pet.id
                                      ? 'border-teal-500 bg-teal-100 text-teal-800'
                                      : 'border-teal-200 bg-white hover:border-teal-300'
                                  }`}
                                >
                                  <span className="font-medium">{pet.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {scanResult.status === 'expired' && (
                          <div className="mt-4 p-3 bg-amber-100 rounded-lg">
                            <p className="text-amber-800 text-sm">
                              {t("businessDashboard.result.expiredMsg")}
                            </p>
                          </div>
                        )}

                        {scanResult.status === 'already_redeemed' && (
                          <div className="mt-4 p-3 bg-orange-100 rounded-lg">
                            <p className="text-orange-800 text-sm">
                              {t("businessDashboard.result.alreadyRedeemedMsg", { title: scanResult.offerTitle })}
                            </p>
                          </div>
                        )}

                        {scanResult.status === 'limit_reached' && (
                          <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                            <p className="text-purple-800 text-sm">
                              {t("businessDashboard.result.limitReachedMsg", { title: scanResult.offerTitle })}
                            </p>
                          </div>
                        )}

                        {scanResult.status === 'invalid' && (
                          <div>
                            <p className="text-red-600 text-sm">
                              {t("businessDashboard.result.invalidMsg")}
                            </p>
                            {scanResult.attemptsRemaining !== undefined && (
                              <p className="text-slate-500 text-xs mt-2">
                                {t("businessDashboard.result.attemptsRemainingShort", { count: scanResult.attemptsRemaining })}
                              </p>
                            )}
                          </div>
                        )}

                        {scanResult.status === 'rate_limited' && (
                          <div className="p-3 bg-red-100 rounded-lg">
                            <p className="text-red-800 font-medium">
                              {t("businessDashboard.result.rateLimitedTitle")}
                            </p>
                            <p className="text-red-700 text-sm mt-1">
                              {t("businessDashboard.result.rateLimitedDesc", { minutes: scanResult.remainingMinutes })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pending Birthday Offers */}
                    {scanResult.pendingBirthdayOffers && scanResult.pendingBirthdayOffers.length > 0 && (
                      <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-lg">
                        <h4 className="font-semibold text-pink-800 mb-3 flex items-center gap-2">
                          <Cake className="w-4 h-4" />
                          {t("businessDashboard.birthdayOffers.heading", { count: scanResult.pendingBirthdayOffers.length })}
                        </h4>
                        <p className="text-sm text-pink-700 mb-3">
                          {t("businessDashboard.birthdayOffers.intro")}
                        </p>
                        <div className="space-y-2">
                          {scanResult.pendingBirthdayOffers
                            .filter(offer => offer.business_id === business?.id)
                            .map((offer) => (
                            <div key={offer.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-pink-200 ring-2 ring-pink-300">
                              <div>
                                <p className="font-medium text-pink-900">{t("businessDashboard.birthdayOffers.petBirthday", { name: offer.pet_name })}</p>
                                <p className="text-sm text-pink-700 font-semibold">
                                  {offer.discount_type === 'percentage' ? `${offer.discount_value}%` : `€${offer.discount_value}`} off
                                </p>
                                <p className="text-xs text-pink-600">{t("businessDashboard.birthdayOffers.fromYourBusiness")}</p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => redeemBirthdayOffer(offer.id)}
                                disabled={isRedeemingBirthday === offer.id}
                                className="bg-pink-500 hover:bg-pink-600"
                              >
                                {isRedeemingBirthday === offer.id ? t("businessDashboard.birthdayOffers.redeeming") : t("businessDashboard.birthdayOffers.redeemNow")}
                              </Button>
                            </div>
                          ))}
                          {/* Show offers from other businesses - they can also redeem these */}
                          {scanResult.pendingBirthdayOffers
                            .filter(offer => offer.business_id !== business?.id)
                            .map((offer) => (
                            <div key={offer.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-pink-100">
                              <div>
                                <p className="font-medium text-pink-900">{t("businessDashboard.birthdayOffers.petBirthdayPlain", { name: offer.pet_name })}</p>
                                <p className="text-sm text-pink-700">
                                  {offer.discount_type === 'percentage' ? `${offer.discount_value}%` : `€${offer.discount_value}`} off
                                </p>
                                <p className="text-xs text-pink-500">{t("businessDashboard.birthdayOffers.fromOtherBusiness")}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => redeemBirthdayOffer(offer.id)}
                                disabled={isRedeemingBirthday === offer.id}
                                className="border-pink-300 text-pink-600 hover:bg-pink-50"
                              >
                                {isRedeemingBirthday === offer.id ? t("businessDashboard.birthdayOffers.redeeming") : t("businessDashboard.birthdayOffers.redeem")}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Only show Confirm Redemption button if a regular offer was selected */}
                    {scanResult.status === 'valid' && scanResult.offerId && (
                      <Button 
                        onClick={confirmRedemption} 
                        disabled={isVerifying}
                        className="w-full mt-4 bg-green-600 hover:bg-green-700"
                      >
                        {isVerifying ? t("businessDashboard.result.confirming") : t("businessDashboard.result.confirmRedemption")}
                      </Button>
                    )}

                    {/* Show message when birthday verification has no birthday offers */}
                    {scanResult.status === 'valid' && !scanResult.offerId && (!scanResult.pendingBirthdayOffers || scanResult.pendingBirthdayOffers.length === 0) && (
                      <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                        <p className="text-slate-600">
                          {t("businessDashboard.result.noBirthdayOffers")}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          {t("businessDashboard.result.selectRegularOffer")}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                  </>
                )}
              </div>

              {/* Recent Redemptions */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-slate-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    {t("businessDashboard.recent.title")}
                  </h3>
                  <Link 
                    to="/business/history" 
                    className="text-sm text-primary hover:underline"
                  >
                    {t("businessDashboard.recent.viewAll")}
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-2 text-sm font-medium text-slate-500">{t("businessDashboard.recent.customer")}</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-slate-500">{t("businessDashboard.recent.pet")}</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-slate-500">{t("businessDashboard.recent.offer")}</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-slate-500">{t("businessDashboard.recent.time")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRedemptions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-500">
                            {t("businessDashboard.recent.empty")}
                          </td>
                        </tr>
                      ) : (
                        recentRedemptions.map((redemption) => (
                          <tr key={redemption.id} className="border-b border-slate-100 last:border-0">
                            <td className="py-3 px-2">
                              <div>
                                <p className="font-medium text-slate-900">
                                  {redemption.member_name || t("businessDashboard.recent.customerFallback")}
                                </p>
                                <p className="text-xs text-slate-500 font-mono">
                                  {redemption.member_number || (redemption.isBirthday ? t("businessDashboard.recent.birthdayLabel") : t("businessDashboard.recent.na"))}
                                </p>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-slate-600">
                              {redemption.pet_names || t("businessDashboard.recent.na")}
                            </td>
                            <td className="py-3 px-2 text-slate-600">
                              {redemption.offer?.title || t("businessDashboard.recent.na")}
                            </td>
                            <td className="py-3 px-2 text-slate-500 text-sm">
                              {formatTimeAgo(redemption.redeemed_at)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column - Stats */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-slate-900">This Month</h3>
                  <Link to="/business/analytics" className="text-xs text-primary hover:underline">
                    View details →
                  </Link>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <span className="text-slate-600">Redemptions</span>
                        <p className="text-xs text-slate-400">Total this month</p>
                      </div>
                    </div>
                    <span className="font-display font-bold text-xl text-slate-900">{stats.redemptions}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <span className="text-slate-600">New Customers</span>
                        <p className="text-xs text-slate-400">First-time redeemers</p>
                      </div>
                    </div>
                    <span className="font-display font-bold text-xl text-slate-900">{stats.newCustomers}</span>
                  </div>
                </div>
              </div>

              {/* Your Offers */}
              <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-semibold">Your Active Offers</h3>
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{offers.length} active</span>
                </div>
                {offers.length === 0 ? (
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-white/70 text-sm mb-3">No active offers yet</p>
                    <Link to="/business/offers">
                      <Button size="sm" variant="secondary" className="bg-white text-slate-900 hover:bg-white/90">
                        Create First Offer
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {offers.slice(0, 3).map(offer => (
                      <div key={offer.id} className="bg-white/10 rounded-xl p-3 hover:bg-white/15 transition-colors">
                        <p className="font-display font-bold">
                          {offer.discount_value}{offer.discount_type === 'percentage' ? '%' : '€'} OFF
                        </p>
                        <p className="text-white/70 text-sm">{offer.title}</p>
                      </div>
                    ))}
                    {offers.length > 3 && (
                      <Link to="/business/offers" className="block text-center text-white/70 text-sm hover:text-white pt-2">
                        +{offers.length - 3} more offers →
                      </Link>
                    )}
                  </div>
                )}
              </div>


              {/* Support */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="font-display font-semibold text-slate-900 mb-3">Need Help?</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Contact our partner support team for assistance with verification or billing.
                </p>
                <ContactPopover triggerText="Contact Support" triggerClassName="w-full" />
              </div>
            </div>
          </div>
        </main>
        <div className="pb-20 md:pb-0" />
        <BusinessMobileNav />
      </div>
    </>
  );
};

export default BusinessDashboard;