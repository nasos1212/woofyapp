import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Crown, Star, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import soloPawImg from "@/assets/plan-solo-paw.jpg";
import duoImg from "@/assets/plan-dynamic-duo.jpg";
import packImg from "@/assets/plan-pack-leader.jpg";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Header from "@/components/Header";
import DogLoader from "@/components/DogLoader";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useAuth } from "@/hooks/useAuth";
import { useAccountType } from "@/hooks/useAccountType";
import { useMembership } from "@/hooks/useMembership";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { Trans, useTranslation } from "react-i18next";
import { isPaymentsConfigured } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { PAID_MEMBERSHIP_ENABLED } from "@/lib/featureFlags";
import { toast } from "sonner";

const PLANS = [
  { id: "solo", key: "solo", priceId: "wooffy_solo_yearly", pets: "1", price: 29, image: soloPawImg, popular: false, name: "Solo Paw" },
  { id: "duo", key: "duo", priceId: "wooffy_duo_yearly", pets: "2", price: 49, image: duoImg, popular: true, name: "Dynamic Duo" },
  { id: "pack", key: "pack", priceId: "wooffy_pack_yearly", pets: "3-5", price: 69, image: packImg, popular: false, name: "Pack Leader" },
];


const PLAN_TYPE_TO_PRICE_ID: Record<string, string> = {
  single: "wooffy_solo_yearly",
  duo: "wooffy_duo_yearly",
  family: "wooffy_pack_yearly",
};

