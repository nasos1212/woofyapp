import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ScanLine, CheckCircle2, XCircle, Clock, Users, TrendingUp, Gift, Building2, Bell, AlertCircle, Camera, X, BarChart3, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Scanner } from "@yudiel/react-qr-scanner";
import Breadcrumbs from "@/components/Breadcrumbs";

interface ScanResult {
  status: 'valid' | 'expired' | 'invalid' | 'already_redeemed';
  memberName?: string;
  petName?: string;
  memberId?: string;
  membershipId?: string;
  expiryDate?: string;
  discount?: string;
  offerId?: string;
  offerTitle?: string;
}

interface Redemption {
  id: string;
  redeemed_at: string;
  membership: {
    pet_name: string;
    member_number: string;
  };
  offer: {
    title: string;
    discount_value: number;
    discount_type: string;
  };
}

const BusinessDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [memberIdInput, setMemberIdInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [business, setBusiness] = useState<{ id: string; business_name: string } | null>(null);
  const [offers, setOffers] = useState<{ id: string; title: string; discount_value: number; discount_type: string }[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string>("");
  const [recentRedemptions, setRecentRedemptions] = useState<Redemption[]>([]);
  const [stats, setStats] = useState({ redemptions: 0, newCustomers: 0, discountsGiven: 0 });

  useEffect(() => {
    if (user) {
      fetchBusinessData();
    }
  }, [user]);

  const fetchBusinessData = async () => {
    if (!user) return;

    // Fetch business
    const { data: businessData } = await supabase
      .from('businesses')
      .select('id, business_name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (businessData) {
      setBusiness(businessData);

      // Fetch offers
      const { data: offersData } = await supabase
        .from('offers')
        .select('id, title, discount_value, discount_type')
        .eq('business_id', businessData.id)
        .eq('is_active', true);

      if (offersData && offersData.length > 0) {
        setOffers(offersData);
        setSelectedOfferId(offersData[0].id);
      }

      // Fetch recent redemptions
      const { data: redemptionsData } = await supabase
        .from('offer_redemptions')
        .select(`
          id,
          redeemed_at,
          membership:memberships(pet_name, member_number),
          offer:offers(title, discount_value, discount_type)
        `)
        .eq('business_id', businessData.id)
        .order('redeemed_at', { ascending: false })
        .limit(10);

      if (redemptionsData) {
        setRecentRedemptions(redemptionsData as unknown as Redemption[]);
        
        // Calculate stats
        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);
        
        const monthlyRedemptions = redemptionsData.filter(r => 
          new Date(r.redeemed_at) >= thisMonth
        );
        
        const totalDiscount = monthlyRedemptions.reduce((sum, r) => {
          const offer = r.offer as unknown as { discount_value: number };
          return sum + (offer?.discount_value || 0);
        }, 0);
        
        setStats({
          redemptions: monthlyRedemptions.length,
          newCustomers: Math.floor(monthlyRedemptions.length * 0.3),
          discountsGiven: totalDiscount
        });
      }
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
      // Find membership by member_number
      const { data: membership, error: membershipError } = await supabase
        .from('memberships')
        .select('id, user_id, member_number, pet_name, pet_breed, expires_at, is_active')
        .eq('member_number', memberIdInput.trim())
        .maybeSingle();

      if (membershipError || !membership) {
        setScanResult({ status: 'invalid' });
        return;
      }

      // Check if membership is expired
      if (new Date(membership.expires_at) < new Date() || !membership.is_active) {
        // Get profile for member name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', membership.user_id)
          .maybeSingle();

        setScanResult({
          status: 'expired',
          memberName: profile?.full_name || 'Unknown',
          petName: membership.pet_name || 'Not specified',
          memberId: membership.member_number,
          expiryDate: new Date(membership.expires_at).toLocaleDateString(),
        });
        return;
      }

      // Check if this offer has already been redeemed by this member
      const { data: existingRedemption } = await supabase
        .from('offer_redemptions')
        .select('id')
        .eq('membership_id', membership.id)
        .eq('offer_id', selectedOfferId)
        .maybeSingle();

      if (existingRedemption) {
        // Get profile for member name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', membership.user_id)
          .maybeSingle();

        const selectedOffer = offers.find(o => o.id === selectedOfferId);

        setScanResult({
          status: 'already_redeemed',
          memberName: profile?.full_name || 'Unknown',
          petName: membership.pet_name || 'Not specified',
          memberId: membership.member_number,
          expiryDate: new Date(membership.expires_at).toLocaleDateString(),
          offerTitle: selectedOffer?.title,
        });
        return;
      }

      // Valid membership and offer not yet redeemed
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', membership.user_id)
        .maybeSingle();

      const selectedOffer = offers.find(o => o.id === selectedOfferId);

      setScanResult({
        status: 'valid',
        memberName: profile?.full_name || 'Unknown',
        petName: membership.pet_name || 'Not specified',
        memberId: membership.member_number,
        membershipId: membership.id,
        expiryDate: new Date(membership.expires_at).toLocaleDateString(),
        discount: selectedOffer ? `${selectedOffer.discount_value}${selectedOffer.discount_type === 'percentage' ? '%' : '€'} - ${selectedOffer.title}` : '',
        offerId: selectedOfferId,
        offerTitle: selectedOffer?.title,
      });

    } catch (error) {
      console.error('Verification error:', error);
      setScanResult({ status: 'invalid' });
    } finally {
      setIsVerifying(false);
    }
  };

  const confirmRedemption = async () => {
    if (!scanResult || scanResult.status !== 'valid' || !business || !user) return;

    try {
      const { error } = await supabase
        .from('offer_redemptions')
        .insert({
          membership_id: scanResult.membershipId!,
          offer_id: scanResult.offerId!,
          business_id: business.id,
          redeemed_by_user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: "Redemption Confirmed!",
        description: `Discount applied for ${scanResult.memberName}`,
      });

      setScanResult(null);
      setMemberIdInput("");
      fetchBusinessData(); // Refresh data

    } catch (error) {
      console.error('Redemption error:', error);
      toast({
        title: "Redemption Failed",
        description: "Could not record the redemption. Please try again.",
        variant: "destructive",
      });
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
      } else if (scannedValue.startsWith('PP-')) {
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

  return (
    <>
      <Helmet>
        <title>Partner Dashboard | PawPass Business Portal</title>
        <meta name="description" content="Verify PawPass members and track redemptions at your business." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Breadcrumbs items={[{ label: "Partner Dashboard" }]} />
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-slate-100 rounded-full transition-colors">
                <Bell className="w-5 h-5 text-slate-500" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="font-medium text-slate-900 text-sm">{business?.business_name || 'Your Business'}</p>
                  <p className="text-xs text-slate-500">Partner</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              Partner Dashboard
            </h1>
            <p className="text-slate-500">Verify members and track your PawPass redemptions</p>
          </div>

          {/* Quick Navigation */}
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <Link 
              to="/business/offers" 
              className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-primary hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Tag className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Manage Offers</h3>
                <p className="text-sm text-slate-500">Create and edit your discounts</p>
              </div>
            </Link>
            <Link 
              to="/business/analytics" 
              className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-primary hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Analytics</h3>
                <p className="text-sm text-slate-500">View performance insights</p>
              </div>
            </Link>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Scanner */}
            <div className="lg:col-span-2 space-y-8">
              {/* Member Verification */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h2 className="font-display text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                  <ScanLine className="w-5 h-5 text-primary" />
                  Member Verification
                </h2>

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
                      placeholder="e.g., PP-2024-123456"
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
                    'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-start gap-4">
                      {scanResult.status === 'valid' && <CheckCircle2 className="w-8 h-8 text-green-500 flex-shrink-0" />}
                      {scanResult.status === 'expired' && <Clock className="w-8 h-8 text-amber-500 flex-shrink-0" />}
                      {scanResult.status === 'already_redeemed' && <AlertCircle className="w-8 h-8 text-orange-500 flex-shrink-0" />}
                      {scanResult.status === 'invalid' && <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />}
                      
                      <div className="flex-1">
                        <h3 className={`font-display font-semibold text-lg mb-2 ${
                          scanResult.status === 'valid' ? 'text-green-700' :
                          scanResult.status === 'expired' ? 'text-amber-700' :
                          scanResult.status === 'already_redeemed' ? 'text-orange-700' :
                          'text-red-700'
                        }`}>
                          {scanResult.status === 'valid' && '✓ Valid Membership'}
                          {scanResult.status === 'expired' && '⚠ Membership Expired'}
                          {scanResult.status === 'already_redeemed' && '⚠ Offer Already Redeemed'}
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

                        {scanResult.status === 'invalid' && (
                          <p className="text-red-600 text-sm">
                            This member ID is not recognized. Please check and try again.
                          </p>
                        )}
                      </div>
                    </div>

                    {scanResult.status === 'valid' && (
                      <Button onClick={confirmRedemption} className="w-full mt-4 bg-green-600 hover:bg-green-700">
                        Confirm Redemption
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Recent Redemptions */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Recent Redemptions
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-2 text-sm font-medium text-slate-500">Member ID</th>
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
                            <td className="py-3 px-2 font-mono text-xs text-slate-900">
                              {redemption.membership?.member_number || 'N/A'}
                            </td>
                            <td className="py-3 px-2 text-slate-600">
                              {redemption.membership?.pet_name || 'N/A'}
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
                <h3 className="font-display font-semibold text-slate-900 mb-4">This Month</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-slate-600">Redemptions</span>
                    </div>
                    <span className="font-display font-bold text-xl text-slate-900">{stats.redemptions}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="text-slate-600">New Customers</span>
                    </div>
                    <span className="font-display font-bold text-xl text-slate-900">{stats.newCustomers}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Gift className="w-5 h-5 text-amber-600" />
                      </div>
                      <span className="text-slate-600">Discounts Given</span>
                    </div>
                    <span className="font-display font-bold text-xl text-slate-900">€{stats.discountsGiven}</span>
                  </div>
                </div>
              </div>

              {/* Your Offers */}
              <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl p-6 text-white">
                <h3 className="font-display font-semibold mb-3">Your Active Offers</h3>
                {offers.length === 0 ? (
                  <p className="text-white/70 text-sm">No active offers. Add offers in partner registration.</p>
                ) : (
                  <div className="space-y-2">
                    {offers.slice(0, 3).map(offer => (
                      <div key={offer.id} className="bg-white/10 rounded-xl p-3">
                        <p className="font-display font-bold">
                          {offer.discount_value}{offer.discount_type === 'percentage' ? '%' : '€'} OFF
                        </p>
                        <p className="text-white/70 text-sm">{offer.title}</p>
                      </div>
                    ))}
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
      </div>
    </>
  );
};

export default BusinessDashboard;