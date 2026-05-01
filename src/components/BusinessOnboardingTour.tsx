import {
  Building2,
  ScanLine,
  Gift,
  BarChart3,
  Cake,
  Sparkles,
  PartyPopper,
} from "lucide-react";
import OnboardingTour, { type TourStep } from "./OnboardingTour";

const steps: TourStep[] = [
  {
    icon: Sparkles,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    title: "Welcome, Partner! 🎉",
    description:
      "Thanks for joining Wooffy as a business partner. Let's walk through your dashboard!",
  },
  {
    icon: ScanLine,
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    title: "Scan & Verify Members 📱",
    description:
      "Use the QR scanner or enter a member ID to verify Wooffy members and confirm offer redemptions.",
  },
  {
    icon: Gift,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    title: "Manage Your Offers 🎁",
    description:
      "Create and manage exclusive offers for Wooffy members. Set discounts, terms, and redemption rules.",
  },
  {
    icon: Cake,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    title: "Pet Birthday Offers 🎂",
    description:
      "Send special birthday offers to pets in your area, a great way to build loyalty and delight customers!",
  },
  {
    icon: BarChart3,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    title: "Analytics & Insights 📊",
    description:
      "Track redemptions, see popular offers, and understand your Wooffy customer base with detailed analytics.",
  },
  {
    icon: Building2,
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    title: "Your Business Profile 🏪",
    description:
      "Keep your profile up to date, add photos, business hours, locations, and social links to attract more pet parents.",
  },
  {
    icon: PartyPopper,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    title: "You're Ready! 🥳",
    description:
      "Start verifying members and managing your offers. Welcome to the Wooffy community!",
  },
];

const BusinessOnboardingTour = () => (
  <OnboardingTour
    storageKey="wooffy_business_tour_seen"
    steps={steps}
    accentGradient="from-primary via-amber-400 to-primary"
  />
);

export default BusinessOnboardingTour;
