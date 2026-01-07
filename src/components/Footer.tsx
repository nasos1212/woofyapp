import { Dog, Mail, Phone, MapPin, Instagram, Facebook, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-wooffy-dark text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4 col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-wooffy-blue/20 rounded-xl flex items-center justify-center">
                <Dog className="w-6 h-6 text-wooffy-sky" />
              </div>
              <span className="font-display font-bold text-xl text-wooffy-sky">Wooffy</span>
            </div>
            <p className="text-white/70 text-sm">
              The ultimate membership for pet lovers. Unlock discounts, connect with community, 
              and make every moment with your pet special.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 sm:w-10 sm:h-10 bg-wooffy-blue/20 rounded-full flex items-center justify-center hover:bg-wooffy-sky hover:text-wooffy-dark transition-colors">
                <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
              <a href="#" className="w-9 h-9 sm:w-10 sm:h-10 bg-wooffy-blue/20 rounded-full flex items-center justify-center hover:bg-wooffy-sky hover:text-wooffy-dark transition-colors">
                <Facebook className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
              <a href="#" className="w-9 h-9 sm:w-10 sm:h-10 bg-wooffy-blue/20 rounded-full flex items-center justify-center hover:bg-wooffy-sky hover:text-wooffy-dark transition-colors">
                <Twitter className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-wooffy-light">Quick Links</h4>
            <ul className="space-y-3 text-sm text-wooffy-light/70">
              <li><a href="#benefits" className="hover:text-wooffy-sky transition-colors">Benefits</a></li>
              <li><a href="#partners" className="hover:text-wooffy-sky transition-colors">Partners</a></li>
              <li><a href="#hub" className="hover:text-wooffy-sky transition-colors">Pet Hub</a></li>
              <li><a href="#pricing" className="hover:text-wooffy-sky transition-colors">Pricing</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-wooffy-light">Support</h4>
            <ul className="space-y-3 text-sm text-wooffy-light/70">
              <li><a href="#" className="hover:text-wooffy-sky transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-wooffy-sky transition-colors">Partner Program</a></li>
              <li><a href="#" className="hover:text-wooffy-sky transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-wooffy-sky transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold mb-4 text-wooffy-light">Contact</h4>
            <ul className="space-y-3 text-sm text-wooffy-light/70">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-wooffy-sky" />
                <a href="mailto:hello@wooffy.app" className="hover:text-wooffy-sky transition-colors">hello@wooffy.app</a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-wooffy-sky" />
                <a href="tel:+35799123456" className="hover:text-wooffy-sky transition-colors">+357 99 123 456</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-wooffy-sky" />
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
