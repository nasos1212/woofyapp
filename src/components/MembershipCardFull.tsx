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
  memberId = "PP-2024-XXXX-XXXX",
  expiryDate = "Dec 25, 2025"
}: MembershipCardFullProps) => {
  // Generate a verification URL for the QR code
  const verificationUrl = `https://woofy.app/verify/${memberId}`;

  return (
    <div className="relative w-full max-w-lg mx-auto group">
      {/* Glow effect */}
      <div className="absolute -inset-2 bg-gradient-hero rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
      
      {/* Card */}
      <div className="relative bg-gradient-hero rounded-3xl p-6 sm:p-8 shadow-card overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary-foreground/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-foreground/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        {/* Header */}
        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Dog className="w-8 h-8 text-primary-foreground" />
            <span className="font-display font-bold text-2xl text-primary-foreground">Woofy</span>
          </div>
          <div className="flex items-center gap-1">
            <Crown className="w-5 h-5 text-yellow-300" />
            <span className="text-sm font-medium text-primary-foreground/90">Premium</span>
          </div>
        </div>

        <div className="relative flex flex-col sm:flex-row gap-6">
          {/* Member info */}
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-primary-foreground/70 text-sm">Member</p>
              <p className="font-display font-semibold text-xl text-primary-foreground">{memberName}</p>
            </div>
            
            <div className="flex justify-between items-end">
              <div>
                <p className="text-primary-foreground/70 text-sm">Furry Friend</p>
                <p className="font-display font-semibold text-lg text-primary-foreground">{petName}</p>
              </div>
              <div className="text-right">
                <p className="text-primary-foreground/70 text-sm">Since</p>
                <p className="font-display font-semibold text-primary-foreground">{memberSince}</p>
              </div>
            </div>

            {/* Stars */}
            <div className="flex gap-1 pt-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-300 text-yellow-300" />
              ))}
            </div>

            {/* Validity */}
            <div className="flex items-center gap-2 pt-2">
              <Shield className="w-4 h-4 text-primary-foreground/80" />
              <span className="text-sm text-primary-foreground/80">Valid until: <strong>{expiryDate}</strong></span>
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
            <p className="text-xs text-primary-foreground/60 mt-2 text-center">Scan to verify</p>
          </div>
        </div>

        {/* Card number */}
        <div className="relative mt-6 pt-4 border-t border-primary-foreground/20">
          <p className="font-mono text-sm text-primary-foreground/80 tracking-wider">
            {memberId}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MembershipCardFull;
