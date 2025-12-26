import { useState } from "react";
import { Link } from "react-router-dom";
import { Dog, Menu, X, Building2, User } from "lucide-react";
import { Button } from "./ui/button";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: "Benefits", href: "#benefits" },
    { name: "Partners", href: "#partners" },
    { name: "Shelters", href: "#shelters" },
    { name: "Hub", href: "#hub" },
    { name: "Pricing", href: "#pricing" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-hero rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Dog className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">PawPass</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="font-medium text-muted-foreground hover:text-primary transition-colors duration-300"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/business">
              <Button variant="ghost" size="sm" className="gap-2">
                <Building2 className="w-4 h-4" />
                For Business
              </Button>
            </Link>
            <Link to="/member">
              <Button variant="outline" size="sm" className="gap-2">
                <User className="w-4 h-4" />
                My Account
              </Button>
            </Link>
            <Button variant="hero" size="default">Join Now</Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-card border-b border-border animate-slide-up">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="font-medium text-foreground hover:text-primary transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              <Link to="/member" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <User className="w-4 h-4" />
                  My Account
                </Button>
              </Link>
              <Link to="/business" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Building2 className="w-4 h-4" />
                  For Business
                </Button>
              </Link>
              <Button variant="hero">Join Now</Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
