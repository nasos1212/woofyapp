import { Check, Sparkles, Lock, Gift } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

const freeFeatures = [
  "Lost & Found Pet Alerts",
  "Pet-Friendly Places Map",
  "Community Q&A Access",
  "Basic Pet Profiles",
];

const premiumFeatures = [
  "Exclusive Partner Discounts",
  "AI Pet Health Assistant",
  "Vaccination & Health Reminders",
  "Priority Support",
  "Pet Birthday Offers",
];

const FreemiumSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 lg:py-28 bg-gradient-warm">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-soft border border-border mb-6">
            <Gift className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Free to Start</span>
          </span>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6">
            Join Free, Upgrade Anytime
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create your account for free and enjoy essential pet community features. 
            When you're ready for exclusive discounts and premium perks, upgrade to a paid plan!
          </p>
        </div>

        {/* Comparison cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Free tier */}
          <div className="bg-card rounded-3xl p-6 lg:p-8 shadow-card border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-foreground">Free Member</h3>
                <p className="text-sm text-muted-foreground">No credit card required</p>
              </div>
            </div>

            <div className="text-center mb-6 py-4 bg-muted/50 rounded-xl">
              <span className="font-display font-bold text-3xl text-foreground">€0</span>
              <span className="text-muted-foreground ml-1">forever</span>
            </div>

            <ul className="space-y-3 mb-6">
              {freeFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-accent" />
                  </div>
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate("/auth")}
            >
              Sign Up Free
            </Button>
          </div>

          {/* Premium tier */}
          <div className="bg-card rounded-3xl p-6 lg:p-8 shadow-card border-2 border-primary/30 ring-2 ring-primary/10 relative">
            <div className="absolute -top-3 right-6">
              <div className="bg-gradient-hero text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold shadow-glow">
                Best Value
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-foreground">Paid Member</h3>
                <p className="text-sm text-muted-foreground">Unlock all features</p>
              </div>
            </div>

            <div className="text-center mb-6 py-4 bg-primary/5 rounded-xl">
              <span className="text-muted-foreground mr-1">From</span>
              <span className="font-display font-bold text-3xl text-gradient">€59</span>
              <span className="text-muted-foreground ml-1">/year</span>
            </div>

            <ul className="space-y-3 mb-2">
              <li className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">
                Everything in Free, plus:
              </li>
              {premiumFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <Button 
                variant="hero" 
                className="w-full"
                onClick={() => navigate("/auth")}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-center text-sm text-muted-foreground mt-8 max-w-lg mx-auto">
          💡 Start exploring for free. Upgrade only when you want access to exclusive partner discounts and premium features!
        </p>
      </div>
    </section>
  );
};

export default FreemiumSection;
