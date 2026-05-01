import {
  Home,
  Heart,
  ImageIcon,
  PawPrint,
  Globe,
  Sparkles,
  PartyPopper,
} from "lucide-react";
import OnboardingTour, { type TourStep } from "./OnboardingTour";

const steps: TourStep[] = [
  {
    icon: Sparkles,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    title: "Welcome, Partner Shelter! 🎉",
    description:
      "Thank you for joining Wooffy. Here's a quick guide to your shelter dashboard!",
  },
  {
    icon: Home,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    title: "Your Shelter Profile 🏠",
    description:
      "Keep your basic info, description, and mission statement up to date so pet lovers can learn about you.",
  },
  {
    icon: ImageIcon,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    title: "Branding & Gallery 📸",
    description:
      "Upload a logo, cover photo, and gallery images to make your profile stand out and tell your story.",
  },
  {
    icon: PawPrint,
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    title: "Adoptable Pets 🐾",
    description:
      "List your pets available for adoption with photos and descriptions, and receive inquiries directly!",
  },
  {
    icon: Globe,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    title: "Social & Donations 🌐",
    description:
      "Add your website, social media, and donation link so visitors can follow and support you.",
  },
  {
    icon: Heart,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    title: "Revenue Share ❤️",
    description:
      "As an approved shelter, you receive a share of 10% of Wooffy membership proceeds. Thank you for what you do!",
  },
  {
    icon: PartyPopper,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    title: "You're All Set! 🥳",
    description:
      "Start building your profile and listing adoptable pets. The Wooffy community is behind you!",
  },
];

const ShelterOnboardingTour = () => (
  <OnboardingTour
    storageKey="wooffy_shelter_tour_seen"
    steps={steps}
    accentGradient="from-rose-400 via-rose-500 to-rose-400"
  />
);

export default ShelterOnboardingTour;
