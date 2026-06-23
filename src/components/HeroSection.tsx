import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import MemberJourneyCarousel from "./MemberJourneyCarousel";
import heroImage from "@/assets/hero-dog-v2.jpg";
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
              <h1 className="text-[2.25rem] leading-[1.05] font-display font-bold drop-shadow-lg">
                {t("hero.titlePart1")} {t("hero.titleOf")}{" "}
                <span className="text-wooffy-sky">{t("hero.titleHighlight")}</span>
              </h1>
            </div>

            {/* Description + CTAs (bottom on mobile, full block on desktop) */}
            <div className="max-w-2xl space-y-5 sm:space-y-6 text-white">
              <h1 className="hidden sm:block sm:text-5xl lg:text-6xl font-display font-bold drop-shadow-lg leading-[1.05]">
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
