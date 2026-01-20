import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { Clock, Building2, Search, Filter, Download, ArrowLeft, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessVerification } from "@/hooks/useBusinessVerification";
import BusinessMobileNav from "@/components/BusinessMobileNav";
import BusinessHeader from "@/components/BusinessHeader";
import PendingApprovalBanner from "@/components/PendingApprovalBanner";
import DogLoader from "@/components/DogLoader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";

interface Redemption {
  id: string;
  redeemed_at: string;
  member_name: string | null;
  pet_names: string | null;
  member_number: string | null;
  offer: {
    id: string;
    title: string;
    discount_value: number;
    discount_type: string;
  };
}

interface Offer {
  id: string;
  title: string;
}

const BusinessRedemptionHistory = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isApproved, verificationStatus, loading: verificationLoading } = useBusinessVerification();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [filteredRedemptions, setFilteredRedemptions] = useState<Redemption[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [business, setBusiness] = useState<{ id: string; business_name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?type=business");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [redemptions, searchQuery, selectedOffer, dateRange]);

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Fetch business
      const { data: businessData } = await supabase
        .from('businesses')
        .select('id, business_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!businessData) {
        setIsLoading(false);
        return;
      }

      setBusiness(businessData);

      // Fetch all offers for this business
      const { data: offersData } = await supabase
        .from('offers')
        .select('id, title')
        .eq('business_id', businessData.id);

      if (offersData) {
        setOffers(offersData);
      }

      // Fetch all redemptions with stored member/pet data
      const { data: redemptionsData } = await supabase
        .from('offer_redemptions')
        .select(`
          id,
          redeemed_at,
          member_name,
          pet_names,
          member_number,
          offer:offers(id, title, discount_value, discount_type)
        `)
        .eq('business_id', businessData.id)
        .order('redeemed_at', { ascending: false });

      if (redemptionsData) {
        setRedemptions(redemptionsData as unknown as Redemption[]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...redemptions];

    // Search filter (member name, pet name, member number)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.member_name?.toLowerCase().includes(query) ||
        r.pet_names?.toLowerCase().includes(query) ||
        r.member_number?.toLowerCase().includes(query)
      );
    }

    // Offer filter
    if (selectedOffer !== "all") {
      filtered = filtered.filter(r => r.offer?.id === selectedOffer);
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date();
      let startDate: Date;
      let endDate: Date = now;

      switch (dateRange) {
        case "today":
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date();
          break;
        case "week":
          startDate = subDays(new Date(), 7);
          break;
        case "month":
          startDate = startOfMonth(new Date());
          endDate = endOfMonth(new Date());
          break;
        case "30days":
          startDate = subDays(new Date(), 30);
          break;
        case "90days":
          startDate = subDays(new Date(), 90);
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter(r => {
        const redemptionDate = parseISO(r.redeemed_at);
        return isWithinInterval(redemptionDate, { start: startDate, end: endDate });
      });
    }

    setFilteredRedemptions(filtered);
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "MMM d, yyyy 'at' h:mm a");
  };

  const formatDiscount = (value: number, type: string) => {
    return type === 'percentage' ? `${value}%` : `€${value}`;
  };

  const calculateTotalSavings = () => {
    return filteredRedemptions.reduce((sum, r) => {
      return sum + (r.offer?.discount_value || 0);
    }, 0);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Member Name', 'Member ID', 'Pet Name', 'Offer', 'Discount'];
    const rows = filteredRedemptions.map(r => [
      format(parseISO(r.redeemed_at), 'yyyy-MM-dd HH:mm'),
      r.member_name || 'N/A',
      r.member_number || 'N/A',
      r.pet_names || 'N/A',
      r.offer?.title || 'N/A',
      formatDiscount(r.offer?.discount_value || 0, r.offer?.discount_type || 'fixed')
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `redemptions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || isLoading || verificationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader size="lg" />
      </div>
    );
  }

  if (!isApproved) {
    return (
      <>
        <Helmet>
          <title>Redemption History | Wooffy Business</title>
        </Helmet>
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
          <BusinessHeader />
          <main className="container mx-auto px-4 py-8 pt-24 md:pt-28">
            <PendingApprovalBanner status={verificationStatus} />
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-200 text-center">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-display font-semibold text-lg mb-2">Redemption History Unavailable</h3>
              <p className="text-slate-500">View your redemption history once your business is approved.</p>
            </div>
          </main>
          <div className="pb-20 md:pb-0" />
          <BusinessMobileNav />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Redemption History | Wooffy Business</title>
        <meta name="description" content="View and filter your complete redemption history." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <BusinessHeader />

        <main className="container mx-auto px-4 py-8 pt-24 md:pt-28">
          {/* Back Link & Title */}
          <div className="mb-6">
            <Link 
              to="/business" 
              className="inline-flex items-center gap-2 text-slate-500 hover:text-primary mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              Redemption History
            </h1>
            <p className="text-slate-500">View and filter all your past redemptions</p>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-6">
            <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200">
              <p className="text-slate-500 text-xs sm:text-sm">Redemptions</p>
              <p className="font-display text-lg sm:text-2xl font-bold text-slate-900">{filteredRedemptions.length}</p>
            </div>
            <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200">
              <p className="text-slate-500 text-xs sm:text-sm">Members</p>
              <p className="font-display text-lg sm:text-2xl font-bold text-slate-900">
                {new Set(filteredRedemptions.map(r => r.member_number).filter(Boolean)).size}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 mb-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search member..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                {/* Offer Filter */}
                <Select value={selectedOffer} onValueChange={setSelectedOffer}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="w-4 h-4 mr-2 text-slate-400" />
                    <SelectValue placeholder="All Offers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Offers</SelectItem>
                    {offers.map(offer => (
                      <SelectItem key={offer.id} value={offer.id}>
                        {offer.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Date Filter */}
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="90days">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>

                {/* Export Button */}
                <Button 
                  variant="outline" 
                  onClick={exportToCSV}
                  disabled={filteredRedemptions.length === 0}
                  className="gap-2 w-full sm:w-auto"
                  size="sm"
                >
                  <Download className="w-4 h-4" />
                  <span className="sm:inline">Export</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Redemptions Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">Loading...</div>
            ) : filteredRedemptions.length === 0 ? (
              <div className="p-8 text-center">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No redemptions found</p>
                <p className="text-sm text-slate-400 mt-1">
                  {redemptions.length > 0 
                    ? "Try adjusting your filters" 
                    : "Redemptions will appear here after members use your offers"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-4 px-4 text-sm font-medium text-slate-500">Date & Time</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-slate-500">Member</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-slate-500">Pet</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-slate-500">Offer</th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-slate-500">Discount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRedemptions.map((redemption) => (
                      <tr key={redemption.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4">
                          <p className="text-slate-900 text-sm">{formatDate(redemption.redeemed_at)}</p>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-slate-900">
                              {redemption.member_name || 'Member'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {redemption.member_number || 'N/A'}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-600">
                          {redemption.pet_names || 'N/A'}
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {redemption.offer?.title || 'N/A'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-semibold text-green-600">
                            {formatDiscount(redemption.offer?.discount_value || 0, redemption.offer?.discount_type || 'fixed')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
        <div className="pb-20 md:pb-0" />
        <BusinessMobileNav />
      </div>
    </>
  );
};

export default BusinessRedemptionHistory;
