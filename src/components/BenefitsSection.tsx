import { Heart } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const BenefitsSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const freeFeatures = [
    { key: "directory", emoji: "📍" },
    { key: "lostFound", emoji: "🔍" },
    { key: "community", emoji: "💬" },
    { key: "profiles", emoji: "🐾" },
    { key: "health", emoji: "🏥" },
  ];

  const premiumFeatures = [
    { key: "discounts", emoji: "💰" },
    { key: "ai", emoji: "🤖" },
  ];

  return (
    <section id="benefits" className="py-20 lg:py-32 bg-gradient-warm">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-soft border border-border mb-6">
            <Heart className="w-4 h-4 text-primary fill-primary" />
            <span className="text-sm font-medium text-muted-foreground">{t("benefits.badge")}</span>
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6">
            {t("benefits.title")}
          </h2>

          <p className="text-lg text-muted-foreground">
            {t("benefits.subtitle")}
          </p>
        </div>

        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-700 dark:text-green-400 rounded-full px-4 py-1.5 text-sm font-bold">
              {t("benefits.freeForever")}
            </span>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {freeFeatures.map((feature) => (
              <div
                key={feature.key}
                className="group bg-card rounded-2xl p-6 shadow-card border border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{feature.emoji}</div>
                  <div>
                    <h3 className="font-display font-semibold text-lg text-foreground mb-1">
                      {t(`benefits.free.${feature.key}.title`)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t(`benefits.free.${feature.key}.desc`)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-bold">
              {t("benefits.premiumMembership")}
            </span>
            <span className="text-sm text-muted-foreground">{t("benefits.startingAt")}</span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {premiumFeatures.map((feature) => (
              <div
                key={feature.key}
                className="group bg-card rounded-2xl p-6 shadow-card border border-primary/20 hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{feature.emoji}</div>
                  <div>
                    <h3 className="font-display font-semibold text-lg text-foreground mb-1">
                      {t(`benefits.premium.${feature.key}.title`)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t(`benefits.premium.${feature.key}.desc`)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Button variant="hero" size="xl" onClick={() => navigate("/auth")}>
            {t("benefits.ctaJoin")}
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            {t("benefits.noCard")}
          </p>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
