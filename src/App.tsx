import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./hooks/useAuth";
import PWAUpdatePrompt from "./components/PWAUpdatePrompt";

import SupportButton from "./components/SupportButton";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MemberDashboard from "./pages/MemberDashboard";
import FreeMemberDashboard from "./pages/FreeMemberDashboard";
import BusinessDashboard from "./pages/BusinessDashboard";
import Auth from "./pages/Auth";
import PartnerRegister from "./pages/PartnerRegister";
import MemberOnboarding from "./pages/MemberOnboarding";
import MemberOffers from "./pages/MemberOffers";
import RedemptionHistory from "./pages/RedemptionHistory";
import BusinessOfferManagement from "./pages/BusinessOfferManagement";
import BusinessAnalytics from "./pages/BusinessAnalytics";
import BusinessProfile from "./pages/BusinessProfile";
import BusinessSettings from "./pages/BusinessSettings";
import AdminDashboard from "./pages/AdminDashboard";
import PetHealthAssistant from "./pages/PetHealthAssistant";
import LostFoundAlerts from "./pages/LostFoundAlerts";
import PetHealthRecords from "./pages/PetHealthRecords";

import BusinessCustomerBirthdays from "./pages/BusinessCustomerBirthdays";
import BusinessRedemptionHistory from "./pages/BusinessRedemptionHistory";
import ResetPassword from "./pages/ResetPassword";
import PetProfile from "./pages/PetProfile";
import Notifications from "./pages/Notifications";
import Community from "./pages/Community";
import CommunityAsk from "./pages/CommunityAsk";
import CommunityQuestion from "./pages/CommunityQuestion";
// CommunityLeaderboard temporarily disabled - may be re-enabled in future
// import CommunityLeaderboard from "./pages/CommunityLeaderboard";
import MemberUpgrade from "./pages/MemberUpgrade";
import AddPet from "./pages/AddPet";
import ShelterProfile from "./pages/ShelterProfile";
import ShelterDashboard from "./pages/ShelterDashboard";
import ShelterOnboarding from "./pages/ShelterOnboarding";
import MemberShelters from "./pages/MemberShelters";
import PetFriendlyPlaces from "./pages/PetFriendlyPlaces";
import VerifyEmail from "./pages/VerifyEmail";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <PWAUpdatePrompt />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/member" element={<MemberDashboard />} />
              <Route path="/member/free" element={<FreeMemberDashboard />} />
              <Route path="/member/onboarding" element={<MemberOnboarding />} />
              <Route path="/member/offers" element={<MemberOffers />} />
              <Route path="/member/history" element={<RedemptionHistory />} />
              <Route path="/member/health-assistant" element={<PetHealthAssistant />} />
              <Route path="/member/lost-found" element={<LostFoundAlerts />} />
              <Route path="/member/lost-pets" element={<Navigate to="/member/lost-found" replace />} />
              <Route path="/member/health-records" element={<PetHealthRecords />} />
              <Route path="/member/vaccinations" element={<PetHealthRecords />} />
              <Route path="/member/pet/:id" element={<PetProfile />} />
              <Route path="/member/notifications" element={<Notifications />} />
              <Route path="/member/upgrade" element={<MemberUpgrade />} />
              <Route path="/member/add-pet" element={<AddPet />} />
              <Route path="/member/shelters" element={<MemberShelters />} />
              <Route path="/member/pet-friendly-places" element={<PetFriendlyPlaces />} />
              <Route path="/community" element={<Community />} />
              <Route path="/community/ask" element={<CommunityAsk />} />
              <Route path="/community/question/:id" element={<CommunityQuestion />} />
              {/* Leaderboard route temporarily disabled - may be re-enabled in future */}
              {/* <Route path="/community/leaderboard" element={<CommunityLeaderboard />} /> */}
              <Route path="/business" element={<BusinessDashboard />} />
              <Route path="/business/offers" element={<BusinessOfferManagement />} />
              <Route path="/business/analytics" element={<BusinessAnalytics />} />
              <Route path="/business/birthdays" element={<BusinessCustomerBirthdays />} />
              <Route path="/business/history" element={<BusinessRedemptionHistory />} />
              <Route path="/business/settings" element={<BusinessSettings />} />
              <Route path="/business/:id" element={<BusinessProfile />} />
              <Route path="/partner-register" element={<PartnerRegister />} />
              <Route path="/shelter/:id" element={<ShelterProfile />} />
              <Route path="/shelter-dashboard" element={<ShelterDashboard />} />
              <Route path="/shelter-onboarding" element={<ShelterOnboarding />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            
            <SupportButton />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
