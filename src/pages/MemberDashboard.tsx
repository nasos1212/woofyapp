import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, Gift, MapPin, Calendar, Clock, Percent, QrCode, Shield, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import MembershipCardFull from "@/components/MembershipCardFull";

const recentDeals = [
  { business: "Happy Paws Pet Shop", discount: "15% off", used: "2 days ago", saved: "€12.50" },
  { business: "Woof & Wag Grooming", discount: "Free nail trim", used: "1 week ago", saved: "€15.00" },
  { business: "Pet Paradise Hotel", discount: "10% off", used: "2 weeks ago", saved: "€45.00" },
];

const nearbyOffers = [
  { business: "Bark & Brew Café", distance: "0.3 km", offer: "Free puppuccino" },
  { business: "Canine Academy", distance: "1.2 km", offer: "20% off classes" },
  { business: "PetMed Clinic", distance: "2.1 km", offer: "Free checkup" },
];

const MemberDashboard = () => {
  return (
    <>
      <Helmet>
        <title>My PawPass Dashboard | Member Area</title>
        <meta name="description" content="Access your PawPass membership card, view savings, and discover nearby pet deals." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-paw-cream to-background">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-muted rounded-full transition-colors">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
              </button>
              <div className="w-10 h-10 bg-gradient-hero rounded-full flex items-center justify-center text-white font-medium">
                JS
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              Welcome back, John! 👋
            </h1>
            <p className="text-muted-foreground">Here's your PawPass membership overview</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Card & Stats */}
            <div className="lg:col-span-2 space-y-8">
              {/* Membership Card */}
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-primary" />
                  Your Membership Card
                </h2>
                <MembershipCardFull 
                  memberName="John Smith"
                  petName="Max"
                  memberId="PP-2024-8472-1653"
                  expiryDate="Dec 25, 2025"
                  memberSince="2024"
                />
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Show this QR code at any partner business to redeem your discounts
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-4 shadow-soft">
                  <div className="text-2xl font-display font-bold text-primary">€247</div>
                  <p className="text-sm text-muted-foreground">Total Saved</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-soft">
                  <div className="text-2xl font-display font-bold text-paw-gold">18</div>
                  <p className="text-sm text-muted-foreground">Deals Used</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-soft">
                  <div className="text-2xl font-display font-bold text-green-500">342</div>
                  <p className="text-sm text-muted-foreground">Days Left</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-soft">
                  <div className="text-2xl font-display font-bold text-rose-500">€5.90</div>
                  <p className="text-sm text-muted-foreground">To Shelters</p>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-2xl p-6 shadow-soft">
                <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  {recentDeals.map((deal, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                      <div>
                        <p className="font-medium text-foreground">{deal.business}</p>
                        <p className="text-sm text-muted-foreground">{deal.discount} • {deal.used}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-green-500 font-semibold">{deal.saved}</span>
                        <p className="text-xs text-muted-foreground">saved</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Nearby & Info */}
            <div className="space-y-6">
              {/* Membership Status */}
              <div className="bg-gradient-hero rounded-2xl p-6 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">Active Membership</span>
                </div>
                <p className="text-white/80 text-sm mb-4">
                  Your membership is valid until <strong>December 25, 2025</strong>
                </p>
                <Button variant="secondary" size="sm" className="w-full bg-white text-primary hover:bg-white/90">
                  Renew Early & Save 10%
                </Button>
              </div>

              {/* Nearby Offers */}
              <div className="bg-white rounded-2xl p-6 shadow-soft">
                <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Nearby Offers
                </h3>
                <div className="space-y-4">
                  {nearbyOffers.map((offer, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors cursor-pointer">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Percent className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">{offer.business}</p>
                        <p className="text-xs text-muted-foreground">{offer.distance} away</p>
                      </div>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {offer.offer}
                      </span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  View All Partners
                </Button>
              </div>

              {/* Pet Profile */}
              <div className="bg-white rounded-2xl p-6 shadow-soft">
                <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  Your Pets
                </h3>
                <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-xl">
                  <div className="w-14 h-14 bg-paw-gold/20 rounded-full flex items-center justify-center text-2xl">
                    🐕
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Max</p>
                    <p className="text-sm text-muted-foreground">Golden Retriever • 3 years</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-4 text-primary">
                  + Add Another Pet
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default MemberDashboard;
