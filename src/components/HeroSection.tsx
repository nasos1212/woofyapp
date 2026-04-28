import { ArrowRight, Sparkles, Heart, MapPin, Building2, PiggyBank, Star, Users } from "lucide-react";
import { Button } from "./ui/button";
import MembershipCard from "./MembershipCard";
import MemberJourneyCarousel from "./MemberJourneyCarousel";
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
      {/* Modern gradient mesh background */}
      <div className="absolute inset-0 bg-gradient-to-br from-wooffy-soft via-background to-wooffy-light/40" />
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px]" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-wooffy-light rounded-full blur-[120px] opacity-70" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* LEFT — Text column (7/12) */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6 sm:space-y-7 relative">
            {/* Glass badge */}
            <div className="inline-flex items-center gap-2 bg-card/60 backdrop-blur-md rounded-full pl-2 pr-4 py-1.5 shadow-soft border border-primary/15">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/15">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </span>
              <span className="text-xs sm:text-sm font-semibold text-foreground">{t("hero.badge")}</span>
            </div>

            {/* Refined headline */}
            <h1 className="text-[2.25rem] leading-[1.1] sm:text-6xl lg:text-7xl font-display font-extrabold text-foreground tracking-tight">
              {t("hero.titlePart1")}
              <br className="hidden sm:block" />{" "}
              {t("hero.titleOf")}{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-gradient">{t("hero.titleHighlight")}</span>
                <span className="absolute -bottom-1 sm:-bottom-2 left-0 right-0 h-2 sm:h-3 bg-primary/20 -z-0 rounded-full blur-sm" />
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
              {t("hero.description")}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="xl" className="group" onClick={handleGetPass}>
                {t("hero.ctaJoin")}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="heroOutline" size="xl" onClick={() => document.getElementById("get-listed")?.scrollIntoView({ behavior: "smooth" })}>
                {t("hero.ctaPlaces")}
              </Button>
            </div>

            {/* Trust strip */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 justify-center lg:justify-start text-sm text-muted-foreground pt-2">
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="font-semibold text-foreground">{t("hero.loved")}</span>
              </div>
              <div className="w-1 h-1 bg-muted-foreground/40 rounded-full" />
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{t("hero.directory")}</span>
              </div>
            </div>

            {/* Get Listed link */}
            <a
              href="#get-listed"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium flex-wrap justify-center lg:justify-start"
            >
              <span>{t("hero.ownPlace")}</span>
              <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-bold shadow-soft whitespace-nowrap">
                {t("hero.getListedFree")}
                <ArrowRight className="w-3 h-3" />
              </span>
            </a>
          </div>

          {/* RIGHT — Card column (5/12) with tilt + accents */}
          <div className="lg:col-span-5 relative mt-2 lg:mt-0">
            {/* Decorative ring behind card */}
            <div className="absolute inset-0 -m-6 lg:-m-10 rounded-[2rem] bg-gradient-to-br from-primary/20 via-transparent to-wooffy-light/40 blur-2xl" />

            {/* Tilted card wrapper */}
            <div className="relative animate-float lg:rotate-[3deg] hover:rotate-0 transition-transform duration-500">
              <MembershipCard />
            </div>

            {/* Floating €29 chip */}
            <div className="absolute -top-3 -right-2 sm:-top-5 sm:-right-5 bg-card/90 backdrop-blur-md rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 shadow-card border border-primary/20 animate-bounce-slow">
              <p className="font-display font-extrabold text-xl sm:text-2xl text-gradient leading-none">€29</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{t("hero.perYear")}</p>
            </div>

            {/* Floating members chip */}
            <div className="absolute -bottom-4 -left-2 sm:-bottom-6 sm:-left-4 bg-card/90 backdrop-blur-md rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 shadow-card border border-border flex items-center gap-2 animate-float" style={{ animationDelay: '0.6s' }}>
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="text-left">
                <p className="font-display font-bold text-xs sm:text-sm text-foreground leading-tight">{t("hero.tryToday")}</p>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-tight">{t("hero.joinPack")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modern stats bar — full width below */}
        <div className="mt-16 sm:mt-20 relative">
          <div className="relative bg-card/70 backdrop-blur-md rounded-3xl border border-border shadow-card overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
            <div className="relative px-6 py-6 sm:px-10 sm:py-8">
              <p className="text-xs sm:text-sm font-semibold text-primary mb-5 sm:mb-6 flex items-center justify-center gap-2 uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                {t("hero.targets")}
              </p>
              <div className="grid grid-cols-3 gap-2 sm:gap-6">
                <div className="text-center group">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                    <Building2 className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
                  </div>
                  <p className="font-display font-extrabold text-2xl sm:text-4xl text-gradient leading-none">100+</p>
                  <p className="text-[10px] sm:text-sm text-muted-foreground mt-1.5 sm:mt-2 font-medium">{t("hero.partnerBusinesses")}</p>
                </div>
                <div className="text-center group border-x border-border/50">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                    <PiggyBank className="w-5 h-5 sm:w-7 sm:h-7 text-green-600" />
                  </div>
                  <p className="font-display font-extrabold text-2xl sm:text-4xl text-green-600 leading-none">€200+</p>
                  <p className="text-[10px] sm:text-sm text-muted-foreground mt-1.5 sm:mt-2 font-medium">{t("hero.yearlySavings")}</p>
                </div>
                <div className="text-center group">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                    <Heart className="w-5 h-5 sm:w-7 sm:h-7 text-rose-500" />
                  </div>
                  <p className="font-display font-extrabold text-2xl sm:text-4xl text-rose-500 leading-none">5+</p>
                  <p className="text-[10px] sm:text-sm text-muted-foreground mt-1.5 sm:mt-2 font-medium">{t("hero.sheltersSupported")}</p>
                </div>
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
