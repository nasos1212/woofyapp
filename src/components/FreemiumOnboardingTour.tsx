import {
  Users,
  AlertTriangle,
  MapPin,
  Heart,
  Sparkles,
  PartyPopper,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import OnboardingTour, { type TourStep } from "./OnboardingTour";

const FreemiumOnboardingTour = () => {
  const { t } = useTranslation();

  const steps: TourStep[] = [
    {
      icon: Sparkles,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      title: t("freemium.tour.welcome.title"),
      description: t("freemium.tour.welcome.desc"),
    },
    {
      icon: Users,
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600",
      title: t("freemium.tour.community.title"),
      description: t("freemium.tour.community.desc"),
    },
    {
      icon: AlertTriangle,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      title: t("freemium.tour.lostFound.title"),
      description: t("freemium.tour.lostFound.desc"),
    },
    {
      icon: MapPin,
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600",
      title: t("freemium.tour.places.title"),
      description: t("freemium.tour.places.desc"),
    },
    {
      icon: Heart,
      iconBg: "bg-rose-100",
      iconColor: "text-rose-600",
      title: t("freemium.tour.shelters.title"),
      description: t("freemium.tour.shelters.desc"),
    },
    {
      icon: PartyPopper,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      title: t("freemium.tour.done.title"),
      description: t("freemium.tour.done.desc"),
    },
  ];

  return <OnboardingTour storageKey="wooffy_freemium_tour_seen" steps={steps} />;
};

export default FreemiumOnboardingTour;
