import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Check, Sparkles, ArrowLeft, Dog, Users, Crown, Clock, RefreshCw, ArrowDown, AlertTriangle, Star, Zap, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Header from "@/components/Header";
import DogLoader from "@/components/DogLoader";
import SupportDialog from "@/components/SupportDialog";
import { useAuth } from "@/hooks/useAuth";
import { useAccountType } from "@/hooks/useAccountType";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays, addYears } from "date-fns";
import { formatDate } from "@/lib/utils";

interface Membership {
  id: string;
  plan_type: string;
  max_pets: number;
  expires_at: string;
}

interface PlanOption {
  id: string;
  name: string;
  petLabel: string;
  price: number;
  renewalPrice: number;
  maxPets: number;
  icon: typeof Dog;
  popular?: boolean;
}

const sharedBenefits = [
  "Access to all partner discounts",
  "AI Pet Assistant",
  "Vaccination reminders",
  "Community access",
  "Priority support",
];

const plans: PlanOption[] = [
  {
    id: "single",
    name: "Solo Paw",
    petLabel: "For your one & only furball 🐾",
    price: 59,
    renewalPrice: 49,
    maxPets: 1,
    icon: Dog,
  },
  {
    id: "duo",
    name: "Dynamic Duo",
    petLabel: "Because one buddy wasn't enough! 🐶🐱",
    price: 99,
    renewalPrice: 79,
    maxPets: 2,
    icon: Users,
    popular: true,
  },
  {
    id: "family",
    name: "Pack Leader",
    petLabel: "You run the zoo — we've got you 🦁",
    price: 139,
    renewalPrice: 109,
    maxPets: 5,
    icon: Crown,
  },
];

