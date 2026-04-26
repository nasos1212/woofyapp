import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import DogLoader from "@/components/DogLoader";
import ContactPopover from "@/components/ContactPopover";
import { useTranslation, Trans } from "react-i18next";

const VerifyEmail = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [userRole, setUserRole] = useState<string>("member");

  const verifyingRef = useRef(false);

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (!token) {
      setStatus("no-token");
      return;
    }

    if (verifyingRef.current) return;
    verifyingRef.current = true;

    const verifyToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-email-token", {
          body: { token }
        });

        if (error) {
          console.error("Verification error:", error);
          setStatus("error");
          setErrorMessage(t("verifyEmail.failedFallback"));
          return;
        }

        if (data?.success) {
          setStatus("success");
          setVerifiedEmail(data.email || "");
          setUserRole(data.role || "member");
        } else {
          setStatus("error");
          setErrorMessage(data?.error || t("verifyEmail.failedExpired"));
        }
      } catch (err) {
        console.error("Verification exception:", err);
        setStatus("error");
        setErrorMessage(t("verifyEmail.errorGeneric"));
      }
    };

    verifyToken();
  }, [searchParams, t]);

  const getRoleMessage = () => {
    switch (userRole) {
      case "business":
        return t("verifyEmail.roleBusiness");
      case "shelter":
        return t("verifyEmail.roleShelter");
      default:
        return t("verifyEmail.roleMember");
    }
  };

  const getCtaLabel = () => {
    switch (userRole) {
      case "business":
        return t("verifyEmail.ctaBusiness");
      case "shelter":
        return t("verifyEmail.ctaShelter");
      default:
        return t("verifyEmail.ctaMember");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-wooffy-dark via-wooffy-dark to-wooffy-purple flex items-center justify-center p-4">
        <div className="text-center">
          <DogLoader size="lg" />
          <p className="mt-4 text-wooffy-sky text-lg">{t("verifyEmail.verifying")}</p>
        </div>
      </div>
    );
  }

  if (status === "no-token") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-wooffy-dark via-wooffy-dark to-wooffy-purple flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center mx-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-7 h-7 sm:w-8 sm:h-8 text-amber-600" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{t("verifyEmail.checkTitle")}</h1>
          <p className="text-muted-foreground text-sm sm:text-base mb-6">
            {t("verifyEmail.checkDesc")}
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            {t("verifyEmail.checkSpam")}
          </p>
          <Button onClick={() => navigate("/auth")} className="w-full">
            {t("verifyEmail.backToLogin")}
          </Button>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-wooffy-dark via-wooffy-dark to-wooffy-purple flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("verifyEmail.failedTitle")}</h1>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <div className="space-y-3">
            <Button onClick={() => navigate("/auth")} className="w-full">
              {t("verifyEmail.backToLogin")}
            </Button>
            <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
              {t("verifyEmail.needHelp")}{" "}
              <ContactPopover 
                triggerText={t("verifyEmail.contactUs")}
                asLink 
                triggerClassName="text-wooffy-purple"
              />
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-wooffy-dark via-wooffy-dark to-wooffy-purple flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("verifyEmail.successTitle")}</h1>
        <p className="text-gray-600 mb-2">
          {verifiedEmail ? (
            <Trans
              i18nKey="verifyEmail.verifiedWithEmail"
              values={{ email: verifiedEmail }}
              components={{ 1: <span className="font-medium" /> }}
            />
          ) : (
            t("verifyEmail.verifiedNoEmail")
          )}
        </p>
        <p className="text-gray-500 text-sm mb-6">
          {getRoleMessage()}
        </p>
        <Button 
          onClick={() => navigate("/auth")} 
          className="w-full bg-gradient-to-r from-wooffy-dark to-wooffy-purple hover:opacity-90 text-base py-5"
          size="lg"
        >
          {getCtaLabel()}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        {(userRole === "business" || userRole === "shelter") && (
          <p className="text-xs text-gray-400 mt-3">
            {t("verifyEmail.savedNote")}
          </p>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
