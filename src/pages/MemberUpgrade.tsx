import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Check, Sparkles, ArrowLeft, Dog, Users, Crown, Clock, RefreshCw, ArrowDown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Header from "@/components/Header";
import DogLoader from "@/components/DogLoader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, addYears } from "date-fns";

interface Membership {
  id: string;
  plan_type: string;
  max_pets: number;
  expires_at: string;
}

interface PlanOption {
  id: string;
  name: string;
  price: number;
  renewalPrice: number;
  maxPets: number;
  icon: typeof Dog;
  features: string[];
  highlight?: boolean;
}

const plans: PlanOption[] = [
  {
    id: "single",
    name: "Solo Paw",
    price: 59,
    renewalPrice: 49,
    maxPets: 1,
    icon: Dog,
    features: [
      "1 pet included",
      "Access to all partner discounts",
      "AI Health Assistant",
      "Vaccination reminders",
    ],
  },
  {
    id: "duo",
    name: "Dynamic Duo",
    price: 99,
    renewalPrice: 79,
    maxPets: 2,
    icon: Users,
    features: [
      "2 pets included",
      "Access to all partner discounts",
      "AI Health Assistant",
      "Vaccination reminders",
      "Priority support",
    ],
    highlight: true,
  },
  {
    id: "family",
    name: "Pack Leader",
    price: 129,
    renewalPrice: 99,
    maxPets: 5,
    icon: Crown,
    features: [
      "Up to 5 pets",
      "Access to all partner discounts",
      "AI Health Assistant",
      "Vaccination reminders",
      "Priority support",
      "Exclusive family events",
    ],
  },
];

const MemberUpgrade = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [membership, setMembership] = useState<Membership | null>(null);
  const [petCount, setPetCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [downgradePlan, setDowngradePlan] = useState<PlanOption | null>(null);

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

  const daysUntilExpiry = membership?.expires_at
    ? differenceInDays(new Date(membership.expires_at), new Date())
    : 0;

  const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  const isExpired = daysUntilExpiry <= 0;

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
        description: `Your ${plan.name} plan is now active until ${format(newExpiryDate, "MMM d, yyyy")}.`,
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

  const currentPlanIndex = plans.findIndex(p => p.id === membership?.plan_type);
  const currentPlan = plans.find(p => p.id === membership?.plan_type);

  return (
    <>
      <Helmet>
        <title>Manage Your Plan | Wooffy</title>
        <meta name="description" content="Upgrade, downgrade, or renew your Wooffy membership." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-wooffy-light to-background">
        <Header />

        <main className="container mx-auto px-4 py-8 pt-24 max-w-5xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/member")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          {/* Renewal Banner */}
          {(isExpiringSoon || isExpired) && (
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

          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Manage Your Plan</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              {isExpiringSoon || isExpired ? "Renew & Save 🎉" : "Choose Your Plan 🐾"}
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {isExpiringSoon || isExpired 
                ? "Renew your membership with special loyalty discounts - save up to €30/year!"
                : "Upgrade or change your plan anytime to fit your furry family."}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              const isCurrentPlan = membership?.plan_type === plan.id;
              const isDowngrade = index < currentPlanIndex;
              const isUpgrade = index > currentPlanIndex;
              const showRenewalPrice = isExpiringSoon || isExpired;
              const savings = plan.price - plan.renewalPrice;

              return (
                <Card 
                  key={plan.id}
                  className={`relative overflow-hidden transition-all ${
                    plan.highlight 
                      ? 'border-primary shadow-lg scale-[1.02]' 
                      : 'border-border'
                  } ${isCurrentPlan ? 'ring-2 ring-green-500/50' : ''}`}
                >
                  {plan.highlight && !isCurrentPlan && (
                    <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-xs font-medium py-1 text-center">
                      Most Popular
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute top-0 left-0 right-0 bg-green-500 text-white text-xs font-medium py-1 text-center">
                      Current Plan
                    </div>
                  )}
                  {showRenewalPrice && !isCurrentPlan && (
                    <div className="absolute top-0 left-0 right-0 bg-amber-500 text-white text-xs font-medium py-1 text-center">
                      Save €{savings}/year!
                    </div>
                  )}
                  
                  <CardHeader className={(plan.highlight && !isCurrentPlan) || isCurrentPlan || showRenewalPrice ? 'pt-8' : ''}>
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>
                      {showRenewalPrice && isCurrentPlan ? (
                        <div className="space-y-1">
                          <div>
                            <span className="text-2xl font-bold text-foreground">€{plan.renewalPrice}</span>
                            <span className="text-muted-foreground">/year</span>
                          </div>
                          <div className="text-xs">
                            <span className="line-through text-muted-foreground">€{plan.price}</span>
                            <span className="ml-2 text-green-600 font-medium">Save €{savings}!</span>
                          </div>
                        </div>
                      ) : showRenewalPrice ? (
                        <div className="space-y-1">
                          <div>
                            <span className="text-2xl font-bold text-foreground">€{plan.renewalPrice}</span>
                            <span className="text-muted-foreground">/year</span>
                          </div>
                          <div className="text-xs">
                            <span className="line-through text-muted-foreground">€{plan.price}</span>
                            <span className="ml-2 text-green-600 font-medium">Renewal price</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="text-3xl font-bold text-foreground">€{plan.price}</span>
                          <span className="text-muted-foreground">/year</span>
                        </>
                      )}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {isCurrentPlan ? (
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
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleDowngradeClick(plan)}
                      >
                        <ArrowDown className="w-4 h-4 mr-2" />
                        Downgrade
                      </Button>
                    ) : isUpgrade ? (
                      showRenewalPrice ? (
                        <Button 
                          variant={plan.highlight ? "hero" : "default"}
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
                          variant={plan.highlight ? "hero" : "default"}
                          className="w-full"
                          onClick={() => handlePlanChange(plan.id)}
                          disabled={isProcessing}
                        >
                          {isProcessing && selectedPlan === plan.id ? (
                            "Upgrading..."
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Upgrade to {plan.name}
                            </>
                          )}
                        </Button>
                      )
                    ) : (
                      <Button variant="outline" className="w-full" disabled>
                        Select Plan
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Need help choosing? <a href="mailto:support@wooffy.com" className="text-primary hover:underline">Contact us</a>
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
    </>
  );
};

export default MemberUpgrade;
