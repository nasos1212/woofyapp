export interface CityService {
  slug: string;
  label: string;        // plural, used in titles e.g. "Pet Shops"
  categories: string[]; // business categories included
  blurb: string;
}

export const CITY_SERVICES: CityService[] = [
  { slug: "pet-shops", label: "Pet Shops", categories: ["pet_shop", "accessories", "pet_food_supplier"], blurb: "pet shops, pet food and accessories" },
  { slug: "vets", label: "Vets", categories: ["vet"], blurb: "veterinary clinics and vets" },
  { slug: "grooming", label: "Dog Grooming", categories: ["grooming"], blurb: "dog and cat groomers" },
  { slug: "dog-trainers", label: "Dog Trainers", categories: ["trainer"], blurb: "dog trainers and behaviour specialists" },
  { slug: "pet-hotels", label: "Pet Hotels", categories: ["hotel"], blurb: "pet hotels and boarding" },
  { slug: "pet-sitters", label: "Pet Sitters & Dog Walkers", categories: ["daycare", "dog_walking"], blurb: "pet sitters, daycare and dog walkers" },
];

export const getCityService = (slug?: string) => CITY_SERVICES.find((s) => s.slug === slug?.toLowerCase());

export const businessMatchesService = (b: { category: string; categories?: string[] | null }, s: CityService) =>
  [b.category, ...(b.categories ?? [])].some((c) => s.categories.includes(c));
