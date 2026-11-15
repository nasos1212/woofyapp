import { scrollToTop } from "@/lib/scroll";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { useTranslation } from "react-i18next";

const CheckoutReturn = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    scrollToTop();
  }, []);

  return (
    <>
      <Helmet>
        <title>{t("checkoutReturn.title")}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-wooffy-light to-background">
        <Header />
        <main className="container mx-auto px-4 py-12 pt-[calc(6rem+env(safe-area-inset-top))]">
          <div className="max-w-lg mx-auto bg-card rounded-3xl p-8 shadow-card border border-border text-center">
            {sessionId ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-9 h-9 text-green-600" />
                </div>
                <h1 className="text-2xl font-display font-bold mb-3">
                  {t("checkoutReturn.successTitle")}
                </h1>
                <p className="text-muted-foreground mb-6">
                  {t("checkoutReturn.successBody")}
                </p>
                <Button asChild className="w-full">
                  <Link to="/member">
                    {t("checkoutReturn.goToDashboard")}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-display font-bold mb-3">
                  {t("checkoutReturn.noSessionTitle")}
                </h1>
                <p className="text-muted-foreground mb-6">
                  {t("checkoutReturn.noSessionBody")}
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/member">{t("checkoutReturn.backToDashboard")}</Link>
                </Button>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default CheckoutReturn;
