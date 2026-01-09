import { ArrowRight, Sparkles, Heart, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import MembershipCard from "./MembershipCard";
import heroImage from "@/assets/hero-dog.jpg";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  const handleGetPass = () => {
    navigate("/auth?type=member");
  };

  const handleExploreBenefits = () => {
    document.getElementById("benefits")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen pt-24 pb-16 overflow-hidden">
      {/* Background image with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      {/* Background decorations */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-wooffy-soft rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-wooffy-light rounded-full blur-3xl opacity-60" />
      
      {/* Animated paw prints */}
      <div className="absolute top-32 left-[5%] text-4xl opacity-20 animate-bounce-slow" style={{ animationDelay: '0s' }}>🐾</div>
      <div className="absolute top-48 right-[8%] text-3xl opacity-15 animate-bounce-slow" style={{ animationDelay: '0.5s' }}>🐾</div>
      <div className="absolute top-[60%] left-[3%] text-2xl opacity-20 animate-bounce-slow" style={{ animationDelay: '1s' }}>🐾</div>
      <div className="absolute bottom-32 right-[5%] text-4xl opacity-15 animate-bounce-slow" style={{ animationDelay: '1.5s' }}>🐾</div>
      <div className="absolute top-[40%] right-[15%] text-2xl opacity-10 animate-bounce-slow hidden lg:block" style={{ animationDelay: '0.7s' }}>🐾</div>
      <div className="absolute bottom-[45%] left-[12%] text-3xl opacity-15 animate-bounce-slow hidden lg:block" style={{ animationDelay: '1.2s' }}>🐾</div>
      
      {/* Floating bone decorations */}
      <div className="absolute top-24 right-[20%] text-2xl opacity-15 animate-float hidden md:block" style={{ animationDelay: '0.3s' }}>🦴</div>
      <div className="absolute bottom-40 left-[18%] text-xl opacity-20 animate-float hidden md:block" style={{ animationDelay: '0.8s' }}>🦴</div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="text-center lg:text-left space-y-8">
            <div className="inline-flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-soft border border-border">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">The Ultimate Pet Owner Membership</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight">
              Unlock a World of{" "}
              <span className="text-gradient">Pet Perks</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
              Join 10,000+ happy pet parents. Get exclusive discounts at pet shops, trainers, hotels & more. 
              Plus access our community hub for tips, events & connections.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-8 py-4">
              <div className="text-center lg:text-left">
                <p className="font-display font-bold text-3xl text-foreground">500+</p>
                <p className="text-sm text-muted-foreground">Partner Businesses</p>
              </div>
              <div className="text-center lg:text-left">
                <p className="font-display font-bold text-3xl text-foreground">€2,000+</p>
                <p className="text-sm text-muted-foreground">Avg. Yearly Savings</p>
              </div>
              <div className="text-center lg:text-left">
                <p className="font-display font-bold text-3xl text-foreground">10k+</p>
                <p className="text-sm text-muted-foreground">Happy Members</p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="xl" className="group" onClick={handleGetPass}>
                Get Your Wooffy Pass
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="heroOutline" size="xl" onClick={handleExploreBenefits}>
                Explore Benefits
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-4 justify-center lg:justify-start text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-destructive" />
                <span>Loved by pet parents</span>
              </div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Partners across Europe</span>
              </div>
            </div>
          </div>

          {/* Card */}
          <div className="relative">
            <div className="animate-float">
              <MembershipCard />
            </div>
            
            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 bg-card rounded-2xl p-4 shadow-card border border-border animate-bounce-slow hidden lg:block">
              <p className="font-display font-bold text-2xl text-primary">€59</p>
              <p className="text-xs text-muted-foreground">/year</p>
            </div>
            
            <div className="absolute -bottom-4 -left-4 bg-card rounded-2xl px-4 py-3 shadow-card border border-border hidden lg:flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-lg">✓</span>
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">Try it today - wooff!</p>
                <p className="text-xs text-muted-foreground">Join the pack</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;