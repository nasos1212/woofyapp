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
              <Route path="/member" element={<MemberDashboard />} />
              <Route path="/member/onboarding" element={<MemberOnboarding />} />
              <Route path="/member/join-family" element={<JoinFamily />} />
              <Route path="/member/offers" element={<MemberOffers />} />
              <Route path="/member/history" element={<RedemptionHistory />} />
              <Route path="/member/family" element={<FamilyManagement />} />
              <Route path="/business" element={<BusinessDashboard />} />
              <Route path="/business/offers" element={<BusinessOfferManagement />} />
              <Route path="/business/analytics" element={<BusinessAnalytics />} />
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
