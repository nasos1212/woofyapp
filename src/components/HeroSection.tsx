import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
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
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 right-[-10%] w-[28rem] h-[28rem] rounded-full bg-accent/10 blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* TEXT COLUMN */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-[11px] tracking-widest uppercase mb-6 ring-1 ring-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {t("hero.vipBadge")}
            </div>

            <h1 className="font-display font-black text-foreground tracking-[-0.04em] leading-[0.88] text-[3.75rem] sm:text-[5.5rem] lg:text-[7rem]">
              {t("hero.newTitle1")}
              <br />
              <span className="text-gradient">{t("hero.newTitle2")}</span>
              <br />
              {t("hero.newTitle3")}
            </h1>

            <p className="mt-6 sm:mt-8 text-base sm:text-lg lg:text-xl text-muted-foreground font-medium max-w-[34ch] leading-relaxed">
              {t("hero.newTagline")}
            </p>

            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row w-full sm:w-auto gap-3 sm:gap-4">
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
          </div>

          {/* PASS COLUMN */}
          <div className="relative w-full flex items-center justify-center mt-4 lg:mt-0">
            <div className="relative w-[260px] sm:w-[300px] aspect-[1/1.5] rotate-6 lg:rotate-12 transition-transform duration-700 hover:rotate-[8deg] hover:-translate-y-2">
              {/* Drop shadow halo */}
              <div className="absolute inset-0 bg-primary/30 blur-3xl translate-y-12 rounded-[2.5rem] -z-10" />

              {/* Holographic gradient frame */}
              <div className="absolute inset-0 rounded-[2.5rem] p-[3px] shadow-card overflow-hidden bg-[linear-gradient(135deg,hsl(var(--accent))_0%,hsl(var(--primary))_50%,hsl(var(--wooffy-sky))_100%)]">
                {/* Inner card */}
                <div className="relative w-full h-full bg-card/90 backdrop-blur-xl rounded-[2.3rem] flex flex-col p-5 sm:p-6 ring-1 ring-border">
                  {/* Lanyard slot */}
                  <div className="w-14 h-3.5 bg-foreground/20 rounded-full mx-auto mb-5 sm:mb-6 ring-1 ring-border" />

                  {/* Header row */}
                  <div className="flex justify-between items-start">
                    <div className="font-display font-black text-foreground text-2xl sm:text-3xl tracking-tighter">
                      {t("hero.passLabel")}
                    </div>
                    <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-soft">
                      {t("hero.passVip")}
                    </div>
                  </div>

                  {/* Photo */}
                  <div className="relative w-full aspect-[4/3] rounded-2xl mt-5 sm:mt-6 overflow-hidden ring-2 ring-border bg-muted">
                    <img
                      src={heroImage}
                      alt="Wooffy member pet"
                      className="w-full h-full object-cover"
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                    <div className="absolute bottom-2.5 left-3 right-3">
                      <div className="text-primary-foreground font-display font-black text-lg leading-none drop-shadow">
                        {t("hero.passPet")}
                      </div>
                      <div className="text-primary-foreground/85 font-bold text-[10px] uppercase tracking-widest mt-1">
                        {t("hero.passBreed")}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-auto pt-5 flex justify-between items-end text-foreground">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">
                        {t("hero.passMemberSince")}
                      </div>
                      <div className="text-2xl font-display font-black tabular-nums">
                        2026
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center">
                      <span className="block w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
