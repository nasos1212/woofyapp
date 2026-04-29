import { Dog, Crown } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";

interface MembershipCardProps {
  memberName?: string;
  petName?: string;
  memberSince?: string;
}

const MembershipCard = ({
  memberName = "Your Name",
  petName = "Your Pet's Name",
  memberSince = "2026",
}: MembershipCardProps) => {
  const { t } = useTranslation();
  return (
    <div className="relative w-full max-w-md lg:max-w-lg mx-auto group aspect-[1.6/1]">
      <div className="absolute -inset-2 bg-wooffy-blue/50 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
      <div className="relative h-full bg-wooffy-dark rounded-2xl p-5 sm:p-6 shadow-card overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-40 h-40 bg-wooffy-blue/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-wooffy-blue/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dog className="w-6 h-6 text-wooffy-sky" />
            <span className="font-display font-bold text-xl text-wooffy-sky">Wooffy</span>
          </div>
          <div className="flex items-center gap-1">
            <Crown className="w-4 h-4 text-wooffy-accent" />
            <span className="text-xs font-medium text-wooffy-light">{t("membershipCard.premium")}</span>
          </div>
        </div>

        <div className="relative flex justify-between items-start">
          <div className="pl-2">
            <p className="text-wooffy-light/70 text-sm">{t("membershipCard.member")}</p>
            <p className="font-display font-semibold text-lg text-wooffy-sky">{memberName}</p>
            <p className="text-wooffy-light/70 text-sm mt-2">{t("membershipCard.furryFriend")}</p>
            <p className="font-display font-semibold text-base text-wooffy-sky">{petName}</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-white p-2 rounded-lg">
              <QRCodeSVG value="WF-2026-DEMO" size={88} level="M" bgColor="#ffffff" fgColor="#1a1f36" />
            </div>
            <p className="text-wooffy-light/60 text-[10px] mt-1">{t("membershipCard.scanToVerify")}</p>
          </div>
        </div>

        <div className="relative pt-2 border-t border-wooffy-blue/30 flex justify-between items-center">
          <div>
            <p className="text-wooffy-light/70 text-[10px]">{t("membershipCard.memberId")}</p>
            <p className="font-mono text-xs text-wooffy-light/80 tracking-wider">WF-2026-XX</p>
          </div>
          <p className="text-wooffy-light/70 text-xs">
            {t("membershipCard.since", { year: memberSince })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MembershipCard;
