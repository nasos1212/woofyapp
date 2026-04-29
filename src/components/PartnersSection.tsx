import { Building2, Store, Dumbbell, Home, Stethoscope, Scissors } from "lucide-react";
import { useTranslation } from "react-i18next";

const PartnersSection = () => {
  const { t } = useTranslation();

  const categoryConfig = [
    { icon: Store, name: t("partnersSection.cat.petShops") },
    { icon: Stethoscope, name: t("partnersSection.cat.veterinaries") },
    { icon: Dumbbell, name: t("partnersSection.cat.trainers") },
    { icon: Home, name: t("partnersSection.cat.petHotels") },
    { icon: Scissors, name: t("partnersSection.cat.groomers") },
    { icon: Building2, name: t("partnersSection.cat.other") },
  ];

  return (
    <section id="partners" className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-soft border border-border mb-6">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">{t("partnersSection.badge")}</span>
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6">
            {t("partnersSection.title")}
          </h2>

          <p className="text-lg text-muted-foreground">
            {t("partnersSection.description")}
          </p>
        </div>

        {/* Category icons */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
          {categoryConfig.map((category) => (
            <div
              key={category.name}
              className="bg-card rounded-2xl p-4 text-center shadow-soft border border-border hover:shadow-card hover:border-primary/20 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <category.icon className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">{category.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
