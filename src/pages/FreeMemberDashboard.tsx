import { Helmet } from "react-helmet-async";
import { Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Users,
  Gift,
  Heart,
  Bot,
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
  BookOpen,
  AlertTriangle,
  Syringe,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
        const [shelterResult, shelterRoleResult, businessResult, businessRoleResult] = await Promise.all([
          supabase.from("shelters").select("id, verification_status").eq("user_id", user.id).maybeSingle(),
          supabase.rpc("has_role", { _user_id: user.id, _role: "shelter" }),
          supabase.from("businesses").select("id").eq("user_id", user.id).maybeSingle(),
          supabase.rpc("has_role", { _user_id: user.id, _role: "business" }),
        ]);

        if (shelterResult.data) {
          setRedirectPath("/shelter-dashboard");
          return;
        }

        if (shelterRoleResult.data) {
          setRedirectPath("/shelter-onboarding");
          return;
        }

        if (businessResult.data) {
          setRedirectPath("/business");
          return;
        }

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
      <div className="min-h-screen flex items-center justify-center bg-warm-100">
        <DogLoader size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  if (isPaidMember) {
    return <Navigate to="/member" replace />;
  }

  const mainServices = [
    { icon: Building2, label: t("freeMember.cards.partners"), path: "/member/partners" },
    { icon: AlertTriangle, label: t("freeMember.cards.lostFound"), path: "/member/lost-found" },
    { icon: MapPin, label: t("freeMember.cards.places"), path: "/member/pet-friendly-places" },
    { icon: Gift, label: t("freeMember.cards.browseOffers"), path: "/member/offers" },
  ];

  const extraServices = [
    { icon: Heart, label: t("freeMember.cards.shelters"), path: "/member/shelters" },
    { icon: Syringe, label: t("freeMember.cards.health"), path: "/member/health-records" },
  ];

  return (
    <>
      <Helmet>
        <title>{t("freeMember.pageTitle")}</title>
        <meta name="description" content={t("freeMember.pageDescription")} />
      </Helmet>

      <div className="min-h-screen bg-warm-100 overflow-x-hidden">
        <Header />
        <FreemiumOnboardingTour />

        <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 pt-[calc(6rem+env(safe-area-inset-top))] box-border">
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

          {/* Top Section: My Pets */}
          <div className="bg-warm-50 rounded-[2rem] sm:rounded-[2.5rem] border border-warm-300 shadow-[0_32px_64px_-16px_rgba(60,40,20,0.06)] overflow-hidden mb-6">
            <div className="p-6 sm:p-10 pb-6">
              <div className="flex items-end justify-between mb-8 gap-3 flex-wrap">
                <div>
                  <h2 className="font-lora text-2xl sm:text-3xl font-bold text-warm-900 tracking-tight">
                    {t("freeMember.pets.title")}
                  </h2>
                  <p className="text-warm-600 text-sm mt-1">
                    {pets.length === 0
                      ? t("freeMember.pets.emptyDesc")
                      : t("freeMember.subtitle")}
                  </p>
                </div>
                {pets.length > 0 && (
                  <button
                    onClick={() => navigate("/member/add-pet")}
                    className="px-5 py-2 text-sm font-semibold bg-warm-200 text-warm-800 rounded-full hover:bg-warm-300 transition-colors border border-warm-400 flex items-center gap-1.5"
                  >
                    {t("freeMember.pets.addPet")}
                    <PlusCircle className="w-4 h-4" />
                  </button>
                )}
              </div>

              {pets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="w-20 h-20 rounded-full bg-warm-200 flex items-center justify-center mb-4">
                    <Dog className="w-9 h-9 text-warm-600" />
                  </div>
                  <h3 className="font-lora font-semibold text-warm-900 mb-2 text-lg">
                    {t("freeMember.pets.empty")}
                  </h3>
                  <p className="text-sm text-warm-600 mb-6 max-w-md text-center">
                    {t("freeMember.pets.emptyDesc")}
                  </p>
                  <button
                    onClick={() => navigate("/member/add-pet")}
                    className="px-6 py-3 bg-terracotta text-warm-950 rounded-xl text-sm font-bold hover:bg-terracotta-dark transition-colors flex items-center gap-2"
                  >
                    <PlusCircle className="w-5 h-5" />
                    {t("freeMember.pets.addFirst")}
                  </button>
                </div>
              ) : (
                <div className="flex gap-5 sm:gap-8 overflow-x-auto pb-4 scrollbar-hide">
                  {pets.map((pet, idx) => (
                    <div
                      key={pet.id}
                      className="flex-shrink-0 group cursor-pointer"
                      onClick={() => navigate(`/member/pet/${pet.id}`)}
                    >
                      <div
                        className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1.5 border-2 transition-all ${
                          idx === 0
                            ? "border-terracotta ring-4 ring-terracotta/10"
                            : "border-transparent group-hover:border-warm-300"
                        }`}
                      >
                        {pet.photo_url ? (
                          <img
                            src={pet.photo_url}
                            alt={pet.pet_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-warm-200 flex items-center justify-center">
                            {pet.pet_type === 'cat' ? (
                              <Cat className="w-7 h-7 sm:w-8 sm:h-8 text-warm-600" />
                            ) : (
                              <Dog className="w-7 h-7 sm:w-8 sm:h-8 text-warm-600" />
                            )}
                          </div>
                        )}
                      </div>
                      <p
                        className={`text-center mt-2 sm:mt-3 text-sm font-semibold truncate max-w-[5.5rem] sm:max-w-[6rem] mx-auto ${
                          idx === 0 ? "text-warm-900" : "text-warm-600 group-hover:text-warm-900"
                        }`}
                      >
                        {pet.pet_name}
                      </p>
                    </div>
                  ))}
                  <div
                    className="flex-shrink-0 flex flex-col items-center justify-center cursor-pointer"
                    onClick={() => navigate("/member/add-pet")}
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-warm-200 border-2 border-dashed border-warm-400 flex items-center justify-center text-warm-500 hover:bg-warm-300 hover:border-warm-500 transition-all">
                      <span className="text-3xl font-light">+</span>
                    </div>
                    <p className="text-center mt-2 sm:mt-3 font-medium text-sm text-warm-500">
                      {t("freeMember.pets.addPet")}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Community Hub + Quick Access Grid */}
            <div className="grid lg:grid-cols-3 gap-0 border-t border-warm-300">
              {/* Community Hub */}
              <div className="lg:col-span-2 p-6 sm:p-10 border-b lg:border-b-0 lg:border-r border-warm-300 bg-white/40">
                <div className="flex items-center justify-between mb-6 sm:mb-8 gap-3 flex-wrap">
                  <h3 className="font-lora text-xl font-bold text-warm-900">
                    {t("freeMember.hub.title")}
                  </h3>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-widest">
                    Active Now
                  </span>
                </div>

                {recentQuestions.length === 0 ? (
                  <div className="text-center py-8 text-warm-600 text-sm">
                    {t("freeMember.hub.description")}
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="relative overflow-hidden rounded-2xl border border-warm-300 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                      <div
                        className="flex transition-transform duration-500 ease-in-out"
                        style={{ transform: `translateX(-${currentQuestionIdx * 100}%)` }}
                      >
                        {recentQuestions.map((q) => (
                          <button
                            key={q.id}
                            onClick={() => navigate(`/community/question/${q.id}`)}
                            className="w-full shrink-0 text-left p-5 sm:p-6 hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)] transition-all"
                          >
                            <div className="flex gap-4 sm:gap-5">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-warm-100 overflow-hidden flex-shrink-0 border border-warm-300 flex items-center justify-center">
                                <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-warm-600" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-warm-900 leading-snug">
                                  {q.title}
                                </h4>
                                <p className="text-xs sm:text-sm text-warm-600 mt-2 leading-relaxed line-clamp-2">
                                  {q.helped_count > 0
                                    ? `${q.helped_count} ${q.helped_count === 1 ? "person" : "people"} helped`
                                    : "Be the first to help"}
                                </p>
                                <div className="flex items-center gap-4 mt-3 text-[11px] font-semibold text-warm-500 uppercase tracking-wider">
                                  <span>{new Date(q.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => setCurrentQuestionIdx((i) => (i - 1 + recentQuestions.length) % recentQuestions.length)}
                        disabled={recentQuestions.length < 2}
                        className="p-2 rounded-xl bg-warm-200 text-warm-700 hover:bg-warm-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-1.5">
                        {recentQuestions.map((_, i) => (
                          <span
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              i === currentQuestionIdx ? "w-5 bg-terracotta" : "w-1.5 bg-warm-400"
                            }`}
                          />
                        ))}
                      </div>
                      <button
                        onClick={() => setCurrentQuestionIdx((i) => (i + 1) % recentQuestions.length)}
                        disabled={recentQuestions.length < 2}
                        className="p-2 rounded-xl bg-warm-200 text-warm-700 hover:bg-warm-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
                  <button
                    onClick={() => navigate("/community")}
                    className="flex items-center gap-2 text-warm-700 hover:text-warm-900 transition-colors text-sm font-medium"
                  >
                    <MessageSquarePlus className="w-4 h-4" />
                    {t("freeMember.hub.browse")}
                  </button>
                  <button
                    onClick={() => navigate("/community?tab=saved")}
                    className="flex items-center gap-2 text-warm-500 hover:text-warm-700 transition-colors text-sm"
                  >
                    <Bookmark className="w-4 h-4" />
                    <span className="font-medium">{t("freeMember.hub.saved")}</span>
                  </button>
                </div>
              </div>

              {/* Quick Access & Upgrade */}
              <div className="bg-warm-200/50 p-6 sm:p-10 flex flex-col">
                <div className="mb-8 sm:mb-10">
                  <h3 className="text-[11px] font-black text-warm-600 uppercase tracking-[0.2em] mb-6">
                    Quick Access
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {mainServices.map(({ icon: Icon, label, path }) => (
                      <button
                        key={path}
                        onClick={() => navigate(path)}
                        className="aspect-square flex flex-col items-center justify-center p-3 sm:p-4 bg-white rounded-2xl border border-warm-300 hover:border-terracotta hover:shadow-lg hover:shadow-terracotta/5 transition-all group"
                      >
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-warm-100 flex items-center justify-center mb-2 group-hover:bg-terracotta/10 transition-colors">
                          <Icon className="w-5 h-5 text-warm-700 group-hover:text-terracotta transition-colors" />
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-bold text-warm-900 uppercase tracking-wider text-center leading-tight">
                          {label}
                        </span>
                      </button>
                    ))}
                    {showAllServices &&
                      extraServices.map(({ icon: Icon, label, path }) => (
                        <button
                          key={path}
                          onClick={() => navigate(path)}
                          className="aspect-square flex flex-col items-center justify-center p-3 sm:p-4 bg-white rounded-2xl border border-warm-300 hover:border-terracotta hover:shadow-lg hover:shadow-terracotta/5 transition-all group"
                        >
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-warm-100 flex items-center justify-center mb-2 group-hover:bg-terracotta/10 transition-colors">
                            <Icon className="w-5 h-5 text-warm-700 group-hover:text-terracotta transition-colors" />
                          </div>
                          <span className="text-[10px] sm:text-[11px] font-bold text-warm-900 uppercase tracking-wider text-center leading-tight">
                            {label}
                          </span>
                        </button>
                      ))}
                  </div>
                  <button
                    onClick={() => setShowAllServices((v) => !v)}
                    className="mt-4 w-full text-xs text-terracotta hover:text-terracotta-dark font-semibold transition-colors"
                  >
                    {showAllServices ? "Show less" : "See more services"}
                  </button>
                </div>

                {/* Upgrade CTA */}
                <div className="mt-auto p-6 sm:p-8 bg-warm-950 rounded-[2rem] text-white relative overflow-hidden">
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-terracotta/20 rounded-full blur-3xl" />
                  <div className="relative z-10">
                    <h4 className="font-lora text-xl font-bold mb-2">
                      {t("freeMember.upgrade.unlock")}
                    </h4>
                    <p className="text-warm-500 text-xs leading-relaxed mb-5 font-medium">
                      {t("freeMember.upgrade.unlockDesc")}
                    </p>
                    <button
                      onClick={() => navigate("/member/upgrade")}
                      className="w-full py-3.5 bg-terracotta hover:bg-terracotta-dark text-warm-950 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all active:scale-[0.98] shadow-xl shadow-terracotta/10 flex items-center justify-center gap-2"
                    >
                      <Crown className="w-4 h-4" />
                      {t("freeMember.upgrade.cta")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Blog Card */}
          <button
            onClick={() => navigate("/blog")}
            className="w-full text-left bg-warm-50 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-warm-300 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)] transition-all mb-6 flex items-center gap-4 group"
          >
            <div className="w-12 h-12 flex-shrink-0 bg-warm-200 rounded-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-warm-700" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-lora font-semibold text-warm-900">{t("header.blog")}</h3>
              <p className="text-sm text-warm-600">{t("blog.discoverCardSubtitle", { defaultValue: "Tips, guides and stories for pet parents" })}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-warm-500 group-hover:text-warm-900 group-hover:translate-x-1 transition-all shrink-0" />
          </button>

          {/* Benefits Dialog */}
          <Dialog open={showComingSoon} onOpenChange={setShowComingSoon}>
            <DialogContent className="sm:max-w-lg bg-warm-50 border-warm-300">
              <DialogHeader className="items-center text-center">
                <div className="w-14 h-14 bg-terracotta/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Sparkles className="w-7 h-7 text-terracotta" />
                </div>
                <DialogTitle className="font-lora text-xl text-warm-900">
                  {t("freeMember.benefitsDialog.title")}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 rounded-full px-3 py-1 text-xs font-bold">
                      {t("freeMember.benefitsDialog.freeBadge")}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { icon: MapPin, label: t("freeMember.benefitsDialog.directory"), desc: t("freeMember.benefitsDialog.directoryDesc") },
                      { icon: AlertTriangle, label: t("freeMember.benefitsDialog.lostFound"), desc: t("freeMember.benefitsDialog.lostFoundDesc") },
                      { icon: Users, label: t("freeMember.benefitsDialog.qa"), desc: t("freeMember.benefitsDialog.qaDesc") },
                      { icon: Gift, label: t("freeMember.benefitsDialog.browseOffers"), desc: t("freeMember.benefitsDialog.browseOffersDesc") },
                      { icon: Heart, label: t("freeMember.benefitsDialog.petProfiles"), desc: t("freeMember.benefitsDialog.petProfilesDesc") },
                      { icon: Syringe, label: t("freeMember.benefitsDialog.petHealth"), desc: t("freeMember.benefitsDialog.petHealthDesc") },
                    ].map(({ icon: Icon, label, desc }) => (
                      <div key={label} className="flex items-center gap-3 p-2 rounded-lg">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-warm-200">
                          <Icon className="w-4 h-4 text-warm-700" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-warm-900">{label}</p>
                          <p className="text-xs text-warm-600">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 bg-terracotta/10 text-terracotta rounded-full px-3 py-1 text-xs font-bold">
                      {t("freeMember.benefitsDialog.premiumBadge")}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { icon: Gift, label: t("freeMember.benefitsDialog.exclusive"), desc: t("freeMember.benefitsDialog.exclusiveDesc") },
                      { icon: Bot, label: t("freeMember.benefitsDialog.ai"), desc: t("freeMember.benefitsDialog.aiDesc") },
                    ].map(({ icon: Icon, label, desc }) => (
                      <div key={label} className="flex items-center gap-3 p-2 rounded-lg opacity-75">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-warm-200">
                          <Icon className="w-4 h-4 text-warm-700" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-warm-900">{label}</p>
                            <Lock className="w-3 h-3 text-warm-500" />
                          </div>
                          <p className="text-xs text-warm-600">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-warm-200 rounded-xl p-3 border border-warm-300 text-center">
                  <p className="text-xs text-warm-600">
                    {t("freeMember.benefitsDialog.premiumNote")}
                    <span className="font-bold text-terracotta">{t("freeMember.benefitsDialog.perYear")}</span>
                    {t("freeMember.benefitsDialog.premiumNoteEnd")}
                  </p>
                </div>
              </div>

              <Button
                className="w-full mt-1 gap-2 bg-terracotta hover:bg-terracotta-dark text-warm-950"
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
