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
    <section id="freemium" className="py-20 lg:py-28 bg-wooffy-dark text-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 bg-wooffy-blue/20 rounded-full px-4 py-2 border border-wooffy-blue/30 mb-6">
            <Gift className="w-4 h-4 text-wooffy-sky" />
            <span className="text-sm font-medium text-wooffy-light/80">{t("freemium.badge")}</span>
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-6">
            {t("freemium.title")}
          </h2>

          <p className="text-lg text-wooffy-light/70 max-w-2xl mx-auto">
            {t("freemium.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Free */}
          <div className="bg-wooffy-blue/10 rounded-3xl p-6 lg:p-8 border border-wooffy-blue/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-wooffy-blue/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-wooffy-light/70" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-white">{t("freemium.freeMember")}</h3>
                <p className="text-sm text-wooffy-light/70">{t("freemium.noCard")}</p>
              </div>
            </div>

            <div className="text-center mb-6 py-4 bg-wooffy-blue/10 rounded-xl border border-wooffy-blue/20">
              <span className="font-display font-bold text-3xl text-white">€0</span>
              <span className="text-wooffy-light/70 ml-1">{t("freemium.forever")}</span>
            </div>

            <ul className="space-y-3 mb-6">
              {freeFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-wooffy-sky/20 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-wooffy-sky" />
                  </div>
                  <span className="text-wooffy-light/90">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              variant="outline"
              className="w-full rounded-full bg-transparent border-wooffy-blue/40 text-white hover:bg-wooffy-blue/20 hover:text-white"
              onClick={() => navigate("/auth")}
            >
              {t("freemium.signUpFree")}
            </Button>
          </div>

          {/* Paid */}
          <div className="bg-wooffy-blue/15 rounded-3xl p-6 lg:p-8 border-2 border-wooffy-sky/50 relative">
            <div className="absolute -top-3 right-6">
              <div className="bg-wooffy-sky text-wooffy-dark px-3 py-1 rounded-full text-xs font-semibold">
                {t("freemium.bestValue")}
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-wooffy-sky/20 rounded-full flex items-center justify-center">
                <Lock className="w-6 h-6 text-wooffy-sky" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-white">{t("freemium.paidMember")}</h3>
                <p className="text-sm text-wooffy-light/70">{t("freemium.unlock")}</p>
              </div>
            </div>

            <div className="text-center mb-6 py-4 bg-wooffy-sky/10 rounded-xl border border-wooffy-sky/20">
              <span className="text-wooffy-light/70 mr-1">{t("freemium.from")}</span>
              <span className="font-display font-bold text-3xl text-wooffy-sky">€29</span>
              <span className="text-wooffy-light/70 ml-1">{t("freemium.perYear")}</span>
            </div>

            <ul className="space-y-3 mb-2">
              <li className="text-xs text-wooffy-light/60 uppercase tracking-wide font-medium mb-2">
                {t("freemium.everythingPlus")}
              </li>
              {premiumFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-wooffy-sky/20 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-wooffy-sky" />
                  </div>
                  <span className="text-wooffy-light/90">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <Button
                className="w-full rounded-full bg-wooffy-sky text-wooffy-dark hover:bg-wooffy-sky/90"
                onClick={() => navigate("/auth")}
              >
                {t("freemium.getStarted")}
              </Button>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-wooffy-light/60 mt-8 max-w-lg mx-auto">
          {t("freemium.bottomNote")}
        </p>
      </div>
    </section>
  );
};

export default FreemiumSection;
