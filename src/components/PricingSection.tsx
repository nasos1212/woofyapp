import { Check, Star, Zap, Dog } from "lucide-react";
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
  },
  {
    id: "duo",
    name: "Dynamic Duo",
    pets: 2,
    price: 99,
    pricePerPet: 49.5,
    description: "Ideal for multi-pet households",
    popular: true,
    savings: 19,
  },
  {
    id: "pack",
    name: "Pack Leader",
    pets: 5,
    price: 129,
    pricePerPet: 25.8,
    description: "Best value for 3-5 pets",
    popular: false,
    savings: 166,
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
            Choose the perfect plan for your furry family. Save more with multiple pets!
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {plans.map((plan) => (
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
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                    <Dog className="w-6 h-6 text-primary" />
                    {plan.pets > 1 && (
                      <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                        {plan.pets}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-xl text-foreground mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-display font-bold text-4xl text-gradient">€{plan.price}</span>
                    <span className="text-muted-foreground">/year</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    €{plan.pricePerPet.toFixed(2)} per pet
                  </p>
                  {plan.savings && (
                    <p className="text-sm text-green-600 font-medium mt-1">
                      Save €{plan.savings} vs individual
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
          ))}
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
