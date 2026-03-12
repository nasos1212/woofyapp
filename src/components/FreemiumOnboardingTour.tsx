import { useState, useEffect } from "react";
import { 
  Users, 
  AlertTriangle, 
  MapPin, 
  Heart, 
  ArrowRight, 
  X, 
  Sparkles,
  PartyPopper
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TOUR_STORAGE_KEY = "wooffy_freemium_tour_seen";

interface TourStep {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  emoji: string;
}

const tourSteps: TourStep[] = [
  {
    icon: Sparkles,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    title: "Welcome to Wooffy! 🎉",
    description: "Your free membership gives you access to amazing pet community features. Let us show you around!",
    emoji: "🐾",
  },
  {
    icon: Users,
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    title: "Community Q&A",
    description: "Ask questions, share experiences, and get advice from fellow pet parents across Cyprus. Your voice matters!",
    emoji: "💬",
  },
  {
    icon: AlertTriangle,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    title: "Lost & Found Alerts",
    description: "Report or find lost pets in your area. Together, we help reunite pets with their families — fast.",
    emoji: "🔍",
  },
  {
    icon: MapPin,
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    title: "Dog-Friendly Places",
    description: "Discover cafés, parks, beaches and more that welcome your furry friends. Rate and review your favourites!",
    emoji: "📍",
  },
  {
    icon: Heart,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    title: "Support Shelters",
    description: "Browse local shelters, meet adoptable pets, and make a difference in an animal's life.",
    emoji: "❤️",
  },
  {
    icon: PartyPopper,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    title: "You're All Set!",
    description: "Start exploring — all of these features are completely free. Enjoy being part of the Wooffy community!",
    emoji: "🥳",
  },
];

const FreemiumOnboardingTour = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!seen) {
      // Small delay so the dashboard renders first
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
  };

  const handleNext = () => {
    if (currentStep === tourSteps.length - 1) {
      handleClose();
      return;
    }
    setAnimating(true);
    setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
      setAnimating(false);
    }, 200);
  };

  const handleBack = () => {
    if (currentStep === 0) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrentStep((prev) => prev - 1);
      setAnimating(false);
    }, 200);
  };

  if (!isOpen) return null;

  const step = tourSteps[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === tourSteps.length - 1;
  const isFirst = currentStep === 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />

      {/* Card */}
      <div
        className={`relative bg-card rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden transition-all duration-200 ${
          animating ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
        style={{ animation: currentStep === 0 && !animating ? "scale-in 0.4s ease-out" : undefined }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-muted/80 flex items-center justify-center hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Top accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />

        {/* Content */}
        <div className="p-6 pt-8 text-center">
          {/* Animated icon */}
          <div className={`w-20 h-20 ${step.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-5 transition-all duration-300`}>
            <Icon className={`w-10 h-10 ${step.iconColor}`} />
          </div>

          <h3 className="font-display text-xl font-bold text-foreground mb-3">
            {step.title}
          </h3>

          <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-xs mx-auto">
            {step.description}
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {tourSteps.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? "w-6 bg-primary"
                    : i < currentStep
                    ? "w-2 bg-primary/40"
                    : "w-2 bg-muted-foreground/20"
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            {!isFirst && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                Back
              </Button>
            )}
            {isFirst && (
              <Button
                variant="ghost"
                onClick={handleClose}
                className="flex-1 text-muted-foreground"
              >
                Skip
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="flex-1 gap-2"
            >
              {isLast ? "Let's Go!" : "Next"}
              {!isLast && <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreemiumOnboardingTour;
