import { useState, useEffect } from "react";
import { UserPlus, Gift, Sparkles, Crown, ChevronRight } from "lucide-react";
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
    bgColor: "bg-blue-50",
    features: ["Quick registration", "No credit card needed", "Instant access"],
  },
  {
    id: 2,
    title: "Freemium Access",
    icon: Gift,
    description: "Enjoy free features forever",
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-50",
    features: ["Lost & Found alerts", "Pet-friendly places map", "Community Q&A"],
  },
  {
    id: 3,
    title: "Upgrade Anytime",
    icon: Sparkles,
    description: "Unlock the full experience",
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-50",
    features: ["Choose your plan", "Flexible options", "Cancel anytime"],
  },
  {
    id: 4,
    title: "Premium Member",
    icon: Crown,
    description: "Full membership benefits",
    color: "from-primary to-purple-500",
    bgColor: "bg-primary/5",
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
    <div className="w-full mt-10 lg:mt-14">
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
        <p className="text-sm font-semibold text-muted-foreground px-3">
          Your Wooffy Journey
        </p>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
      </div>
      
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-3">
          {journeySteps.map((step, index) => (
            <CarouselItem key={step.id} className="pl-3 basis-[85%] sm:basis-[75%]">
              <div className="relative">
                {/* Arrow connector */}
                {index < journeySteps.length - 1 && (
                  <div className="absolute -right-1 top-1/2 -translate-y-1/2 z-10 hidden sm:block">
                    <ChevronRight className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                )}
                
                <div className={`relative overflow-hidden ${step.bgColor} rounded-2xl p-6 shadow-card border border-border/50 h-full min-h-[200px]`}>
                  {/* Step number badge */}
                  <div className={`absolute top-4 right-4 w-8 h-8 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-md`}>
                    <span className="text-sm font-bold text-white">{step.id}</span>
                  </div>
                  
                  {/* Large Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="font-display font-bold text-xl text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {step.description}
                  </p>
                  
                  {/* Features */}
                  <ul className="space-y-2">
                    {step.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-foreground/80">
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${step.color} flex-shrink-0`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <div className="flex items-center justify-center gap-4 mt-6">
          <CarouselPrevious className="static translate-y-0" />
          
          {/* Dots indicator */}
          <div className="flex gap-2">
            {journeySteps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => api?.scrollTo(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  current === idx 
                    ? "bg-primary w-8" 
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
          
          <CarouselNext className="static translate-y-0" />
        </div>
      </Carousel>
    </div>
  );
};

export default MemberJourneyCarousel;
