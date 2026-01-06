import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import BenefitsSection from "@/components/BenefitsSection";
import OffersSection from "@/components/OffersSection";
import PartnersSection from "@/components/PartnersSection";
import SheltersSection from "@/components/SheltersSection";
import HubSection from "@/components/HubSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import PricingSection from "@/components/PricingSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Wooffy - The Ultimate Membership for Pet Lovers | €59/year</title>
        <meta 
          name="description" 
          content="Join 10,000+ pet parents. Get exclusive discounts at 500+ pet shops, trainers, hotels & more. 10% of proceeds support dog shelters. Save €2,000+ yearly with Wooffy membership." 
        />
        <meta name="keywords" content="pet membership, dog owners, pet discounts, pet services, dog training, pet hotels, pet shops, dog shelters, pet charity, Wooffy" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <HeroSection />
          <BenefitsSection />
          <OffersSection />
          <PartnersSection />
          <SheltersSection />
          <TestimonialsSection />
          <HubSection />
          <PricingSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;