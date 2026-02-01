import { Dog, Crown, Shield } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface MembershipCardFullProps {
  memberName?: string;
  petName?: string;
  petNames?: string[];
  memberSince?: string;
  memberId?: string;
  expiryDate?: string;
}

const MembershipCardFull = ({ 
  memberName = "Your Name", 
  petName = "Your Pet's Name",
  petNames,
  memberSince = "2024",
  memberId = "WF-2026-XXXX-XXXX",
  expiryDate = "Dec 25, 2025"
}: MembershipCardFullProps) => {
  // Generate a verification URL for the QR code
  const verificationUrl = `https://wooffy.app/verify/${memberId}`;

  // Format pet display - show all pet names
  const formatPetDisplay = () => {
    if (petNames && petNames.length > 0) {
      return petNames.join(", ");
    }
    return petName;
  };

  return (
    <div className="relative w-full sm:max-w-lg mx-auto group">
      {/* Glow effect - hidden on mobile to prevent overflow */}
      <div className="absolute inset-0 bg-wooffy-blue/30 rounded-2xl sm:rounded-3xl blur-xl opacity-0 sm:opacity-30 group-hover:opacity-50 transition-opacity duration-500 sm:-inset-2" />
      
      {/* Card */}
      <div className="relative bg-wooffy-dark rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-card overflow-hidden">
        {/* Decorative elements - smaller on mobile */}
        <div className="absolute top-0 right-0 w-24 sm:w-40 h-24 sm:h-40 bg-wooffy-blue/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-20 sm:w-32 h-20 sm:h-32 bg-wooffy-blue/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        {/* Header */}
        <div className="relative flex items-center justify-between mb-4 sm:mb-5">
          <div className="flex items-center gap-2">
            <Dog className="w-6 sm:w-8 h-6 sm:h-8 text-wooffy-sky" />
            <span className="font-display font-bold text-xl sm:text-2xl text-wooffy-sky">Wooffy</span>
          </div>
          <div className="flex items-center gap-1">
            <Crown className="w-4 sm:w-5 h-4 sm:h-5 text-wooffy-accent" />
            <span className="text-xs sm:text-sm font-medium text-wooffy-light">Premium</span>
          </div>
        </div>

        {/* Main content */}
        <div className="relative flex gap-3 sm:gap-5">
          {/* Member info */}
          <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
            <div>
              <p className="text-wooffy-light/70 text-xs sm:text-sm">Member</p>
              <p className="font-display font-semibold text-lg sm:text-xl text-wooffy-sky truncate">{memberName}</p>
            </div>
            
            <div>
              <p className="text-wooffy-light/70 text-xs sm:text-sm">
                {petNames && petNames.length > 1 ? "Furry Friends" : "Furry Friend"}
              </p>
              <p className="font-display font-semibold text-base sm:text-lg text-wooffy-sky truncate">{formatPetDisplay()}</p>
            </div>
          </div>

          {/* QR Code - positioned slightly towards center */}
          <div className="shrink-0 flex flex-col items-center justify-center ml-auto mr-2 sm:mr-4">
            <div className="bg-white p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg">
              <QRCodeSVG 
                value={verificationUrl}
                size={100}
                level="H"
                includeMargin={false}
                className="w-[70px] h-[70px] sm:w-[100px] sm:h-[100px]"
              />
            </div>
            <p className="text-[10px] sm:text-xs text-wooffy-light/60 mt-1 sm:mt-1.5">Scan to verify</p>
          </div>
        </div>

        {/* Footer */}
        <div className="relative mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-wooffy-blue/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <div className="min-w-0">
            <p className="text-wooffy-light/60 text-[10px] sm:text-xs mb-0.5">Member ID</p>
            <p className="font-mono text-xs sm:text-sm text-wooffy-light/90 tracking-wide truncate">{memberId}</p>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Shield className="w-3 sm:w-4 h-3 sm:h-4 text-wooffy-light/70" />
            <span className="text-xs sm:text-sm text-wooffy-light/70">Valid: {expiryDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipCardFull;
