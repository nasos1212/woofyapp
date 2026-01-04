import { Dog, Star, Crown } from "lucide-react";

interface MembershipCardProps {
  memberName?: string;
  petName?: string;
  memberSince?: string;
}

const MembershipCard = ({ 
  memberName = "John Smith", 
  petName = "Max",
  memberSince = "2024"
}: MembershipCardProps) => {
  return (
    <div className="relative w-full max-w-md mx-auto group">
      {/* Glow effect */}
      <div className="absolute -inset-2 bg-woofy-blue/50 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
      
      {/* Card */}
      <div className="relative bg-woofy-dark rounded-3xl p-6 sm:p-8 shadow-card overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-woofy-blue/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-woofy-blue/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        {/* Header */}
        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Dog className="w-8 h-8 text-woofy-sky" />
            <span className="font-display font-bold text-2xl text-woofy-sky">Woofy</span>
          </div>
          <div className="flex items-center gap-1">
            <Crown className="w-5 h-5 text-woofy-accent" />
            <span className="text-sm font-medium text-woofy-light">Premium</span>
          </div>
        </div>

        {/* Member info */}
        <div className="relative space-y-4">
          <div>
            <p className="text-woofy-light/70 text-sm">Member</p>
            <p className="font-display font-semibold text-xl text-woofy-sky">{memberName}</p>
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <p className="text-woofy-light/70 text-sm">Furry Friend</p>
              <p className="font-display font-semibold text-lg text-woofy-sky">{petName}</p>
            </div>
            <div className="text-right">
              <p className="text-woofy-light/70 text-sm">Since</p>
              <p className="font-display font-semibold text-woofy-sky">{memberSince}</p>
            </div>
          </div>

          {/* Stars */}
          <div className="flex gap-1 pt-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-woofy-accent text-woofy-accent" />
            ))}
          </div>
        </div>

        {/* Card number */}
        <div className="relative mt-6 pt-4 border-t border-woofy-blue/30">
          <p className="font-mono text-sm text-woofy-light/80 tracking-wider">
            WF-2026-XXXX-XXXX
          </p>
        </div>
      </div>
    </div>
  );
};

export default MembershipCard;
