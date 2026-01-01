import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { TrendingUp, Calendar, Building2, Tag, PiggyBank, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import Breadcrumbs from "@/components/Breadcrumbs";
import DogLoader from "@/components/DogLoader";

interface Redemption {
  id: string;
  redeemed_at: string;
  offer: {
    title: string;
    discount_value: number | null;
    discount_type: string;
  };
  business: {
    business_name: string;
    category: string;
  };
}

const RedemptionHistory = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSaved: 0,
    totalRedemptions: 0,
    thisMonth: 0,
    avgPerRedemption: 0,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?type=member");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchRedemptions();
    }
  }, [user]);

  const fetchRedemptions = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Get user's membership
      const { data: membership } = await supabase
        .from("memberships")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      let effectiveMembershipId = membership?.id;

      // Check shared membership
      if (!effectiveMembershipId) {
        const { data: share } = await supabase
          .from("membership_shares")
          .select("membership_id")
          .eq("shared_with_user_id", user.id)
          .maybeSingle();

        effectiveMembershipId = share?.membership_id;
      }

      if (!effectiveMembershipId) {
        setIsLoading(false);
        return;
      }

      // Fetch redemptions
      const { data, error } = await supabase
        .from("offer_redemptions")
        .select(`
          id,
          redeemed_at,
          offer:offers(title, discount_value, discount_type),
          business:businesses(business_name, category)
        `)
        .eq("membership_id", effectiveMembershipId)
        .order("redeemed_at", { ascending: false });

      if (error) throw error;

      const transformedRedemptions = (data || []).map((r) => ({
        id: r.id,
        redeemed_at: r.redeemed_at,
        offer: r.offer as unknown as Redemption["offer"],
        business: r.business as unknown as Redemption["business"],
      }));

      setRedemptions(transformedRedemptions);

      // Calculate stats
      const totalSaved = transformedRedemptions.reduce((sum, r) => {
        const value = r.offer?.discount_value || 0;
        // Estimate actual savings (for percentage, assume average transaction of €50)
        if (r.offer?.discount_type === "percentage") {
          return sum + (value / 100) * 50;
        }
        return sum + value;
      }, 0);

      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const monthlyRedemptions = transformedRedemptions.filter(
        (r) => new Date(r.redeemed_at) >= thisMonth
      );

      setStats({
        totalSaved: Math.round(totalSaved),
        totalRedemptions: transformedRedemptions.length,
        thisMonth: monthlyRedemptions.length,
        avgPerRedemption:
          transformedRedemptions.length > 0
            ? Math.round(totalSaved / transformedRedemptions.length)
            : 0,
      });
    } catch (error) {
      console.error("Error fetching redemptions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDiscount = (offer: Redemption["offer"]) => {
    if (!offer?.discount_value) return "Special Offer";
    return offer.discount_type === "percentage"
      ? `${offer.discount_value}% off`
      : `€${offer.discount_value} off`;
  };

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
        <title>Redemption History | PawPass</title>
        <meta
          name="description"
          content="View your PawPass redemption history and track your savings."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-paw-cream to-background">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <Breadcrumbs 
              items={[
                { label: "Dashboard", href: "/member" },
                { label: "History" }
              ]} 
            />
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              Redemption History
            </h1>
            <p className="text-muted-foreground">
              Track your savings and see how much you've benefited from PawPass
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-hero rounded-2xl p-5 text-white">
              <PiggyBank className="w-6 h-6 mb-2 opacity-80" />
              <div className="text-3xl font-display font-bold">€{stats.totalSaved}</div>
              <p className="text-sm opacity-80">Total Saved</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-soft">
              <Tag className="w-6 h-6 mb-2 text-primary" />
              <div className="text-3xl font-display font-bold text-foreground">
                {stats.totalRedemptions}
              </div>
              <p className="text-sm text-muted-foreground">Total Redemptions</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-soft">
              <TrendingUp className="w-6 h-6 mb-2 text-green-500" />
              <div className="text-3xl font-display font-bold text-foreground">
                {stats.thisMonth}
              </div>
              <p className="text-sm text-muted-foreground">This Month</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-soft">
              <BarChart3 className="w-6 h-6 mb-2 text-paw-gold" />
              <div className="text-3xl font-display font-bold text-foreground">
                €{stats.avgPerRedemption}
              </div>
              <p className="text-sm text-muted-foreground">Avg Savings</p>
            </div>
          </div>

          {/* Savings Progress */}
          <div className="bg-white rounded-2xl p-6 shadow-soft mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-foreground">
                Your Savings Journey
              </h2>
              {stats.totalSaved >= 100 && (
                <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                  🌟 Super Saver
                </span>
              )}
            </div>
            <div className="relative pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Progress to €500 milestone</span>
                <span className="text-sm font-medium text-primary">
                  {Math.min(100, Math.round((stats.totalSaved / 500) * 100))}%
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-hero rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (stats.totalSaved / 500) * 100)}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>€0</span>
                <div className="flex items-center gap-1">
                  <span className={stats.totalSaved >= 59 ? 'text-green-500 font-medium' : ''}>
                    €59
                  </span>
                  {stats.totalSaved >= 59 && <span className="text-green-500">✓</span>}
                </div>
                <span>€250</span>
                <span>€500</span>
              </div>
            </div>
            
            {/* Milestone messages */}
            <div className="mt-4 space-y-2">
              {stats.totalSaved >= 59 && (
                <p className="text-sm text-green-600 font-medium flex items-center gap-2 bg-green-50 p-3 rounded-lg">
                  🎉 You've already saved more than your membership cost!
                </p>
              )}
              {stats.totalSaved >= 100 && stats.totalSaved < 250 && (
                <p className="text-sm text-primary flex items-center gap-2 bg-primary/5 p-3 rounded-lg">
                  🚀 You're on fire! Keep using your PawPass to reach the next milestone.
                </p>
              )}
              {stats.totalSaved >= 250 && stats.totalSaved < 500 && (
                <p className="text-sm text-amber-600 flex items-center gap-2 bg-amber-50 p-3 rounded-lg">
                  ⭐ Halfway to €500! You're a PawPass power user.
                </p>
              )}
              {stats.totalSaved >= 500 && (
                <p className="text-sm text-rose-600 flex items-center gap-2 bg-rose-50 p-3 rounded-lg">
                  🏆 Incredible! You've saved over €500 with PawPass!
                </p>
              )}
            </div>
          </div>

          {/* Redemption List */}
          <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="font-display font-semibold text-foreground">
                All Redemptions
              </h2>
            </div>

            {redemptions.length === 0 ? (
              <div className="p-12 text-center">
                <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display font-semibold text-lg mb-2">
                  No redemptions yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Start using your PawPass at partner businesses to see your history here
                </p>
                <Link to="/member/offers">
                  <button className="text-primary font-medium hover:underline">
                    Browse available offers →
                  </button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {redemptions.map((redemption) => (
                  <div
                    key={redemption.id}
                    className="p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {redemption.offer?.title || "Offer"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {redemption.business?.business_name || "Business"}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-green-600">
                          {formatDiscount(redemption.offer)}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(redemption.redeemed_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default RedemptionHistory;
