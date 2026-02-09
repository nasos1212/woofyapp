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
    bgColor: "bg-blue-50",
    features: ["Quick registration", "No credit card needed"],
  },
  {
    id: 2,
    title: "Freemium Access",
    icon: Gift,
    description: "Enjoy free features forever",
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-50",
    features: ["Lost & Found alerts", "Community Q&A"],
  },
  {
    id: 3,
    title: "Upgrade Anytime",
    icon: Sparkles,
    description: "Unlock the full experience",
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-50",
    features: ["Flexible plans", "Cancel anytime"],
  },
  {
    id: 4,
    title: "Premium Member",
    icon: Crown,
    description: "Full membership benefits",
    color: "from-primary to-purple-500",
    bgColor: "bg-primary/5",
    features: ["Exclusive discounts", "AI health assistant"],
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
    <div className="w-full mt-8">
      <p className="text-center text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
        Your Wooffy Journey
      </p>
      
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2">
          {journeySteps.map((step) => (
            <CarouselItem key={step.id} className="pl-2 basis-1/2">
              <div className={`relative overflow-hidden ${step.bgColor} rounded-xl p-4 border border-border/50 h-full`}>
                {/* Step number */}
                <div className={`absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                  <span className="text-xs font-bold text-white">{step.id}</span>
                </div>
                
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-3 shadow-sm`}>
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                
                {/* Content */}
                <h3 className="font-display font-bold text-base text-foreground mb-1">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {step.description}
                </p>
                
                {/* Features */}
                <ul className="space-y-1.5">
                  {step.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-foreground/80">
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${step.color} flex-shrink-0`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Navigation: arrows + dots */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <CarouselPrevious className="static translate-x-0 translate-y-0 h-7 w-7" />
          
          {/* Dots indicator */}
          <div className="flex gap-1.5">
            {[0, 1].map((idx) => (
              <button
                key={idx}
                onClick={() => api?.scrollTo(idx * 2)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  Math.floor(current / 2) === idx 
                    ? "bg-primary w-4" 
                    : "bg-muted-foreground/30 w-1.5"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
          
          <CarouselNext className="static translate-x-0 translate-y-0 h-7 w-7" />
        </div>
      </Carousel>
    </div>
  );
};

export default MemberJourneyCarousel;
