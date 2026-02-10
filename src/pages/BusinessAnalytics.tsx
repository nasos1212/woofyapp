import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Users,
  Tag,
  Calendar,
  Download,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeft,
  Clock,
} from "lucide-react";
import DogLoader from "@/components/DogLoader";
import BusinessMobileNav from "@/components/BusinessMobileNav";
import BusinessHeader from "@/components/BusinessHeader";
import PendingApprovalBanner from "@/components/PendingApprovalBanner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessVerification } from "@/hooks/useBusinessVerification";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { formatDate } from "@/lib/utils";

interface DailyData {
  date: string;
  redemptions: number;
}

interface TopOffer {
  title: string;
  redemptions: number;
  discount: string;
}

interface CustomerInsight {
  member_id: string;
  member_number: string;
  member_name: string | null;
  pet_names: string | null;
  total_redemptions: number;
  last_visit: string;
}

const BusinessAnalytics = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { isApproved, verificationStatus, loading: verificationLoading } = useBusinessVerification();
  const [isLoading, setIsLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalRedemptions: 0,
    thisMonth: 0,
    lastMonth: 0,
    uniqueCustomers: 0,
  });
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [topOffers, setTopOffers] = useState<TopOffer[]>([]);
  const [customers, setCustomers] = useState<CustomerInsight[]>([]);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "6m">("30d");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?type=business");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, dateRange]);

  const fetchAnalytics = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Get business
      const { data: business } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!business) {
        navigate("/partner-register");
        return;
      }

      setBusinessId(business.id);

      // Calculate date ranges
      const now = new Date();
      let startDate: Date;
      
      if (dateRange === "7d") {
        startDate = subDays(now, 7);
      } else if (dateRange === "30d") {
        startDate = subDays(now, 30);
      } else {
        startDate = subDays(now, 180); // 6 months
      }

      const thisMonthStart = startOfMonth(now);
      const lastMonthStart = startOfMonth(subDays(thisMonthStart, 1));
      const lastMonthEnd = endOfMonth(subDays(thisMonthStart, 1));

      // Fetch all regular offer redemptions
      const { data: regularRedemptions, error } = await supabase
        .from("offer_redemptions")
        .select(`
          id,
          redeemed_at,
          membership_id,
          member_number,
          member_name,
          pet_names,
          offer:offers(title, discount_value, discount_type)
        `)
        .eq("business_id", business.id)
        .order("redeemed_at", { ascending: false });

      if (error) throw error;

      // Fetch birthday redemptions for this business
      const { data: birthdayRedemptions } = await supabase
        .from("sent_birthday_offers")
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
        .eq("redeemed_by_business_id", business.id)
        .not("redeemed_at", "is", null)
        .order("redeemed_at", { ascending: false });

      // For birthday redemptions where owner_name is null, try to look up from profiles
      const ownerUserIds = [...new Set((birthdayRedemptions || [])
        .filter(r => !r.owner_name && r.owner_user_id)
        .map(r => r.owner_user_id))];
      
      let userToNameMap: Record<string, string> = {};
      if (ownerUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', ownerUserIds);
        
        (profilesData || []).forEach(p => {
          if (p.full_name) {
            userToNameMap[p.user_id] = p.full_name;
          }
        });
      }

      // Get pet IDs from birthday redemptions to lookup their membership_ids
      const petIds = [...new Set((birthdayRedemptions || []).map(r => r.pet_id).filter(Boolean))];
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

      // Get all unique membership IDs to look up member_numbers
      const allMembershipIds = [
        ...new Set([
          ...(petIds.length > 0 ? Object.values(petToMembershipMap) : []),
        ])
      ].filter(Boolean);

      let membershipToNumberMap: Record<string, string> = {};
      if (allMembershipIds.length > 0) {
        const { data: membershipsData } = await supabase
          .from('memberships')
          .select('id, member_number')
          .in('id', allMembershipIds);
        
        (membershipsData || []).forEach(m => {
          membershipToNumberMap[m.id] = m.member_number;
        });
      }

      // Normalize birthday redemptions to match regular redemption structure
      const normalizedBirthdayRedemptions = (birthdayRedemptions || []).map((r) => {
        // Get membership_id from pet for proper customer tracking
        const membershipId = r.pet_id ? petToMembershipMap[r.pet_id] : null;
        // Get actual member_number from memberships table
        const memberNumber = membershipId ? membershipToNumberMap[membershipId] : null;
        
        return {
          id: r.id,
          redeemed_at: r.redeemed_at!,
          // Use the looked-up membership_id for proper customer tracking
          membership_id: membershipId || r.owner_user_id, // Fallback to owner_user_id
          member_number: memberNumber || "🎂 Birthday", // Use actual member_number, fallback to birthday indicator
          // Use owner_name if available, otherwise look up from profiles
          member_name: r.owner_name || (r.owner_user_id ? userToNameMap[r.owner_user_id] : null) || null,
          pet_names: r.pet_name,
          offer: {
            title: `🎂 Birthday: ${r.pet_name}`,
            discount_value: r.discount_value,
            discount_type: r.discount_type,
          },
        };
      });

      // Combine all redemptions
      const redemptions = [...(regularRedemptions || []), ...normalizedBirthdayRedemptions];

      // Calculate stats
      const thisMonthRedemptions = redemptions.filter(
        (r) => new Date(r.redeemed_at) >= thisMonthStart
      );
      const lastMonthRedemptions = redemptions.filter(
        (r) =>
          new Date(r.redeemed_at) >= lastMonthStart &&
          new Date(r.redeemed_at) <= lastMonthEnd
      );

      const uniqueMemberIds = new Set(redemptions.map((r) => r.membership_id));

      setStats({
        totalRedemptions: redemptions.length,
        thisMonth: thisMonthRedemptions.length,
        lastMonth: lastMonthRedemptions.length,
        uniqueCustomers: uniqueMemberIds.size,
      });

      // Calculate daily data
      const days = eachDayOfInterval({ start: startDate, end: now });
      const dailyCounts: Record<string, number> = {};
      
      days.forEach((day) => {
        dailyCounts[format(day, "yyyy-MM-dd")] = 0;
      });

      redemptions.forEach((r) => {
        const date = format(new Date(r.redeemed_at), "yyyy-MM-dd");
        if (dailyCounts[date] !== undefined) {
          dailyCounts[date]++;
        }
      });

      setDailyData(
        Object.entries(dailyCounts).map(([date, redemptions]) => ({
          date,
          redemptions,
        }))
      );

      // Calculate top offers
      const offerCounts: Record<string, { title: string; count: number; discount: string }> = {};
      redemptions.forEach((r) => {
        const offer = r.offer as unknown as {
          title: string;
          discount_value: number;
          discount_type: string;
        };
        if (offer?.title) {
          if (!offerCounts[offer.title]) {
            offerCounts[offer.title] = {
              title: offer.title,
              count: 0,
              discount: `${offer.discount_value}${offer.discount_type === "percentage" ? "%" : "€"}`,
            };
          }
          offerCounts[offer.title].count++;
        }
      });

      setTopOffers(
        Object.values(offerCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map((o) => ({
            title: o.title,
            redemptions: o.count,
            discount: o.discount,
          }))
      );

      // Calculate customer insights - use member_number, member_name and pet_names directly from redemptions
      const customerData: Record<
        string,
        { member_number: string; member_name: string | null; pet_names: Set<string>; count: number; lastVisit: string }
      > = {};

      redemptions.forEach((r) => {
        const memberNumber = r.member_number;
        if (memberNumber) {
          if (!customerData[r.membership_id]) {
            customerData[r.membership_id] = {
              member_number: memberNumber,
              member_name: r.member_name || null,
              pet_names: new Set<string>(),
              count: 0,
              lastVisit: r.redeemed_at,
            };
          }
          // Add pet names from this redemption
          if (r.pet_names) {
            r.pet_names.split(',').forEach((name: string) => {
              const trimmed = name.trim();
              if (trimmed) customerData[r.membership_id].pet_names.add(trimmed);
            });
          }
          customerData[r.membership_id].count++;
          if (new Date(r.redeemed_at) > new Date(customerData[r.membership_id].lastVisit)) {
            customerData[r.membership_id].lastVisit = r.redeemed_at;
          }
        }
      });

      setCustomers(
        Object.entries(customerData)
          .map(([id, data]) => ({
            member_id: id,
            member_number: data.member_number,
            member_name: data.member_name,
            pet_names: Array.from(data.pet_names).join(', ') || null,
            total_redemptions: data.count,
            last_visit: data.lastVisit,
          }))
          .sort((a, b) => b.total_redemptions - a.total_redemptions)
          .slice(0, 10)
      );
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = () => {
    const csvContent = [
      ["Date", "Redemptions"],
      ...dailyData.map((d) => [d.date, d.redemptions.toString()]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wooffy-analytics-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported successfully");
  };

  const monthChange =
    stats.lastMonth > 0
      ? Math.round(((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100)
      : stats.thisMonth > 0
      ? 100
      : 0;

  const maxRedemptions = Math.max(...dailyData.map((d) => d.redemptions), 1);

  if (loading || isLoading || verificationLoading) {
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
          <title>Analytics | Wooffy Business</title>
        </Helmet>
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
          <BusinessHeader />
          <main className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-8 py-8 pt-[calc(6rem+env(safe-area-inset-top))] md:pt-[calc(7rem+env(safe-area-inset-top))]">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/business")}
              className="mb-6 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <PendingApprovalBanner status={verificationStatus} />
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-200 text-center">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-display font-semibold text-lg mb-2">Analytics Unavailable</h3>
              <p className="text-slate-500">Analytics will be available once your business is approved.</p>
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
        <title>Analytics | Wooffy Business</title>
        <meta
          name="description"
          content="View your Wooffy business analytics and customer insights."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <BusinessHeader />

        <main className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-8 py-8 pt-[calc(6rem+env(safe-area-inset-top))] md:pt-[calc(7rem+env(safe-area-inset-top))]">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/business")}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-1 sm:mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-sm sm:text-base text-slate-500">Track your Wooffy performance</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Date Range Selector */}
              <div className="flex items-center gap-1 sm:gap-2 bg-white rounded-lg p-1 border border-slate-200 w-fit">
                {(["7d", "30d", "6m"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                      dateRange === range
                        ? "bg-primary text-primary-foreground"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {range === "7d" ? "7D" : range === "30d" ? "30D" : "6M"}
                  </button>
                ))}
              </div>
              <Button variant="outline" onClick={exportData} className="gap-2" size="sm">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <span
                  className={`text-[10px] sm:text-xs font-medium flex items-center gap-0.5 ${
                    monthChange >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {monthChange >= 0 ? (
                    <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  ) : (
                    <ArrowDownRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  )}
                  {Math.abs(monthChange)}%
                </span>
              </div>
              <div className="text-xl sm:text-3xl font-display font-bold text-slate-900">
                {stats.thisMonth}
              </div>
              <p className="text-xs sm:text-sm text-slate-500">Redemptions This Month</p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm border border-slate-200">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mb-1 sm:mb-2" />
              <div className="text-xl sm:text-3xl font-display font-bold text-slate-900">
                {stats.uniqueCustomers}
              </div>
              <p className="text-xs sm:text-sm text-slate-500">Customers</p>
            </div>

          </div>

          {/* Top Offers */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 mb-6">
            <h2 className="font-display font-semibold text-slate-900 mb-4">Top Offers</h2>
            {topOffers.length === 0 ? (
              <p className="text-slate-500 text-sm">No redemptions yet</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {topOffers.map((offer, i) => (
                  <div key={offer.title} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {offer.title}
                      </p>
                      <p className="text-xs text-slate-500">{offer.discount} off</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                      <Tag className="w-3 h-3" />
                      {offer.redemptions}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer Insights */}
          <div className="mt-6 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200">
              <h2 className="font-display font-semibold text-slate-900">Top Customers</h2>
            </div>
            {customers.length === 0 ? (
              <div className="p-12 text-center text-slate-500">No customers yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                     <tr>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-3 sm:px-6 py-3">
                        Customer
                      </th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-3 sm:px-6 py-3 hidden sm:table-cell">
                        Pets
                      </th>
                      <th className="text-center text-xs font-medium text-slate-500 uppercase px-3 sm:px-6 py-3">
                        Redemptions
                      </th>
                      <th className="text-right text-xs font-medium text-slate-500 uppercase px-3 sm:px-6 py-3">
                        Last Visit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.map((customer) => (
                      <tr key={customer.member_id} className="hover:bg-slate-50">
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {customer.member_name || "Unknown"}
                            </p>
                            <p className="text-xs font-mono text-slate-500">
                              {customer.member_number}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                          <span className="text-sm text-slate-600">
                            {customer.pet_names || "-"}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium">
                            {customer.total_redemptions}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                          <span className="text-xs sm:text-sm text-slate-500 flex items-center justify-end gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(new Date(customer.last_visit))}
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

export default BusinessAnalytics;
