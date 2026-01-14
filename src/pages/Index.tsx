import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DogLoader from "@/components/DogLoader";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checkingMembership, setCheckingMembership] = useState(false);

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (!user) return;
      
      setCheckingMembership(true);
      
      // Check if user has a membership
      const { data: membership } = await supabase
        .from("memberships")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (membership) {
        navigate("/member");
      } else {
        navigate("/member/free");
      }
      
      setCheckingMembership(false);
    };

    if (!loading && user) {
      checkAndRedirect();
    }
  }, [user, loading, navigate]);

  if (loading || checkingMembership) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader size="lg" />
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <>
      <Helmet>
        <title>Wooffy - The Ultimate Membership for Pet Lovers | €59/year</title>
        <meta 
          name="description" 
          content="Join 250+ pet parents. Get exclusive discounts at 500+ pet shops, trainers, hotels & more. 10% of proceeds support dog shelters. Save €500+ yearly with Wooffy membership." 
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