const MemberUpgrade = () => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith("el") ? "el-GR" : "en-GB";
  const formatDate = (d: Date | string | number) =>
    new Date(d).toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" });
  const planLabel = (key: string) => t(`memberUpgrade.plans.${key}.label`);
  const { user, loading } = useAuth();
  const { isBusiness, loading: accountTypeLoading } = useAccountType();
  const { hasMembership, isPaidMember, membership } = useMembership();
  const navigate = useNavigate();
  const { openCheckout, closeCheckout, isOpen, checkoutElement } = useStripeCheckout();
  const [changePlan, setChangePlan] = useState<typeof PLANS[number] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<number | null>(null);
  const [previewIsUpgrade, setPreviewIsUpgrade] = useState(false);
  const [previewAmountDue, setPreviewAmountDue] = useState<number | null>(null);
  const [previewCurrency, setPreviewCurrency] = useState<string | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [subDetails, setSubDetails] = useState<{
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    status: string;
  } | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reactivateLoading, setReactivateLoading] = useState(false);
  const [pendingChange, setPendingChange] = useState<{ priceId: string | null; scheduledFor: number | null } | null>(null);
  const [cancelPendingLoading, setCancelPendingLoading] = useState(false);

  const currentPriceId = membership ? PLAN_TYPE_TO_PRICE_ID[membership.plan_type] : undefined;

  // Load active subscription details for in-app management
  useEffect(() => {
    if (!user || !isPaidMember) {
      setSubDetails(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("current_period_end, cancel_at_period_end, status")
        .eq("user_id", user.id)
        .eq("environment", getStripeEnvironment())
        .in("status", ["active", "trialing", "past_due"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) setSubDetails(data ?? null);
    })();
    return () => { cancelled = true; };
  }, [user, isPaidMember]);

  // Load any scheduled (pending) plan change
  const refreshPending = async () => {
    if (!user || !isPaidMember) {
      setPendingChange(null);
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("change-subscription-plan", {
        body: { mode: "status", environment: getStripeEnvironment() },
      });
      if (error || data?.error) {
        setPendingChange(null);
        return;
      }
      setPendingChange(data?.pending ?? null);
    } catch {
      setPendingChange(null);
    }
  };

  useEffect(() => {
    refreshPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isPaidMember]);




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
    // Block additional changes while one is already scheduled
    if (isPaidMember && pendingChange) {
      toast.error("You already have a scheduled plan change. Cancel it before scheduling another.");
      return;
    }
    // Paid member switching plan → scheduled at next renewal (no proration / no refund)
    if (isPaidMember && currentPriceId && currentPriceId !== priceId) {
      const plan = PLANS.find((p) => p.priceId === priceId) || null;
      setChangePlan(plan);
      setScheduledFor(null);
      setPreviewIsUpgrade(false);
      setPreviewAmountDue(null);
      setPreviewCurrency(null);
      setPreviewLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("change-subscription-plan", {
          body: {
            priceId,
            mode: "preview",
            environment: getStripeEnvironment(),
          },
        });
        const errMsg = error?.message || data?.error;
        if (data?.noActiveSubscription || (errMsg && /no active subscription/i.test(errMsg))) {
          // User is marked as paid in our DB but has no Stripe subscription
          // (legacy / manually-set plan). Treat as a new subscriber.
          setChangePlan(null);
          setPreviewLoading(false);
          openCheckout({
            priceId,
            customerEmail: user.email || undefined,
            userId: user.id,
            returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
          });
          return;
        }
        if (error || !data) throw new Error(error?.message || "Failed to preview plan change");
        if (data.error) throw new Error(data.error);

        setScheduledFor(data.scheduledFor ?? null);
        setPreviewIsUpgrade(!!data.isUpgrade);
        setPreviewAmountDue(typeof data.amountDueNow === "number" ? data.amountDueNow : null);
        setPreviewCurrency(data.currency ?? null);

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

  const handleCancelPendingChange = async () => {
    setCancelPendingLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("change-subscription-plan", {
        body: { mode: "cancel_pending", environment: getStripeEnvironment() },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setPendingChange(null);
      toast.success("Scheduled plan change canceled. You'll stay on your current plan.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel scheduled change");
    } finally {
      setCancelPendingLoading(false);
    }
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
      if (data?.upgraded) {
        toast.success(`You've been upgraded to ${changePlan.name}. Enjoy!`);
        setChangePlan(null);
        // Refresh page to reflect new plan
        setTimeout(() => window.location.reload(), 800);
        return;
      }
      const when = data?.scheduledFor
        ? new Date(data.scheduledFor * 1000).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "your next renewal";
      toast.success(`Your plan will switch to ${changePlan.name} on ${when}.`);
      setPendingChange({ priceId: changePlan.priceId, scheduledFor: data?.scheduledFor ?? null });
      setChangePlan(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to change plan");
    } finally {
      setConfirmLoading(false);
    }
  };


  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("update-subscription-status", {
        body: { action: "cancel", environment: getStripeEnvironment() },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success("Your membership has been canceled. You'll keep access until your renewal date.");
      setSubDetails((s) => s ? { ...s, cancel_at_period_end: true } : s);
      setCancelDialogOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel subscription");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setReactivateLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("update-subscription-status", {
        body: { action: "reactivate", environment: getStripeEnvironment() },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success("Your membership has been reactivated.");
      setSubDetails((s) => s ? { ...s, cancel_at_period_end: false } : s);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reactivate subscription");
    } finally {
      setReactivateLoading(false);
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
              {t("memberUpgrade.heading")}
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-xl mx-auto">
              {t("memberUpgrade.subheading")}
            </p>
          </div>

          {isPaidMember && (
            <div className="max-w-xl mx-auto mb-8 bg-card rounded-2xl p-5 border border-border shadow-card space-y-3">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">{t("memberUpgrade.active.label")}</p>
                <p className="font-display font-semibold text-lg text-foreground">
                  {membership?.member_number}
                </p>
              </div>
              {subDetails?.current_period_end && (
                <div className="text-center text-sm">
                  {subDetails.cancel_at_period_end ? (
                    <p className="text-amber-600 dark:text-amber-400">
                      <Trans
                        i18nKey="memberUpgrade.active.cancelsOn"
                        values={{ date: formatDate(subDetails.current_period_end) }}
                        components={{ 1: <strong /> }}
                      />
                    </p>
                  ) : (
                    <p className="text-muted-foreground">
                      <Trans
                        i18nKey="memberUpgrade.active.renewsOn"
                        values={{ date: formatDate(subDetails.current_period_end) }}
                        components={{ 1: <strong className="text-foreground" /> }}
                      />
                    </p>
                  )}
                </div>
              )}
              <div className="flex justify-center pt-1">
                {subDetails?.cancel_at_period_end ? (
                  <Button
                    variant="hero"
                    size="sm"
                    onClick={handleReactivateSubscription}
                    disabled={reactivateLoading}
                  >
                    {reactivateLoading ? t("memberUpgrade.active.reactivating") : t("memberUpgrade.active.reactivate")}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelDialogOpen(true)}
                  >
                    {t("memberUpgrade.active.cancel")}
                  </Button>
                )}
              </div>
            </div>
          )}

          {isPaidMember && pendingChange && (() => {
            const pendingPlan = PLANS.find((p) => p.priceId === pendingChange.priceId);
            const whenStr = pendingChange.scheduledFor
              ? formatDate(pendingChange.scheduledFor * 1000)
              : t("memberUpgrade.pending.fallbackDate");
            return (
              <div className="max-w-xl mx-auto mb-8 rounded-2xl p-5 border border-primary/30 bg-primary/5 shadow-card text-center space-y-3">
                <p className="text-sm text-muted-foreground">{t("memberUpgrade.pending.label")}</p>
                <p className="text-base text-foreground">
                  <Trans
                    i18nKey="memberUpgrade.pending.body"
                    values={{ plan: pendingPlan?.name ?? t("memberUpgrade.pending.fallbackPlan"), date: whenStr }}
                    components={{ 1: <strong className="font-display" />, 3: <strong /> }}
                  />
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelPendingChange}
                  disabled={cancelPendingLoading}
                >
                  {cancelPendingLoading ? t("memberUpgrade.pending.canceling") : t("memberUpgrade.pending.cancel")}
                </Button>
              </div>
            );
          })()}

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {PLANS.map((plan) => {
              return (
                <div key={plan.id} className="relative">
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <div className="bg-gradient-hero text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-glow">
                        <Star className="w-4 h-4 fill-current" />
                        {t("memberUpgrade.mostPopular")}
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
                      <div className="relative mx-auto mb-4 w-28 h-28 rounded-2xl overflow-hidden shadow-md">
                        <img
                          src={plan.image}
                          alt={plan.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          width={112}
                          height={112}
                        />
                      </div>
                      <h3 className="font-display font-bold text-xl text-foreground">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1 min-h-[40px] flex items-center justify-center">
                        {planLabel(plan.key)}
                      </p>
                    </div>
                    <div className="text-center mb-6">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="font-display font-bold text-4xl text-gradient">
                          €{plan.price}
                        </span>
                        <span className="text-muted-foreground">{t("memberUpgrade.perYear")}</span>
                      </div>
                    </div>
                    <div className="flex-1" />
                    {(() => {
                      const isCurrent = currentPriceId === plan.priceId;
                      const currentIdx = currentPriceId
                        ? PLANS.findIndex((p) => p.priceId === currentPriceId)
                        : -1;
                      const thisIdx = PLANS.findIndex((p) => p.priceId === plan.priceId);
                      const isPending = !!pendingChange && pendingChange.priceId === plan.priceId;
                      const blocked = !!pendingChange && !isCurrent && !isPending;
                      const label = isCurrent
                        ? t("memberUpgrade.cta.current")
                        : isPending
                          ? t("memberUpgrade.cta.scheduled")
                          : isPaidMember && currentIdx >= 0
                            ? thisIdx > currentIdx
                              ? t("memberUpgrade.cta.upgradeTo", { plan: plan.name })
                              : t("memberUpgrade.cta.switchTo", { plan: plan.name })
                            : t("memberUpgrade.cta.select", { plan: plan.name });
                      return (
                        <Button
                          variant={plan.popular ? "hero" : "outline"}
                          className="w-full"
                          onClick={() => handleSelect(plan.priceId)}
                          disabled={isCurrent || isPending || blocked}
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
            <h3 className="font-display font-semibold text-lg text-center mb-4">{t("memberUpgrade.benefitsHeading")}</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {(t("memberUpgrade.benefits", { returnObjects: true }) as string[]).map((b, i) => (
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
              <DialogTitle>{t("memberUpgrade.checkout.title")}</DialogTitle>
            </DialogHeader>
            <div className="px-2 sm:px-4 pb-4">{checkoutElement}</div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!changePlan} onOpenChange={(open) => !open && !confirmLoading && setChangePlan(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t("memberUpgrade.switchDialog.title", { plan: changePlan?.name ?? "" })}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {previewLoading ? (
                <div className="py-6 flex justify-center"><DogLoader size="sm" /></div>
              ) : (
                <>
                  {previewIsUpgrade ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        <Trans
                          i18nKey="memberUpgrade.switchDialog.upgradeBody"
                          values={{ plan: changePlan?.name ?? "" }}
                          components={{ 1: <strong /> }}
                        />
                      </p>
                      {typeof previewAmountDue === "number" && previewAmountDue > 0 && (
                        <div className="bg-muted/50 rounded-xl p-4 text-center">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                            {t("memberUpgrade.switchDialog.dueToday")}
                          </p>
                          <p className="font-display font-bold text-2xl text-foreground">
                            {new Intl.NumberFormat(dateLocale, {
                              style: "currency",
                              currency: (previewCurrency || "eur").toUpperCase(),
                            }).format(previewAmountDue / 100)}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        <Trans
                          i18nKey="memberUpgrade.switchDialog.scheduleBody"
                          values={{ plan: changePlan?.name ?? "" }}
                          components={{ 1: <strong /> }}
                        />
                      </p>
                      {scheduledFor && (
                        <div className="bg-muted/50 rounded-xl p-4 text-center">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                            {t("memberUpgrade.switchDialog.takesEffectOn")}
                          </p>
                          <p className="font-display font-bold text-2xl text-foreground">
                            {formatDate(scheduledFor * 1000)}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setChangePlan(null)}
                      disabled={confirmLoading}
                    >
                      {t("memberUpgrade.switchDialog.cancel")}
                    </Button>
                    <Button
                      variant="hero"
                      onClick={handleConfirmChange}
                      disabled={confirmLoading}
                    >
                      {confirmLoading
                        ? previewIsUpgrade ? t("memberUpgrade.switchDialog.charging") : t("memberUpgrade.switchDialog.scheduling")
                        : previewIsUpgrade ? t("memberUpgrade.switchDialog.payUpgrade") : t("memberUpgrade.switchDialog.schedule")}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={cancelDialogOpen} onOpenChange={(open) => !open && !cancelLoading && setCancelDialogOpen(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t("memberUpgrade.cancelDialog.title")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                <Trans
                  i18nKey="memberUpgrade.cancelDialog.body"
                  values={{
                    date: subDetails?.current_period_end
                      ? formatDate(subDetails.current_period_end)
                      : t("memberUpgrade.cancelDialog.fallbackDate"),
                  }}
                  components={{ 1: <strong className="text-foreground" /> }}
                />
              </p>
              <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => setCancelDialogOpen(false)}
                  disabled={cancelLoading}
                >
                  {t("memberUpgrade.cancelDialog.keep")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelSubscription}
                  disabled={cancelLoading}
                >
                  {cancelLoading ? t("memberUpgrade.cancelDialog.canceling") : t("memberUpgrade.cancelDialog.confirm")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};


export default MemberUpgrade;
