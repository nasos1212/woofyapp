import { Star, Zap, Dog, Users, Crown, Check, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const PricingSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const sharedBenefits = [
    t("pricing.shared.discounts"),
    t("pricing.shared.ai"),
    t("pricing.shared.vaccination"),
    t("pricing.shared.community"),
    t("pricing.shared.support"),
  ];

  const plans = [
    { id: "solo", pets: 1, price: 29, popular: false, icon: Dog },
    { id: "duo", pets: 2, price: 49, popular: true, icon: Users },
    { id: "pack", pets: "3-5", price: 69, popular: false, icon: Crown },
  ];

  return (
    <section id="pricing" className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-flex items-center gap-2 bg-wooffy-sky/15 rounded-full px-4 py-2 border border-wooffy-sky/30 mb-6">
            <Zap className="w-4 h-4 text-wooffy-blue" />
            <span className="text-sm font-medium text-wooffy-dark">{t("pricing.badge")}</span>
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6">
            {t("pricing.title")}
          </h2>

          <p className="text-lg text-muted-foreground">
            {t("freemium.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12 items-stretch">
          {/* Free tier */}
          <div className="relative">
            <div className="bg-card rounded-3xl p-6 lg:p-8 h-full flex flex-col border border-border hover:border-wooffy-sky/50 transition-all duration-300 hover:-translate-y-1">
              <div className="text-center mb-4">
                <div className="w-14 h-14 bg-wooffy-sky/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-wooffy-blue" />
                </div>
                <h3 className="font-display font-bold text-xl text-foreground">
                  {t("freemium.freeMember")}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 min-h-[40px] flex items-center justify-center">
                  {t("freemium.noCard")}
                </p>
              </div>

              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-display font-bold text-4xl text-wooffy-dark">€0</span>
                  <span className="text-muted-foreground">{t("freemium.forever")}</span>
                </div>
              </div>

              <div className="flex-1" />

              <Button
                variant="outline"
                className="w-full rounded-full border-border hover:bg-muted"
                onClick={() => navigate("/auth")}
              >
                {t("freemium.signUpFree")}
              </Button>
            </div>
          </div>

          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
            <div key={plan.id} className="relative">
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="bg-wooffy-dark text-wooffy-sky px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Star className="w-4 h-4 fill-current" />
                    {t("pricing.mostPopular")}
                  </div>
                </div>
              )}

              <div className={`bg-card rounded-3xl p-6 lg:p-8 h-full flex flex-col transition-all duration-300 hover:-translate-y-1 ${plan.popular ? "border-2 border-wooffy-blue/40" : "border border-border hover:border-wooffy-sky/50"}`}>
                <div className="text-center mb-4">
                  <div className="w-14 h-14 bg-wooffy-sky/15 rounded-2xl flex items-center justify-center mx-auto mb-4 relative">
                    <Icon className="w-7 h-7 text-wooffy-blue" />
                    <span className="absolute -bottom-1 -right-1 bg-wooffy-dark text-wooffy-sky text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                      {plan.pets}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-xl text-foreground">
                    {t(`pricing.plans.${plan.id}.name`)}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 min-h-[40px] flex items-center justify-center">{t(`pricing.plans.${plan.id}.label`)}</p>
                </div>

                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-display font-bold text-4xl text-wooffy-dark">€{plan.price}</span>
                    <span className="text-muted-foreground">{t("pricing.perYear")}</span>
                  </div>
                </div>

                <div className="flex-1" />

                <Button
                  className={`w-full rounded-full ${plan.popular ? "bg-wooffy-dark text-white hover:bg-wooffy-dark/90" : "bg-wooffy-sky text-wooffy-dark hover:bg-wooffy-sky/90"}`}
                  onClick={() => navigate("/auth")}
                >
                  {t("pricing.getStarted")}
                </Button>
              </div>
            </div>
          )})}
        </div>

        <div className="max-w-2xl mx-auto bg-card rounded-2xl p-6 border border-border mb-8">
          <h3 className="font-display font-semibold text-lg text-center text-foreground mb-4">{t("pricing.allPaidPlansInclude") !== "pricing.allPaidPlansInclude" ? t("pricing.allPaidPlansInclude") : t("pricing.allPlansInclude")}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {sharedBenefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-wooffy-sky/20 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-wooffy-blue" />
                </div>
                <span className="text-sm text-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-lg mx-auto bg-wooffy-dark rounded-2xl p-6 text-center border border-wooffy-blue/30">
          <p className="font-display font-semibold text-lg text-wooffy-sky mb-2">
            {t("pricing.savings")}
          </p>
          <p className="text-sm text-wooffy-light/70">
            {t("pricing.savingsSub")}
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
