import { 
  MapPin, 
  Users, 
  Heart,
  Stethoscope,
  Dog,
  Percent,
  Home,
  Search,
  Bot
} from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

const freeFeatures = [
  {
    icon: MapPin,
    title: "Dog-Friendly Directory",
    description: "Find dog-friendly cafés, restaurants, parks and hidden gems near you.",
    emoji: "📍",
  },
  {
    icon: Search,
    title: "Lost & Found Alerts",
    description: "Report and search for lost or found pets in your area.",
    emoji: "🔍",
  },
  {
    icon: Users,
    title: "Community Q&A",
    description: "Connect with fellow pet parents. Share tips, ask questions, and help each other.",
    emoji: "💬",
  },
  {
    icon: Dog,
    title: "Pet Profiles",
    description: "Create detailed profiles for all your pets with photos, breed info and birthdays.",
    emoji: "🐾",
  },
];

const premiumFeatures = [
  {
    icon: Percent,
    title: "Exclusive Discounts",
    description: "Save at pet shops, trainers, groomers, hotels and more with your membership card.",
    emoji: "💰",
  },
  {
    icon: Stethoscope,
    title: "Pet Health Records",
    description: "Track vaccinations, appointments and vet visits. Plus discounts on vet care.",
    emoji: "🏥",
  },
  {
    icon: Dog,
    title: "Pet Profiles",
    description: "Create detailed profiles for all your pets with photos, breed info and birthdays.",
    emoji: "🐾",
  },
  {
    icon: Bot,
    title: "AI Health Assistant",
    description: "Get instant guidance on pet health questions powered by AI — available 24/7.",
    emoji: "🤖",
  },
  {
    icon: Home,
    title: "Pet Hotel Benefits",
    description: "Special rates and perks at partner pet hotels and boarding facilities.",
    emoji: "🏨",
  },
];

const BenefitsSection = () => {
  const navigate = useNavigate();

  return (
    <section id="benefits" className="py-20 lg:py-32 bg-gradient-warm">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-soft border border-border mb-6">
            <Heart className="w-4 h-4 text-primary fill-primary" />
            <span className="text-sm font-medium text-muted-foreground">Everything You Get with Wooffy</span>
          </span>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6">
            Built for Pet Parents Like You
          </h2>
          
          <p className="text-lg text-muted-foreground">
            Start free with powerful tools, then upgrade to unlock exclusive discounts and premium features.
          </p>
        </div>

        {/* Free Tier */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-700 dark:text-green-400 rounded-full px-4 py-1.5 text-sm font-bold">
              ✨ Free Forever
            </span>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {freeFeatures.map((feature) => (
              <div
                key={feature.title}
                className="group bg-card rounded-2xl p-6 shadow-card border border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{feature.emoji}</div>
                  <div>
                    <h3 className="font-display font-semibold text-lg text-foreground mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Premium Tier */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-bold">
              👑 Premium Membership
            </span>
            <span className="text-sm text-muted-foreground">Starting at €59/year</span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {premiumFeatures.map((feature) => (
              <div
                key={feature.title}
                className="group bg-card rounded-2xl p-6 shadow-card border border-primary/20 hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{feature.emoji}</div>
                  <div>
                    <h3 className="font-display font-semibold text-lg text-foreground mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button variant="hero" size="xl" onClick={() => navigate("/auth")}>
            Join Free Today
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card needed · Upgrade anytime
          </p>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
