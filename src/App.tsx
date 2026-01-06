import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./hooks/useAuth";
import BackToTop from "./components/BackToTop";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MemberDashboard from "./pages/MemberDashboard";
import BusinessDashboard from "./pages/BusinessDashboard";
import Auth from "./pages/Auth";
import PartnerRegister from "./pages/PartnerRegister";
import MemberOnboarding from "./pages/MemberOnboarding";
import JoinFamily from "./pages/JoinFamily";
import MemberOffers from "./pages/MemberOffers";
import RedemptionHistory from "./pages/RedemptionHistory";
import FamilyManagement from "./pages/FamilyManagement";
import BusinessOfferManagement from "./pages/BusinessOfferManagement";
import BusinessAnalytics from "./pages/BusinessAnalytics";
import BusinessProfile from "./pages/BusinessProfile";
import AdminDashboard from "./pages/AdminDashboard";
import PetHealthAssistant from "./pages/PetHealthAssistant";
import LostPetAlerts from "./pages/LostPetAlerts";
import PetHealthRecords from "./pages/PetHealthRecords";
import VaccinationReminders from "./pages/VaccinationReminders";
import BusinessCustomerBirthdays from "./pages/BusinessCustomerBirthdays";
import BusinessRedemptionHistory from "./pages/BusinessRedemptionHistory";
import ResetPassword from "./pages/ResetPassword";
import PetProfile from "./pages/PetProfile";
import Notifications from "./pages/Notifications";
import Community from "./pages/Community";
import CommunityAsk from "./pages/CommunityAsk";
import CommunityQuestion from "./pages/CommunityQuestion";
import CommunityLeaderboard from "./pages/CommunityLeaderboard";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/member" element={<MemberDashboard />} />
              <Route path="/member/onboarding" element={<MemberOnboarding />} />
              <Route path="/member/join-family" element={<JoinFamily />} />
              <Route path="/member/offers" element={<MemberOffers />} />
              <Route path="/member/history" element={<RedemptionHistory />} />
              <Route path="/member/family" element={<FamilyManagement />} />
              <Route path="/member/health-assistant" element={<PetHealthAssistant />} />
              <Route path="/member/lost-pets" element={<LostPetAlerts />} />
              <Route path="/member/health-records" element={<PetHealthRecords />} />
              <Route path="/member/vaccinations" element={<VaccinationReminders />} />
              <Route path="/member/pet/:id" element={<PetProfile />} />
              <Route path="/member/notifications" element={<Notifications />} />
              <Route path="/community" element={<Community />} />
              <Route path="/community/ask" element={<CommunityAsk />} />
              <Route path="/community/question/:id" element={<CommunityQuestion />} />
              <Route path="/community/leaderboard" element={<CommunityLeaderboard />} />
              <Route path="/business" element={<BusinessDashboard />} />
              <Route path="/business/offers" element={<BusinessOfferManagement />} />
              <Route path="/business/analytics" element={<BusinessAnalytics />} />
              <Route path="/business/birthdays" element={<BusinessCustomerBirthdays />} />
              <Route path="/business/history" element={<BusinessRedemptionHistory />} />
              <Route path="/business/:id" element={<BusinessProfile />} />
              <Route path="/partner-register" element={<PartnerRegister />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <BackToTop />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
