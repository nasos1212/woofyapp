import { ArrowRight, MapPin, ShieldCheck } from "lucide-react";
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
    <section className="relative min-h-screen pt-[calc(4.5rem+env(safe-area-inset-top))] sm:pt-[calc(6rem+env(safe-area-inset-top))] pb-12 sm:pb-20 overflow-hidden bg-[#f6f7fb]">
      {/* Subtle background grid + radial glow */}
      <div
        className="absolute inset-0 opacity-[0.35] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(217 33% 17% / 0.06) 1px, transparent 1px), linear-gradient(90deg, hsl(217 33% 17% / 0.06) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at 50% 30%, black 40%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 30%, black 40%, transparent 75%)",
        }}
      />
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] rounded-full blur-3xl opacity-25 bg-[#3b6fa0] -translate-y-1/3 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-20 bg-[#1e3a5f] translate-y-1/3 -translate-x-1/3" />

      {/* Light paw accents, kept understated */}
      <div className="absolute top-28 left-[6%] text-2xl opacity-10 select-none">🐾</div>
      <div className="absolute bottom-32 right-[7%] text-2xl opacity-10 select-none">🐾</div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* LEFT — editorial copy column */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 border border-[#0f1b3d]/15 bg-white/70 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b6fa0]" />
              <span className="text-[11px] sm:text-xs font-sans font-medium tracking-[0.18em] uppercase text-[#0f1b3d]/70">
                {t("hero.badge")}
              </span>
            </div>

            <h1 className="font-serif text-[2.75rem] leading-[1.05] sm:text-6xl lg:text-7xl text-[#0f1b3d] tracking-tight">
              {t("hero.titlePart1")} {t("hero.titleOf")}
              <br />
              <span className="italic text-[#1e3a5f]">{t("hero.titleHighlight")}</span>
            </h1>

            <p className="font-sans text-base sm:text-lg text-[#0f1b3d]/70 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              {t("hero.description")}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-1">
              <Button
                size="xl"
                onClick={handleGetPass}
                className="group bg-[#0f1b3d] text-white hover:bg-[#1e3a5f] hover:scale-[1.02] rounded-xl shadow-[0_10px_30px_-12px_rgba(15,27,61,0.5)]"
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
                className="rounded-xl border-[#0f1b3d]/20 text-[#0f1b3d] hover:bg-[#0f1b3d] hover:text-white"
              >
                {t("hero.ctaPlaces")}
              </Button>
            </div>

            {/* Compact trust strip — replaces the noisy stats panel */}
            <div className="pt-6 border-t border-[#0f1b3d]/10 grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto lg:mx-0">
              <div>
                <p className="font-serif text-3xl sm:text-4xl text-[#0f1b3d]">100+</p>
                <p className="font-sans text-[11px] sm:text-xs uppercase tracking-wider text-[#0f1b3d]/55 mt-1">
                  {t("hero.partnerBusinesses")}
                </p>
              </div>
              <div>
                <p className="font-serif text-3xl sm:text-4xl text-[#0f1b3d]">€200+</p>
                <p className="font-sans text-[11px] sm:text-xs uppercase tracking-wider text-[#0f1b3d]/55 mt-1">
                  {t("hero.yearlySavings")}
                </p>
              </div>
              <div>
                <p className="font-serif text-3xl sm:text-4xl text-[#0f1b3d]">5+</p>
                <p className="font-sans text-[11px] sm:text-xs uppercase tracking-wider text-[#0f1b3d]/55 mt-1">
                  {t("hero.sheltersSupported")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 justify-center lg:justify-start font-sans text-xs text-[#0f1b3d]/60 pt-2">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#3b6fa0]" />
                <span>{t("hero.directory")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#3b6fa0]" />
                <span>{t("hero.loved")}</span>
              </div>
            </div>
          </div>

          {/* RIGHT — membership card on dark navy plinth */}
          <div className="lg:col-span-5 relative mt-2 lg:mt-0">
            <div className="relative rounded-3xl bg-gradient-to-br from-[#0f1b3d] via-[#162a52] to-[#1e3a5f] p-6 sm:p-8 shadow-[0_30px_80px_-30px_rgba(15,27,61,0.55)] border border-white/5">
              <div className="absolute inset-0 rounded-3xl opacity-[0.08] pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 10%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)",
                  backgroundSize: "60px 60px, 90px 90px",
                }}
              />

              <div className="flex items-center justify-between mb-5 relative">
                <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-white/55">
                  Wooffy · Membership
                </span>
                <span className="font-serif text-white/90">
                  €29<span className="font-sans text-xs text-white/55">{t("hero.perYear")}</span>
                </span>
              </div>

              <div className="relative">
                <MembershipCard />
              </div>

              <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between relative">
                <p className="font-sans text-xs text-white/60 leading-snug max-w-[60%]">
                  {t("hero.tryToday")} · {t("hero.joinPack")}
                </p>
                <a
                  href="#get-listed"
                  className="font-sans text-xs text-white hover:text-white/80 inline-flex items-center gap-1 transition-colors"
                >
                  {t("hero.getListedFree")}
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 sm:mt-28 max-w-3xl mx-auto">
          <MemberJourneyCarousel />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
