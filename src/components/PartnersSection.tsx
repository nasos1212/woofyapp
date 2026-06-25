import { Building2, Store, Dumbbell, Home, Stethoscope, Scissors, Users, TrendingUp, BarChart3, Gift, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

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

  const benefits = [
    {
      icon: Users,
      title: t("partnersSection.benefits.reach.title"),
      desc: t("partnersSection.benefits.reach.desc"),
    },
    {
      icon: TrendingUp,
      title: t("partnersSection.benefits.traffic.title"),
      desc: t("partnersSection.benefits.traffic.desc"),
    },
    {
      icon: BarChart3,
      title: t("partnersSection.benefits.insights.title"),
      desc: t("partnersSection.benefits.insights.desc"),
    },
    {
      icon: Gift,
      title: t("partnersSection.benefits.free.title"),
      desc: t("partnersSection.benefits.free.desc"),
    },
  ];

  return (
    <section id="partners" className="py-20 lg:py-28 bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
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

        {/* Benefits grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 max-w-5xl mx-auto">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="bg-card rounded-2xl p-6 shadow-soft border border-border hover:shadow-card hover:border-primary/30 transition-all duration-300"
            >
              <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <b.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">{b.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>

        {/* Categories we welcome */}
        <p className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider mb-5">
          {t("partnersSection.categoriesLabel")}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10 max-w-5xl mx-auto">
          {categoryConfig.map((category) => (
            <div
              key={category.name}
              className="bg-card rounded-xl p-3 text-center shadow-soft border border-border hover:border-primary/20 transition-all duration-300"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <category.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs font-medium text-foreground">{category.name}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button asChild size="lg" className="rounded-full px-8">
            <Link to="/partner-register">
              {t("partnersSection.cta")}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground mt-3">{t("partnersSection.ctaHelp")}</p>
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
