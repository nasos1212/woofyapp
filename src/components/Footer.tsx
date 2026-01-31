import { Link, useLocation } from "react-router-dom";
import { Dog, Mail, Phone, MapPin, Instagram, Facebook, Twitter, Copy } from "lucide-react";
import { toast } from "sonner";

const Footer = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  const scrollToSection = (sectionId: string) => {
    if (isHomePage) {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = `/#${sectionId}`;
    }
  };

  const handleEmailClick = async (e: React.MouseEvent) => {
    // Try mailto: first, but also copy to clipboard as fallback
    try {
      await navigator.clipboard.writeText("hello@wooffy.app");
      toast.success("Email copied to clipboard!");
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
              <span className="font-display font-bold text-xl text-wooffy-sky">Wooffy</span>
            </Link>
            <p className="text-white/70 text-sm">
              The ultimate membership for pet lovers. Unlock discounts, connect with community, 
              and make every moment with your pet special.
            </p>
            <div className="flex gap-3">
              <a href="https://instagram.com/wooffy" target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-10 sm:h-10 bg-wooffy-blue/20 rounded-full flex items-center justify-center hover:bg-wooffy-sky hover:text-wooffy-dark transition-colors">
                <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
              <a href="https://facebook.com/wooffy" target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-10 sm:h-10 bg-wooffy-blue/20 rounded-full flex items-center justify-center hover:bg-wooffy-sky hover:text-wooffy-dark transition-colors">
                <Facebook className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
              <a href="https://twitter.com/wooffy" target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-10 sm:h-10 bg-wooffy-blue/20 rounded-full flex items-center justify-center hover:bg-wooffy-sky hover:text-wooffy-dark transition-colors">
                <Twitter className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-wooffy-light">Quick Links</h4>
            <ul className="space-y-3 text-sm text-wooffy-light/70">
              <li><button onClick={() => scrollToSection("benefits")} className="hover:text-wooffy-sky transition-colors">Benefits</button></li>
              <li><button onClick={() => scrollToSection("partners")} className="hover:text-wooffy-sky transition-colors">Partners</button></li>
              <li><button onClick={() => scrollToSection("hub")} className="hover:text-wooffy-sky transition-colors">Pet Hub</button></li>
              <li><button onClick={() => scrollToSection("pricing")} className="hover:text-wooffy-sky transition-colors">Pricing</button></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-wooffy-light">Support</h4>
            <ul className="space-y-3 text-sm text-wooffy-light/70">
              <li><a href="mailto:hello@wooffy.app?subject=Help Request" className="hover:text-wooffy-sky transition-colors">Help Center</a></li>
              <li><Link to="/partner-register" className="hover:text-wooffy-sky transition-colors">Partner Program</Link></li>
              <li><a href="mailto:hello@wooffy.app?subject=Privacy Policy Inquiry" className="hover:text-wooffy-sky transition-colors">Privacy Policy</a></li>
              <li><a href="mailto:hello@wooffy.app?subject=Terms of Service Inquiry" className="hover:text-wooffy-sky transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-wooffy-light">Contact</h4>
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
              <li>
                <a href="tel:+35799123456" className="flex items-center gap-2 py-2 hover:text-wooffy-sky transition-colors">
                  <Phone className="w-4 h-4 text-wooffy-sky flex-shrink-0" />
                  <span>+357 99 123 456</span>
                </a>
              </li>
              <li className="flex items-start gap-2 py-2">
                <MapPin className="w-4 h-4 mt-0.5 text-wooffy-sky flex-shrink-0" />
                <span>Cyprus</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-wooffy-blue/30 text-center text-sm text-wooffy-light/50">
          <p>© 2026 Wooffy. Made with ❤️ for pet lovers everywhere.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
