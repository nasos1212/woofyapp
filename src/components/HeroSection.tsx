import { ArrowRight, MapPin, Heart, Search, Users, Sparkles, ShieldCheck } from "lucide-react";
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
    <section className="relative min-h-screen pt-[calc(4.5rem+env(safe-area-inset-top))] sm:pt-[calc(6rem+env(safe-area-inset-top))] pb-12 sm:pb-20 overflow-hidden bg-gradient-warm">
      {/* Soft background flourishes */}
      <div className="absolute top-0 right-0 w-[36rem] h-[36rem] rounded-full blur-3xl opacity-30 bg-wooffy-sky/40 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-25 bg-wooffy-blue/30 translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Top badge */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 border border-wooffy-blue/15 bg-card/80 backdrop-blur-sm shadow-soft">
            <Sparkles className="w-3.5 h-3.5 text-wooffy-blue" />
            <span className="text-[11px] sm:text-xs font-sans font-medium tracking-[0.18em] uppercase text-wooffy-dark/70">
              {t("hero.badge")}
            </span>
          </div>
        </div>

        {/* BENTO GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-6 lg:grid-cols-12 auto-rows-[minmax(0,auto)] gap-3 sm:gap-4 max-w-6xl mx-auto">
          {/* Hero headline tile — large */}
          <div className="sm:col-span-6 lg:col-span-8 lg:row-span-2 relative rounded-3xl bg-card border border-wooffy-blue/10 p-7 sm:p-10 lg:p-12 shadow-card overflow-hidden">
            <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-wooffy-sky/20 blur-2xl pointer-events-none" />
            <div className="absolute top-6 right-6 text-2xl opacity-20 select-none">🐾</div>

            <h1 className="font-serif text-[2.5rem] leading-[1.02] sm:text-6xl lg:text-[5rem] text-wooffy-dark tracking-tight">
              {t("hero.titlePart1")} {t("hero.titleOf")}
              <br />
              <span className="italic text-gradient bg-gradient-hero">{t("hero.titleHighlight")}</span>
            </h1>

            <p className="font-sans text-base sm:text-lg text-wooffy-dark/65 max-w-xl mt-5 sm:mt-7 leading-relaxed">
              {t("hero.description")}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-7">
              <Button
                size="xl"
                onClick={handleGetPass}
                className="group bg-gradient-hero text-primary-foreground hover:scale-[1.02] rounded-xl shadow-soft border-0"
              >
                {t("hero.ctaJoin")}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="xl"
                variant="outline"
                onClick={() =>
                  document.getElementById("get-listed")?.scrollIntoView({ behavior: "smooth" })
                }
                className="rounded-xl border-wooffy-blue/25 text-wooffy-dark hover:bg-wooffy-blue hover:text-primary-foreground"
              >
                <MapPin className="w-4 h-4" />
                {t("hero.ctaPlaces")}
              </Button>
            </div>
          </div>

          {/* Membership card tile — accent */}
          <div className="sm:col-span-6 lg:col-span-4 lg:row-span-2 relative rounded-3xl bg-gradient-hero p-6 sm:p-7 shadow-card overflow-hidden flex flex-col">
            <div
              className="absolute inset-0 opacity-[0.08] pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 10%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)",
                backgroundSize: "60px 60px, 90px 90px",
              }}
            />
            <div className="flex items-center justify-between relative">
              <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-primary-foreground/70">
                Wooffy · Membership
              </span>
              <span className="font-serif text-primary-foreground text-lg">
                €29<span className="font-sans text-xs text-primary-foreground/70">{t("hero.perYear")}</span>
              </span>
            </div>

            <div className="relative mt-5 flex-1 flex items-center justify-center">
              <MembershipCard />
            </div>

            <div className="mt-5 pt-4 border-t border-primary-foreground/15 relative">
              <p className="font-sans text-xs text-primary-foreground/75 leading-snug">
                {t("hero.tryToday")} · {t("hero.joinPack")}
              </p>
            </div>
          </div>

          {/* Stat tile - partners */}
          <div className="sm:col-span-2 lg:col-span-3 rounded-3xl bg-card border border-wooffy-blue/10 p-5 sm:p-6 shadow-soft">
            <p className="font-serif text-4xl sm:text-5xl text-wooffy-blue leading-none">100+</p>
            <p className="font-sans text-xs uppercase tracking-wider text-wooffy-dark/55 mt-3">
              {t("hero.partnerBusinesses")}
            </p>
          </div>

          {/* Stat tile - savings */}
          <div className="sm:col-span-2 lg:col-span-3 rounded-3xl bg-wooffy-blue text-primary-foreground p-5 sm:p-6 shadow-soft">
            <p className="font-serif text-4xl sm:text-5xl leading-none">€200+</p>
            <p className="font-sans text-xs uppercase tracking-wider text-primary-foreground/75 mt-3">
              {t("hero.yearlySavings")}
            </p>
          </div>

          {/* Feature tile - directory */}
          <div className="sm:col-span-2 lg:col-span-3 rounded-3xl bg-card border border-wooffy-blue/10 p-5 sm:p-6 shadow-soft flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-wooffy-sky/15 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-wooffy-blue" />
            </div>
            <p className="font-serif text-lg text-wooffy-dark mt-3 leading-tight">
              {t("hero.directory")}
            </p>
          </div>

          {/* Feature tile - shelters */}
          <div className="sm:col-span-6 lg:col-span-3 rounded-3xl bg-card border border-wooffy-blue/10 p-5 sm:p-6 shadow-soft flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-wooffy-sky/15 flex items-center justify-center">
              <Heart className="w-5 h-5 text-wooffy-blue" />
            </div>
            <div className="mt-3">
              <p className="font-serif text-2xl text-wooffy-dark leading-none">5+</p>
              <p className="font-sans text-xs uppercase tracking-wider text-wooffy-dark/55 mt-2">
                {t("hero.sheltersSupported")}
              </p>
            </div>
          </div>

          {/* Wide trust tile */}
          <div className="sm:col-span-6 lg:col-span-12 rounded-3xl bg-card/70 backdrop-blur-sm border border-wooffy-blue/10 p-4 sm:p-5 shadow-soft flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-sans text-sm text-wooffy-dark/70">
              <ShieldCheck className="w-4 h-4 text-wooffy-blue" />
              <span>{t("hero.loved")}</span>
            </div>
            <div className="flex items-center gap-2 font-sans text-sm text-wooffy-dark/70">
              <Search className="w-4 h-4 text-wooffy-blue" />
              <span>{t("hero.ownPlace")}</span>
            </div>
            <a
              href="#get-listed"
              className="font-sans text-sm text-wooffy-blue hover:text-wooffy-dark inline-flex items-center gap-1 transition-colors"
            >
              {t("hero.getListedFree")}
              <ArrowRight className="w-4 h-4" />
            </a>
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
