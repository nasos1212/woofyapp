import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Crown, Sparkles, MapPin, Search, Users, Heart, PawPrint, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import DogLoader from "@/components/DogLoader";
import { useAuth } from "@/hooks/useAuth";
import { useAccountType } from "@/hooks/useAccountType";
import { useMembership } from "@/hooks/useMembership";

const MemberUpgrade = () => {
  const { user, loading } = useAuth();
  const { isBusiness, loading: accountTypeLoading } = useAccountType();
  const { hasMembership } = useMembership();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !accountTypeLoading && isBusiness) {
      navigate("/business");
    }
  }, [loading, accountTypeLoading, isBusiness, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DogLoader size="lg" />
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Premium Plans | Wooffy</title>
        <meta name="description" content="Premium plans are coming soon to Wooffy." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-wooffy-light to-background overflow-x-hidden">
        <Header />

        <main className="w-full max-w-2xl mx-auto px-4 py-8 pt-[calc(6rem+env(safe-area-inset-top))] box-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(hasMembership ? "/member" : "/member/free")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="text-center space-y-6">
            {/* Icon */}
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Crown className="w-10 h-10 text-primary" />
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-3">
                Something Exciting is Coming! 🐾
              </h1>
              <p className="text-muted-foreground text-base leading-relaxed max-w-md mx-auto">
                Premium plans are on their way! We're working hard to bring you exclusive discounts, 
                AI health assistant, pet birthday offers and much more.
              </p>
            </div>

            {/* What you can enjoy now */}
            <div className="bg-card rounded-2xl p-6 border border-border shadow-card text-left">
              <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                In the meantime, enjoy your free features:
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Search className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">Lost & Found Alerts</p>
                    <p className="text-xs text-muted-foreground">Report and search for lost or found pets</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">Dog-Friendly Places</p>
                    <p className="text-xs text-muted-foreground">Discover dog-friendly spots near you</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">Community Q&A</p>
                    <p className="text-xs text-muted-foreground">Connect with fellow pet parents</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Promise */}
            <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Heart className="w-4 h-4 text-primary" />
                We'll notify you as soon as premium plans are available!
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => navigate(hasMembership ? "/member" : "/member/free")}
            >
              Back to Dashboard
            </Button>
          </div>
        </main>
      </div>
    </>
  );
};

export default MemberUpgrade;
