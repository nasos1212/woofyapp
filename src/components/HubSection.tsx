import { Dog, Calendar, MessageSquare, MapPin, Bell, Award } from "lucide-react";
import { Button } from "./ui/button";

const hubFeatures = [
  {
    icon: Dog,
    title: "Pet Profiles",
    description: "Create detailed profiles for all your pets. Track health records, birthdays, and milestones.",
    image: "🐕",
  },
  {
    icon: Calendar,
    title: "Events & Meetups",
    description: "Discover and join local pet events, dog walks, training sessions, and community gatherings.",
    image: "📅",
  },
  {
    icon: MessageSquare,
    title: "Community Forum",
    description: "Connect with fellow pet parents. Share tips, ask questions, and build friendships.",
    image: "💬",
  },
  {
    icon: MapPin,
    title: "Pet-Friendly Map",
    description: "Find dog parks, pet-friendly restaurants, vets, and hidden gems in your area.",
    image: "🗺️",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description: "Never miss vaccinations, grooming appointments, or your pet's special days.",
    image: "🔔",
  },
  {
    icon: Award,
    title: "Loyalty Rewards",
    description: "Earn points with every purchase. Redeem for treats, products, and exclusive experiences.",
    image: "🏆",
  },
];

const HubSection = () => {
  return (
    <section id="hub" className="py-20 lg:py-32 bg-gradient-warm">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-soft border border-border mb-6">
            <Dog className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Coming Soon</span>
          </span>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6">
            Your Pet Owner Hub
          </h2>
          
          <p className="text-lg text-muted-foreground">
            More than just discounts. PawPass is your all-in-one companion for pet parenthood. 
            Connect, discover, and make every moment with your pet count.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {hubFeatures.map((feature, index) => (
            <div
              key={feature.title}
              className="group bg-card rounded-2xl p-6 shadow-card border border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{feature.image}</div>
                <div>
                  <h3 className="font-display font-semibold text-lg text-foreground mb-2">
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

        {/* CTA */}
        <div className="text-center">
          <Button variant="hero" size="xl">
            Join the Waitlist for Hub Access
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            All PawPass members get early access to new features
          </p>
        </div>
      </div>
    </section>
  );
};

export default HubSection;
