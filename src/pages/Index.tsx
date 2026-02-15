import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import BenefitsSection from "@/components/BenefitsSection";
import OffersSection from "@/components/OffersSection";
import PartnersSection from "@/components/PartnersSection";
import SheltersSection from "@/components/SheltersSection";
import HubSection from "@/components/HubSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FreemiumSection from "@/components/FreemiumSection";
import PricingSection from "@/components/PricingSection";
import CTASection from "@/components/CTASection";
import FounderSection from "@/components/FounderSection";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DogLoader from "@/components/DogLoader";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [checkingMembership, setCheckingMembership] = useState(false);
  const skipRedirect = searchParams.get("stay") === "true";

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (!user) return;
      
      setCheckingMembership(true);
      
      // Check entity records and membership in parallel (records take priority over roles)
      const [shelterResult, businessResult, membershipResult] = await Promise.all([
        supabase.from("shelters").select("id, verification_status").eq("user_id", user.id).maybeSingle(),
        supabase.from("businesses").select("id").eq("user_id", user.id).maybeSingle(),
        supabase.from("memberships").select("id, is_active").eq("user_id", user.id).maybeSingle(),
      ]);
      
      const hasShelter = !!shelterResult.data;
      const hasBusiness = !!businessResult.data;
      const hasMembership = !!membershipResult.data;
      
      // Shelter users - redirect to dashboard (only if they have an actual record)
      if (hasShelter) {
        navigate("/shelter-dashboard");
        return;
      }
      
      // Business users - redirect to business dashboard (only if they have an actual record)
      if (hasBusiness) {
        navigate("/business");
        return;
      }
      
      // Regular members
      if (hasMembership && membershipResult.data?.is_active) {
        navigate("/member");
      } else {
        navigate("/member/free");
      }
      
      setCheckingMembership(false);
    };

    if (!loading && user && !skipRedirect) {
      checkAndRedirect();
    }
  }, [user, loading, navigate, skipRedirect]);

  if (loading || checkingMembership) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader size="lg" />
      </div>
    );
  }

  // If skipRedirect is true, show the landing page even for logged-in users
  if (user && !skipRedirect) {
    return null; // Will redirect
  }

  return (
    <>
      <Helmet>
        <title>Wooffy - The Ultimate Membership for Pet Lovers | €59/year</title>
        <meta 
          name="description" 
          content="Join 250+ pet parents. Get exclusive discounts at 500+ pet shops, trainers, hotels & more. 10% goes to animal shelters. Save €500+ yearly with Wooffy membership." 
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
          <FounderSection />
          <FreemiumSection />
          <PricingSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;