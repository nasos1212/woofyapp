import { ArrowRight, Gift, Shield, Clock } from "lucide-react";
import { Button } from "./ui/button";

const CTASection = () => {
  return (
    <section className="py-20 lg:py-32 bg-gradient-hero relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-foreground/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-foreground/10 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-primary-foreground mb-6">
            Ready to Join the Pack?
          </h2>
          
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Start saving today with your Woofy membership. Over 10,000 pet parents already trust us.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-6 mb-10">
            <div className="flex items-center gap-2 text-primary-foreground/90">
              <Gift className="w-5 h-5" />
              <span>Welcome kit included</span>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/90">
              <Shield className="w-5 h-5" />
              <span>30-day money back</span>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/90">
              <Clock className="w-5 h-5" />
              <span>Cancel anytime</span>
            </div>
          </div>

          {/* CTA */}
          <Button 
            size="xl" 
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 hover:scale-105 shadow-lg group"
          >
            Get Woofy for €59/year
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>

          <p className="text-sm text-primary-foreground/60 mt-4">
            That's less than €5/month for unlimited perks
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;