import { ArrowRight, Sparkles, Heart, MapPin, Building2, PiggyBank, Check, Coffee, Bone } from "lucide-react";
import { Button } from "./ui/button";
import MembershipCard from "./MembershipCard";
import MemberJourneyCarousel from "./MemberJourneyCarousel";
import heroVideo from "@/assets/hero-dog-video.mp4.asset.json";
import heroPoster from "@/assets/hero-dog-poster.jpg";
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
      {/* Looping dog video backdrop */}
      <div className="absolute inset-0 overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={heroVideo.url}
          poster={heroPoster}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
        />
        {/* Navy gradient overlay so text stays crisp */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-background/70 lg:from-background/85 lg:via-background/30 lg:to-background/60" />
      </div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-wooffy-soft rounded-full blur-3xl opacity-30" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-wooffy-light rounded-full blur-3xl opacity-40" />

      <div className="absolute top-32 left-[5%] text-4xl opacity-20 animate-bounce-slow" style={{ animationDelay: '0s' }}>🐾</div>
      <div className="absolute top-48 right-[8%] text-3xl opacity-15 animate-bounce-slow" style={{ animationDelay: '0.5s' }}>🐾</div>
      <div className="absolute top-[60%] left-[3%] text-2xl opacity-20 animate-bounce-slow" style={{ animationDelay: '1s' }}>🐾</div>
      <div className="absolute bottom-32 right-[5%] text-4xl opacity-15 animate-bounce-slow" style={{ animationDelay: '1.5s' }}>🐾</div>
      <div className="absolute top-[40%] right-[15%] text-2xl opacity-10 animate-bounce-slow hidden lg:block" style={{ animationDelay: '0.7s' }}>🐾</div>
      <div className="absolute bottom-[45%] left-[12%] text-3xl opacity-15 animate-bounce-slow hidden lg:block" style={{ animationDelay: '1.2s' }}>🐾</div>

      <div className="absolute top-24 right-[20%] text-2xl opacity-15 animate-float hidden md:block" style={{ animationDelay: '0.3s' }}>🦴</div>
      <div className="absolute bottom-40 left-[18%] text-xl opacity-20 animate-float hidden md:block" style={{ animationDelay: '0.8s' }}>🦴</div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left space-y-5 sm:space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-soft border border-border">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">{t("hero.badge")}</span>
            </div>

            <h1 className="text-[2rem] leading-snug sm:text-5xl lg:text-6xl font-display font-bold text-foreground sm:leading-tight">
              {t("hero.titlePart1")}<br className="sm:hidden" />{" "}
              {t("hero.titleOf")} <span className="text-gradient">{t("hero.titleHighlight")}</span>
            </h1>

            <p className="hidden sm:block text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
              {t("hero.description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2 sm:pt-0">
              <Button variant="hero" size="xl" className="group" onClick={handleGetPass}>
                {t("hero.ctaJoin")}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="heroOutline" size="xl" onClick={() => document.getElementById("get-listed")?.scrollIntoView({ behavior: "smooth" })}>
                {t("hero.ctaPlaces")}
              </Button>
            </div>
            <p className="block sm:hidden text-base text-muted-foreground max-w-xl mx-auto">
              {t("hero.description")}
            </p>

            <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-card to-primary/10 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-card border border-primary/20">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
              <p className="text-sm sm:text-base font-semibold text-primary mb-3 sm:mb-6 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                {t("hero.targets")}
              </p>
              <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 relative">
                <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 text-center shadow-soft border border-border hover:border-primary/30 hover:shadow-card transition-all duration-300">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <p className="font-display font-bold text-2xl sm:text-3xl text-gradient">100+</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t("hero.partnerBusinesses")}</p>
                </div>
                <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 text-center shadow-soft border border-border hover:border-primary/30 hover:shadow-card transition-all duration-300">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/10 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <PiggyBank className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <p className="font-display font-bold text-2xl sm:text-3xl text-green-600">€200+</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t("hero.yearlySavings")}</p>
                </div>
                <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 text-center shadow-soft border border-border hover:border-primary/30 hover:shadow-card transition-all duration-300">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-500/10 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />
                  </div>
                  <p className="font-display font-bold text-2xl sm:text-3xl text-rose-500">5+</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t("hero.sheltersSupported")}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center lg:justify-start text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{t("hero.directory")}</span>
              </div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full hidden sm:block" />
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-destructive" />
                <span>{t("hero.loved")}</span>
              </div>
            </div>

            <a
              href="#get-listed"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium mt-1 flex-wrap justify-center lg:justify-start"
            >
              <MapPin className="w-4 h-4" />
              <span>{t("hero.ownPlace")}</span>
              <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-bold shadow-soft whitespace-nowrap">
                {t("hero.getListedFree")}
                <ArrowRight className="w-3 h-3" />
              </span>
            </a>
          </div>

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

        <div className="mt-24 max-w-3xl mx-auto">
          <MemberJourneyCarousel />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
