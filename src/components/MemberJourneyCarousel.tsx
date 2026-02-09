import { useState, useEffect } from "react";
import { UserPlus, Gift, Sparkles, Crown } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

const journeySteps = [
  {
    id: 1,
    title: "Sign Up Free",
    icon: UserPlus,
    description: "Create your account in seconds",
    color: "from-blue-500 to-cyan-500",
    features: ["Quick registration", "No credit card needed", "Instant access"],
  },
  {
    id: 2,
    title: "Freemium Access",
    icon: Gift,
    description: "Enjoy free features forever",
    color: "from-emerald-500 to-teal-500",
    features: ["Lost & Found alerts", "Pet-friendly places map", "Community Q&A"],
  },
  {
    id: 3,
    title: "Upgrade Anytime",
    icon: Sparkles,
    description: "Unlock the full experience",
    color: "from-amber-500 to-orange-500",
    features: ["Choose your plan", "Flexible options", "Cancel anytime"],
  },
  {
    id: 4,
    title: "Premium Member",
    icon: Crown,
    description: "Full membership benefits",
    color: "from-primary to-purple-500",
    features: ["Exclusive discounts", "AI health assistant", "Birthday perks"],
  },
];

const MemberJourneyCarousel = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <div className="w-full mt-8 lg:mt-12">
      <p className="text-center text-sm font-medium text-muted-foreground mb-4">
        Your journey with Wooffy
      </p>
      
      <Carousel
        setApi={setApi}
        opts={{
          align: "center",
          loop: true,
        }}
        className="w-full max-w-xs mx-auto"
      >
        <CarouselContent>
          {journeySteps.map((step) => (
            <CarouselItem key={step.id}>
              <div className="p-1">
                <div className="relative overflow-hidden bg-card rounded-2xl p-5 shadow-card border border-border">
                  {/* Step indicator */}
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-xs font-bold text-muted-foreground">{step.id}</span>
                  </div>
                  
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-3`}>
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="font-display font-bold text-lg text-foreground mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {step.description}
                  </p>
                  
                  {/* Features */}
                  <ul className="space-y-1.5">
                    {step.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${step.color}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <CarouselPrevious className="left-0 -translate-x-1/2" />
        <CarouselNext className="right-0 translate-x-1/2" />
      </Carousel>
      
      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-4">
        {journeySteps.map((_, idx) => (
          <button
            key={idx}
            onClick={() => api?.scrollTo(idx)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              current === idx 
                ? "bg-primary w-6" 
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default MemberJourneyCarousel;
