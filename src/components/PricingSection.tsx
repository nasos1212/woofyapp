import { Star, Zap, Dog, Users, Crown, Check } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

const sharedBenefits = [
  "Access to all partner discounts",
  "AI Pet Assistant",
  "Vaccination reminders",
  "Community access",
  "Priority support",
];

const plans = [
  {
    id: "single",
    name: "Solo Paw",
    pets: 1,
    petLabel: "For your one & only furball 🐾",
    price: 59,
    popular: false,
    icon: Dog,
  },
  {
    id: "duo",
    name: "Dynamic Duo",
    pets: 2,
    petLabel: "Because one buddy wasn't enough! 🐶🐱",
    price: 99,
    popular: true,
    icon: Users,
  },
  {
    id: "pack",
    name: "Pack Leader",
    pets: 5,
    petLabel: "You run the zoo — we've got you 🦁",
    price: 139,
    popular: false,
    icon: Crown,
  },
];

const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-soft border border-border mb-6">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Simple Pricing</span>
          </span>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6">
            One Membership, Endless Value
          </h2>
          
          <p className="text-lg text-muted-foreground">
            All plans include the same great benefits. Choose based on how many pets you have!
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          {plans.map((plan) => {
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
              
              <div className={`bg-card rounded-3xl p-6 lg:p-8 shadow-card h-full flex flex-col ${plan.popular ? "border-2 border-primary/30 ring-2 ring-primary/10" : "border border-border"}`}>
                <div className="text-center mb-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                    <Icon className="w-7 h-7 text-primary" />
                    <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                      {plan.pets}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-xl text-foreground">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.petLabel}</p>
                </div>

                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-display font-bold text-4xl text-gradient">€{plan.price}</span>
                    <span className="text-muted-foreground">/year</span>
                  </div>
                </div>

                <div className="flex-1" />

                <Button 
                  variant={plan.popular ? "hero" : "outline"} 
                  className="w-full"
                  onClick={() => navigate("/auth")}
                >
                  Get Started
                </Button>
              </div>
            </div>
          )})}
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
      </div>
    </section>
  );
};

export default PricingSection;
