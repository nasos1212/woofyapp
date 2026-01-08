import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Check, Sparkles, ArrowLeft, Dog, Users, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Header from "@/components/Header";
import DogLoader from "@/components/DogLoader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Membership {
  id: string;
  plan_type: string;
  max_pets: number;
}

interface PlanOption {
  id: string;
  name: string;
  price: number;
  maxPets: number;
  icon: typeof Dog;
  features: string[];
  highlight?: boolean;
}

const plans: PlanOption[] = [
  {
    id: "solo",
    name: "Solo",
    price: 29,
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
    name: "Duo",
    price: 39,
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
    name: "Family",
    price: 49,
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
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    const fetchMembership = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("memberships")
        .select("id, plan_type, max_pets")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setMembership(data);
      }
      setIsLoading(false);
    };

    if (!loading) {
      fetchMembership();
    }
  }, [user, loading]);

  const handleUpgrade = async (planId: string) => {
    if (!membership || !user) return;
    
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    setIsUpgrading(true);
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
        title: "Plan upgraded! 🎉",
        description: `You're now on the ${plan.name} plan. You can add up to ${plan.maxPets} pets.`,
      });

      navigate("/member");
    } catch (error) {
      console.error("Error upgrading:", error);
      toast({
        title: "Upgrade failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpgrading(false);
      setSelectedPlan(null);
    }
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

  return (
    <>
      <Helmet>
        <title>Upgrade Your Plan | Wooffy</title>
        <meta name="description" content="Upgrade your Wooffy membership to add more pets and unlock more benefits." />
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

          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Upgrade Your Plan</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              More Pets, More Love 🐾
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Got a new furry family member? Upgrade your plan to add more pets and enjoy additional benefits.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              const isCurrentPlan = membership?.plan_type === plan.id;
              const isDowngrade = index < currentPlanIndex;
              const isUpgrade = index > currentPlanIndex;

              return (
                <Card 
                  key={plan.id}
                  className={`relative overflow-hidden transition-all ${
                    plan.highlight 
                      ? 'border-primary shadow-lg scale-[1.02]' 
                      : 'border-border'
                  } ${isCurrentPlan ? 'ring-2 ring-primary/50' : ''}`}
                >
                  {plan.highlight && (
                    <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-xs font-medium py-1 text-center">
                      Most Popular
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute top-0 left-0 right-0 bg-green-500 text-white text-xs font-medium py-1 text-center">
                      Current Plan
                    </div>
                  )}
                  
                  <CardHeader className={plan.highlight || isCurrentPlan ? 'pt-8' : ''}>
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>
                      <span className="text-3xl font-bold text-foreground">€{plan.price}</span>
                      <span className="text-muted-foreground">/year</span>
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
                      <Button variant="outline" className="w-full" disabled>
                        Current Plan
                      </Button>
                    ) : isDowngrade ? (
                      <Button variant="outline" className="w-full" disabled>
                        Downgrade not available
                      </Button>
                    ) : isUpgrade ? (
                      <Button 
                        variant={plan.highlight ? "hero" : "default"}
                        className="w-full"
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={isUpgrading}
                      >
                        {isUpgrading && selectedPlan === plan.id ? (
                          "Upgrading..."
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Upgrade to {plan.name}
                          </>
                        )}
                      </Button>
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
    </>
  );
};

export default MemberUpgrade;
