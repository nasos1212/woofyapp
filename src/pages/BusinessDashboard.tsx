import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ScanLine, CheckCircle2, XCircle, Clock, Users, TrendingUp, Gift, Building2, Bell, AlertCircle, Camera, X, BarChart3, Tag, Cake, HelpCircle, Dog, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
      setSelectedOfferId(offersData[0].id);
    } else {
      setOffers([]);
    }

    // Fetch ALL redemptions for this business to calculate accurate stats
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
      .order('redeemed_at', { ascending: true }); // Order by oldest first to track first visits

    if (allRedemptionsData) {
      // Get recent 10 for display
      const recentRedemptions = [...allRedemptionsData]
        .sort((a, b) => new Date(b.redeemed_at).getTime() - new Date(a.redeemed_at).getTime())
        .slice(0, 10);
      setRecentRedemptions(recentRedemptions as unknown as Redemption[]);
      
      // Calculate stats
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      
      const monthlyRedemptions = allRedemptionsData.filter(r => 
        new Date(r.redeemed_at) >= thisMonth
      );
      
      // Calculate first-time customers this month
      // Track when each membership first redeemed at this business
      const firstRedemptionByMember: Record<string, Date> = {};
      allRedemptionsData.forEach(r => {
        if (r.membership_id && !firstRedemptionByMember[r.membership_id]) {
          firstRedemptionByMember[r.membership_id] = new Date(r.redeemed_at);
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
    }
  };

  const verifyMember = async () => {
    if (!memberIdInput.trim() || !selectedOfferId || !business) {
      toast({
        title: "Missing Information",
        description: "Please enter a member ID and select an offer.",
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
          title: "Session Expired",
          description: "Please log in again to verify members.",
          variant: "destructive",
        });
        return;
      }

      console.log('Calling verify-member with session:', !!sessionData.session);

      // Use edge function for rate-limited verification
      const { data, error } = await supabase.functions.invoke('verify-member', {
        body: {
          memberId: memberIdInput.trim(),
          offerId: selectedOfferId,
          businessId: business.id,
        },
      });

      console.log('verify-member response:', { data, error });

      if (error) {
        console.error('Verification error:', error);
        
        // Check if it's an auth error
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          toast({
            title: "Authentication Error",
            description: "Please log in again.",
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
            title: "Too Many Attempts",
            description: "Please wait before trying again.",
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
          title: "Too Many Failed Attempts",
          description: `Please wait ${data.remainingMinutes} minutes before trying again.`,
          variant: "destructive",
        });
        return;
      }

      // Set the scan result from the edge function response
      setScanResult(data);

      // Show warning if running low on attempts
      if (data.attemptsRemaining !== undefined && data.attemptsRemaining <= 3) {
        toast({
          title: "Warning",
          description: `${data.attemptsRemaining} verification attempts remaining.`,
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
        title: "Select a Pet",
        description: "Please select which pet is using this offer.",
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
          title: "Session Expired",
          description: "Please log in again to continue.",
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
            title: "Already Redeemed",
            description: "This offer has already been redeemed by this member.",
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
        title: "Redemption Confirmed! 🎉",
        description: `${scanResult.memberName} saved ${data.redemption.discount}. They've been notified!`,
      });

      setScanResult(null);
      setMemberIdInput("");
      setSelectedPetId("");
      fetchBusinessData();

    } catch (error) {
      console.error('Redemption error:', error);
      toast({
        title: "Redemption Failed",
        description: "Could not record the redemption. Please try again.",
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
          title: "Session Expired",
          description: "Please log in again to continue.",
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
            title: "Already Redeemed",
            description: "This birthday offer has already been redeemed.",
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
        title: "Birthday Offer Redeemed! 🎂",
        description: `${data.redemption.pet_name}'s birthday offer was successfully redeemed. They saved ${data.redemption.discount}!`,
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
        title: "Redemption Failed",
        description: "Could not redeem the birthday offer. Please try again.",
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
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    return date.toLocaleDateString();
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
        title: "QR Code Scanned",
        description: `Member ID: ${memberId}`,
      });
    }
  };

  // Show loading while checking for business
  if (loading || isCheckingBusiness || verificationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{business?.business_name || "Partner Dashboard"} | Wooffy Business Portal</title>
        <meta name="description" content="Verify Wooffy members and track redemptions at your business." />
      </Helmet>

      {/* Celebration Animation */}
      <ConfettiCelebration 
        isActive={showCelebration} 
        onComplete={() => setShowCelebration(false)} 
      />

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <BusinessHeader />

        <main className="container mx-auto px-4 py-8 pt-24 md:pt-28">
          {/* Pending Approval Banner */}
          <PendingApprovalBanner status={verificationStatus} />

          {/* Welcome */}
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              {business?.business_name || "Partner Dashboard"}
            </h1>
            <p className="text-slate-500">Verify members and track your Wooffy redemptions</p>
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
                  <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Offers</h3>
                  <p className="text-xs sm:text-sm text-slate-500">{offers.length} active</p>
                </div>
              </Link>
            ) : (
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200 text-center sm:text-left opacity-60 cursor-not-allowed">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                  <Tag className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-500 text-sm sm:text-base">Offers</h3>
                  <p className="text-xs sm:text-sm text-slate-400">Pending</p>
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
                  <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Redemptions</h3>
                  <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">View history</p>
                </div>
              </Link>
            ) : (
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200 text-center sm:text-left opacity-60 cursor-not-allowed">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-500 text-sm sm:text-base">Redemptions</h3>
                  <p className="text-xs sm:text-sm text-slate-400 hidden sm:block">Pending</p>
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
                  <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Analytics</h3>
                  <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">Insights</p>
                </div>
              </Link>
            ) : (
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200 text-center sm:text-left opacity-60 cursor-not-allowed">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-500 text-sm sm:text-base">Analytics</h3>
                  <p className="text-xs sm:text-sm text-slate-400 hidden sm:block">Pending</p>
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
                  <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Birthdays</h3>
                  <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">Celebrate</p>
                </div>
              </Link>
            ) : (
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200 text-center sm:text-left opacity-60 cursor-not-allowed">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                  <Cake className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-500 text-sm sm:text-base">Birthdays</h3>
                  <p className="text-xs sm:text-sm text-slate-400 hidden sm:block">Pending</p>
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
                <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Settings</h3>
                <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">Profile</p>
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
                  Member Verification
                </h2>
                <p className="text-sm text-slate-500 mb-6">
                  💡 <span className="font-medium">Quick tip:</span> Scan QR code or enter member ID, select offer, then confirm redemption.
                </p>

                {!isApproved ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="font-semibold text-slate-600 mb-2">Verification Unavailable</h3>
                    <p className="text-sm text-slate-500">
                      Member verification will be available once your business is approved.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* QR Scanner Modal */}
                {isScannerOpen && (
                  <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
                      <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="font-display font-semibold text-slate-900">Scan QR Code</h3>
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
                                title: "Camera Error",
                                description: "Could not access camera. Please check permissions.",
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
                          Point camera at member's QR code
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
                    Open Camera Scanner
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-slate-500">or enter manually</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Member ID
                    </label>
                    <Input
                      placeholder="e.g., WF-2026-123456"
                      value={memberIdInput}
                      onChange={(e) => setMemberIdInput(e.target.value)}
                      className="font-mono"
                    />
                  </div>

                  {offers.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Select Offer to Redeem
                      </label>
                      <select
                        value={selectedOfferId}
                        onChange={(e) => setSelectedOfferId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {offers.map(offer => (
                          <option key={offer.id} value={offer.id}>
                            {offer.title} ({offer.discount_value}{offer.discount_type === 'percentage' ? '%' : '€'} off)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <Button 
                    onClick={verifyMember} 
                    disabled={isVerifying || !memberIdInput.trim()}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {isVerifying ? 'Verifying...' : 'Verify Member'}
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
                          {scanResult.status === 'valid' && '✓ Valid Membership'}
                          {scanResult.status === 'expired' && '⚠ Membership Expired'}
                          {scanResult.status === 'already_redeemed' && '⚠ Offer Already Redeemed'}
                          {scanResult.status === 'limit_reached' && '⚠ Offer Limit Reached'}
                          {scanResult.status === 'invalid' && '✗ Invalid Member ID'}
                        </h3>

                        {scanResult.status !== 'invalid' && (
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-slate-500">Member</p>
                              <p className="font-medium text-slate-900">{scanResult.memberName}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Pet</p>
                              <p className="font-medium text-slate-900">{scanResult.petName}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Member ID</p>
                              <p className="font-mono text-xs text-slate-900">{scanResult.memberId}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Expiry Date</p>
                              <p className={`font-medium ${scanResult.status === 'expired' ? 'text-red-600' : 'text-slate-900'}`}>
                                {scanResult.expiryDate}
                              </p>
                            </div>
                          </div>
                        )}

                        {scanResult.status === 'valid' && (
                          <div className="mt-4 p-3 bg-green-100 rounded-lg">
                            <p className="text-green-800 font-medium">
                              🎁 Apply discount: {scanResult.discount}
                            </p>
                            {scanResult.offerType === 'per_pet' && scanResult.availablePets && (
                              <p className="text-green-700 text-sm mt-1">
                                🐕 Per-pet offer: {scanResult.redeemedPetsCount}/{scanResult.totalPets} pets have used this
                              </p>
                            )}
                          </div>
                        )}

                        {/* Pet selector - always show for data tracking */}
                        {scanResult.status === 'valid' && scanResult.availablePets && scanResult.availablePets.length > 0 && (
                          <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-lg">
                            <label className="block text-sm font-medium text-teal-800 mb-2 flex items-center gap-2">
                              <Dog className="w-4 h-4" />
                              {scanResult.offerType === 'per_pet' 
                                ? 'Select which pet is using this offer:' 
                                : 'Which pet is this for? (optional for tracking)'}
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
                              Membership expired. Suggest renewal to continue enjoying discounts.
                            </p>
                          </div>
                        )}

                        {scanResult.status === 'already_redeemed' && (
                          <div className="mt-4 p-3 bg-orange-100 rounded-lg">
                            <p className="text-orange-800 text-sm">
                              This member has already redeemed "{scanResult.offerTitle}". Each offer can only be used once.
                            </p>
                          </div>
                        )}

                        {scanResult.status === 'limit_reached' && (
                          <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                            <p className="text-purple-800 text-sm">
                              "{scanResult.offerTitle}" has reached its maximum redemption limit. Consider creating a new offer or increasing the limit.
                            </p>
                          </div>
                        )}

                        {scanResult.status === 'invalid' && (
                          <div>
                            <p className="text-red-600 text-sm">
                              This member ID is not recognized. Please check and try again.
                            </p>
                            {scanResult.attemptsRemaining !== undefined && (
                              <p className="text-slate-500 text-xs mt-2">
                                {scanResult.attemptsRemaining} verification attempts remaining
                              </p>
                            )}
                          </div>
                        )}

                        {scanResult.status === 'rate_limited' && (
                          <div className="p-3 bg-red-100 rounded-lg">
                            <p className="text-red-800 font-medium">
                              🚫 Too many failed attempts
                            </p>
                            <p className="text-red-700 text-sm mt-1">
                              Please wait {scanResult.remainingMinutes} minutes before trying again.
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
                          🎂 Birthday Offers to Redeem ({scanResult.pendingBirthdayOffers.length})
                        </h4>
                        <p className="text-sm text-pink-700 mb-3">
                          This member has birthday offers they can use at your business!
                        </p>
                        <div className="space-y-2">
                          {scanResult.pendingBirthdayOffers
                            .filter(offer => offer.business_id === business?.id)
                            .map((offer) => (
                            <div key={offer.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-pink-200 ring-2 ring-pink-300">
                              <div>
                                <p className="font-medium text-pink-900">{offer.pet_name}'s Birthday 🎉</p>
                                <p className="text-sm text-pink-700 font-semibold">
                                  {offer.discount_type === 'percentage' ? `${offer.discount_value}%` : `€${offer.discount_value}`} off
                                </p>
                                <p className="text-xs text-pink-600">From your business</p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => redeemBirthdayOffer(offer.id)}
                                disabled={isRedeemingBirthday === offer.id}
                                className="bg-pink-500 hover:bg-pink-600"
                              >
                                {isRedeemingBirthday === offer.id ? 'Redeeming...' : 'Redeem Now'}
                              </Button>
                            </div>
                          ))}
                          {/* Show offers from other businesses - they can also redeem these */}
                          {scanResult.pendingBirthdayOffers
                            .filter(offer => offer.business_id !== business?.id)
                            .map((offer) => (
                            <div key={offer.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-pink-100">
                              <div>
                                <p className="font-medium text-pink-900">{offer.pet_name}'s Birthday</p>
                                <p className="text-sm text-pink-700">
                                  {offer.discount_type === 'percentage' ? `${offer.discount_value}%` : `€${offer.discount_value}`} off
                                </p>
                                <p className="text-xs text-pink-500">From another business</p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => redeemBirthdayOffer(offer.id)}
                                disabled={isRedeemingBirthday === offer.id}
                                className="border-pink-300 text-pink-600 hover:bg-pink-50"
                              >
                                {isRedeemingBirthday === offer.id ? 'Redeeming...' : 'Redeem'}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {scanResult.status === 'valid' && (
                      <Button 
                        onClick={confirmRedemption} 
                        disabled={isVerifying}
                        className="w-full mt-4 bg-green-600 hover:bg-green-700"
                      >
                        {isVerifying ? 'Confirming...' : 'Confirm Redemption'}
                      </Button>
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
                    Recent Redemptions
                  </h3>
                  <Link 
                    to="/business/analytics" 
                    className="text-sm text-primary hover:underline"
                  >
                    View All →
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-2 text-sm font-medium text-slate-500">Member</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-slate-500">Pet</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-slate-500">Offer</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-slate-500">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRedemptions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-500">
                            No redemptions yet. Verify a member to get started!
                          </td>
                        </tr>
                      ) : (
                        recentRedemptions.map((redemption) => (
                          <tr key={redemption.id} className="border-b border-slate-100 last:border-0">
                            <td className="py-3 px-2">
                              <div>
                                <p className="font-medium text-slate-900">
                                  {redemption.member_name || 'Member'}
                                </p>
                                <p className="text-xs text-slate-500 font-mono">
                                  {redemption.member_number || 'N/A'}
                                </p>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-slate-600">
                              {redemption.pet_names || 'N/A'}
                            </td>
                            <td className="py-3 px-2 text-slate-600">
                              {redemption.offer?.title || 'N/A'}
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
                <Button variant="outline" size="sm" className="w-full">
                  Contact Support
                </Button>
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