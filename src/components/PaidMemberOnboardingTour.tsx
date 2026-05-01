import {
  Gift,
  MapPin,
  Syringe,
  Bot,
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
    title: "Welcome, Member! 🎉",
    description:
      "You've unlocked the full Wooffy experience. Here's a quick tour of your premium perks!",
  },
  {
    icon: Gift,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    title: "Exclusive Offers 🎁",
    description:
      "Browse and redeem discounts from our verified partner businesses, just show your membership card!",
  },
  {
    icon: Syringe,
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    title: "Pet Health Records 💉",
    description:
      "Keep vaccinations, vet visits, and reminders organised in one place. Never miss an appointment again.",
  },
  {
    icon: Bot,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    title: "AI Health Assistant 🤖",
    description:
      "Get instant, breed-aware health advice for your pet powered by AI, available 24/7.",
  },
  {
    icon: MapPin,
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    title: "Places, Community & More 📍",
    description:
      "Discover dog-friendly places, ask questions in the community, and post lost & found alerts.",
  },
  {
    icon: Heart,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    title: "Support Shelters ❤️",
    description:
      "10% of your membership goes to local shelters. Browse them, meet adoptable pets, and donate directly.",
  },
  {
    icon: PartyPopper,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    title: "You're All Set! 🥳",
    description:
      "Start exploring your dashboard, your membership saves you an average of €200+ per year!",
  },
];

const PaidMemberOnboardingTour = () => (
  <OnboardingTour storageKey="wooffy_paid_member_tour_seen" steps={steps} />
);

export default PaidMemberOnboardingTour;
