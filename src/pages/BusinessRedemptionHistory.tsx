import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Clock, Building2, Search, Filter, Download, ArrowLeft, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Breadcrumbs from "@/components/Breadcrumbs";
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
  const { user } = useAuth();
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

  return (
    <>
      <Helmet>
        <title>Redemption History | Wooffy Business</title>
        <meta name="description" content="View and filter your complete redemption history." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Breadcrumbs items={[
              { label: "Partner Dashboard", href: "/business" },
              { label: "Redemption History" }
            ]} />
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
        </header>

        <main className="container mx-auto px-4 py-8">
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
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <p className="text-slate-500 text-sm">Total Redemptions</p>
              <p className="font-display text-2xl font-bold text-slate-900">{filteredRedemptions.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <p className="text-slate-500 text-sm">Total Discounts Given</p>
              <p className="font-display text-2xl font-bold text-primary">€{calculateTotalSavings()}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <p className="text-slate-500 text-sm">Unique Members</p>
              <p className="font-display text-2xl font-bold text-slate-900">
                {new Set(filteredRedemptions.map(r => r.member_number).filter(Boolean)).size}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by member name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Offer Filter */}
              <Select value={selectedOffer} onValueChange={setSelectedOffer}>
                <SelectTrigger className="w-full lg:w-[200px]">
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
                <SelectTrigger className="w-full lg:w-[180px]">
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
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
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
      </div>
    </>
  );
};

export default BusinessRedemptionHistory;
