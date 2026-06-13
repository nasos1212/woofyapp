import { ArrowRight, Search, MapPin, Heart, Building2, PiggyBank } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import MembershipCard from "./MembershipCard";
import MemberJourneyCarousel from "./MemberJourneyCarousel";
import heroImage from "@/assets/hero-dog.jpg";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cyprusCitiesWithCoords } from "@/data/cyprusLocations";

const HeroSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [city, setCity] = useState<string>("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    navigate(`/member/pet-friendly-places${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <section className="relative min-h-screen pt-[calc(4.5rem+env(safe-area-inset-top))] sm:pt-[calc(6rem+env(safe-area-inset-top))] pb-8 sm:pb-16 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute top-20 left-10 w-72 h-72 bg-wooffy-soft rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-wooffy-light rounded-full blur-3xl opacity-25" />

      <div className="absolute top-32 left-[5%] text-3xl opacity-20 animate-bounce-slow">🐾</div>
      <div className="absolute bottom-32 right-[5%] text-3xl opacity-15 animate-bounce-slow" style={{ animationDelay: '1.5s' }}>🐾</div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* LEFT: search-first */}
          <div className="text-center lg:text-left space-y-6 sm:space-y-8 relative z-10">
            <h1 className="text-[2.25rem] leading-tight sm:text-5xl lg:text-6xl font-display font-bold text-foreground">
              {t("hero.titlePart1") /* fallback only if needed */}
              <span className="block">
                Find <span className="text-gradient">dog-friendly places</span> near you
              </span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0">
              Search parks, cafés, hotels and more across Cyprus.
            </p>

            {/* Search bar */}
            <div className="bg-card rounded-2xl shadow-card border border-border p-2 flex flex-col sm:flex-row gap-2 max-w-xl mx-auto lg:mx-0">
              <div className="flex-1 flex items-center gap-2 px-3">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="border-0 shadow-none focus:ring-0 h-12 text-base px-0">
                    <SelectValue placeholder="Choose a city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cyprusCitiesWithCoords.map((c) => (
                      <SelectItem key={c.name} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="hero"
                size="lg"
                className="h-12 px-6 group"
                onClick={handleSearch}
              >
                <Search className="w-4 h-4 mr-2" />
                Search
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Targets stats */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-card to-primary/10 rounded-2xl p-4 sm:p-6 shadow-soft border border-primary/20">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-card/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center border border-border">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <p className="font-display font-bold text-xl sm:text-2xl text-foreground">100+</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{t("hero.partnerBusinesses")}</p>
                </div>
                <div className="bg-card/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center border border-border">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <p className="font-display font-bold text-xl sm:text-2xl text-foreground">€200+</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{t("hero.yearlySavings")}</p>
                </div>
                <div className="bg-card/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center border border-border">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <p className="font-display font-bold text-xl sm:text-2xl text-foreground">5+</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{t("hero.sheltersSupported")}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 justify-center lg:justify-start text-sm text-muted-foreground">
              <button
                onClick={() => navigate("/auth")}
                className="text-primary font-semibold hover:underline"
              >
                Join free →
              </button>
              <span className="w-1 h-1 bg-muted-foreground rounded-full" />
              <a
                href="#get-listed"
                className="hover:text-primary transition-colors"
              >
                List your place
              </a>
            </div>
          </div>

          {/* RIGHT: membership card */}
          <div className="relative mt-4 lg:mt-0">
            <div className="animate-float">
              <MembershipCard />
            </div>
          </div>
        </div>

        <div className="mt-24 max-w-3xl mx-auto">
          <MemberJourneyCarousel />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
