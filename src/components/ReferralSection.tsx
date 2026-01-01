import { useState } from "react";
import { Copy, Check, Gift, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useReferrals } from "@/hooks/useReferrals";

interface ReferralSectionProps {
  userName: string;
}

const ReferralSection = ({ userName }: ReferralSectionProps) => {
  const {
    referralCode,
    referrals,
    generateReferralCode,
    copyReferralCode,
    getCompletedReferrals,
  } = useReferrals();
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    await generateReferralCode(userName);
    setIsGenerating(false);
  };

  const handleCopy = () => {
    copyReferralCode();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const completedReferrals = getCompletedReferrals();

  return (
    <div className="bg-white rounded-2xl p-6 shadow-soft">
      <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
        <Gift className="w-5 h-5 text-primary" />
        Refer Friends
      </h3>

      <p className="text-sm text-muted-foreground mb-4">
        Share PawPass with friends! When they sign up, you'll both benefit from exclusive rewards.
      </p>

      {referralCode ? (
        <>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 bg-muted rounded-lg px-4 py-3 font-mono text-lg font-semibold tracking-wider text-center">
              {referralCode}
            </div>
            <Button variant="outline" size="icon" onClick={handleCopy}>
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Friends referred:</span>
            </div>
            <span className="font-semibold text-foreground">{referrals.length}</span>
          </div>

          {completedReferrals >= 3 && (
            <div className="mt-3 p-3 bg-paw-gold/10 rounded-lg">
              <p className="text-sm text-paw-gold font-medium flex items-center gap-2">
                🏆 Referral Master! You've referred 3+ friends
              </p>
            </div>
          )}
        </>
      ) : (
        <Button
          onClick={handleGenerateCode}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? "Generating..." : "Get Your Referral Code"}
        </Button>
      )}
    </div>
  );
};

export default ReferralSection;
