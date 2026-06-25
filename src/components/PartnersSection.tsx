import { Building2, Users, TrendingUp, BarChart3, Gift, ArrowRight, Sparkles, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import petShopImg from "@/assets/partners/pet-shop.jpg";
import vetImg from "@/assets/partners/vet.jpg";
import trainerImg from "@/assets/partners/trainer.jpg";
import petHotelImg from "@/assets/partners/pet-hotel.jpg";
import groomerImg from "@/assets/partners/groomer.jpg";
import otherImg from "@/assets/partners/other.jpg";

const PartnersSection = () => {
  const { t } = useTranslation();

  const categoryConfig = [
    { image: petShopImg, name: t("partnersSection.cat.petShops") },
    { image: vetImg, name: t("partnersSection.cat.veterinaries") },
    { image: trainerImg, name: t("partnersSection.cat.trainers") },
    { image: petHotelImg, name: t("partnersSection.cat.petHotels") },
    { image: groomerImg, name: t("partnersSection.cat.groomers") },
    { image: otherImg, name: t("partnersSection.cat.other") },
  ];

  const benefits = [
    { icon: Users, title: t("partnersSection.benefits.reach.title"), desc: t("partnersSection.benefits.reach.desc") },
    { icon: TrendingUp, title: t("partnersSection.benefits.traffic.title"), desc: t("partnersSection.benefits.traffic.desc") },
    { icon: BarChart3, title: t("partnersSection.benefits.insights.title"), desc: t("partnersSection.benefits.insights.desc") },
    { icon: Gift, title: t("partnersSection.benefits.free.title"), desc: t("partnersSection.benefits.free.desc") },
  ];

  return (
    <section id="partners" className="py-20 lg:py-28 bg-wooffy-dark text-white overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-flex items-center gap-2 bg-wooffy-blue/20 rounded-full px-4 py-2 border border-wooffy-blue/30 mb-6">
            <Building2 className="w-4 h-4 text-wooffy-sky" />
            <span className="text-sm font-medium text-wooffy-light/80">{t("partnersSection.badge")}</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-6">
            {t("partnersSection.title")}
          </h2>
          <p className="text-lg text-wooffy-light/70">{t("partnersSection.description")}</p>
        </div>

        {/* Split: dashboard preview + benefits */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center max-w-6xl mx-auto mb-14">
          {/* Animated dashboard mockup */}
          <DashboardPreview t={t} />

          {/* Benefits stack */}
          <div className="space-y-4">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="bg-wooffy-blue/10 rounded-2xl p-5 border border-wooffy-blue/30 hover:border-wooffy-sky/50 transition-all duration-300 flex gap-4"
              >
                <div className="w-11 h-11 shrink-0 bg-wooffy-sky/20 rounded-xl flex items-center justify-center">
                  <b.icon className="w-5 h-5 text-wooffy-sky" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-white mb-1">{b.title}</h3>
                  <p className="text-sm text-wooffy-light/70 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <p className="text-center text-sm font-medium text-wooffy-light/60 uppercase tracking-wider mb-5">
          {t("partnersSection.categoriesLabel")}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10 max-w-5xl mx-auto">
          {categoryConfig.map((category) => (
            <div
              key={category.name}
              className="group relative aspect-square rounded-xl overflow-hidden border border-wooffy-blue/30 hover:border-wooffy-sky/60 transition-all duration-300"
            >
              <img
                src={category.image}
                alt={category.name}
                loading="lazy"
                width={512}
                height={512}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-wooffy-dark via-wooffy-dark/40 to-transparent" />
              <p className="absolute bottom-2 left-0 right-0 text-center text-xs font-semibold text-white px-2">
                {category.name}
              </p>
            </div>
          ))}
        </div>


        {/* CTA */}
        <div className="text-center">
          <Button asChild size="lg" className="rounded-full px-8 bg-wooffy-sky text-wooffy-dark hover:bg-wooffy-sky/90">
            <Link to="/partner-register">
              {t("partnersSection.cta")}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <p className="text-xs text-wooffy-light/60 mt-3">{t("partnersSection.ctaHelp")}</p>
        </div>
      </div>
    </section>
  );
};

const DashboardPreview = ({ t }: { t: (k: string) => string }) => {
  return (
    <div className="relative">
      {/* Soft glow */}
      <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent rounded-3xl blur-2xl" aria-hidden />

      {/* Browser frame */}
      <div className="relative bg-white rounded-2xl shadow-card border border-border overflow-hidden text-slate-800">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 bg-slate-50">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
          </div>
          <div className="ml-3 flex-1 text-[10px] text-slate-400 font-mono truncate">
            wooffy.app/business
          </div>
        </div>

        {/* App header (mimics partner portal) */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-wooffy-sky/20 flex items-center justify-center">
              <span className="text-[10px]">🐾</span>
            </div>
            <div className="leading-tight">
              <p className="text-[10px] font-display font-bold text-slate-900">Wooffy</p>
              <p className="text-[7px] text-slate-400 -mt-0.5">Partner Portal</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[9px] font-medium">
            <span className="text-wooffy-sky">▦ Dashboard</span>
            <span className="text-slate-400">◷ Offers</span>
            <span className="text-slate-400">▥ Analytics</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
              <span className="text-[8px]">🏢</span>
            </div>
            <span className="text-[9px] font-medium text-slate-700">Paws Pet Hotel</span>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 bg-slate-50/60 min-h-[380px]">
          {/* Title */}
          <div>
            <h3 className="font-display font-bold text-slate-900 text-base leading-tight">Pet Nas</h3>
            <p className="text-[10px] text-slate-500">{t("partnersSection.preview.subtitle")}</p>
          </div>

          {/* Tile grid */}
          <div className="grid grid-cols-2 gap-2">
            <Tile icon="🏷️" iconBg="bg-blue-100" title={t("partnersSection.preview.tiles.offers")} sub={t("partnersSection.preview.tiles.offersSub")} />
            <Tile icon="⏱️" iconBg="bg-green-100" title={t("partnersSection.preview.tiles.redemptions")} sub={t("partnersSection.preview.tiles.redemptionsSub")} />
            <Tile icon="📊" iconBg="bg-sky-100" title={t("partnersSection.preview.tiles.analytics")} sub={t("partnersSection.preview.tiles.analyticsSub")} />
            <Tile icon="🎂" iconBg="bg-pink-100" title={t("partnersSection.preview.tiles.birthdays")} sub={t("partnersSection.preview.tiles.birthdaysSub")} />
          </div>

          {/* This month stats */}
          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-slate-900">{t("partnersSection.preview.thisMonth")}</p>
              <span className="text-[9px] text-wooffy-sky font-medium">{t("partnersSection.preview.viewDetails")} →</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <StatRow icon="👥" iconBg="bg-blue-50" label={t("partnersSection.preview.redemptions")} from={4} to={32} delay={0} />
              <StatRow icon="📈" iconBg="bg-green-50" label={t("partnersSection.preview.newCustomers")} from={2} to={18} delay={400} />
            </div>
          </div>

          {/* Live redemption toast */}
          <div className="relative h-12">
            <div className="absolute inset-x-0 bottom-0 bg-white border border-wooffy-sky/40 rounded-xl p-2.5 flex items-center gap-2 shadow-soft animate-toast">
              <div className="w-7 h-7 rounded-full bg-wooffy-sky/15 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-wooffy-sky" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-slate-900 truncate">{t("partnersSection.preview.toastTitle")}</p>
                <p className="text-[9px] text-slate-500 truncate">{t("partnersSection.preview.toastBody")}</p>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-wooffy-sky shrink-0" />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes toastLoop {
          0%, 100% { opacity: 0; transform: translateY(12px); }
          10%, 45% { opacity: 1; transform: translateY(0); }
          55% { opacity: 0; transform: translateY(-8px); }
        }
        .animate-toast { animation: toastLoop 6s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

const Tile = ({ icon, iconBg, title, sub }: { icon: string; iconBg: string; title: string; sub: string }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center gap-2">
    <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0 text-sm`}>{icon}</div>
    <div className="min-w-0">
      <p className="text-[11px] font-semibold text-slate-900 leading-tight truncate">{title}</p>
      <p className="text-[9px] text-slate-500 truncate">{sub}</p>
    </div>
  </div>
);

const StatRow = ({ icon, iconBg, label, from, to, delay }: { icon: string; iconBg: string; label: string; from: number; to: number; delay: number }) => (
  <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2">
    <div className={`w-7 h-7 rounded-full ${iconBg} flex items-center justify-center text-xs shrink-0`}>{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-[9px] text-slate-500 truncate">{label}</p>
      <p className="text-sm font-display font-bold tabular-nums text-slate-900">
        <CountUp from={from} to={to} delay={delay} />
      </p>
    </div>
  </div>
);

const CountUp = ({ from, to, delay }: { from: number; to: number; delay: number }) => {
  return (
    <span
      ref={(el) => {
        if (!el || el.dataset.init) return;
        el.dataset.init = "1";
        const animate = () => {
          const start = performance.now() + delay;
          const dur = 1600;
          const tick = (now: number) => {
            const t = Math.max(0, Math.min(1, (now - start) / dur));
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = Math.round(from + (to - from) * eased).toString();
            if (t < 1) requestAnimationFrame(tick);
            else setTimeout(() => { el.textContent = from.toString(); requestAnimationFrame(animate); }, 3500);
          };
          requestAnimationFrame(tick);
        };
        el.textContent = from.toString();
        animate();
      }}
    >
      {from}
    </span>
  );
};

export default PartnersSection;
