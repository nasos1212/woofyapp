import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Crown, Star, Dog, Users, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Header from "@/components/Header";
import DogLoader from "@/components/DogLoader";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useAuth } from "@/hooks/useAuth";
import { useAccountType } from "@/hooks/useAccountType";
import { useMembership } from "@/hooks/useMembership";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useTranslation } from "react-i18next";
import { isPaymentsConfigured } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { PAID_MEMBERSHIP_ENABLED } from "@/lib/featureFlags";
import { toast } from "sonner";

const PLANS = [
  {
    id: "solo",
    priceId: "wooffy_solo_yearly",
    pets: "1",
    price: 29,
    icon: Dog,
    popular: false,
    name: "Solo Paw",
    label: "For one beloved companion",
  },
  {
    id: "duo",
    priceId: "wooffy_duo_yearly",
    pets: "2",
    price: 49,
    icon: Users,
    popular: true,
    name: "Dynamic Duo",
    label: "Perfect for two pets",
  },
  {
    id: "pack",
    priceId: "wooffy_pack_yearly",
    pets: "3-5",
    price: 69,
    icon: Crown,
    popular: false,
    name: "Pack Leader",
    label: "For families with 3 to 5 pets",
  },
];

const BENEFITS = [
  "Exclusive partner discounts at vets, groomers, shops & more",
  "AI Pet Health Assistant available 24/7",
  "Vaccination & health reminders for every pet",
  "Community access — ask vets and other owners",
  "Priority support",
];

const PLAN_TYPE_TO_PRICE_ID: Record<string, string> = {
  single: "wooffy_solo_yearly",
  duo: "wooffy_duo_yearly",
  family: "wooffy_pack_yearly",
};

