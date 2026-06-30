import { Star, Gift, Check, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import soloPawImg from "@/assets/plan-solo-paw.jpg";
import duoImg from "@/assets/plan-dynamic-duo.jpg";
import packImg from "@/assets/plan-pack-leader.jpg";

const PricingSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const freeFeatures = [
    t("benefits.free.profiles.title"),
    t("benefits.free.health.title"),
    t("benefits.free.lostFound.title"),
    t("benefits.free.directory.title"),
    t("benefits.free.community.title"),
  ];

  const plans = [
    { id: "solo", price: 29, popular: false, image: soloPawImg },
    { id: "duo", price: 49, popular: true, image: duoImg },
    { id: "pack", price: 69, popular: false, image: packImg },
  ];

  return (
    <section id="freemium" className="py-20 lg:py-28">
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

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
          {/* Free plan */}
          <div className="bg-card rounded-3xl p-6 lg:p-8 shadow-card border border-border h-full flex flex-col">
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground">{t("freemium.freeMember")}</h3>
              <p className="text-sm text-muted-foreground mt-1 min-h-[40px] flex items-center justify-center">{t("freemium.noCard")}</p>
            </div>

            <div className="text-center mb-6">
              <div className="flex items-baseline justify-center gap-1">
                <span className="font-display font-bold text-4xl text-foreground">€0</span>
                <span className="text-muted-foreground">{t("freemium.forever")}</span>
              </div>
            </div>

            <ul className="space-y-3 mb-6 flex-1">
              {freeFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-accent" />
                  </div>
                  <span className="text-sm text-foreground">{feature}</span>
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

          {/* Paid plans */}
          {plans.map((plan) => (
            <div key={plan.id} className="relative flex flex-col">
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="bg-gradient-hero text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-glow">
                    <Star className="w-4 h-4 fill-current" />
                    {t("pricing.mostPopular")}
                  </div>
                </div>
              )}

              <div className={`bg-card rounded-3xl p-6 lg:p-8 shadow-card h-full flex flex-col ${plan.popular ? "border-2 border-primary/30 ring-2 ring-primary/10" : "border border-border"}`}>
                <div className="text-center mb-4">
                  <img
                    src={plan.image}
                    alt={t(`pricing.plans.${plan.id}.name`)}
                    className="w-24 h-24 rounded-2xl object-cover mx-auto mb-4"
                  />
                  <h3 className="font-display font-bold text-xl text-foreground">
                    {t(`pricing.plans.${plan.id}.name`)}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 min-h-[40px] flex items-center justify-center">{t(`pricing.plans.${plan.id}.label`)}</p>
                </div>

                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-display font-bold text-4xl text-gradient">€{plan.price}</span>
                    <span className="text-muted-foreground">{t("pricing.perYear")}</span>
                  </div>
                </div>

                <div className="flex-1" />

                <Button
                  variant={plan.popular ? "hero" : "outline"}
                  className="w-full"
                  onClick={() => navigate("/auth")}
                >
                  {t("pricing.getStarted")}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-lg mx-auto bg-wooffy-dark rounded-2xl p-6 text-center mb-8">
          <p className="font-display font-semibold text-lg text-wooffy-sky mb-2">
            {t("pricing.savings")}
          </p>
          <p className="text-sm text-wooffy-light/70">
            {t("pricing.savingsSub")}
          </p>
        </div>

        <p className="text-center text-sm text-muted-foreground max-w-lg mx-auto">
          {t("freemium.bottomNote")}
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
