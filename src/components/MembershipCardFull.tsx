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
    <div className="relative w-full max-w-md mx-auto group">
      {/* Glow effect */}
      <div className="absolute -inset-2 bg-wooffy-blue/50 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
      
      {/* Card - credit card aspect ratio */}
      <div className="relative bg-wooffy-dark rounded-2xl p-5 shadow-card overflow-hidden aspect-[1.7/1]">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-wooffy-blue/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-wooffy-blue/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        {/* Content wrapper */}
        <div className="relative h-full flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dog className="w-6 h-6 text-wooffy-sky" />
              <span className="font-display font-bold text-xl text-wooffy-sky">Wooffy</span>
            </div>
            <div className="flex items-center gap-1">
              <Crown className="w-4 h-4 text-wooffy-accent" />
              <span className="text-xs font-medium text-wooffy-light">Premium</span>
            </div>
          </div>

          {/* Main content row */}
          <div className="flex gap-4 items-end">
            {/* Member info */}
            <div className="flex-1 min-w-0">
              <div className="flex gap-4 items-end">
                <div className="flex-1 min-w-0">
                  <p className="text-wooffy-light/70 text-xs">Member</p>
                  <p className="font-display font-semibold text-base text-wooffy-sky truncate">{memberName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-wooffy-light/70 text-xs">Since</p>
                  <p className="font-display font-semibold text-sm text-wooffy-sky">{memberSince}</p>
                </div>
              </div>
              <div className="mt-1">
                <p className="text-wooffy-light/70 text-xs">
                  {petNames && petNames.length > 1 ? "Furry Friends" : "Furry Friend"}
                </p>
                <p className="font-display font-semibold text-sm text-wooffy-sky truncate">{formatPetDisplay()}</p>
              </div>
            </div>

            {/* QR Code */}
            <div className="shrink-0 flex flex-col items-center">
              <div className="bg-white p-2 rounded-lg shadow-lg">
                <QRCodeSVG 
                  value={verificationUrl}
                  size={56}
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-wooffy-blue/30">
            <div>
              <p className="font-mono text-xs text-wooffy-light/80 tracking-wider">{memberId}</p>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-wooffy-light/60" />
              <span className="text-xs text-wooffy-light/60">Valid: {expiryDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipCardFull;
