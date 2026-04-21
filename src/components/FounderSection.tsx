import { Heart } from "lucide-react";
import founderImage from "@/assets/founder-klodiana.jpg";
import { useTranslation } from "react-i18next";

const FounderSection = () => {
  const { t } = useTranslation();
  return (
    <section className="py-20 lg:py-32 bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-soft border border-border mb-6">
            <Heart className="w-4 h-4 text-primary fill-primary" />
            <span className="text-sm font-medium text-muted-foreground">{t("founder.badge")}</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground">
            {t("founder.title")}
          </h2>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-5 gap-10 items-center">
          <div className="md:col-span-2 flex justify-center">
            <div className="relative">
              <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden shadow-card border-4 border-primary/20 rotate-2 hover:rotate-0 transition-transform duration-500">
                <img
                  src={founderImage}
                  alt="Klodiana Koutsouki, founder of Wooffy, with her dog Kobe"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-card rounded-2xl px-4 py-2 shadow-card border border-border">
                <p className="font-display font-bold text-sm text-foreground">Klodiana & Kobe</p>
                <p className="text-xs text-muted-foreground">{t("founder.tag")}</p>
              </div>
            </div>
          </div>

          <div className="md:col-span-3 space-y-5">
            <p className="text-lg text-foreground font-medium">{t("founder.hello")}</p>
            <p className="text-muted-foreground leading-relaxed">{t("founder.p1")}</p>
            <p className="text-muted-foreground leading-relaxed">{t("founder.p2")}</p>
            <p className="text-muted-foreground leading-relaxed">{t("founder.p3")}</p>
            <p className="text-muted-foreground leading-relaxed">{t("founder.p4")}</p>
            <p className="text-lg text-foreground font-medium">{t("founder.see")}</p>
            <p className="font-display font-semibold text-primary">— Klodiana Koutsouki</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FounderSection;
