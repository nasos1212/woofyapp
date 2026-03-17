import { useState, useEffect } from "react";
import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export interface TourStep {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
}

interface OnboardingTourProps {
  storageKey: string;
  steps: TourStep[];
  accentGradient?: string;
}

const OnboardingTour = ({
  storageKey,
  steps,
  accentGradient = "from-primary via-accent to-primary",
}: OnboardingTourProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(storageKey);
    if (seen) return;

    // Only show tour for genuinely new users (account created within last 10 minutes)
    const checkIfNewUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const createdAt = new Date(user.created_at);
      const now = new Date();
      const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60);

      if (minutesSinceCreation <= 10) {
        const timer = setTimeout(() => setIsOpen(true), 800);
        return () => clearTimeout(timer);
      } else {
        // Mark as seen for existing users so we never check again
        localStorage.setItem(storageKey, "true");
      }
    };

    checkIfNewUser();
  }, [storageKey]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(storageKey, "true");
  };

  const handleNext = () => {
    if (currentStep === steps.length - 1) {
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

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />

      <div
        className={`relative bg-card rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden transition-all duration-200 ${
          animating ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
        style={{
          animation:
            currentStep === 0 && !animating
              ? "scale-in 0.4s ease-out"
              : undefined,
        }}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-muted/80 flex items-center justify-center hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className={`h-1.5 bg-gradient-to-r ${accentGradient}`} />

        <div className="p-6 pt-8 text-center">
          <div
            className={`w-20 h-20 ${step.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-5 transition-all duration-300`}
          >
            <Icon className={`w-10 h-10 ${step.iconColor}`} />
          </div>

          <h3 className="font-display text-xl font-bold text-foreground mb-3">
            {step.title}
          </h3>

          <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-xs mx-auto">
            {step.description}
          </p>

          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((_, i) => (
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

          <div className="flex items-center gap-3">
            {!isFirst && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
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
            <Button onClick={handleNext} className="flex-1 gap-2">
              {isLast ? "Let's Go!" : "Next"}
              {!isLast && <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
