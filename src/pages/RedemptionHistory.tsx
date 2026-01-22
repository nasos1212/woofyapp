import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { TrendingUp, Calendar, Building2, Tag, PiggyBank, ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useMembership } from "@/hooks/useMembership";
import { useAccountType } from "@/hooks/useAccountType";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import Header from "@/components/Header";
import DogLoader from "@/components/DogLoader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Redemption {
  id: string;
  redeemed_at: string;
  offer: {
    title: string;
    description: string | null;
    discount_value: number | null;
    discount_type: string;
  };
  business: {
    id: string;
    business_name: string;
    category: string;
  };
  isBirthday?: boolean;
  petName?: string;
}

const RedemptionHistory = () => {
  const { user, loading } = useAuth();
  const { hasMembership, loading: membershipLoading } = useMembership();
  const { isBusiness, loading: accountTypeLoading } = useAccountType();
  const navigate = useNavigate();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRedemption, setSelectedRedemption] = useState<Redemption | null>(null);
  const [stats, setStats] = useState({
    totalSaved: 0,
    avgPercentage: 0,
    percentageCount: 0,
    totalRedemptions: 0,
    thisMonth: 0,
  });

  useEffect(() => {
    if (!loading && !accountTypeLoading) {
      if (!user) {
        navigate("/auth?type=member");
      } else if (isBusiness) {
        navigate("/business");
      } else if (!membershipLoading && !hasMembership) {
        navigate("/member/free");
      }
    }
  }, [user, loading, hasMembership, membershipLoading, isBusiness, accountTypeLoading, navigate]);

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

      // Fetch regular offer redemptions
      const { data, error } = await supabase
        .from("offer_redemptions")
        .select(`
          id,
          redeemed_at,
          offer:offers(title, description, discount_value, discount_type),
          business:businesses(id, business_name, category)
        `)
        .eq("membership_id", effectiveMembershipId)
        .order("redeemed_at", { ascending: false });

      if (error) throw error;

      const regularRedemptions = (data || []).map((r) => ({
        id: r.id,
        redeemed_at: r.redeemed_at,
        offer: r.offer as unknown as Redemption["offer"],
        business: r.business as unknown as Redemption["business"],
        isBirthday: false,
      }));

      // Fetch birthday offer redemptions
      const { data: birthdayData, error: birthdayError } = await supabase
        .from("sent_birthday_offers")
        .select(`
          id,
          redeemed_at,
          pet_name,
          discount_value,
          discount_type,
          message,
          business:businesses(id, business_name, category)
        `)
        .eq("owner_user_id", user.id)
        .not("redeemed_at", "is", null)
        .order("redeemed_at", { ascending: false });

      if (birthdayError) {
        console.error("Error fetching birthday redemptions:", birthdayError);
      }

      const birthdayRedemptions = (birthdayData || []).map((r) => ({
        id: r.id,
        redeemed_at: r.redeemed_at!,
        offer: {
          title: `🎂 Birthday Offer for ${r.pet_name}`,
          description: r.message,
          discount_value: r.discount_value,
          discount_type: r.discount_type,
        },
        business: r.business as unknown as Redemption["business"],
        isBirthday: true,
        petName: r.pet_name,
      }));

      // Combine and sort by date
      const transformedRedemptions = [...regularRedemptions, ...birthdayRedemptions]
        .sort((a, b) => new Date(b.redeemed_at).getTime() - new Date(a.redeemed_at).getTime());

      setRedemptions(transformedRedemptions);

      // Calculate stats - separate fixed amounts and percentages
      let fixedTotal = 0;
      let percentageTotal = 0;
      let percentageCount = 0;

      transformedRedemptions.forEach((r) => {
        const value = r.offer?.discount_value || 0;
        if (r.offer?.discount_type === "percentage") {
          percentageTotal += value;
          percentageCount++;
        } else {
          fixedTotal += value;
        }
      });

      const avgPercentage = percentageCount > 0 ? Math.round(percentageTotal / percentageCount) : 0;

      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const monthlyRedemptions = transformedRedemptions.filter(
        (r) => new Date(r.redeemed_at) >= thisMonth
      );

      setStats({
        totalSaved: Math.round(fixedTotal),
        avgPercentage,
        percentageCount,
        totalRedemptions: transformedRedemptions.length,
        thisMonth: monthlyRedemptions.length,
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
        <title>Redemption History | Wooffy</title>
        <meta
          name="description"
          content="View your Wooffy redemption history and track your savings."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-wooffy-light to-background">
        <Header />

        <main className="container mx-auto px-4 py-8 pt-24">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/member")}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              Redemption History
            </h1>
            <p className="text-muted-foreground">
              Track your savings and see how much you've benefited from Wooffy
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-hero rounded-2xl p-5 text-white">
              <PiggyBank className="w-6 h-6 mb-2 opacity-80" />
              <div className="text-3xl font-display font-bold">€{stats.totalSaved}</div>
              <p className="text-sm opacity-80">Fixed Savings</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-soft border-2 border-primary/20">
              <TrendingUp className="w-6 h-6 mb-2 text-primary" />
              <div className="text-3xl font-display font-bold text-foreground">
                {stats.avgPercentage > 0 ? `${stats.avgPercentage}%` : '-'}
              </div>
              <p className="text-sm text-muted-foreground">
                Avg % Discount {stats.percentageCount > 0 && `(${stats.percentageCount}x)`}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-soft">
              <Tag className="w-6 h-6 mb-2 text-green-500" />
              <div className="text-3xl font-display font-bold text-foreground">
                {stats.totalRedemptions}
              </div>
              <p className="text-sm text-muted-foreground">Total Redemptions</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-soft">
              <Calendar className="w-6 h-6 mb-2 text-yellow-500" />
              <div className="text-3xl font-display font-bold text-foreground">
                {stats.thisMonth}
              </div>
              <p className="text-sm text-muted-foreground">This Month</p>
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
                  Start using your Wooffy card at partner businesses to see your history here
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
                  <button
                    key={redemption.id}
                    onClick={() => setSelectedRedemption(redemption)}
                    className="w-full p-4 hover:bg-muted/30 transition-colors text-left"
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
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Redemption Detail Dialog */}
          <Dialog open={!!selectedRedemption} onOpenChange={() => setSelectedRedemption(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary" />
                  Redemption Details
                </DialogTitle>
              </DialogHeader>
              
              {selectedRedemption && (
                <div className="space-y-4">
                  {/* Offer Info */}
                  <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Offer</p>
                      <p className="font-semibold text-lg">{selectedRedemption.offer?.title || "Offer"}</p>
                    </div>
                    
                    {selectedRedemption.offer?.description && (
                      <div>
                        <p className="text-sm text-muted-foreground">Description</p>
                        <p className="text-foreground">{selectedRedemption.offer.description}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Discount</p>
                        <p className="font-semibold text-green-600 text-lg">
                          {formatDiscount(selectedRedemption.offer)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Redeemed</p>
                        <p className="font-medium">
                          {format(new Date(selectedRedemption.redeemed_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Business Info */}
                  <div className="bg-primary/5 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{selectedRedemption.business?.business_name || "Business"}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {selectedRedemption.business?.category?.replace(/_/g, " ") || "Partner"}
                        </p>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full gap-2" 
                      onClick={() => {
                        setSelectedRedemption(null);
                        navigate(`/business/${selectedRedemption.business?.id}`);
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Visit Company
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </>
  );
};

export default RedemptionHistory;
