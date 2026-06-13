import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import MemberJourneyCarousel from "./MemberJourneyCarousel";
import heroImage from "@/assets/hero-dog-new.jpg";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const HeroSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleGetPass = () => {
    navigate("/auth");
  };

  return (
    <section className="relative min-h-screen pt-[calc(4.5rem+env(safe-area-inset-top))] sm:pt-[calc(6rem+env(safe-area-inset-top))] pb-12 sm:pb-20 overflow-hidden">
      {/* Soft background accents */}
      <div className="absolute top-32 -left-20 w-72 h-72 bg-wooffy-soft rounded-full blur-3xl opacity-30" />
      <div className="absolute bottom-10 -right-20 w-96 h-96 bg-wooffy-light rounded-full blur-3xl opacity-30" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left: Minimal copy */}
          <div className="text-center lg:text-left space-y-6 sm:space-y-8 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-soft border border-border">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">{t("hero.badge")}</span>
            </div>

            <h1 className="text-[2.25rem] leading-[1.1] sm:text-5xl lg:text-6xl font-display font-bold text-foreground">
              {t("hero.titlePart1")} {t("hero.titleOf")}{" "}
              <span className="text-gradient">{t("hero.titleHighlight")}</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto lg:mx-0">
              {t("hero.description")}
            </p>

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
          </div>

          {/* Right: Big photo */}
          <div className="relative order-1 lg:order-2">
            <div className="relative aspect-square w-full max-w-md lg:max-w-lg mx-auto">
              <div className="absolute -inset-3 bg-gradient-to-br from-primary/30 via-wooffy-light/40 to-transparent rounded-[2rem] blur-2xl opacity-70" />
              <div className="relative w-full h-full rounded-[2rem] overflow-hidden shadow-card border border-border bg-card">
                <img
                  src={heroImage}
                  alt={t("hero.titleHighlight")}
                  width={1024}
                  height={1024}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Subtle floating accents — kept tasteful, no clutter */}
              <div className="absolute -bottom-5 -left-4 bg-card rounded-2xl px-4 py-3 shadow-card border border-border hidden sm:flex items-center gap-3 animate-float">
                <span className="text-2xl">🐾</span>
                <div>
                  <p className="font-display font-semibold text-sm text-foreground leading-tight">
                    {t("hero.tryToday")}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("hero.joinPack")}</p>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 bg-card rounded-2xl px-4 py-3 shadow-card border border-border hidden sm:block">
                <p className="font-display font-bold text-xl text-primary leading-none">€29</p>
                <p className="text-[11px] text-muted-foreground mt-1">{t("hero.perYear")}</p>
              </div>
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
