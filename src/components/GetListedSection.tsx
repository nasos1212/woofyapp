import { MapPin, CheckCircle, Clock, Store } from "lucide-react";
import PetFriendlyPlaceRequestDialog from "./PetFriendlyPlaceRequestDialog";
import { useTranslation } from "react-i18next";

const GetListedSection = () => {
  const { t } = useTranslation();
  return (
    <section className="py-20 lg:py-28 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <span className="inline-flex items-center gap-2 bg-wooffy-blue/20 rounded-full px-4 py-2 border border-wooffy-blue/30 mb-6">
          <Store className="w-4 h-4 text-wooffy-sky" />
          <span className="text-sm font-medium text-wooffy-light/80">{t("getListed.badge")}</span>
        </span>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-6">
          {t("getListed.titlePart")} <span className="text-wooffy-sky">{t("getListed.titleHighlight")}</span>
        </h2>

        <p className="text-wooffy-light/70 text-lg mb-3 max-w-xl mx-auto">
          {t("getListed.subtitle")}
        </p>
        <p className="text-xs text-wooffy-light/50 italic mb-10 max-w-xl mx-auto">
          {t("getListed.joke")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: CheckCircle, title: t("getListed.noAccount"), sub: t("getListed.noAccountSub") },
            { icon: MapPin, title: t("getListed.visible"), sub: t("getListed.visibleSub") },
            { icon: Clock, title: t("getListed.quickReview"), sub: t("getListed.quickReviewSub") },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-wooffy-blue/10 rounded-2xl p-5 border border-wooffy-blue/30 hover:border-wooffy-sky/60 transition-all duration-300 flex flex-col items-center gap-2"
            >
              <div className="w-11 h-11 bg-wooffy-sky/15 rounded-xl flex items-center justify-center">
                <item.icon className="w-5 h-5 text-wooffy-sky" />
              </div>
              <p className="text-sm font-display font-semibold text-white">{item.title}</p>
              <p className="text-xs text-wooffy-light/70 text-center">{item.sub}</p>
            </div>
          ))}
        </div>

        <div className="max-w-md mx-auto">
          <PetFriendlyPlaceRequestDialog />
        </div>
      </div>
    </section>
  );
};

export default GetListedSection;
