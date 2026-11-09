import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import MemberJourneyCarousel from "./MemberJourneyCarousel";
import heroImage from "@/assets/hero-dog-v2.jpg";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Capacitor } from "@capacitor/core";

const APP_STORE_URL = "https://apps.apple.com/cy/app/wooffy/id6819098781";

const HeroSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleGetPass = () => {
    navigate("/auth");
  };

  return (
    <section className="relative min-h-screen pt-[calc(4.5rem+env(safe-area-inset-top))] sm:pt-[calc(6rem+env(safe-area-inset-top))] pb-12 sm:pb-20 overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        {/* Full-bleed photo with text overlay */}
        <div className="relative w-full rounded-[1.75rem] sm:rounded-[2.5rem] overflow-hidden shadow-card border border-border min-h-[78vh] sm:min-h-[80vh]">
          <img
            src={heroImage}
            alt={t("hero.titleHighlight")}
            width={1280}
            height={1280}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Gradient scrim for legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/70 sm:hidden" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20 hidden sm:block" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent hidden sm:block" />

          {/* Mobile: title top, actions bottom. Desktop: all bottom-left. */}
          <div className="relative h-full min-h-[78vh] sm:min-h-[80vh] flex flex-col justify-between sm:justify-end p-6 sm:p-12 lg:p-16">
            {/* Title (top on mobile) */}
            <div className="max-w-2xl text-white sm:hidden">
              <p aria-hidden="true" className="text-[2.25rem] leading-[1.05] font-display font-bold drop-shadow-lg">
                {t("hero.titlePart1")} {t("hero.titleOf")}{" "}
                <span className="text-wooffy-sky">{t("hero.titleHighlight")}</span>
              </p>
            </div>

            {/* Description + CTAs (bottom on mobile, full block on desktop) */}
            <div className="max-w-2xl space-y-5 sm:space-y-6 text-white">
              <h1 className="sr-only sm:not-sr-only sm:block sm:text-5xl lg:text-6xl font-display font-bold drop-shadow-lg leading-[1.05]">
                {t("hero.titlePart1")} {t("hero.titleOf")}{" "}
                <span className="text-wooffy-sky">{t("hero.titleHighlight")}</span>
              </h1>

              <p className="text-base sm:text-lg text-white/90 max-w-lg drop-shadow">
                {t("hero.description")}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-1">
                <Button variant="hero" size="xl" className="group" onClick={handleGetPass}>
                  {t("hero.ctaJoin")}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  variant="heroOutline"
                  size="xl"
                  className="bg-white/10 backdrop-blur-md border-white text-white hover:bg-white hover:text-foreground"
                  onClick={() => document.getElementById("get-listed")?.scrollIntoView({ behavior: "smooth" })}
                >
                  {t("hero.ctaPlaces")}
                </Button>
              </div>

              {!Capacitor.isNativePlatform() && (
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("hero.appStoreAria")}
                  className="inline-flex items-center gap-3 rounded-xl border border-white/40 bg-black/80 px-4 py-2 text-white transition-colors hover:bg-black"
                >
                  <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden="true">
                    <path d="M16.37 12.6c-.02-2.3 1.88-3.4 1.97-3.46-1.07-1.57-2.74-1.78-3.33-1.8-1.42-.14-2.77.83-3.49.83-.72 0-1.83-.81-3.01-.79-1.55.02-2.98.9-3.78 2.29-1.61 2.8-.41 6.94 1.16 9.21.77 1.11 1.68 2.36 2.88 2.31 1.16-.05 1.59-.75 2.99-.75 1.4 0 1.79.75 3.01.72 1.24-.02 2.03-1.13 2.79-2.25.88-1.29 1.24-2.54 1.26-2.6-.03-.01-2.42-.93-2.45-3.71zM14.08 5.85c.64-.77 1.07-1.85.95-2.92-.92.04-2.03.61-2.69 1.38-.59.68-1.11 1.78-.97 2.83 1.02.08 2.07-.52 2.71-1.29z" />
                  </svg>
                  <span className="flex flex-col leading-tight text-left">
                    <span className="text-[10px] uppercase tracking-wide opacity-80">{t("hero.appStoreSmall")}</span>
                    <span className="text-lg font-semibold">App Store</span>
                  </span>
                </a>
              )}
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
