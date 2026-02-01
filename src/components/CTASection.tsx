import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 lg:py-32 bg-wooffy-dark relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-wooffy-blue/20 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-wooffy-blue/20 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-wooffy-sky mb-6">
            Ready to Join the Pack?
          </h2>
          
          <p className="text-xl text-wooffy-light/80 mb-10 max-w-2xl mx-auto">
            Start saving today with your Wooffy membership. Many pet parents already trust us.
          </p>

          {/* CTA */}
          <Button 
            size="xl" 
            className="bg-wooffy-sky text-wooffy-dark hover:bg-wooffy-light hover:scale-105 shadow-lg group"
            onClick={() => navigate("/auth?type=member")}
          >
            Get Wooffy for €59/year
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>

          <p className="text-sm text-wooffy-light/60 mt-4">
            That's less than €5/month for unlimited benefits
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;