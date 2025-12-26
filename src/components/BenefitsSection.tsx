import { 
  Percent, 
  Gift, 
  Calendar, 
  MapPin, 
  Users, 
  Heart,
  Stethoscope,
  ShoppingBag,
  Home,
  GraduationCap
} from "lucide-react";

const benefits = [
  {
    icon: Percent,
    title: "Exclusive Discounts",
    description: "Up to 30% off at 500+ partner pet shops, groomers & supply stores",
    color: "bg-paw-amber/10 text-paw-amber",
  },
  {
    icon: Stethoscope,
    title: "Vet Savings",
    description: "10-20% discounts on vaccinations, check-ups & treatments",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: GraduationCap,
    title: "Free Training Sessions",
    description: "Monthly free group training with certified trainers",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: Home,
    title: "Pet Hotel Perks",
    description: "Exclusive rates & priority booking at partner hotels",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: Gift,
    title: "Birthday Treats",
    description: "Free gifts & special surprises on your pet's birthday",
    color: "bg-pink-100 text-pink-600",
  },
  {
    icon: ShoppingBag,
    title: "Welcome Kit",
    description: "Premium starter kit with treats, toys & essentials",
    color: "bg-amber-100 text-amber-600",
  },
  {
    icon: Calendar,
    title: "Exclusive Events",
    description: "VIP access to pet meetups, shows & community events",
    color: "bg-cyan-100 text-cyan-600",
  },
  {
    icon: MapPin,
    title: "Local Discovery",
    description: "Find pet-friendly cafés, parks & hidden gems nearby",
    color: "bg-rose-100 text-rose-600",
  },
  {
    icon: Users,
    title: "Community Access",
    description: "Connect with local pet owners, share tips & make friends",
    color: "bg-indigo-100 text-indigo-600",
  },
];

const BenefitsSection = () => {
  return (
    <section id="benefits" className="py-20 lg:py-32 bg-gradient-warm">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-soft border border-border mb-6">
            <Heart className="w-4 h-4 text-primary fill-primary" />
            <span className="text-sm font-medium text-muted-foreground">Why Pet Parents Love Us</span>
          </span>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6">
            Benefits That Make Tails Wag
          </h2>
          
          <p className="text-lg text-muted-foreground">
            From everyday savings to special perks, your PawPass membership pays for itself many times over.
          </p>
        </div>

        {/* Benefits grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className="group bg-card rounded-2xl p-6 shadow-card border border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`w-14 h-14 rounded-xl ${benefit.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <benefit.icon className="w-7 h-7" />
              </div>
              
              <h3 className="font-display font-semibold text-xl text-foreground mb-2">
                {benefit.title}
              </h3>
              
              <p className="text-muted-foreground">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
