import { Heart, Home, PawPrint } from "lucide-react";

const shelters = [
  {
    name: "Happy Tails Rescue",
    location: "Dublin, Ireland",
    dogsHelped: 1240,
    image: "🏠"
  },
  {
    name: "Second Chance Sanctuary",
    location: "Cork, Ireland", 
    dogsHelped: 890,
    image: "🏠"
  },
  {
    name: "Furever Friends Foundation",
    location: "Galway, Ireland",
    dogsHelped: 560,
    image: "🏠"
  },
  {
    name: "Paws of Hope",
    location: "Belfast, UK",
    dogsHelped: 720,
    image: "🏠"
  }
];

const SheltersSection = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-paw-cream to-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-600 px-4 py-2 rounded-full mb-6">
            <Heart className="w-4 h-4 fill-current" />
            <span className="text-sm font-medium">Giving Back</span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            10% Goes to <span className="text-rose-500">Dog Shelters</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Every PawPass membership directly supports whitelisted dog shelters. 
            Together, we've helped rehome over 3,400 dogs and counting.
          </p>
        </div>

        {/* Impact Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <div className="bg-white rounded-2xl p-6 text-center shadow-soft">
            <div className="text-3xl md:text-4xl font-display font-bold text-rose-500 mb-2">€47K+</div>
            <p className="text-muted-foreground text-sm">Donated This Year</p>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center shadow-soft">
            <div className="text-3xl md:text-4xl font-display font-bold text-primary mb-2">3,400+</div>
            <p className="text-muted-foreground text-sm">Dogs Rehomed</p>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center shadow-soft">
            <div className="text-3xl md:text-4xl font-display font-bold text-paw-gold mb-2">12</div>
            <p className="text-muted-foreground text-sm">Partner Shelters</p>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center shadow-soft">
            <div className="text-3xl md:text-4xl font-display font-bold text-green-500 mb-2">100%</div>
            <p className="text-muted-foreground text-sm">Transparent Giving</p>
          </div>
        </div>

        {/* Whitelisted Shelters */}
        <div className="mb-12">
          <h3 className="font-display text-xl font-semibold text-foreground mb-6 text-center">
            Our Whitelisted Shelter Partners
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {shelters.map((shelter, index) => (
              <div 
                key={index}
                className="bg-white rounded-2xl p-6 shadow-soft hover:shadow-card transition-all duration-300 group"
              >
                <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Home className="w-8 h-8 text-rose-500" />
                </div>
                <h4 className="font-display font-semibold text-foreground mb-1">{shelter.name}</h4>
                <p className="text-muted-foreground text-sm mb-3">{shelter.location}</p>
                <div className="flex items-center gap-2 text-sm">
                  <PawPrint className="w-4 h-4 text-primary" />
                  <span className="text-foreground font-medium">{shelter.dogsHelped} dogs helped</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Are you a registered dog shelter? Apply to join our whitelist.
          </p>
          <a 
            href="#" 
            className="text-rose-500 font-medium hover:underline inline-flex items-center gap-2"
          >
            Apply as a Shelter Partner
            <span>→</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default SheltersSection;
