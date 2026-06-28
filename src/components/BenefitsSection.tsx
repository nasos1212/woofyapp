import { Heart, MapPin, Search, MessageCircle, PawPrint, HeartPulse, BadgePercent, Bot } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const BenefitsSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const freeFeatures = [
    { key: "directory", icon: MapPin },
    { key: "lostFound", icon: Search },
    { key: "community", icon: MessageCircle },
    { key: "profiles", icon: PawPrint },
    { key: "health", icon: HeartPulse },
  ];

  const premiumFeatures = [
    { key: "discounts", icon: BadgePercent },
    { key: "ai", icon: Bot },
  ];

  return (
    <section id="benefits" className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 bg-card rounded-full px-4 py-2 border border-border mb-6">
            <Heart className="w-4 h-4 text-muted-foreground" />
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
            <span className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground rounded-full px-4 py-1.5 text-sm font-bold border border-border">
              {t("benefits.freeForever")}
            </span>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {freeFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.key}
                  className="group bg-card rounded-2xl p-6 border border-border hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
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
              );
            })}
          </div>
        </div>

        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground rounded-full px-4 py-1.5 text-sm font-bold border border-border">
              {t("benefits.premiumMembership")}
            </span>
            <span className="text-sm text-muted-foreground">{t("benefits.startingAt")}</span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {premiumFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.key}
                  className="group bg-card rounded-2xl p-6 border border-border hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
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
              );
            })}
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
