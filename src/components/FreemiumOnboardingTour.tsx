import {
  Users,
  AlertTriangle,
  MapPin,
  Heart,
  Sparkles,
  PartyPopper,
} from "lucide-react";
import OnboardingTour, { type TourStep } from "./OnboardingTour";

const steps: TourStep[] = [
  {
    icon: Sparkles,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    title: "Welcome to Wooffy! 🎉",
    description:
      "Your free membership gives you access to amazing pet community features. Let us show you around!",
  },
  {
    icon: Users,
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    title: "Community Q&A 💬",
    description:
      "Ask questions, share experiences, and get advice from fellow pet parents across Cyprus. Your voice matters!",
  },
  {
    icon: AlertTriangle,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    title: "Lost & Found Alerts 🔍",
    description:
      "Report or find lost pets in your area. Together, we help reunite pets with their families — fast.",
  },
  {
    icon: MapPin,
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    title: "Dog-Friendly Places 📍",
    description:
      "Discover cafés, parks, beaches and more that welcome your furry friends. Rate and review your favourites!",
  },
  {
    icon: Heart,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    title: "Support Shelters ❤️",
    description:
      "Browse local shelters, meet adoptable pets, and make a difference in an animal's life.",
  },
  {
    icon: PartyPopper,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    title: "You're All Set! 🥳",
    description:
      "Start exploring — all of these features are completely free. Enjoy being part of the Wooffy community!",
  },
];

const FreemiumOnboardingTour = () => (
  <OnboardingTour storageKey="wooffy_freemium_tour_seen" steps={steps} />
);

export default FreemiumOnboardingTour;
