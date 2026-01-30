import { Check, Star, Zap, Dog, Users, Crown } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    id: "single",
    name: "Solo Paw",
    pets: 1,
    price: 59,
    pricePerPet: 59,
    description: "Perfect for one furry friend",
    popular: false,
    icon: Dog,
  },
  {
    id: "duo",
    name: "Dynamic Duo",
    pets: 2,
    price: 99,
    pricePerPet: 49.5,
    description: "Ideal for households with two pets",
    popular: true,
    savings: 19,
    icon: Users,
  },
  {
    id: "pack",
    name: "Pack Leader",
    pets: 5,
    price: 139,
    pricePerPet: 27.8,
    description: "Best value for 3-5 pets",
    popular: false,
    savings: 156,
    icon: Crown,
  },
];

const includedFeatures = [
  "Digital membership card",
  "Access to 500+ partner discounts",
  "Welcome kit (treats & toys)",
  "Monthly free training session",
  "Birthday treats for your pet",
  "Pet owner community access",
  "Pet-friendly location finder",
  "Priority event booking",
  "Smart reminders & notifications",
  "Satisfaction guaranteed",
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
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
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
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                    <Icon className="w-7 h-7 text-primary" />
                    <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                      {plan.pets}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-xl text-foreground mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                {/* Pet count highlight */}
                <div className="bg-muted/50 rounded-xl p-4 mb-6 text-center">
                  <p className="text-2xl font-display font-bold text-primary">
                    {plan.pets === 1 ? "1 Pet" : plan.pets === 5 ? "Up to 5 Pets" : `${plan.pets} Pets`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    €{plan.pricePerPet.toFixed(2)} per pet/year
                  </p>
                </div>

                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-display font-bold text-4xl text-gradient">€{plan.price}</span>
                    <span className="text-muted-foreground">/year</span>
                  </div>
                  {plan.savings && (
                    <p className="text-sm text-green-600 font-medium mt-2">
                      Save €{plan.savings} vs individual plans
                    </p>
                  )}
                </div>

                <div className="flex-1" />

                <Button 
                  variant={plan.popular ? "hero" : "outline"} 
                  className="w-full"
                  onClick={() => navigate("/auth?type=member")}
                >
                  Get Started
                </Button>
              </div>
            </div>
          )})}
        </div>

        {/* Features list */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-2xl p-8 shadow-card border border-border">
            <h4 className="font-display font-bold text-lg text-center mb-6">
              All Plans Include
            </h4>
            <div className="grid sm:grid-cols-2 gap-3">
              {includedFeatures.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Value proposition */}
        <div className="mt-8 max-w-lg mx-auto bg-wooffy-dark rounded-2xl p-6 text-center">
          <p className="font-display font-semibold text-lg text-wooffy-sky mb-2">
            💡 The Average Member Saves €2,000+ Per Year
          </p>
          <p className="text-sm text-wooffy-light/70">
            That's a 33x return on your membership investment!
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
