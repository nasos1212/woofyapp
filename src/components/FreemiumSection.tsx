import { Check, Sparkles, Lock, Gift } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const FreemiumSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const freeFeatures = [
    t("benefits.free.profiles.title"),
    t("benefits.free.health.title"),
    t("benefits.free.lostFound.title"),
    t("benefits.free.directory.title"),
    t("benefits.free.community.title"),
  ];

  const premiumFeatures = [
    t("benefits.premium.discounts.title"),
    t("benefits.premium.ai.title"),
  ];

  return (
    <section id="freemium" className="py-20 lg:py-28 bg-gradient-warm">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-soft border border-border mb-6">
            <Gift className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">{t("freemium.badge")}</span>
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6">
            {t("freemium.title")}
          </h2>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("freemium.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-card rounded-3xl p-6 lg:p-8 shadow-card border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-foreground">{t("freemium.freeMember")}</h3>
                <p className="text-sm text-muted-foreground">{t("freemium.noCard")}</p>
              </div>
            </div>

            <div className="text-center mb-6 py-4 bg-muted/50 rounded-xl">
              <span className="font-display font-bold text-3xl text-foreground">€0</span>
              <span className="text-muted-foreground ml-1">{t("freemium.forever")}</span>
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
              {t("freemium.signUpFree")}
            </Button>
          </div>

          <div className="bg-card rounded-3xl p-6 lg:p-8 shadow-card border-2 border-primary/30 ring-2 ring-primary/10 relative">
            <div className="absolute -top-3 right-6">
              <div className="bg-gradient-hero text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold shadow-glow">
                {t("freemium.bestValue")}
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-foreground">{t("freemium.paidMember")}</h3>
                <p className="text-sm text-muted-foreground">{t("freemium.unlock")}</p>
              </div>
            </div>

            <div className="text-center mb-6 py-4 bg-primary/5 rounded-xl">
              <span className="text-muted-foreground mr-1">{t("freemium.from")}</span>
              <span className="font-display font-bold text-3xl text-gradient">€29</span>
              <span className="text-muted-foreground ml-1">{t("freemium.perYear")}</span>
            </div>

            <ul className="space-y-3 mb-2">
              <li className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">
                {t("freemium.everythingPlus")}
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
                {t("freemium.getStarted")}
              </Button>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8 max-w-lg mx-auto">
          {t("freemium.bottomNote")}
        </p>
      </div>
    </section>
  );
};

export default FreemiumSection;
