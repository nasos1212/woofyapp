import { Building2, Store, Dumbbell, Home, Stethoscope, Scissors } from "lucide-react";

const partnerCategories = [
  { icon: Store, name: "Pet Shops", count: 150 },
  { icon: Stethoscope, name: "Veterinaries", count: 80 },
  { icon: Dumbbell, name: "Trainers", count: 60 },
  { icon: Home, name: "Pet Hotels", count: 45 },
  { icon: Scissors, name: "Groomers", count: 120 },
  { icon: Building2, name: "Pet Cafés", count: 35 },
];

const featuredPartners = [
  { name: "PetWorld", discount: "25% off", category: "Pet Shop" },
  { name: "Happy Paws Vet", discount: "15% off", category: "Veterinary" },
  { name: "Bark Academy", discount: "1 Free Session", category: "Training" },
  { name: "Pawsome Hotel", discount: "20% off", category: "Pet Hotel" },
  { name: "Fluffy Grooming", discount: "€10 off", category: "Grooming" },
  { name: "Café Canine", discount: "Free Treat", category: "Pet Café" },
];

const PartnersSection = () => {
  return (
    <section id="partners" className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-soft border border-border mb-6">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Growing Network</span>
          </span>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6">
            500+ Partner Businesses
          </h2>
          
          <p className="text-lg text-muted-foreground">
            From local pet shops to premium hotels, our network keeps growing. 
            Show your Woofy card and enjoy instant savings everywhere.
          </p>
        </div>

        {/* Category stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
          {partnerCategories.map((category) => (
            <div
              key={category.name}
              className="bg-card rounded-2xl p-4 text-center shadow-soft border border-border hover:shadow-card hover:border-primary/20 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <category.icon className="w-6 h-6 text-primary" />
              </div>
              <p className="font-display font-bold text-xl text-foreground">{category.count}+</p>
              <p className="text-sm text-muted-foreground">{category.name}</p>
            </div>
          ))}
        </div>

        {/* Featured partners */}
        <div className="bg-gradient-hero rounded-3xl p-8 lg:p-12">
          <h3 className="font-display font-bold text-2xl text-primary-foreground mb-8 text-center">
            Featured Partner Deals
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredPartners.map((partner) => (
              <div
                key={partner.name}
                className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4 border border-primary-foreground/20 hover:bg-primary-foreground/20 transition-colors duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display font-semibold text-primary-foreground">{partner.name}</p>
                    <p className="text-sm text-primary-foreground/70">{partner.category}</p>
                  </div>
                  <div className="bg-primary-foreground text-primary px-3 py-1 rounded-full text-sm font-semibold">
                    {partner.discount}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-center text-primary-foreground/70 mt-8 text-sm">
            + hundreds more exclusive deals waiting for you
          </p>
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
