import { Helmet } from "react-helmet-async";
import { Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  Building2,
  Dog,
  Cat,
  PlusCircle,
  FileText,
  BookOpen
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

import CityPromptBanner from "@/components/CityPromptBanner";
import { PetType, getPetTypeEmoji } from "@/data/petBreeds";

interface Pet {
  id: string;
  pet_name: string;
  pet_type: PetType;
  pet_breed: string | null;
  photo_url: string | null;
}

interface RecentQuestion {
  id: string;
  title: string;
  helped_count: number;
  created_at: string;
}


const FreeMemberDashboard = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { hasMembership, isPaidMember, loading: membershipLoading } = useMembership();
  const navigate = useNavigate();
  const [profileName, setProfileName] = useState<string | null>(null);
  const [preferredCity, setPreferredCity] = useState<string | null>(null);
  const [checkingRoles, setCheckingRoles] = useState(true);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [recentQuestions, setRecentQuestions] = useState<RecentQuestion[]>([]);
  const [showAllServices, setShowAllServices] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [cityPromptDismissed, setCityPromptDismissed] = useState(() => {
    return sessionStorage.getItem('wooffy_city_prompt_dismissed_free') === 'true';
  });


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
        .select("full_name, preferred_city")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.full_name) {
        setProfileName(data.full_name.split(" ")[0]);
      }
      setPreferredCity(data?.preferred_city || null);
    };
    fetchProfile();
  }, [user]);

  // Fetch pets
  useEffect(() => {
    const fetchPets = async () => {
      if (!user) return;
      const { data: membershipData } = await supabase
        .from("memberships")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!membershipData) return;
      const { data: petsData } = await supabase
        .from("pets")
        .select("id, pet_name, pet_type, pet_breed, photo_url")
        .eq("membership_id", membershipData.id);
      if (petsData) {
        setPets(petsData.map(p => ({ ...p, pet_type: (p.pet_type === 'cat' ? 'cat' : 'dog') as PetType })));
      }
    };
    fetchPets();
  }, [user]);

  // Fetch latest community questions
  useEffect(() => {
    const fetchQuestions = async () => {
      const { data } = await supabase
        .from("community_questions")
        .select("id, title, helped_count, created_at")
        .order("created_at", { ascending: false })
        .limit(4);
      if (data) setRecentQuestions(data);
    };
    fetchQuestions();
  }, []);

  // Auto-advance community questions every 5 seconds
  useEffect(() => {
    if (recentQuestions.length < 2) return;
    const interval = setInterval(() => {
      setCurrentQuestionIdx((i) => (i + 1) % recentQuestions.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [recentQuestions.length]);




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
  if (isPaidMember) {
    return <Navigate to="/member" replace />;
  }

  return (
    <>
      <Helmet>
        <title>{t("freeMember.pageTitle")}</title>
        <meta name="description" content={t("freeMember.pageDescription")} />
      </Helmet>

      <div className="min-h-screen bg-background overflow-x-hidden">
        <Header />
        <FreemiumOnboardingTour />

        <main className="w-full max-w-7xl mx-auto px-4 py-8 pt-[calc(6rem+env(safe-area-inset-top))] box-border">

          {/* One-time city prompt for existing users */}
          {user && !preferredCity && !cityPromptDismissed && (
            <CityPromptBanner
              userId={user.id}
              onCitySet={(city) => {
                setPreferredCity(city);
                setCityPromptDismissed(true);
              }}
              onDismiss={() => {
                setCityPromptDismissed(true);
                sessionStorage.setItem('wooffy_city_prompt_dismissed_free', 'true');
              }}
            />
          )}

          {/* Welcome Header - Simple & Clean */}
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-1">
              {t("freeMember.hello", { name: profileName || t("freeMember.friend") })}
            </h1>
            <p className="text-muted-foreground">
              {t("freeMember.subtitle")}
            </p>
          </div>

          {/* My Pets Section - FIRST (membership-card themed) */}
          <div className="relative mb-8 group">
            <div className="absolute -inset-2 bg-wooffy-blue/40 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
            <Card className="relative bg-wooffy-dark border-wooffy-blue/30 shadow-card overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-wooffy-blue/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-wooffy-blue/10 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
              <CardContent className="relative p-6 md:p-8">
                <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                  <h2 className="font-display text-lg md:text-xl font-bold text-wooffy-sky flex items-center gap-2">
                    <Dog className="w-5 h-5 text-wooffy-accent" />
                    {t("freeMember.pets.title")}
                  </h2>
                  {pets.length > 0 && (
                    <Button
                      size="sm"
                      onClick={() => navigate("/member/add-pet")}
                      className="gap-1 bg-wooffy-sky text-wooffy-dark hover:bg-wooffy-sky/90"
                    >
                      <PlusCircle className="w-4 h-4" />
                      {t("freeMember.pets.addPet")}
                    </Button>
                  )}
                </div>

                {pets.length === 0 ? (
                  <div className="rounded-xl border-dashed border-2 border-wooffy-blue/40 bg-wooffy-blue/10 p-8 text-center">
                    <Dog className="w-12 h-12 text-wooffy-sky/70 mx-auto mb-3" />
                    <h3 className="font-display font-semibold text-wooffy-sky mb-1 text-lg">{t("freeMember.pets.empty")}</h3>
                    <p className="text-sm text-wooffy-light/70 mb-5 max-w-md mx-auto">
                      {t("freeMember.pets.emptyDesc")}
                    </p>
                    <Button onClick={() => navigate("/member/add-pet")} size="lg" className="gap-2 bg-wooffy-sky text-wooffy-dark hover:bg-wooffy-sky/90">
                      <PlusCircle className="w-5 h-5" />
                      {t("freeMember.pets.addFirst")}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pets.map((pet) => (
                      <button
                        key={pet.id}
                        onClick={() => navigate(`/member/pet/${pet.id}`)}
                        className="text-left rounded-xl border border-wooffy-blue/30 bg-wooffy-blue/10 hover:bg-wooffy-blue/20 hover:border-wooffy-sky/50 transition-all p-4 flex items-center gap-4"
                      >
                        {pet.photo_url ? (
                          <img
                            src={pet.photo_url}
                            alt={pet.pet_name}
                            className="w-14 h-14 rounded-full object-cover border-2 border-wooffy-sky/40"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-wooffy-blue/30 flex items-center justify-center border-2 border-wooffy-sky/40">
                            {pet.pet_type === 'cat' ? (
                              <Cat className="w-6 h-6 text-wooffy-sky" />
                            ) : (
                              <Dog className="w-6 h-6 text-wooffy-sky" />
                            )}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-wooffy-sky truncate">{pet.pet_name}</h3>
                          <p className="text-sm text-wooffy-light/70 truncate">
                            {pet.pet_breed || (pet.pet_type === 'cat' ? t("freeMember.pets.cat") : t("freeMember.pets.dog"))}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-wooffy-light/60 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>



          {/* Community Hub Section - One question at a time */}
          <div className="mb-8">
            <Card className="border-border shadow-soft overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-display text-lg md:text-xl font-bold text-foreground">
                        {t("freeMember.hub.title")}
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        {t("freeMember.hub.tagline")}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate("/community/ask")}
                    className="gap-2"
                  >
                    <HelpCircle className="w-4 h-4" />
                    {t("freeMember.hub.ask")}
                  </Button>
                </div>

                {recentQuestions.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    {t("freeMember.hub.description")}
                  </div>
                ) : (
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <div className="overflow-hidden">
                      <div
                        className="flex transition-transform duration-500 ease-in-out"
                        style={{ transform: `translateX(-${currentQuestionIdx * 100}%)` }}
                      >
                        {recentQuestions.map((q) => (
                          <button
                            key={q.id}
                            onClick={() => navigate(`/community/question/${q.id}`)}
                            className="w-full shrink-0 text-left flex items-center justify-between gap-3 hover:opacity-80 transition-opacity pr-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-foreground truncate">{q.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {q.helped_count > 0
                                  ? `${q.helped_count} ${q.helped_count === 1 ? "person" : "people"} helped`
                                  : "Be the first to help"}
                              </p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/60">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentQuestionIdx((i) => (i - 1 + recentQuestions.length) % recentQuestions.length)}
                        disabled={recentQuestions.length < 2}
                      >
                        ← Previous
                      </Button>
                      <div className="flex items-center gap-1.5">
                        {recentQuestions.map((_, i) => (
                          <span
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              i === currentQuestionIdx ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentQuestionIdx((i) => (i + 1) % recentQuestions.length)}
                        disabled={recentQuestions.length < 2}
                      >
                        Next →
                      </Button>
                    </div>
                  </div>
                )}


                <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/community")}
                    className="gap-2"
                  >
                    <MessageSquarePlus className="w-4 h-4" />
                    {t("freeMember.hub.browse")}
                  </Button>
                  <button
                    onClick={() => navigate("/community?tab=saved")}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    <Bookmark className="w-4 h-4" />
                    <span className="font-medium">{t("freeMember.hub.saved")}</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>


          {/* Upgrade CTA above Quick Access */}
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Crown className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {t("freeMember.upgrade.unlock")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("freeMember.upgrade.unlockDesc")}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate("/member/upgrade")}
                className="gap-2 shrink-0 w-full sm:w-auto"
              >
                <Crown className="w-4 h-4" />
                {t("freeMember.upgrade.cta")}
              </Button>
            </CardContent>
          </Card>

          <div className="bg-white rounded-2xl p-6 shadow-soft mb-8">
            <h3 className="font-display font-semibold text-foreground mb-4">{t("memberDashboard.quickAccess.title")}</h3>
            <div className="space-y-2">
              <button onClick={() => navigate("/member/health-records")} className="w-full text-left flex items-center gap-3 p-3 bg-muted/40 rounded-xl hover:bg-muted transition-colors">
                <div className="w-10 h-10 flex-shrink-0 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Syringe className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="font-medium text-foreground text-sm">{t("freeMember.cards.health")}</p>
              </button>
              <button onClick={() => navigate("/member/lost-found")} className="w-full text-left flex items-center gap-3 p-3 bg-muted/40 rounded-xl hover:bg-muted transition-colors">
                <div className="w-10 h-10 flex-shrink-0 bg-amber-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <p className="font-medium text-foreground text-sm">{t("freeMember.cards.lostFound")}</p>
              </button>
              <button onClick={() => navigate("/member/pet-friendly-places")} className="w-full text-left flex items-center gap-3 p-3 bg-muted/40 rounded-xl hover:bg-muted transition-colors">
                <div className="w-10 h-10 flex-shrink-0 bg-teal-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-teal-600" />
                </div>
                <p className="font-medium text-foreground text-sm">{t("freeMember.cards.places")}</p>
              </button>
              <button onClick={() => navigate("/member/offers")} className="w-full text-left flex items-center gap-3 p-3 bg-muted/40 rounded-xl hover:bg-muted transition-colors">
                <div className="w-10 h-10 flex-shrink-0 bg-purple-100 rounded-full flex items-center justify-center">
                  <Gift className="w-5 h-5 text-purple-600" />
                </div>
                <p className="font-medium text-foreground text-sm">{t("freeMember.cards.browseOffers")}</p>
              </button>

              {showAllServices && (
                <>
                  <button onClick={() => navigate("/member/shelters")} className="w-full text-left flex items-center gap-3 p-3 bg-muted/40 rounded-xl hover:bg-muted transition-colors">
                    <div className="w-10 h-10 flex-shrink-0 bg-rose-100 rounded-full flex items-center justify-center">
                      <Heart className="w-5 h-5 text-rose-600" />
                    </div>
                    <p className="font-medium text-foreground text-sm">{t("freeMember.cards.shelters")}</p>
                  </button>
                  <button onClick={() => navigate("/member/partners")} className="w-full text-left flex items-center gap-3 p-3 bg-muted/40 rounded-xl hover:bg-muted transition-colors">
                    <div className="w-10 h-10 flex-shrink-0 bg-sky-100 rounded-full flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-sky-600" />
                    </div>
                    <p className="font-medium text-foreground text-sm">{t("freeMember.cards.partners")}</p>
                  </button>
                  <button onClick={() => navigate("/blog")} className="w-full text-left flex items-center gap-3 p-3 bg-muted/40 rounded-xl hover:bg-muted transition-colors">
                    <div className="w-10 h-10 flex-shrink-0 bg-cyan-100 rounded-full flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-cyan-600" />
                    </div>
                    <p className="font-medium text-foreground text-sm">{t("blog.discoverCardTitle")}</p>
                  </button>
                </>
              )}
            </div>
            <button
              onClick={() => setShowAllServices((v) => !v)}
              className="mt-3 w-full text-sm text-primary hover:underline font-medium"
            >
              {showAllServices ? "Show less" : "See more services"}
            </button>
          </div>




          {/* Subtle Upgrade Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {t("freeMember.upgrade.want")}
              </p>
              <Button 
                variant="link" 
                size="sm" 
                className="text-primary gap-1 p-0 h-auto"
                onClick={() => setShowComingSoon(true)}
              >
                {t("freeMember.upgrade.seeBenefits")}
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Gift, label: t("freeMember.upgrade.partnerDiscounts"), color: "text-primary" },
                { icon: Bot, label: t("freeMember.upgrade.aiAssistant"), color: "text-violet-500" },
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
                  <span className="font-medium">{t("freeMember.upgrade.unlock")}</span>
                  <span className="text-muted-foreground">{t("freeMember.upgrade.unlockDesc")}</span>
                </p>
              </div>
              <Button 
                size="sm"
                onClick={() => navigate("/member/upgrade")}
                className="gap-2 shrink-0"
              >
                <Crown className="w-4 h-4" />
                {t("freeMember.upgrade.cta")}
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
                <DialogTitle className="font-display text-xl">{t("freeMember.benefitsDialog.title")}</DialogTitle>
              </DialogHeader>

              {/* Free Features */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-700 rounded-full px-3 py-1 text-xs font-bold">
                      {t("freeMember.benefitsDialog.freeBadge")}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { icon: MapPin, label: t("freeMember.benefitsDialog.directory"), desc: t("freeMember.benefitsDialog.directoryDesc"), color: "text-teal-600 bg-teal-100" },
                      { icon: AlertTriangle, label: t("freeMember.benefitsDialog.lostFound"), desc: t("freeMember.benefitsDialog.lostFoundDesc"), color: "text-amber-600 bg-amber-100" },
                      { icon: Users, label: t("freeMember.benefitsDialog.qa"), desc: t("freeMember.benefitsDialog.qaDesc"), color: "text-indigo-600 bg-indigo-100" },
                      { icon: Gift, label: t("freeMember.benefitsDialog.browseOffers"), desc: t("freeMember.benefitsDialog.browseOffersDesc"), color: "text-purple-600 bg-purple-100" },
                      { icon: Heart, label: t("freeMember.benefitsDialog.petProfiles"), desc: t("freeMember.benefitsDialog.petProfilesDesc"), color: "text-rose-600 bg-rose-100" },
                      { icon: Syringe, label: t("freeMember.benefitsDialog.petHealth"), desc: t("freeMember.benefitsDialog.petHealthDesc"), color: "text-blue-600 bg-blue-100" },
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
                      {t("freeMember.benefitsDialog.premiumBadge")}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { icon: Gift, label: t("freeMember.benefitsDialog.exclusive"), desc: t("freeMember.benefitsDialog.exclusiveDesc"), color: "text-primary bg-primary/10" },
                      { icon: Bot, label: t("freeMember.benefitsDialog.ai"), desc: t("freeMember.benefitsDialog.aiDesc"), color: "text-violet-600 bg-violet-100" },
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
                    {t("freeMember.benefitsDialog.premiumNote")}<span className="font-bold text-primary">{t("freeMember.benefitsDialog.perYear")}</span>{t("freeMember.benefitsDialog.premiumNoteEnd")}
                  </p>
                </div>
              </div>

              <Button 
                className="w-full mt-1 gap-2" 
                onClick={() => { setShowComingSoon(false); navigate("/member/upgrade"); }}
              >
                <Crown className="w-4 h-4" />
                {t("freeMember.upgrade.cta")}
              </Button>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </>
  );
};

export default FreeMemberDashboard;
