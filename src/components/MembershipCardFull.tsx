import { Dog, Crown } from "lucide-react";
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
  memberSince = "2026",
  memberId = "WF-2026-XXXX-XXXX",
  expiryDate = "25/12/2025"
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
    <div className="relative w-full max-w-md lg:max-w-lg mx-auto group aspect-[1.6/1] overflow-hidden">
      {/* Glow effect */}
      <div className="absolute -inset-2 bg-wooffy-blue/50 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
      
      {/* Card */}
      <div className="relative h-full bg-wooffy-dark rounded-2xl p-4 sm:p-5 lg:p-6 shadow-card overflow-hidden flex flex-col justify-between">
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

        {/* Member info with QR code */}
        <div className="relative flex justify-between items-start mt-2 sm:mt-0">
          <div className="pl-2">
            <p className="text-wooffy-light/70 text-sm">Member</p>
            <p className="font-display font-semibold text-lg text-wooffy-sky">{memberName}</p>
            <p className="text-wooffy-light/70 text-sm mt-2">
              {petNames && petNames.length > 1 ? "Furry Friends" : "Furry Friend"}
            </p>
            <p className="font-display font-semibold text-base text-wooffy-sky">{formatPetDisplay()}</p>
          </div>
          
          {/* QR Code */}
          <div className="flex flex-col items-center">
            <div className="bg-white p-2 rounded-lg">
              <QRCodeSVG 
                value={verificationUrl}
                size={88}
                level="M"
                bgColor="#ffffff"
                fgColor="#1a1f36"
              />
            </div>
            <p className="text-wooffy-light/60 text-[10px] mt-1">Scan to verify</p>
          </div>
        </div>

        {/* Card number */}
        <div className="relative pt-2 border-t border-wooffy-blue/30 flex justify-between items-center">
          <div>
            <p className="text-wooffy-light/70 text-[10px]">Member ID</p>
            <p className="font-mono text-xs text-wooffy-light/80 tracking-wider">
              {memberId}
            </p>
          </div>
          <p className="text-wooffy-light/70 text-xs">
            Valid until: {expiryDate}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MembershipCardFull;
