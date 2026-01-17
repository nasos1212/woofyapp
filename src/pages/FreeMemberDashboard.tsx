import { Helmet } from "react-helmet-async";
import { Navigate, useNavigate } from "react-router-dom";
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
  Shield,
  HelpCircle,
  Trophy,
  Bookmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import DogLoader from "@/components/DogLoader";
import { useAuth } from "@/hooks/useAuth";
import { useMembership } from "@/hooks/useMembership";

const FreeMemberDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasMembership, loading: membershipLoading } = useMembership();
  const navigate = useNavigate();

  if (authLoading || membershipLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (hasMembership) {
    return <Navigate to="/member" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Community Hub | Wooffy</title>
        <meta name="description" content="Join the Wooffy pet community - ask questions, share experiences, and connect with pet parents." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-cyan-50/50 via-background to-background">
        <Header />

        <main className="container mx-auto px-4 py-8 pt-24">
          {/* Welcome Header - Simple & Clean */}
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-1">
              Welcome back! 🐾
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
                  <button 
                    onClick={() => navigate("/community/leaderboard")}
                    className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
                  >
                    <Trophy className="w-4 h-4" />
                    <span className="text-sm font-medium">Top Contributors</span>
                  </button>
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

          {/* Lost Pet Alerts - Secondary Feature */}
          <div className="mb-8">
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200/50 hover:shadow-md transition-all">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Lost Pet Alerts</h3>
                      <p className="text-sm text-muted-foreground">
                        Help reunite pets with their families
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => navigate("/member/lost-pets")}
                    className="border-amber-300 text-amber-700 hover:bg-amber-50 gap-2"
                  >
                    View Alerts
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
                onClick={() => navigate("/member/onboarding")}
              >
                See membership benefits
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { icon: Gift, label: "Partner Discounts", color: "text-primary" },
                { icon: Heart, label: "Pet Profiles", color: "text-rose-500" },
                { icon: Bot, label: "AI Assistant", color: "text-violet-500" },
                { icon: Syringe, label: "Health Records", color: "text-blue-500" },
                { icon: Shield, label: "Shelter Support", color: "text-green-500" },
              ].map(({ icon: Icon, label, color }) => (
                <button
                  key={label}
                  onClick={() => navigate("/member/onboarding")}
                  className="group p-3 rounded-xl bg-muted/50 hover:bg-muted border border-transparent hover:border-border transition-all text-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <Icon className={`w-5 h-5 ${color} opacity-60 group-hover:opacity-100 transition-opacity`} />
                      <Lock className="w-3 h-3 text-muted-foreground absolute -bottom-1 -right-1" />
                    </div>
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                      {label}
                    </span>
                  </div>
                </button>
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
                onClick={() => navigate("/member/onboarding")}
                className="gap-2 shrink-0"
              >
                <Crown className="w-4 h-4" />
                Upgrade · €59/year
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
};

export default FreeMemberDashboard;
