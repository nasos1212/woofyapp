import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Dog, Mail, MapPin, Copy } from "lucide-react";
import { InstagramIcon, TikTokIcon } from "./SocialIcons";
import { toast } from "sonner";
import AffiliateInquiryDialog from "./AffiliateInquiryDialog";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const [showAffiliateDialog, setShowAffiliateDialog] = useState(false);
  const { t } = useTranslation();

  const scrollToSection = (sectionId: string) => {
    if (isHomePage) {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = `/#${sectionId}`;
    }
  };

  const handleEmailClick = async (e: React.MouseEvent) => {
    try {
      await navigator.clipboard.writeText("hello@wooffy.app");
      toast.success(t("footer.emailCopied"));
    } catch {
      // Clipboard failed, mailto: should still work
    }
  };

  return (
    <footer className="bg-wooffy-dark text-white py-16 relative z-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4 col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-wooffy-blue/20 rounded-xl flex items-center justify-center">
                <Dog className="w-6 h-6 text-wooffy-sky" />
              </div>
              <span className="font-logo font-bold text-xl text-wooffy-sky">Wooffy</span>
            </Link>
            <p className="text-white/70 text-sm">
              {t("footer.tagline")}
            </p>
            <div className="flex gap-3">
              <a href="https://www.instagram.com/wooffyapp" target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-10 sm:h-10 bg-wooffy-blue/20 rounded-full flex items-center justify-center hover:bg-wooffy-sky hover:text-wooffy-dark transition-colors">
                <InstagramIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
              <a href="https://www.tiktok.com/@wooffyapp" target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-10 sm:h-10 bg-wooffy-blue/20 rounded-full flex items-center justify-center hover:bg-wooffy-sky hover:text-wooffy-dark transition-colors">
                <TikTokIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-wooffy-light">{t("footer.quickLinks")}</h4>
            <ul className="space-y-3 text-sm text-wooffy-light/70">
              <li><button onClick={() => scrollToSection("benefits")} className="text-left hover:text-wooffy-sky transition-colors">{t("header.benefits")}</button></li>
              <li><button onClick={() => scrollToSection("partners")} className="text-left hover:text-wooffy-sky transition-colors">{t("partnersSection.badge")}</button></li>
              <li><button onClick={() => scrollToSection("shelters")} className="text-left hover:text-wooffy-sky transition-colors">{t("header.shelters")}</button></li>
              <li><button onClick={() => scrollToSection("freemium")} className="text-left hover:text-wooffy-sky transition-colors">{t("header.pricing")}</button></li>
              <li><button onClick={() => scrollToSection("get-listed")} className="text-left hover:text-wooffy-sky transition-colors">{t("header.dogFriendlyPlaces")}</button></li>
              <li><Link to="/blog" className="block text-left hover:text-wooffy-sky transition-colors">{t("header.blog")}</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-wooffy-light">{t("footer.support")}</h4>
            <ul className="space-y-3 text-sm text-wooffy-light/70">
              <li><button onClick={() => setShowAffiliateDialog(true)} className="text-left hover:text-wooffy-sky transition-colors">{t("footer.affiliate")}</button></li>
              <li><Link to="/terms#privacy-policy" className="block text-left hover:text-wooffy-sky transition-colors">{t("footer.privacy")}</Link></li>
              <li><Link to="/terms" className="block text-left hover:text-wooffy-sky transition-colors">{t("footer.terms")}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-wooffy-light">{t("footer.contact")}</h4>
            <ul className="space-y-1 text-sm text-wooffy-light/70">
              <li>
                <a 
                  href="mailto:hello@wooffy.app" 
                  onClick={handleEmailClick}
                  className="flex items-center gap-2 py-3 hover:text-wooffy-sky transition-colors touch-manipulation"
                >
                  <Mail className="w-5 h-5 text-wooffy-sky flex-shrink-0" />
                  <span className="underline">hello@wooffy.app</span>
                  <Copy className="w-4 h-4 text-wooffy-sky/50 ml-auto" />
                </a>
              </li>
              <li className="flex items-start gap-2 py-2">
                <MapPin className="w-4 h-4 mt-0.5 text-wooffy-sky flex-shrink-0" />
                <span>{t("footer.country")}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-wooffy-blue/30 text-center text-sm text-wooffy-light/50">
          <p>{t("footer.copyright")}</p>
        </div>
      </div>

      <AffiliateInquiryDialog open={showAffiliateDialog} onOpenChange={setShowAffiliateDialog} />
    </footer>
  );
};

export default Footer;
