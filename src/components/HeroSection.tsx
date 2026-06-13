import { ArrowRight, Sparkles, Building2, PiggyBank, Heart } from "lucide-react";
import { Button } from "./ui/button";
import MemberJourneyCarousel from "./MemberJourneyCarousel";
import heroDogs from "@/assets/hero-dogs.jpg";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const HeroSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleGetPass = () => {
    navigate("/auth");
  };

  return (
    <section className="relative min-h-screen pt-[calc(4.5rem+env(safe-area-inset-top))] sm:pt-[calc(6rem+env(safe-area-inset-top))] pb-8 sm:pb-16 overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-wooffy-soft rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-wooffy-light rounded-full blur-3xl opacity-20" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left space-y-6 sm:space-y-8 relative z-10">
            <h1 className="text-[2.25rem] leading-tight sm:text-5xl lg:text-6xl font-display font-bold text-foreground sm:leading-tight">
              {t("hero.titlePart1")} {t("hero.titleOf")}{" "}
              <span className="text-gradient">{t("hero.titleHighlight")}</span>
            </h1>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="xl" className="group" onClick={handleGetPass}>
                {t("hero.ctaJoin")}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="heroOutline"
                size="xl"
                onClick={() => document.getElementById("get-listed")?.scrollIntoView({ behavior: "smooth" })}
              >
                {t("hero.ctaPlaces")}
              </Button>
            </div>

            <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-card to-primary/10 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-card border border-primary/20">
              <p className="text-sm sm:text-base font-semibold text-primary mb-3 sm:mb-6 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                {t("hero.targets")}
              </p>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-3 sm:p-5 text-center shadow-soft border border-border">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <p className="font-display font-bold text-xl sm:text-3xl text-foreground">100+</p>
                  <p className="text-[11px] sm:text-sm text-muted-foreground mt-1 leading-tight">{t("hero.partnerBusinesses")}</p>
                </div>
                <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-3 sm:p-5 text-center shadow-soft border border-border">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <PiggyBank className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <p className="font-display font-bold text-xl sm:text-3xl text-foreground">€200+</p>
                  <p className="text-[11px] sm:text-sm text-muted-foreground mt-1 leading-tight">{t("hero.yearlySavings")}</p>
                </div>
                <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-3 sm:p-5 text-center shadow-soft border border-border">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <p className="font-display font-bold text-xl sm:text-3xl text-foreground">5+</p>
                  <p className="text-[11px] sm:text-sm text-muted-foreground mt-1 leading-tight">{t("hero.sheltersSupported")}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-4 lg:mt-0">
            <div className="relative rounded-[2rem] overflow-hidden shadow-card border border-border bg-card">
              <img
                src={heroDogs}
                alt="Two happy dogs together — golden retriever and a small mixed breed"
                width={1280}
                height={1280}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>

        <div className="mt-20 sm:mt-24 max-w-3xl mx-auto">
          <MemberJourneyCarousel />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
