import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const CTASection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="py-20 lg:py-32 bg-wooffy-dark relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-wooffy-blue/20 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-wooffy-blue/20 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-wooffy-sky mb-6">
            {t("cta.title")}
          </h2>

          <p className="text-xl text-wooffy-light/80 mb-10 max-w-2xl mx-auto">
            {t("cta.subtitle")}
          </p>

          <Button
            size="xl"
            className="bg-wooffy-sky text-wooffy-dark hover:bg-wooffy-light hover:scale-105 shadow-lg group max-w-full w-full sm:w-auto whitespace-normal h-auto min-h-[3.5rem] py-3 px-6 text-base sm:text-lg leading-snug"
            onClick={() => navigate("/auth")}
          >
            <span className="flex-1 text-center">{t("cta.button")}</span>
            <ArrowRight className="w-5 h-5 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
          </Button>

          <p className="text-sm text-wooffy-light/60 mt-4">
            {t("cta.lessThan")}
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
