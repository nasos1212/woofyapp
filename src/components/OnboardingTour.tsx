import { useState, useEffect } from "react";
import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
  const { user, loading } = useAuth();
  const scopedStorageKey = user ? `${storageKey}:${user.id}` : storageKey;

  useEffect(() => {
    let isMounted = true;
    let openTimer: number | null = null;

    const markTourSeen = async (userId: string) => {
      localStorage.setItem(scopedStorageKey, "true");

      const { error } = await supabase
        .from("profiles")
        .update({ onboarding_tour_seen_at: new Date().toISOString() })
        .eq("user_id", userId)
        .is("onboarding_tour_seen_at", null);

      if (error) {
        console.error("Failed to persist onboarding tour status:", error);
      }
    };

    const checkTourEligibility = async () => {
      if (loading || !user) return;

      if (!localStorage.getItem(scopedStorageKey)) {
        localStorage.removeItem(storageKey);
      }

      const seen = localStorage.getItem(scopedStorageKey);
      if (seen) return;

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user || session.user.id !== user.id || !isMounted) return;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("login_count, onboarding_tour_seen_at")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Failed to load onboarding tour eligibility:", error);
        return;
      }

      if (!profile || !isMounted) return;

      if (profile.onboarding_tour_seen_at) {
        localStorage.setItem(scopedStorageKey, "true");
        return;
      }

      const isFirstVerifiedSignIn = profile.login_count === null || profile.login_count <= 1;

      if (!isFirstVerifiedSignIn) {
        await markTourSeen(session.user.id);
        return;
      }

      void markTourSeen(session.user.id);
      openTimer = window.setTimeout(() => {
        if (isMounted) setCurrentStep(0);
        if (isMounted) setIsOpen(true);
      }, 800);
    };

    void checkTourEligibility();

    return () => {
      isMounted = false;
      if (openTimer !== null) {
        window.clearTimeout(openTimer);
      }
    };
  }, [storageKey, scopedStorageKey, user?.id, loading]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(scopedStorageKey, "true");
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
