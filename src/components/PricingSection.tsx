import { Check, Star, Zap } from "lucide-react";
import { Button } from "./ui/button";

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
  "Cancel anytime guarantee",
];

const PricingSection = () => {
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
            For less than €5/month, unlock savings that pay for themselves many times over.
          </p>
        </div>

        {/* Pricing card */}
        <div className="max-w-lg mx-auto">
          <div className="relative">
            {/* Popular badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
              <div className="bg-gradient-hero text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-glow">
                <Star className="w-4 h-4 fill-current" />
                Most Popular
              </div>
            </div>

            {/* Card */}
            <div className="bg-card rounded-3xl p-8 lg:p-10 shadow-card border-2 border-primary/20">
              <div className="text-center mb-8">
                <h3 className="font-display font-bold text-2xl text-foreground mb-4">
                  PawPass Premium
                </h3>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="font-display font-bold text-6xl text-gradient">€59</span>
                  <span className="text-muted-foreground">/year</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  That's just €4.92/month
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                {includedFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Button variant="hero" size="xl" className="w-full">
                Get Your PawPass Now
              </Button>

              <p className="text-center text-sm text-muted-foreground mt-4">
                30-day money-back guarantee. No questions asked.
              </p>
            </div>
          </div>

          {/* Value proposition */}
          <div className="mt-8 bg-paw-cream rounded-2xl p-6 text-center">
            <p className="font-display font-semibold text-lg text-foreground mb-2">
              💡 The Average Member Saves €2,000+ Per Year
            </p>
            <p className="text-sm text-muted-foreground">
              That's a 33x return on your membership investment!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
