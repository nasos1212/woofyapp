import { Dog, Crown } from "lucide-react";

interface MembershipCardProps {
  memberName?: string;
  petName?: string;
  memberSince?: string;
}

const MembershipCard = ({ 
  memberName = "Your Name", 
  petName = "Your Pet's Name",
  memberSince = "2026"
}: MembershipCardProps) => {
  return (
    <div className="relative w-full max-w-sm mx-auto group aspect-[1.6/1]">
      {/* Glow effect */}
      <div className="absolute -inset-2 bg-wooffy-blue/50 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
      
      {/* Card */}
      <div className="relative h-full bg-wooffy-dark rounded-2xl p-5 sm:p-6 shadow-card overflow-hidden flex flex-col justify-between">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-wooffy-blue/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-wooffy-blue/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        {/* Header */}
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dog className="w-6 h-6 text-wooffy-sky" />
            <span className="font-display font-bold text-xl text-wooffy-sky">Wooffy</span>
          </div>
          <div className="flex items-center gap-1">
            <Crown className="w-4 h-4 text-wooffy-accent" />
            <span className="text-xs font-medium text-wooffy-light">Premium</span>
          </div>
        </div>

        {/* Member info */}
        <div className="relative flex justify-between items-end">
          <div>
            <p className="text-wooffy-light/70 text-xs">Member</p>
            <p className="font-display font-semibold text-base text-wooffy-sky">{memberName}</p>
            <p className="text-wooffy-light/70 text-xs mt-2">Furry Friend</p>
            <p className="font-display font-semibold text-sm text-wooffy-sky">{petName}</p>
          </div>
          <div className="text-right">
            <p className="text-wooffy-light/70 text-xs">Since</p>
            <p className="font-display font-semibold text-sm text-wooffy-sky">{memberSince}</p>
          </div>
        </div>

        {/* Card number */}
        <div className="relative pt-2 border-t border-wooffy-blue/30">
          <p className="font-mono text-xs text-wooffy-light/80 tracking-wider">
            WF-2026-XXXX-XXXX
          </p>
        </div>
      </div>
    </div>
  );
};

export default MembershipCard;
