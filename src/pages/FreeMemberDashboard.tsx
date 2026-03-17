import { Helmet } from "react-helmet-async";
import { Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  Users, 
  Gift, 
  Heart, 
  Bot, 
  AlertTriangle, 
  Syringe, 
  Lock, 
  ArrowRight,
  MessageSquarePlus,
  Crown,
  HelpCircle,
  Bookmark,
  MapPin,
  Sparkles,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Header from "@/components/Header";
import DogLoader from "@/components/DogLoader";
import { useAuth } from "@/hooks/useAuth";
import { useMembership } from "@/hooks/useMembership";
import { supabase } from "@/integrations/supabase/client";
import FreemiumOnboardingTour from "@/components/FreemiumOnboardingTour";

const FreeMemberDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasMembership, loading: membershipLoading } = useMembership();
  const navigate = useNavigate();
  const [profileName, setProfileName] = useState<string | null>(null);
  const [checkingRoles, setCheckingRoles] = useState(true);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [showComingSoon, setShowComingSoon] = useState(false);

  // Check user roles to ensure only freemium members can access this page
  useEffect(() => {
    const checkUserRoles = async () => {
      if (!user) {
        setCheckingRoles(false);
        return;
      }

      try {
        // Check for shelter record, shelter role, and business in parallel
        const [shelterResult, shelterRoleResult, businessResult, businessRoleResult] = await Promise.all([
          supabase.from("shelters").select("id, verification_status").eq("user_id", user.id).maybeSingle(),
          supabase.rpc("has_role", { _user_id: user.id, _role: "shelter" }),
          supabase.from("businesses").select("id").eq("user_id", user.id).maybeSingle(),
          supabase.rpc("has_role", { _user_id: user.id, _role: "business" }),
        ]);

        // Redirect shelters to their dashboard or onboarding
        if (shelterResult.data) {
          setRedirectPath("/shelter-dashboard");
          return;
        }
        
        // Shelter role but no record = incomplete onboarding
        if (shelterRoleResult.data) {
          setRedirectPath("/shelter-onboarding");
          return;
        }

        // Redirect businesses to their dashboard or registration
        if (businessResult.data) {
          setRedirectPath("/business");
          return;
        }
        
        // Business role but no record = incomplete registration
        if (businessRoleResult.data) {
          setRedirectPath("/partner-register");
          return;
        }
      } catch (error) {
        console.error("Error checking user roles:", error);
      } finally {
        setCheckingRoles(false);
      }
    };

    if (!authLoading && user) {
      checkUserRoles();
    } else if (!authLoading) {
      setCheckingRoles(false);
    }
  }, [user, authLoading]);

  // Fetch profile name
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.full_name) {
        setProfileName(data.full_name.split(" ")[0]);
      }
    };
    fetchProfile();
  }, [user]);


  if (authLoading || membershipLoading || checkingRoles) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect shelters and businesses to their proper dashboards
  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  // Redirect paid members to member dashboard
  if (hasMembership) {
    return <Navigate to="/member" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Community Hub | Wooffy</title>
        <meta name="description" content="Join the Wooffy pet community - ask questions, share experiences, and connect with pet parents." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-cyan-50/50 via-background to-background overflow-x-hidden">
        <Header />
        <FreemiumOnboardingTour />

        <main className="w-full max-w-7xl mx-auto px-4 py-8 pt-[calc(6rem+env(safe-area-inset-top))] box-border">
          {/* Welcome Header - Simple & Clean */}
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-1">
              Hello, {profileName || "Friend"}! 🐾
            </h1>
            <p className="text-muted-foreground">
              Connect with the Wooffy pet community
            </p>
          </div>

          {/* Main Community Hub Section - Hero Focus */}
          <div className="mb-8">
            <Card className="bg-gradient-to-br from-cyan-500 to-teal-600 border-0 shadow-xl overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="font-display text-xl md:text-2xl font-bold text-white">
                        Community Hub
                      </h2>
                      <p className="text-white/80 text-sm">
                        Your pet parenting questions, answered
                      </p>
                    </div>
                  </div>

                  <p className="text-white/90 mb-6 max-w-lg">
                    Get advice from experienced pet owners, share your knowledge, and be part of Cyprus's most helpful pet community.
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <Button 
                      size="lg"
                      onClick={() => navigate("/community")}
                      className="bg-white text-teal-700 hover:bg-white/90 gap-2"
                    >
                      <MessageSquarePlus className="w-5 h-5" />
                      Browse Questions
                    </Button>
                    <Button 
                      size="lg"
                      variant="outline"
                      onClick={() => navigate("/community/ask")}
                      className="border-white bg-white text-teal-700 hover:bg-white/90 gap-2"
                    >
                      <HelpCircle className="w-5 h-5" />
                      Ask a Question
                    </Button>
                  </div>
                </div>

                {/* Quick Actions Row */}
                <div className="bg-white/10 backdrop-blur px-6 py-4 flex flex-wrap gap-4 md:gap-8">
                  <button 
                    onClick={() => navigate("/community")}
                    className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
                  >
                    <MessageSquarePlus className="w-4 h-4" />
                    <span className="text-sm font-medium">Latest Questions</span>
                  </button>
                  {/* Top Contributors temporarily hidden - may be re-enabled in future */}
                  <button 
                    onClick={() => navigate("/community")}
                    className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
                  >
                    <Bookmark className="w-4 h-4" />
                    <span className="text-sm font-medium">Saved Questions</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {/* Lost Pet Alerts */}
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200/50 hover:shadow-md transition-all h-full">
              <CardContent className="p-5 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Lost&Found Alerts</h3>
                    <p className="text-sm text-muted-foreground">
                      Help reunite pets with families
                    </p>
                  </div>
                </div>
                <div className="mt-auto pt-4">
                  <Button 
                    variant="outline"
                    onClick={() => navigate("/member/lost-found")}
                    className="border-amber-300 text-amber-700 hover:bg-amber-200 hover:text-amber-900 gap-2 w-full"
                  >
                    View Alerts
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pet-Friendly Places */}
            <Card className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200/50 hover:shadow-md transition-all h-full">
              <CardContent className="p-5 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Dog-Friendly Places</h3>
                    <p className="text-sm text-muted-foreground">
                      Discover where pets are welcome
                    </p>
                  </div>
                </div>
                <div className="mt-auto pt-4">
                  <Button 
                    variant="outline"
                    onClick={() => navigate("/member/pet-friendly-places")}
                    className="border-teal-300 text-teal-700 hover:bg-teal-50 gap-2 w-full"
                  >
                    Explore Places
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Shelters */}
            <Card className="bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200/50 hover:shadow-md transition-all h-full">
              <CardContent className="p-5 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
                    <Heart className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Pet Shelters</h3>
                    <p className="text-sm text-muted-foreground">
                      Support local pet shelters
                    </p>
                  </div>
                </div>
                <div className="mt-auto pt-4">
                  <Button 
                    variant="outline"
                    onClick={() => navigate("/member/shelters")}
                    className="border-rose-300 text-rose-700 hover:bg-rose-50 gap-2 w-full"
                  >
                    View Shelters
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Browse Offers */}
            <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200/50 hover:shadow-md transition-all h-full">
              <CardContent className="p-5 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                    <Gift className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Browse Offers</h3>
                    <p className="text-sm text-muted-foreground">
                      Preview exclusive member deals
                    </p>
                  </div>
                </div>
                <div className="mt-auto pt-4">
                  <Button 
                    variant="outline"
                    onClick={() => navigate("/member/offers")}
                    className="border-purple-300 text-purple-700 hover:bg-purple-50 gap-2 w-full"
                  >
                    View Offers
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Our Partners */}
            <Card className="bg-gradient-to-r from-sky-50 to-blue-50 border-sky-200/50 hover:shadow-md transition-all h-full">
              <CardContent className="p-5 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Our Partners</h3>
                    <p className="text-sm text-muted-foreground">
                      Browse partner businesses
                    </p>
                  </div>
                </div>
                <div className="mt-auto pt-4">
                  <Button 
                    variant="outline"
                    onClick={() => navigate("/member/partners")}
                    className="border-sky-300 text-sky-700 hover:bg-sky-50 gap-2 w-full"
                  >
                    View Partners
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subtle Upgrade Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Want more features?
              </p>
              <Button 
                variant="link" 
                size="sm" 
                className="text-primary gap-1 p-0 h-auto"
                onClick={() => setShowComingSoon(true)}
              >
                See membership benefits
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: Gift, label: "Partner Discounts", color: "text-primary" },
                { icon: Heart, label: "Pet Profiles", color: "text-rose-500" },
                { icon: Bot, label: "AI Assistant", color: "text-violet-500" },
                { icon: Syringe, label: "Health Records", color: "text-blue-500" },
              ].map(({ icon: Icon, label, color }) => (
                <div
                  key={label}
                  className="p-3 rounded-xl bg-muted/50 border border-transparent text-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <Icon className={`w-5 h-5 ${color} opacity-60`} />
                      <Lock className="w-3 h-3 text-muted-foreground absolute -bottom-1 -right-1" />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Minimal Upgrade Banner */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <Crown className="w-5 h-5 text-primary hidden sm:block" />
                <p className="text-sm text-foreground">
                  <span className="font-medium">Upgrade to unlock</span>
                  <span className="text-muted-foreground"> exclusive discounts, pet profiles & more</span>
                </p>
              </div>
              <Button 
                size="sm"
                onClick={() => setShowComingSoon(true)}
                className="gap-2 shrink-0"
              >
                <Crown className="w-4 h-4" />
                Upgrade · €29/year
              </Button>
            </CardContent>
          </Card>

          {/* Membership Benefits Dialog */}
          <Dialog open={showComingSoon} onOpenChange={setShowComingSoon}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader className="items-center text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <DialogTitle className="font-display text-xl">Your Wooffy Membership</DialogTitle>
              </DialogHeader>

              {/* Free Features */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-700 rounded-full px-3 py-1 text-xs font-bold">
                      ✨ Free — Yours Now
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { icon: MapPin, label: "Dog-Friendly Directory", desc: "Find dog-friendly cafés, parks and more", color: "text-teal-600 bg-teal-100" },
                      { icon: AlertTriangle, label: "Lost & Found Alerts", desc: "Report and search for lost or found pets", color: "text-amber-600 bg-amber-100" },
                      { icon: Users, label: "Community Q&A", desc: "Ask questions and help fellow pet parents", color: "text-indigo-600 bg-indigo-100" },
                      { icon: Gift, label: "Browse Offers", desc: "Preview exclusive partner deals", color: "text-purple-600 bg-purple-100" },
                    ].map(({ icon: Icon, label, desc, color }) => (
                      <div key={label} className="flex items-center gap-3 p-2 rounded-lg">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color.split(' ')[1]}`}>
                          <Icon className={`w-4 h-4 ${color.split(' ')[0]}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{label}</p>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Premium Features */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-bold">
                      👑 Premium — Coming Soon
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { icon: Heart, label: "Pet Profiles", desc: "Create profiles with photos and breed info", color: "text-rose-600 bg-rose-100" },
                      { icon: Gift, label: "Exclusive Discounts", desc: "Save at pet shops, trainers, groomers, hotels & more", color: "text-primary bg-primary/10" },
                      { icon: Syringe, label: "Pet Health Records", desc: "Track vaccinations, appointments and vet visits", color: "text-blue-600 bg-blue-100" },
                      { icon: Bot, label: "AI Health Assistant", desc: "24/7 AI-powered pet health guidance", color: "text-violet-600 bg-violet-100" },
                    ].map(({ icon: Icon, label, desc, color }) => (
                      <div key={label} className="flex items-center gap-3 p-2 rounded-lg opacity-75">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color.split(' ')[1]}`}>
                          <Icon className={`w-4 h-4 ${color.split(' ')[0]}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{label}</p>
                            <Lock className="w-3 h-3 text-muted-foreground" />
                          </div>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-primary/5 rounded-xl p-3 border border-primary/20 text-center">
                  <p className="text-xs text-muted-foreground">
                    Premium plans starting at <span className="font-bold text-primary">€29/year</span> — we'll notify you when they launch! 🐾
                  </p>
                </div>
              </div>

              <Button 
                className="w-full mt-1" 
                onClick={() => setShowComingSoon(false)}
              >
                Got it!
              </Button>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </>
  );
};

export default FreeMemberDashboard;