const MemberUpgrade = () => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const { isBusiness, loading: accountTypeLoading } = useAccountType();
  const { hasMembership, isPaidMember, membership } = useMembership();
  const navigate = useNavigate();
  const { openCheckout, closeCheckout, isOpen, checkoutElement } = useStripeCheckout();
  const [portalLoading, setPortalLoading] = useState(false);
  const [changePlan, setChangePlan] = useState<typeof PLANS[number] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<number | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const currentPriceId = membership ? PLAN_TYPE_TO_PRICE_ID[membership.plan_type] : undefined;


  useEffect(() => {
    if (!loading && !accountTypeLoading && isBusiness) {
      navigate("/business");
    }
  }, [loading, accountTypeLoading, isBusiness, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader size="lg" />
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  // Paid membership is not live yet — show a friendly Coming Soon screen
  // instead of the plan selector / Stripe checkout flow.
  if (!PAID_MEMBERSHIP_ENABLED) {
    return (
      <>
        <Helmet>
          <title>Paid Membership Coming Soon | Wooffy</title>
          <meta name="description" content="Wooffy Paid Membership launches soon. Stay tuned for exclusive partner discounts and premium perks." />
        </Helmet>

        <div className="min-h-screen bg-gradient-to-b from-wooffy-light to-background">
          <Header />
          <main className="w-full max-w-2xl mx-auto px-4 py-8 pt-[calc(6rem+env(safe-area-inset-top))]">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="bg-card rounded-3xl p-8 sm:p-12 shadow-card border border-border text-center space-y-5">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Crown className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                Paid Membership is launching soon
              </h1>
              <p className="text-muted-foreground text-base leading-relaxed max-w-md mx-auto">
                We're putting the final touches on Wooffy Paid Membership — exclusive partner discounts, AI Pet Health Assistant and more. Free membership stays available in the meantime.
              </p>
              <Button variant="hero" onClick={() => navigate("/member/free")}>
                Back to your dashboard
              </Button>
            </div>
          </main>
        </div>
      </>
    );
  }

  const handleSelect = async (priceId: string) => {
    if (!isPaymentsConfigured()) {
      toast.error("Payments are not yet configured for this environment.");
      return;
    }
    // Paid member switching plan → scheduled at next renewal (no proration / no refund)
    if (isPaidMember && currentPriceId && currentPriceId !== priceId) {
      const plan = PLANS.find((p) => p.priceId === priceId) || null;
      setChangePlan(plan);
      setScheduledFor(null);
      setPreviewLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("change-subscription-plan", {
          body: {
            priceId,
            mode: "preview",
            environment: getStripeEnvironment(),
          },
        });
        if (error || !data) throw new Error(error?.message || "Failed to preview plan change");
        if (data.error) throw new Error(data.error);
        setScheduledFor(data.scheduledFor ?? null);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to preview plan change");
        setChangePlan(null);
      } finally {
        setPreviewLoading(false);
      }
      return;
    }
    // New subscriber → fresh checkout
    openCheckout({
      priceId,
      customerEmail: user.email || undefined,
      userId: user.id,
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
  };

  const handleConfirmChange = async () => {
    if (!changePlan) return;
    setConfirmLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("change-subscription-plan", {
        body: {
          priceId: changePlan.priceId,
          mode: "confirm",
          environment: getStripeEnvironment(),
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      const when = data?.scheduledFor
        ? new Date(data.scheduledFor * 1000).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "your next renewal";
      toast.success(`Your plan will switch to ${changePlan.name} on ${when}.`);
      setChangePlan(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to change plan");
    } finally {
      setConfirmLoading(false);
    }
  };


  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: {
          environment: getStripeEnvironment(),
          returnUrl: `${window.location.origin}/member/upgrade`,
        },
      });
      if (error || !data?.url) {
        throw new Error(error?.message || "Failed to open subscription portal");
      }
      window.location.href = data.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to open subscription portal");
      setPortalLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t("memberUpgrade.metaTitle")}</title>
        <meta name="description" content={t("memberUpgrade.metaDescription")} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-wooffy-light to-background overflow-x-hidden">
        <PaymentTestModeBanner />
        <Header />

        <main className="w-full max-w-5xl mx-auto px-4 py-8 pt-[calc(6rem+env(safe-area-inset-top))] box-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(hasMembership ? "/member" : "/member/free")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("memberUpgrade.back")}
          </Button>

          <div className="text-center space-y-4 mb-10">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Crown className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
              Choose your Wooffy Paid Membership
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-xl mx-auto">
              Unlock exclusive partner discounts, AI health support, and priority features for your pets — all year round.
            </p>
          </div>

          {isPaidMember && (
            <div className="max-w-xl mx-auto mb-8 bg-card rounded-2xl p-5 border border-border shadow-card text-center">
              <p className="text-sm text-muted-foreground mb-3">
                You already have an active paid membership ({membership?.member_number}).
              </p>
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={portalLoading}
              >
                {portalLoading ? "Opening…" : "Manage subscription"}
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              return (
                <div key={plan.id} className="relative">
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <div className="bg-gradient-hero text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-glow">
                        <Star className="w-4 h-4 fill-current" />
                        Most Popular
                      </div>
                    </div>
                  )}
                  <div
                    className={`bg-card rounded-3xl p-6 shadow-card h-full flex flex-col ${
                      plan.popular
                        ? "border-2 border-primary/30 ring-2 ring-primary/10"
                        : "border border-border"
                    }`}
                  >
                    <div className="text-center mb-4">
                      <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                        <Icon className="w-7 h-7 text-primary" />
                        <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                          {plan.pets}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-xl text-foreground">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1 min-h-[40px] flex items-center justify-center">
                        {plan.label}
                      </p>
                    </div>
                    <div className="text-center mb-6">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="font-display font-bold text-4xl text-gradient">
                          €{plan.price}
                        </span>
                        <span className="text-muted-foreground">/ year</span>
                      </div>
                    </div>
                    <div className="flex-1" />
                    {(() => {
                      const isCurrent = currentPriceId === plan.priceId;
                      const currentIdx = currentPriceId
                        ? PLANS.findIndex((p) => p.priceId === currentPriceId)
                        : -1;
                      const thisIdx = PLANS.findIndex((p) => p.priceId === plan.priceId);
                      const label = isCurrent
                        ? "Your current plan"
                        : isPaidMember && currentIdx >= 0
                          ? thisIdx > currentIdx
                            ? `Upgrade to ${plan.name}`
                            : `Switch to ${plan.name}`
                          : `Select ${plan.name}`;
                      return (
                        <Button
                          variant={plan.popular ? "hero" : "outline"}
                          className="w-full"
                          onClick={() => handleSelect(plan.priceId)}
                          disabled={isCurrent}
                        >
                          {label}
                        </Button>
                      );
                    })()}

                  </div>
                </div>
              );
            })}
          </div>

          <div className="max-w-2xl mx-auto bg-card rounded-2xl p-6 shadow-card border border-border">
            <h3 className="font-display font-semibold text-lg text-center mb-4">All plans include</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {BENEFITS.map((b, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </main>

        <Dialog open={isOpen} onOpenChange={(open) => !open && closeCheckout()}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
            <DialogHeader className="px-6 pt-6">
              <DialogTitle>Complete your membership</DialogTitle>
            </DialogHeader>
            <div className="px-2 sm:px-4 pb-4">{checkoutElement}</div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!changePlan} onOpenChange={(open) => !open && !confirmLoading && setChangePlan(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Switch to {changePlan?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {previewLoading ? (
                <div className="py-6 flex justify-center"><DogLoader size="sm" /></div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Your plan will switch to <strong>{changePlan?.name}</strong> automatically on your next renewal. No charge or refund happens today — you keep your current plan and benefits until then.
                  </p>
                  {scheduledFor && (
                    <div className="bg-muted/50 rounded-xl p-4 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Takes effect on
                      </p>
                      <p className="font-display font-bold text-2xl text-foreground">
                        {new Date(scheduledFor * 1000).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2 justify-end pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setChangePlan(null)}
                      disabled={confirmLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="hero"
                      onClick={handleConfirmChange}
                      disabled={confirmLoading}
                    >
                      {confirmLoading ? "Scheduling…" : "Schedule change"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};


export default MemberUpgrade;
