import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Mail, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import DogLoader from "@/components/DogLoader";
import ContactPopover from "@/components/ContactPopover";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (!token) {
      setStatus("no-token");
      return;
    }

    const verifyToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-email-token", {
          body: { token }
        });

        if (error) {
          console.error("Verification error:", error);
          setStatus("error");
          setErrorMessage("Failed to verify email. Please try again.");
          return;
        }

        if (data?.success) {
          setStatus("success");
          setVerifiedEmail(data.email || "");
        } else {
          setStatus("error");
          setErrorMessage(data?.error || "Verification failed. The link may be expired or invalid.");
        }
      } catch (err) {
        console.error("Verification exception:", err);
        setStatus("error");
        setErrorMessage("Something went wrong. Please try again.");
      }
    };

    verifyToken();
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-wooffy-dark via-wooffy-dark to-wooffy-purple flex items-center justify-center p-4">
        <div className="text-center">
          <DogLoader size="lg" />
          <p className="mt-4 text-wooffy-sky text-lg">Verifying your email...</p>
        </div>
      </div>
    );
  }

  if (status === "no-token") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-wooffy-dark via-wooffy-dark to-wooffy-purple flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
          <p className="text-gray-600 mb-6">
            We've sent you a verification link. Please check your inbox and click the link to verify your email.
          </p>
          <Button onClick={() => navigate("/auth")} className="w-full">
            Back to Login
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <div className="space-y-3">
            <Button onClick={() => navigate("/auth")} className="w-full">
              Back to Login
            </Button>
            <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
              Need help?{" "}
              <ContactPopover 
                triggerText="Contact us" 
                asLink 
                triggerClassName="text-wooffy-purple"
              />
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen bg-gradient-to-br from-wooffy-dark via-wooffy-dark to-wooffy-purple flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified! 🎉</h1>
        <p className="text-gray-600 mb-6">
          {verifiedEmail ? (
            <>Your email <span className="font-medium">{verifiedEmail}</span> has been verified successfully.</>
          ) : (
            "Your email has been verified successfully."
          )}
        </p>
        <Button 
          onClick={() => navigate("/auth")} 
          className="w-full bg-gradient-to-r from-wooffy-dark to-wooffy-purple hover:opacity-90"
        >
          Continue to Login
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default VerifyEmail;
