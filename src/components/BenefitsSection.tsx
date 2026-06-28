import { Heart, MapPin, Search, MessageCircle, PawPrint, HeartPulse, BadgePercent, Bot, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const benefitsAccent = [
  { bg: "bg-warm-terracotta/10", text: "text-warm-terracotta", border: "border-warm-terracotta/20" },
  { bg: "bg-warm-navy/10", text: "text-warm-navy", border: "border-warm-navy/20" },
  { bg: "bg-warm-sage/10", text: "text-warm-sage", border: "border-warm-sage/20" },
  { bg: "bg-warm-honey/15", text: "text-amber-700", border: "border-warm-honey/30" },
  { bg: "bg-rose-100", text: "text-rose-600", border: "border-rose-200" },
];

const premiumAccent = [
  { bg: "bg-warm-honey/15", text: "text-amber-700", border: "border-warm-honey/30" },
  { bg: "bg-warm-sage/10", text: "text-warm-sage", border: "border-warm-sage/20" },
];

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
    <section id="benefits" className="py-20 lg:py-32 bg-warm-cream relative overflow-hidden">
      {/* Decorative warm blobs */}
      <div className="absolute top-20 -left-32 w-96 h-96 bg-warm-terracotta/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 -right-32 w-96 h-96 bg-warm-sage/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 border border-warm-stone mb-6 shadow-sm">
            <Heart className="w-4 h-4 text-warm-terracotta" />
            <span className="text-sm font-medium text-warm-navy">{t("benefits.badge")}</span>
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
            <span className="inline-flex items-center gap-1.5 bg-white text-warm-navy rounded-full px-4 py-1.5 text-sm font-bold border border-warm-stone shadow-sm">
              {t("benefits.freeForever")}
            </span>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {freeFeatures.map((feature, index) => {
              const Icon = feature.icon;
              const accent = benefitsAccent[index % benefitsAccent.length];
              return (
                <div
                  key={feature.key}
                  className="group bg-white rounded-2xl p-6 border border-warm-stone hover:border-warm-terracotta/20 hover:shadow-warm transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${accent.bg} ${accent.border} border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className={`w-6 h-6 ${accent.text}`} />
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
            <span className="inline-flex items-center gap-1.5 bg-warm-terracotta text-white rounded-full px-4 py-1.5 text-sm font-bold shadow-sm">
              {t("benefits.premiumMembership")}
            </span>
            <span className="text-sm text-muted-foreground">{t("benefits.startingAt")}</span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {premiumFeatures.map((feature, index) => {
              const Icon = feature.icon;
              const accent = premiumAccent[index % premiumAccent.length];
              return (
                <div
                  key={feature.key}
                  className="group bg-white rounded-2xl p-6 border border-warm-stone hover:border-warm-terracotta/20 hover:shadow-warm transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${accent.bg} ${accent.border} border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className={`w-6 h-6 ${accent.text}`} />
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
          <Button variant="hero" size="xl" onClick={() => navigate("/auth")} className="gap-2">
            {t("benefits.ctaJoin")}
            <ArrowRight className="w-5 h-5" />
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
