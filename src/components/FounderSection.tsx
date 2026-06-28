import { Heart } from "lucide-react";
import founderImage from "@/assets/founder-klodiana.jpg";
import { useTranslation } from "react-i18next";

const FounderSection = () => {
  const { t } = useTranslation();
  return (
    <section className="py-20 lg:py-28 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 bg-wooffy-sky/15 rounded-full px-4 py-2 border border-wooffy-sky/30 mb-6">
            <Heart className="w-4 h-4 text-wooffy-blue fill-wooffy-blue" />
            <span className="text-sm font-medium text-wooffy-dark">{t("founder.badge")}</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground">
            {t("founder.title")}
          </h2>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-5 gap-10 items-center">
          <div className="md:col-span-2 flex justify-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-wooffy-sky/20 via-wooffy-blue/10 to-transparent rounded-3xl blur-2xl" aria-hidden />
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden border border-wooffy-sky/40 rotate-2 hover:rotate-0 transition-transform duration-500">
                <img
                  src={founderImage}
                  alt="Klodiana Koutsouki, founder of Wooffy, with her dog Kobe"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-wooffy-sky/15 backdrop-blur-md rounded-2xl px-4 py-2 border border-wooffy-sky/30">
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
            <p className="font-display font-semibold text-wooffy-blue">— Klodiana Koutsouki</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FounderSection;
