import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Users,
  Tag,
  Calendar,
  Download,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import DogLoader from "@/components/DogLoader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

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
  pet_name: string | null;
  total_redemptions: number;
  last_visit: string;
}

const BusinessAnalytics = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalRedemptions: 0,
    thisMonth: 0,
    lastMonth: 0,
    uniqueCustomers: 0,
    avgPerCustomer: 0,
    totalDiscountsGiven: 0,
  });
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [topOffers, setTopOffers] = useState<TopOffer[]>([]);
  const [customers, setCustomers] = useState<CustomerInsight[]>([]);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "month">("30d");

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
        startDate = startOfMonth(now);
      }

      const thisMonthStart = startOfMonth(now);
      const lastMonthStart = startOfMonth(subDays(thisMonthStart, 1));
      const lastMonthEnd = endOfMonth(subDays(thisMonthStart, 1));

      // Fetch all redemptions
      const { data: allRedemptions, error } = await supabase
        .from("offer_redemptions")
        .select(`
          id,
          redeemed_at,
          membership_id,
          membership:memberships(member_number, pet_name),
          offer:offers(title, discount_value, discount_type)
        `)
        .eq("business_id", business.id)
        .order("redeemed_at", { ascending: false });

      if (error) throw error;

      const redemptions = allRedemptions || [];

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
      const totalDiscounts = redemptions.reduce((sum, r) => {
        const offer = r.offer as unknown as { discount_value: number; discount_type: string };
        if (offer?.discount_type === "percentage") {
          return sum + (offer.discount_value / 100) * 50; // Assume €50 avg transaction
        }
        return sum + (offer?.discount_value || 0);
      }, 0);

      setStats({
        totalRedemptions: redemptions.length,
        thisMonth: thisMonthRedemptions.length,
        lastMonth: lastMonthRedemptions.length,
        uniqueCustomers: uniqueMemberIds.size,
        avgPerCustomer:
          uniqueMemberIds.size > 0
            ? Math.round(redemptions.length / uniqueMemberIds.size * 10) / 10
            : 0,
        totalDiscountsGiven: Math.round(totalDiscounts),
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

      // Calculate customer insights
      const customerData: Record<
        string,
        { member_number: string; pet_name: string | null; count: number; lastVisit: string }
      > = {};

      redemptions.forEach((r) => {
        const membership = r.membership as unknown as {
          member_number: string;
          pet_name: string | null;
        };
        if (membership?.member_number) {
          if (!customerData[r.membership_id]) {
            customerData[r.membership_id] = {
              member_number: membership.member_number,
              pet_name: membership.pet_name,
              count: 0,
              lastVisit: r.redeemed_at,
            };
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
            pet_name: data.pet_name,
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

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader size="lg" />
      </div>
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
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Breadcrumbs 
              items={[
                { label: "Partner Dashboard", href: "/business" },
                { label: "Analytics" }
              ]} 
            />
            <Button variant="outline" onClick={exportData} className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-1 sm:mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-sm sm:text-base text-slate-500">Track your Wooffy performance</p>
            </div>

            {/* Date Range Selector */}
            <div className="flex items-center gap-1 sm:gap-2 bg-white rounded-lg p-1 border border-slate-200 w-fit">
              {(["7d", "30d", "month"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    dateRange === range
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {range === "7d" ? "7D" : range === "30d" ? "30D" : "Month"}
                </button>
              ))}
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
              <p className="text-xs sm:text-sm text-slate-500">This Month</p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm border border-slate-200">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mb-1 sm:mb-2" />
              <div className="text-xl sm:text-3xl font-display font-bold text-slate-900">
                {stats.uniqueCustomers}
              </div>
              <p className="text-xs sm:text-sm text-slate-500">Customers</p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm border border-slate-200">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mb-1 sm:mb-2" />
              <div className="text-xl sm:text-3xl font-display font-bold text-slate-900">
                {stats.avgPerCustomer}
              </div>
              <p className="text-xs sm:text-sm text-slate-500">Avg Visits</p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm border border-slate-200">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 mb-1 sm:mb-2" />
              <div className="text-xl sm:text-3xl font-display font-bold text-slate-900">
                €{stats.totalDiscountsGiven}
              </div>
              <p className="text-xs sm:text-sm text-slate-500">Discounts</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="font-display font-semibold text-slate-900 mb-4">
                Redemptions Over Time
              </h2>
              <div className="h-64 flex items-end gap-1">
                {dailyData.map((day, i) => (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center gap-1"
                    title={`${format(new Date(day.date), "MMM d")}: ${day.redemptions}`}
                  >
                    <div
                      className="w-full bg-primary/80 rounded-t-sm hover:bg-primary transition-colors cursor-pointer"
                      style={{
                        height: `${(day.redemptions / maxRedemptions) * 100}%`,
                        minHeight: day.redemptions > 0 ? "4px" : "0",
                      }}
                    />
                    {i % Math.ceil(dailyData.length / 7) === 0 && (
                      <span className="text-xs text-slate-400 -rotate-45 origin-left whitespace-nowrap">
                        {format(new Date(day.date), "M/d")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Top Offers */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="font-display font-semibold text-slate-900 mb-4">Top Offers</h2>
              {topOffers.length === 0 ? (
                <p className="text-slate-500 text-sm">No redemptions yet</p>
              ) : (
                <div className="space-y-3">
                  {topOffers.map((offer, i) => (
                    <div key={offer.title} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {offer.title}
                        </p>
                        <p className="text-xs text-slate-500">{offer.discount} off</p>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        {offer.redemptions}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Customer Insights */}
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="font-display font-semibold text-slate-900">Top Customers</h2>
            </div>
            {customers.length === 0 ? (
              <div className="p-12 text-center text-slate-500">No customers yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">
                        Member
                      </th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-6 py-3">
                        Pet
                      </th>
                      <th className="text-center text-xs font-medium text-slate-500 uppercase px-6 py-3">
                        Visits
                      </th>
                      <th className="text-right text-xs font-medium text-slate-500 uppercase px-6 py-3">
                        Last Visit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.map((customer) => (
                      <tr key={customer.member_id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono text-slate-900">
                            {customer.member_number}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600">
                            {customer.pet_name || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium">
                            {customer.total_redemptions}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm text-slate-500 flex items-center justify-end gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(customer.last_visit), "MMM d, yyyy")}
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

export default BusinessAnalytics;
