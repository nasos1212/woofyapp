import { ArrowRight, Sparkles, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import MembershipCard from "./MembershipCard";
import MemberJourneyCarousel from "./MemberJourneyCarousel";
import heroImage from "@/assets/hero-dog.jpg";
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
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.07]"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      {/* Soft ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[140%] max-w-3xl aspect-square bg-wooffy-soft/40 rounded-full blur-3xl opacity-60 -z-0" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-wooffy-light rounded-full blur-3xl opacity-50" />

      {/* Subtle paw decorations */}
      <div className="absolute top-32 left-[5%] text-3xl opacity-15 animate-bounce-slow" style={{ animationDelay: "0s" }}>🐾</div>
      <div className="absolute bottom-24 right-[8%] text-3xl opacity-15 animate-bounce-slow" style={{ animationDelay: "1s" }}>🐾</div>
      <div className="absolute top-[50%] right-[12%] text-2xl opacity-10 animate-bounce-slow hidden lg:block" style={{ animationDelay: "0.7s" }}>🐾</div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center min-h-[calc(100vh-12rem)]">
          {/* Left: Typography & CTAs */}
          <div className="text-center lg:text-left space-y-6 sm:space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-soft border border-border">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">{t("hero.badge")}</span>
            </div>

            <h1 className="text-[2.25rem] leading-[1.05] sm:text-5xl lg:text-6xl xl:text-7xl font-display font-bold text-foreground tracking-tight text-balance">
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
                onClick={() =>
                  document.getElementById("get-listed")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                {t("hero.ctaPlaces")}
              </Button>
            </div>

            <a
              href="#get-listed"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium flex-wrap justify-center lg:justify-start"
            >
              <MapPin className="w-4 h-4" />
              <span>{t("hero.ownPlace")}</span>
              <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-bold shadow-soft whitespace-nowrap">
                {t("hero.getListedFree")}
                <ArrowRight className="w-3 h-3" />
              </span>
            </a>
          </div>

          {/* Right: Membership Card */}
          <div className="relative mt-2 lg:mt-0">
            <div className="animate-float">
              <MembershipCard />
            </div>

            <div className="absolute -top-4 -right-4 bg-card rounded-2xl p-4 shadow-card border border-border animate-bounce-slow hidden lg:block">
              <p className="font-display font-bold text-2xl text-primary">€29</p>
              <p className="text-xs text-muted-foreground">{t("hero.perYear")}</p>
            </div>
          </div>
        </div>

        <div className="mt-16 sm:mt-24 max-w-3xl mx-auto">
          <MemberJourneyCarousel />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
