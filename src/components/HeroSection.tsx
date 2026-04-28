import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Heart, MapPin, Building2, PiggyBank } from "lucide-react";
import { Button } from "./ui/button";
import MembershipCard from "./MembershipCard";
import MemberJourneyCarousel from "./MemberJourneyCarousel";
import heroImage from "@/assets/hero-dog.jpg";

const HeroSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleGetPass = () => navigate("/auth");
  const handleExplore = () =>
    document.getElementById("get-listed")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className="relative min-h-[90dvh] w-full overflow-hidden bg-background pt-[calc(4.5rem+env(safe-area-inset-top))] sm:pt-[calc(6rem+env(safe-area-inset-top))] pb-12 sm:pb-20">
      {/* Atmospheric glows */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 right-[-10%] w-[28rem] h-[28rem] rounded-full bg-accent/10 blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* TEXT COLUMN */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-[11px] tracking-widest uppercase mb-6 ring-1 ring-primary/20">
              <Sparkles className="w-3.5 h-3.5" />
              {t("hero.badge")}
            </div>

            <h1 className="font-display font-black text-foreground tracking-[-0.03em] leading-[0.95] text-[2.75rem] sm:text-6xl lg:text-7xl">
              {t("hero.titlePart1")} {t("hero.titleOf")}{" "}
              <span className="text-gradient">{t("hero.titleHighlight")}</span>
            </h1>

            <p className="mt-5 sm:mt-6 text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
              {t("hero.description")}
            </p>

            <div className="mt-7 sm:mt-9 flex flex-col sm:flex-row w-full sm:w-auto gap-3 sm:gap-4">
              <Button
                variant="hero"
                size="xl"
                className="group w-full sm:w-auto rounded-full"
                onClick={handleGetPass}
              >
                {t("hero.ctaJoin")}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="heroOutline"
                size="xl"
                className="w-full sm:w-auto rounded-full"
                onClick={handleExplore}
              >
                {t("hero.ctaPlaces")}
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 justify-center lg:justify-start text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{t("hero.directory")}</span>
              </div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-destructive" />
                <span>{t("hero.loved")}</span>
              </div>
            </div>
          </div>

          {/* MEMBERSHIP CARD COLUMN (original component, unchanged) */}
          <div className="relative mt-4 lg:mt-0">
            <div className="animate-float">
              <MembershipCard />
            </div>

            <div className="absolute -top-4 -right-4 bg-card rounded-2xl p-4 shadow-card border border-border animate-bounce-slow hidden lg:block">
              <p className="font-display font-bold text-2xl text-primary">€29</p>
              <p className="text-xs text-muted-foreground">{t("hero.perYear")}</p>
            </div>

            <div className="absolute -bottom-12 -left-4 bg-card rounded-2xl px-4 py-3 shadow-card border border-border hidden lg:flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-lg">✓</span>
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">{t("hero.tryToday")}</p>
                <p className="text-xs text-muted-foreground">{t("hero.joinPack")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Compact stats strip (kept, just slimmer) */}
        <div className="mt-12 sm:mt-16 max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 bg-card/70 backdrop-blur-sm rounded-2xl p-3 sm:p-5 shadow-soft border border-border">
            <div className="flex flex-col items-center text-center px-1">
              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-primary/10 rounded-xl flex items-center justify-center mb-1.5 sm:mb-2">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <p className="font-display font-bold text-xl sm:text-2xl text-gradient">100+</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-tight">
                {t("hero.partnerBusinesses")}
              </p>
            </div>
            <div className="flex flex-col items-center text-center px-1 border-x border-border">
              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-green-500/10 rounded-xl flex items-center justify-center mb-1.5 sm:mb-2">
                <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <p className="font-display font-bold text-xl sm:text-2xl text-green-600">€200+</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-tight">
                {t("hero.yearlySavings")}
              </p>
            </div>
            <div className="flex flex-col items-center text-center px-1">
              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-rose-500/10 rounded-xl flex items-center justify-center mb-1.5 sm:mb-2">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
              </div>
              <p className="font-display font-bold text-xl sm:text-2xl text-rose-500">5+</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-tight">
                {t("hero.sheltersSupported")}
              </p>
            </div>
          </div>

          <a
            href="#get-listed"
            className="mt-5 inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium flex-wrap justify-center w-full"
          >
            <MapPin className="w-4 h-4" />
            <span>{t("hero.ownPlace")}</span>
            <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-bold shadow-soft whitespace-nowrap">
              {t("hero.getListedFree")}
              <ArrowRight className="w-3 h-3" />
            </span>
          </a>
        </div>

        {/* Member journey - DO NOT change */}
        <div className="mt-20 sm:mt-24 max-w-3xl mx-auto">
          <MemberJourneyCarousel />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