const MemberUpgrade = () => {
  const { user, loading } = useAuth();
  const { isBusiness, loading: accountTypeLoading } = useAccountType();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect business users
  useEffect(() => {
    if (!loading && !accountTypeLoading && isBusiness) {
      navigate("/business");
    }
  }, [loading, accountTypeLoading, isBusiness, navigate]);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [petCount, setPetCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [downgradePlan, setDowngradePlan] = useState<PlanOption | null>(null);
  const [showSupportDialog, setShowSupportDialog] = useState(false);

  useEffect(() => {
    const fetchMembership = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("memberships")
        .select("id, plan_type, max_pets, expires_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setMembership(data);

        // Get current pet count
        const { count } = await supabase
          .from("pets")
          .select("*", { count: "exact", head: true })
          .eq("membership_id", data.id);

        setPetCount(count || 0);
      }
      setIsLoading(false);
    };

    if (!loading) {
      fetchMembership();
    }
  }, [user, loading]);

  // Freemium users have no membership record - they're not "expired", they're new signups
  const isFreemiumUser = !membership;
  
  const daysUntilExpiry = membership?.expires_at
    ? differenceInDays(new Date(membership.expires_at), new Date())
    : null;

  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  const isExpired = membership && daysUntilExpiry !== null && daysUntilExpiry <= 0;

  const handlePlanChange = async (planId: string, isDowngrade: boolean = false) => {
    if (!membership || !user) return;
    
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    // Check if downgrading would leave too many pets
    if (isDowngrade && petCount > plan.maxPets) {
      toast({
        title: "Cannot downgrade",
        description: `You have ${petCount} pets but the ${plan.name} plan only allows ${plan.maxPets}. Please remove ${petCount - plan.maxPets} pet(s) first.`,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setSelectedPlan(planId);

    try {
      const { error } = await supabase
        .from("memberships")
        .update({ 
          plan_type: planId,
          max_pets: plan.maxPets 
        })
        .eq("id", membership.id);

      if (error) throw error;

      toast({
        title: isDowngrade ? "Plan changed" : "Plan upgraded! 🎉",
        description: `You're now on the ${plan.name} plan with up to ${plan.maxPets} pets.`,
      });

      setShowDowngradeDialog(false);
      navigate("/member");
    } catch (error) {
      console.error("Error changing plan:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  const handleNewSignup = async (planId: string) => {
    if (!user) return;
    
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    setIsProcessing(true);
    setSelectedPlan(planId);

    try {
      // Generate member number
      const memberNumber = `WF${Date.now().toString(36).toUpperCase()}`;
      const expiryDate = addYears(new Date(), 1);

      const { error } = await supabase
        .from("memberships")
        .insert({
          user_id: user.id,
          plan_type: planId,
          max_pets: plan.maxPets,
          member_number: memberNumber,
          expires_at: expiryDate.toISOString(),
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Welcome to Wooffy! 🎉",
        description: `Your ${plan.name} membership is now active until ${formatDate(expiryDate)}.`,
      });

      navigate("/member");
    } catch (error) {
      console.error("Error creating membership:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  const handleRenew = async (planId: string) => {
    if (!membership || !user) return;
    
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    setIsProcessing(true);
    setSelectedPlan(planId);

    try {
      const newExpiryDate = addYears(
        isExpired ? new Date() : new Date(membership.expires_at),
        1
      );

      const { error } = await supabase
        .from("memberships")
        .update({ 
          plan_type: planId,
          max_pets: plan.maxPets,
          expires_at: newExpiryDate.toISOString(),
          is_active: true
        })
        .eq("id", membership.id);

      if (error) throw error;

      toast({
        title: "Membership renewed! 🎉",
        description: `Your ${plan.name} plan is now active until ${formatDate(newExpiryDate)}.`,
      });

      navigate("/member");
    } catch (error) {
      console.error("Error renewing:", error);
      toast({
        title: "Renewal failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  const handleDowngradeClick = (plan: PlanOption) => {
    setDowngradePlan(plan);
    setShowDowngradeDialog(true);
  };

  if (loading || isLoading) {
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

  const currentPlanIndex = membership ? plans.findIndex(p => p.id === membership.plan_type) : -1;
  const currentPlan = membership ? plans.find(p => p.id === membership.plan_type) : null;

  return (
    <>
      <Helmet>
        <title>Manage Your Plan | Wooffy</title>
        <meta name="description" content="Upgrade, downgrade, or renew your Wooffy membership." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-wooffy-light to-background">
        <Header />

        <main className="container mx-auto px-4 py-8 pt-[calc(6rem+env(safe-area-inset-top))] max-w-5xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(isFreemiumUser ? "/member/free" : "/member")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          {/* Renewal Banner - only for existing members with expiring/expired subscriptions */}
          {!isFreemiumUser && (isExpiringSoon || isExpired) && (
            <Alert className={`mb-6 ${isExpired ? 'border-destructive bg-destructive/10' : 'border-amber-500 bg-amber-50'}`}>
              <Clock className={`h-4 w-4 ${isExpired ? 'text-destructive' : 'text-amber-600'}`} />
              <AlertDescription className={isExpired ? 'text-destructive' : 'text-amber-800'}>
                {isExpired ? (
                  <span className="font-medium">Your membership has expired! Renew now to continue enjoying Wooffy benefits.</span>
                ) : (
                  <span>Your membership expires in <strong>{daysUntilExpiry} days</strong>. Renew now and save up to €30!</span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-soft border border-border mb-6">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                {isFreemiumUser ? "Simple Pricing" : "Manage Your Plan"}
              </span>
            </span>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6">
              {isFreemiumUser 
                ? "One Membership, Endless Value" 
                : isExpiringSoon || isExpired 
                  ? "Renew & Save 🎉" 
                  : "Choose Your Plan"}
            </h1>
            
            <p className="text-lg text-muted-foreground">
              {isFreemiumUser
                ? "All plans include the same great benefits. Choose based on how many pets you have!"
                : isExpiringSoon || isExpired 
                  ? "Renew your membership with special loyalty discounts - save up to €30/year!"
                  : "Upgrade or change your plan anytime to fit your furry family."}
            </p>
          </div>

          {/* Pricing cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              const isCurrentPlan = membership?.plan_type === plan.id;
              const isDowngrade = !isFreemiumUser && index < currentPlanIndex;
              const isUpgrade = !isFreemiumUser && index > currentPlanIndex;
              const showRenewalPrice = !isFreemiumUser && (isExpiringSoon || isExpired);
              const savings = plan.price - plan.renewalPrice;

              return (
                <div key={plan.id} className="relative">
                  {/* Most Popular / Current Plan / Renewal badges */}
                  {plan.popular && !isCurrentPlan && !showRenewalPrice && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <div className="bg-gradient-hero text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-glow">
                        <Star className="w-4 h-4 fill-current" />
                        Most Popular
                      </div>
                    </div>
                  )}
                  {isCurrentPlan && !showRenewalPrice && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <div className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-lg">
                        <Check className="w-4 h-4" />
                        Current Plan
                      </div>
                    </div>
                  )}
                  {showRenewalPrice && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <div className="bg-amber-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                        {isCurrentPlan ? "Renew Now" : `Save €${savings}/year!`}
                      </div>
                    </div>
                  )}
                  
                  <div className={`bg-card rounded-3xl p-6 lg:p-8 shadow-card h-full flex flex-col ${
                    plan.popular && !isCurrentPlan && !showRenewalPrice
                      ? "border-2 border-primary/30 ring-2 ring-primary/10" 
                      : isCurrentPlan && !showRenewalPrice
                        ? "border-2 border-green-500/30 ring-2 ring-green-500/10"
                        : "border border-border"
                  }`}>
                    <div className="text-center mb-4">
                      <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                        <Icon className="w-7 h-7 text-primary" />
                        <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                          {plan.maxPets}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-xl text-foreground">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 min-h-[40px] flex items-center justify-center">{plan.petLabel}</p>
                    </div>

                    <div className="text-center mb-6">
                      {showRenewalPrice ? (
                        <div className="space-y-1">
                          <div className="flex items-baseline justify-center gap-1">
                            <span className="font-display font-bold text-4xl text-gradient">€{plan.renewalPrice}</span>
                            <span className="text-muted-foreground">/year</span>
                          </div>
                          <div className="text-xs">
                            <span className="line-through text-muted-foreground">€{plan.price}</span>
                            <span className="ml-2 text-green-600 font-medium">Save €{savings}!</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="font-display font-bold text-4xl text-gradient">€{plan.price}</span>
                          <span className="text-muted-foreground">/year</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1" />

                    {/* Action Buttons */}
                    {isFreemiumUser ? (
                      <Button 
                        variant={plan.popular ? "hero" : "outline"}
                        className="w-full"
                        onClick={() => handleNewSignup(plan.id)}
                        disabled={isProcessing}
                      >
                        {isProcessing && selectedPlan === plan.id ? (
                          "Processing..."
                        ) : (
                          "Get Started"
                        )}
                      </Button>
                    ) : isCurrentPlan ? (
                      showRenewalPrice ? (
                        <Button 
                          variant="hero"
                          className="w-full"
                          onClick={() => handleRenew(plan.id)}
                          disabled={isProcessing}
                        >
                          {isProcessing && selectedPlan === plan.id ? (
                            "Renewing..."
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Renew for €{plan.renewalPrice}
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full" disabled>
                          Current Plan
                        </Button>
                      )
                    ) : isDowngrade ? (
                      <Button 
                        variant="ghost" 
                        className="w-full text-muted-foreground hover:text-foreground"
                        onClick={() => handleDowngradeClick(plan)}
                      >
                        <ArrowDown className="w-4 h-4 mr-2" />
                        Downgrade
                      </Button>
                    ) : isUpgrade ? (
                      showRenewalPrice ? (
                        <Button 
                          variant={plan.popular ? "hero" : "outline"}
                          className="w-full"
                          onClick={() => handleRenew(plan.id)}
                          disabled={isProcessing}
                        >
                          {isProcessing && selectedPlan === plan.id ? (
                            "Processing..."
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Renew & Upgrade
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button 
                          variant={plan.popular ? "hero" : "outline"}
                          className="w-full"
                          onClick={() => handlePlanChange(plan.id)}
                          disabled={isProcessing}
                        >
                          {isProcessing && selectedPlan === plan.id ? (
                            "Upgrading..."
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Upgrade
                            </>
                          )}
                        </Button>
                      )
                    ) : (
                      <Button variant="outline" className="w-full" disabled>
                        Select Plan
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Shared benefits */}
          <div className="max-w-2xl mx-auto bg-card rounded-2xl p-6 shadow-card border border-border mb-8">
            <h3 className="font-display font-semibold text-lg text-center mb-4">All Plans Include</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {sharedBenefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500 shrink-0" />
                  <span className="text-sm text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Value proposition */}
          <div className="max-w-lg mx-auto bg-wooffy-dark rounded-2xl p-6 text-center">
            <p className="font-display font-semibold text-lg text-wooffy-sky mb-2">
              💡 The Average Member Saves €300+ Per Year
            </p>
            <p className="text-sm text-wooffy-light/70">
              That's a 5x return on your membership investment!
            </p>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Need help choosing?{" "}
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-primary hover:underline">
                  Contact us
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="center">
                <div className="flex flex-col gap-1">
                  <a
                    href="mailto:hello@wooffy.app"
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Send an Email
                  </a>
                  <button
                    onClick={() => setShowSupportDialog(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors text-left w-full"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Message Us
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </p>
        </main>
      </div>

      {/* Downgrade Confirmation Dialog */}
      <Dialog open={showDowngradeDialog} onOpenChange={setShowDowngradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Downgrade to {downgradePlan?.name}?
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <p>
                You're about to downgrade from <strong>{currentPlan?.name}</strong> (up to {currentPlan?.maxPets} pets) 
                to <strong>{downgradePlan?.name}</strong> (up to {downgradePlan?.maxPets} pet{(downgradePlan?.maxPets || 0) > 1 ? 's' : ''}).
              </p>
              {petCount > (downgradePlan?.maxPets || 0) ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You currently have {petCount} pets but this plan only allows {downgradePlan?.maxPets}. 
                    Please remove {petCount - (downgradePlan?.maxPets || 0)} pet(s) before downgrading.
                  </AlertDescription>
                </Alert>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Your change will take effect immediately. You won't be charged until your next renewal.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDowngradeDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => downgradePlan && handlePlanChange(downgradePlan.id, true)}
              disabled={isProcessing || petCount > (downgradePlan?.maxPets || 0)}
            >
              {isProcessing ? "Processing..." : "Confirm Downgrade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Support Dialog */}
      <SupportDialog open={showSupportDialog} onOpenChange={setShowSupportDialog} />
    </>
  );
};

export default MemberUpgrade;
