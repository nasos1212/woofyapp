import { Heart, Sparkles } from "lucide-react";
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
    <section id="benefits" className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-flex items-center gap-2 bg-wooffy-sky/15 rounded-full px-4 py-2 border border-wooffy-sky/30 mb-6">
            <Heart className="w-4 h-4 text-wooffy-blue fill-wooffy-blue" />
            <span className="text-sm font-medium text-wooffy-dark">{t("benefits.badge")}</span>
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6">
            {t("benefits.title")}
          </h2>

          <p className="text-lg text-muted-foreground">
            {t("benefits.subtitle")}
          </p>
        </div>

        <div className="mb-14 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-1.5 bg-wooffy-sky/15 text-wooffy-dark rounded-full px-4 py-1.5 text-sm font-bold border border-wooffy-sky/30">
              {t("benefits.freeForever")}
            </span>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {freeFeatures.map((feature) => (
              <div
                key={feature.key}
                className="group bg-card rounded-2xl p-5 border border-border hover:border-wooffy-sky/60 hover:-translate-y-1 transition-all duration-300 flex gap-4"
              >
                <div className="w-11 h-11 shrink-0 bg-wooffy-sky/15 rounded-xl flex items-center justify-center text-2xl">
                  {feature.emoji}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-1">
                    {t(`benefits.free.${feature.key}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(`benefits.free.${feature.key}.desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-12 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-1.5 bg-wooffy-blue/15 text-wooffy-blue rounded-full px-4 py-1.5 text-sm font-bold border border-wooffy-blue/30">
              <Sparkles className="w-3.5 h-3.5" />
              {t("benefits.premiumMembership")}
            </span>
            <span className="text-sm text-muted-foreground">{t("benefits.startingAt")}</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {premiumFeatures.map((feature) => (
              <div
                key={feature.key}
                className="group bg-card rounded-2xl p-5 border border-wooffy-blue/30 hover:border-wooffy-blue/60 hover:-translate-y-1 transition-all duration-300 flex gap-4"
              >
                <div className="w-11 h-11 shrink-0 bg-wooffy-blue/10 rounded-xl flex items-center justify-center text-2xl">
                  {feature.emoji}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-1">
                    {t(`benefits.premium.${feature.key}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(`benefits.premium.${feature.key}.desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Button
            size="lg"
            className="rounded-full px-8 bg-wooffy-dark text-white hover:bg-wooffy-dark/90"
            onClick={() => navigate("/auth")}
          >
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
