import { useState, useEffect } from "react";
import { Building2, Store, Dumbbell, Home, Stethoscope, Scissors } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLandingStats } from "@/hooks/useLandingStats";

interface CategoryCount {
  icon: typeof Building2;
  name: string;
  count: number;
  category: string;
}

const categoryConfig = [
  { icon: Store, name: "Pet Shops", category: "pet_shop" },
  { icon: Stethoscope, name: "Veterinaries", category: "vet" },
  { icon: Dumbbell, name: "Trainers", category: "trainer" },
  { icon: Home, name: "Pet Hotels", category: "hotel" },
  { icon: Scissors, name: "Groomers", category: "grooming" },
  { icon: Building2, name: "Other", category: "other" },
];

const featuredPartners = [
  { name: "PetWorld", discount: "25% off", category: "Pet Shop" },
  { name: "Wooffy Vet Care", discount: "15% off", category: "Veterinary" },
  { name: "Bark Academy", discount: "1 Free Session", category: "Training" },
  { name: "Pawsome Hotel", discount: "20% off", category: "Pet Hotel" },
  { name: "Fluffy Grooming", discount: "€10 off", category: "Grooming" },
  { name: "Café Canine", discount: "Free Treat", category: "Pet Café" },
];

const PartnersSection = () => {
  const { partnerBusinesses, isLoading } = useLandingStats();
  const [categoryCounts, setCategoryCounts] = useState<CategoryCount[]>([]);

  useEffect(() => {
    const fetchCategoryCounts = async () => {
      // Get count per category for approved businesses
      const { data, error } = await supabase
        .from("businesses")
        .select("category")
        .eq("verification_status", "approved");

      if (!error && data) {
        const counts: Record<string, number> = {};
        data.forEach((b) => {
          counts[b.category] = (counts[b.category] || 0) + 1;
        });

        const result = categoryConfig.map((config) => ({
          ...config,
          count: counts[config.category] || 0,
        }));
        setCategoryCounts(result);
      }
    };

    fetchCategoryCounts();
  }, []);

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
            {isLoading ? "Partner Businesses" : `${partnerBusinesses}+ Partner Businesses`}
          </h2>
          
          <p className="text-lg text-muted-foreground">
            From local pet shops to premium hotels, our network keeps growing. 
            Show your Wooffy card and enjoy instant savings everywhere.
          </p>
        </div>

        {/* Category stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
          {(categoryCounts.length > 0 ? categoryCounts : categoryConfig.map(c => ({ ...c, count: 0 }))).map((category) => (
            <div
              key={category.name}
              className="bg-card rounded-2xl p-4 text-center shadow-soft border border-border hover:shadow-card hover:border-primary/20 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <category.icon className="w-6 h-6 text-primary" />
              </div>
              <p className="font-display font-bold text-xl text-foreground">
                {category.count > 0 ? `${category.count}` : "—"}
              </p>
              <p className="text-sm text-muted-foreground">{category.name}</p>
            </div>
          ))}
        </div>

        {/* Featured partners */}
        <div className="bg-wooffy-dark rounded-3xl p-8 lg:p-12">
          <h3 className="font-display font-bold text-2xl text-wooffy-sky mb-8 text-center">
            Featured Partner Deals
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredPartners.map((partner) => (
              <div
                key={partner.name}
                className="bg-wooffy-blue/10 backdrop-blur-sm rounded-xl p-4 border border-wooffy-blue/30 hover:bg-wooffy-blue/20 transition-colors duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display font-semibold text-wooffy-light">{partner.name}</p>
                    <p className="text-sm text-wooffy-light/70">{partner.category}</p>
                  </div>
                  <div className="bg-wooffy-sky text-wooffy-dark px-3 py-1 rounded-full text-sm font-semibold">
                    {partner.discount}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-center text-wooffy-light/70 mt-8 text-sm">
            + hundreds more exclusive deals waiting for you
          </p>
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
