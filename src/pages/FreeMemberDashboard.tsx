import { Helmet } from "react-helmet-async";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { 
  Users, 
  Gift, 
  Heart, 
  Bot, 
  AlertTriangle, 
  Syringe, 
  Lock, 
  Sparkles,
  ArrowRight,
  MessageSquarePlus,
  Crown,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import DogLoader from "@/components/DogLoader";
import { useAuth } from "@/hooks/useAuth";
import { useMembership } from "@/hooks/useMembership";

interface LockedFeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  benefit: string;
}

const LockedFeatureCard = ({ title, description, icon, benefit }: LockedFeatureCardProps) => (
  <Card className="relative overflow-hidden group hover:shadow-lg transition-all">
    <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted/80 backdrop-blur-[1px] z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
      <div className="text-center p-4">
        <Lock className="w-8 h-8 text-primary mx-auto mb-2" />
        <p className="text-sm font-medium text-foreground">Upgrade to unlock</p>
      </div>
    </div>
    <CardHeader className="pb-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
          {icon}
        </div>
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">{benefit}</p>
    </CardContent>
    <div className="absolute top-2 right-2">
      <Lock className="w-4 h-4 text-muted-foreground" />
    </div>
  </Card>
);

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

  // If user has membership, redirect to full dashboard
  if (hasMembership) {
    return <Navigate to="/member" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Welcome to Wooffy | Free Member</title>
        <meta name="description" content="Join the Wooffy community and explore what's available for members." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-wooffy-light to-background">
        <Header />

        <main className="container mx-auto px-4 py-8 pt-24">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-amber-100/50 rounded-2xl p-6 md:p-8 mb-8 border border-primary/20">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Welcome to Wooffy! 🐾
                </h1>
                <p className="text-muted-foreground max-w-xl">
                  You have free access to our Community Hub. Upgrade to unlock exclusive discounts, 
                  pet profiles, AI health assistant, and more!
                </p>
              </div>
              <Button 
                variant="hero" 
                size="lg" 
                className="shrink-0 gap-2"
                onClick={() => navigate("/member/onboarding")}
              >
                <Crown className="w-5 h-5" />
                Upgrade Now
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Community Hub - Full Access */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                  <Users className="w-6 h-6 text-primary" />
                  Community Hub
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-normal">
                    Full Access
                  </span>
                </h2>
                <p className="text-sm text-muted-foreground">
                  Connect with fellow pet owners, ask questions, and share experiences
                </p>
              </div>
            </div>

            <Card className="bg-gradient-to-br from-cyan-50 to-teal-50 border-cyan-200 hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <MessageSquarePlus className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-teal-800">
                        Join the Conversation
                      </h3>
                      <p className="text-teal-600/80 text-sm">
                        Ask questions, share tips, help other pet parents
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <Button 
                      onClick={() => navigate("/community")}
                      className="flex-1 md:flex-none bg-teal-600 hover:bg-teal-700"
                    >
                      Browse Questions
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate("/community/ask")}
                      className="flex-1 md:flex-none border-teal-300 text-teal-700 hover:bg-teal-50"
                    >
                      Ask a Question
                    </Button>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-cyan-200">
                  <div className="text-center">
                    <p className="font-bold text-2xl text-teal-700">∞</p>
                    <p className="text-xs text-teal-600/70">Questions</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-2xl text-teal-700">∞</p>
                    <p className="text-xs text-teal-600/70">Answers</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-2xl text-teal-700">250+</p>
                    <p className="text-xs text-teal-600/70">Pet Parents</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upgrade CTA */}
          <div className="bg-gradient-to-r from-primary to-amber-500 rounded-2xl p-6 md:p-8 mb-8 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl">Unlock All Features</h3>
                  <p className="text-white/80">
                    Get €500+ in yearly savings, pet profiles, AI assistant & more
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">€59</p>
                  <p className="text-white/70 text-sm">/year</p>
                </div>
                <Button 
                  variant="secondary" 
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90"
                  onClick={() => navigate("/member/onboarding")}
                >
                  Get Your Pass
                </Button>
              </div>
            </div>
          </div>

          {/* Locked Features Grid */}
          <div className="mb-8">
            <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-muted-foreground" />
              Member-Only Features
            </h2>
            <p className="text-muted-foreground mb-6">
              Upgrade your account to unlock these exclusive benefits
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <LockedFeatureCard
                title="Exclusive Offers"
                description="500+ partner businesses"
                icon={<Gift className="w-5 h-5 text-primary" />}
                benefit="Get 10-50% off at pet shops, groomers, hotels, vets & more"
              />
              <LockedFeatureCard
                title="Pet Profiles"
                description="Digital pet passports"
                icon={<Heart className="w-5 h-5 text-rose-500" />}
                benefit="Store photos, health info, and track your pet's milestones"
              />
              <LockedFeatureCard
                title="AI Health Assistant"
                description="24/7 pet health advice"
                icon={<Bot className="w-5 h-5 text-violet-500" />}
                benefit="Get instant answers to health questions from our AI vet"
              />
              <LockedFeatureCard
                title="Health Records"
                description="Vaccination tracking"
                icon={<Syringe className="w-5 h-5 text-blue-500" />}
                benefit="Never miss a vaccination with smart reminders"
              />
              <LockedFeatureCard
                title="Lost Pet Alerts"
                description="Community network"
                icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
                benefit="Instant alerts to 250+ pet owners if your pet goes missing"
              />
              <LockedFeatureCard
                title="10% to Shelters"
                description="Support animals in need"
                icon={<Shield className="w-5 h-5 text-green-500" />}
                benefit="10% of your membership fee goes to local animal shelters"
              />
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Ready to unlock all the benefits?
            </p>
            <Button 
              variant="hero" 
              size="xl"
              className="gap-2"
              onClick={() => navigate("/member/onboarding")}
            >
              <Crown className="w-5 h-5" />
              Upgrade to Full Membership
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </main>
      </div>
    </>
  );
};

export default FreeMemberDashboard;
