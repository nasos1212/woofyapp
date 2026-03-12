import { MapPin, CheckCircle, Clock, Store } from "lucide-react";
import PetFriendlyPlaceRequestDialog from "./PetFriendlyPlaceRequestDialog";

const GetListedSection = () => {
  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-primary/5 to-background relative overflow-hidden">
      <div className="absolute top-10 right-[10%] text-4xl opacity-10 animate-bounce-slow">📍</div>
      <div className="absolute bottom-10 left-[8%] text-3xl opacity-10 animate-float">🐾</div>

      <div className="container mx-auto px-4 max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-700 dark:text-green-400 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          <Store className="w-4 h-4" />
          For Pet-Friendly Businesses
        </div>

        <h2 className="text-2xl sm:text-4xl font-display font-bold text-foreground mb-4">
          Get Your Place Listed — <span className="text-primary">100% Free</span>
        </h2>

        <p className="text-muted-foreground text-base sm:text-lg mb-8 max-w-xl mx-auto">
          No sign-up, no account, no fees. Just fill in a quick form and we'll add your pet-friendly place to our directory after a quick review.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border shadow-soft">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm font-medium text-foreground">No Account Needed</p>
            <p className="text-xs text-muted-foreground">Just submit the form</p>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border shadow-soft">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">Visible to All Users</p>
            <p className="text-xs text-muted-foreground">Free & paid members see you</p>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border shadow-soft">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-sm font-medium text-foreground">Quick Review</p>
            <p className="text-xs text-muted-foreground">We verify & list you fast</p>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          <PetFriendlyPlaceRequestDialog />
        </div>
      </div>
    </section>
  );
};

export default GetListedSection;
