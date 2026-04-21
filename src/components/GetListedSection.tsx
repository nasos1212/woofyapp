import { MapPin, CheckCircle, Clock, Store } from "lucide-react";
import PetFriendlyPlaceRequestDialog from "./PetFriendlyPlaceRequestDialog";
import { useTranslation } from "react-i18next";

const GetListedSection = () => {
  const { t } = useTranslation();
  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-primary/5 to-background relative overflow-hidden">
      <div className="absolute top-10 right-[10%] text-4xl opacity-10 animate-bounce-slow">📍</div>
      <div className="absolute bottom-10 left-[8%] text-3xl opacity-10 animate-float">🐾</div>

      <div className="container mx-auto px-4 max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-700 dark:text-green-400 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          <Store className="w-4 h-4" />
          {t("getListed.badge")}
        </div>

        <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground mb-4">
          {t("getListed.titlePart")} <span className="text-primary">{t("getListed.titleHighlight")}</span>
        </h2>

        <p className="text-muted-foreground text-base sm:text-lg mb-4 max-w-xl mx-auto">
          {t("getListed.subtitle")}
        </p>
        <p className="text-xs text-muted-foreground/70 italic mb-8 max-w-xl mx-auto">
          {t("getListed.joke")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border shadow-soft">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm font-medium text-foreground">{t("getListed.noAccount")}</p>
            <p className="text-xs text-muted-foreground">{t("getListed.noAccountSub")}</p>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border shadow-soft">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">{t("getListed.visible")}</p>
            <p className="text-xs text-muted-foreground">{t("getListed.visibleSub")}</p>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border shadow-soft">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-sm font-medium text-foreground">{t("getListed.quickReview")}</p>
            <p className="text-xs text-muted-foreground">{t("getListed.quickReviewSub")}</p>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <PetFriendlyPlaceRequestDialog />
        </div>
      </div>
    </section>
  );
};

export default GetListedSection;
