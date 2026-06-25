import { Building2, Store, Dumbbell, Home, Stethoscope, Scissors, Users, TrendingUp, BarChart3, Gift, ArrowRight, Sparkles, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PartnersSection = () => {
  const { t } = useTranslation();

  const categoryConfig = [
    { icon: Store, name: t("partnersSection.cat.petShops") },
    { icon: Stethoscope, name: t("partnersSection.cat.veterinaries") },
    { icon: Dumbbell, name: t("partnersSection.cat.trainers") },
    { icon: Home, name: t("partnersSection.cat.petHotels") },
    { icon: Scissors, name: t("partnersSection.cat.groomers") },
    { icon: Building2, name: t("partnersSection.cat.other") },
  ];

  const benefits = [
    { icon: Users, title: t("partnersSection.benefits.reach.title"), desc: t("partnersSection.benefits.reach.desc") },
    { icon: TrendingUp, title: t("partnersSection.benefits.traffic.title"), desc: t("partnersSection.benefits.traffic.desc") },
    { icon: BarChart3, title: t("partnersSection.benefits.insights.title"), desc: t("partnersSection.benefits.insights.desc") },
    { icon: Gift, title: t("partnersSection.benefits.free.title"), desc: t("partnersSection.benefits.free.desc") },
  ];

  return (
    <section id="partners" className="py-20 lg:py-28 bg-gradient-to-b from-background via-amber-50/40 to-background dark:via-amber-950/10 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-soft border border-border mb-6">
            <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-muted-foreground">{t("partnersSection.badge")}</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
            {t("partnersSection.title")}
          </h2>
          <p className="text-lg text-muted-foreground">{t("partnersSection.description")}</p>
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
                className="bg-card rounded-2xl p-5 shadow-soft border border-border hover:shadow-card hover:border-amber-500/30 transition-all duration-300 flex gap-4"
              >
                <div className="w-11 h-11 shrink-0 bg-amber-500/10 rounded-xl flex items-center justify-center">
                  <b.icon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-1">{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <p className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider mb-5">
          {t("partnersSection.categoriesLabel")}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10 max-w-5xl mx-auto">
          {categoryConfig.map((category) => (
            <div
              key={category.name}
              className="bg-card rounded-xl p-3 text-center shadow-soft border border-border hover:border-amber-500/30 transition-all duration-300"
            >
              <div className="w-10 h-10 bg-foreground/5 rounded-lg flex items-center justify-center mx-auto mb-2">
                <category.icon className="w-5 h-5 text-foreground/70" />
              </div>
              <p className="text-xs font-medium text-foreground">{category.name}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button asChild size="lg" className="rounded-full px-8 bg-amber-500 hover:bg-amber-600 text-white">
            <Link to="/partner-register">
              {t("partnersSection.cta")}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground mt-3">{t("partnersSection.ctaHelp")}</p>
        </div>
      </div>
    </section>
  );
};

const DashboardPreview = ({ t }: { t: (k: string) => string }) => {
  return (
    <div className="relative">
      {/* Soft glow */}
      <div className="absolute -inset-4 bg-gradient-to-br from-amber-300/30 via-amber-200/10 to-transparent rounded-3xl blur-2xl" aria-hidden />

      {/* Browser frame */}
      <div className="relative bg-card rounded-2xl shadow-card border border-border overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
          </div>
          <div className="ml-3 flex-1 text-[11px] text-muted-foreground font-mono truncate">
            wooffy.app/business
          </div>
        </div>

        {/* Dashboard body */}
        <div className="p-5 space-y-4 bg-gradient-to-br from-background to-muted/30 min-h-[380px]">
          {/* Greeting */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{t("partnersSection.preview.welcome")}</p>
              <p className="font-display font-semibold text-foreground">Bark & Bone Cafe</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-green-500/10 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {t("partnersSection.preview.live")}
            </span>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-3 gap-2">
            <KpiCard label={t("partnersSection.preview.views")} from={120} to={847} delay={0} />
            <KpiCard label={t("partnersSection.preview.redemptions")} from={4} to={32} delay={400} accent />
            <KpiCard label={t("partnersSection.preview.newCustomers")} from={2} to={18} delay={800} />
          </div>

          {/* Chart */}
          <div className="bg-card border border-border rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-foreground">{t("partnersSection.preview.weekly")}</p>
              <span className="text-[10px] text-green-600 dark:text-green-400 font-semibold">+24%</span>
            </div>
            <Sparkline />
          </div>

          {/* Live redemption toast */}
          <div className="relative h-14">
            <div className="absolute inset-x-0 bottom-0 bg-card border border-amber-500/30 rounded-xl p-3 flex items-center gap-3 shadow-soft animate-toast">
              <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{t("partnersSection.preview.toastTitle")}</p>
                <p className="text-[10px] text-muted-foreground truncate">{t("partnersSection.preview.toastBody")}</p>
              </div>
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
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
        @keyframes countUp { from { --num: var(--from); } to { --num: var(--to); } }
        @keyframes barRise { from { transform: scaleY(0.1); } to { transform: scaleY(1); } }
        .bar { transform-origin: bottom; animation: barRise 1.2s cubic-bezier(.2,.8,.2,1) both; }
      `}</style>
    </div>
  );
};

const KpiCard = ({ label, from, to, delay, accent }: { label: string; from: number; to: number; delay: number; accent?: boolean }) => {
  return (
    <div className={`rounded-xl p-3 border ${accent ? "bg-amber-500/10 border-amber-500/30" : "bg-card border-border"}`}>
      <p className="text-[10px] text-muted-foreground mb-1 truncate">{label}</p>
      <p className={`text-lg font-display font-bold tabular-nums ${accent ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
        <CountUp from={from} to={to} delay={delay} />
      </p>
    </div>
  );
};

const CountUp = ({ from, to, delay }: { from: number; to: number; delay: number }) => {
  // Pure CSS-keyframe-driven count using a CSS variable trick via animationFillMode
  // Fallback to plain JS interval for cross-browser support
  const id = `cu-${from}-${to}-${delay}`;
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
      data-id={id}
    >
      {from}
    </span>
  );
};

const Sparkline = () => {
  const bars = [30, 42, 38, 55, 48, 70, 92];
  return (
    <div className="flex items-end gap-1.5 h-14">
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 bar rounded-t-md bg-gradient-to-t from-primary/40 to-primary"
          style={{ height: `${h}%`, animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
};

export default PartnersSection;
