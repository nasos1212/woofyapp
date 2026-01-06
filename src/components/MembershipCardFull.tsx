import { Dog, Star, Crown, Shield } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface MembershipCardFullProps {
  memberName?: string;
  petName?: string;
  memberSince?: string;
  memberId?: string;
  expiryDate?: string;
}

const MembershipCardFull = ({ 
  memberName = "John Smith", 
  petName = "Max",
  memberSince = "2024",
  memberId = "WF-2026-XXXX-XXXX",
  expiryDate = "Dec 25, 2025"
}: MembershipCardFullProps) => {
  // Generate a verification URL for the QR code
  const verificationUrl = `https://wooffy.app/verify/${memberId}`;

  return (
    <div className="relative w-full max-w-lg mx-auto group">
      {/* Glow effect */}
      <div className="absolute -inset-2 bg-wooffy-blue/50 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
      
      {/* Card */}
      <div className="relative bg-wooffy-dark rounded-3xl p-6 sm:p-8 shadow-card overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-wooffy-blue/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-wooffy-blue/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        {/* Header */}
        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Dog className="w-8 h-8 text-wooffy-sky" />
            <span className="font-display font-bold text-2xl text-wooffy-sky">Wooffy</span>
          </div>
          <div className="flex items-center gap-1">
            <Crown className="w-5 h-5 text-wooffy-accent" />
            <span className="text-sm font-medium text-wooffy-light">Premium</span>
          </div>
        </div>

        <div className="relative flex flex-col sm:flex-row gap-6">
          {/* Member info */}
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-wooffy-light/70 text-sm">Member</p>
              <p className="font-display font-semibold text-xl text-wooffy-sky">{memberName}</p>
            </div>
            
            <div className="flex justify-between items-end">
              <div>
                <p className="text-wooffy-light/70 text-sm">Furry Friend</p>
                <p className="font-display font-semibold text-lg text-wooffy-sky">{petName}</p>
              </div>
              <div className="text-right">
                <p className="text-wooffy-light/70 text-sm">Since</p>
                <p className="font-display font-semibold text-wooffy-sky">{memberSince}</p>
              </div>
            </div>

            {/* Stars */}
            <div className="flex gap-1 pt-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-wooffy-accent text-wooffy-accent" />
              ))}
            </div>

            {/* Validity */}
            <div className="flex items-center gap-2 pt-2">
              <Shield className="w-4 h-4 text-wooffy-light/80" />
              <span className="text-sm text-wooffy-light/80">Valid until: <strong>{expiryDate}</strong></span>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center">
            <div className="bg-white p-3 rounded-xl shadow-lg">
              <QRCodeSVG 
                value={verificationUrl}
                size={100}
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="text-xs text-wooffy-light/60 mt-2 text-center">Scan to verify</p>
          </div>
        </div>

        {/* Card number */}
        <div className="relative mt-6 pt-4 border-t border-wooffy-blue/30">
          <p className="text-wooffy-light/60 text-xs mb-1">Member ID</p>
          <p className="font-mono text-sm sm:text-base text-wooffy-light/90 tracking-wide break-all">
            {memberId}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MembershipCardFull;
