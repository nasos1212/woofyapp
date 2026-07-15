export interface PetFriendlyPlaceTypeOption {
  value: string;
  label: string;
}

export const petFriendlyPlaceTypes: PetFriendlyPlaceTypeOption[] = [
  { value: "beach", label: "Beach" },
  { value: "cafe", label: "Café" },
  { value: "restaurant", label: "Restaurant" },
  { value: "bar", label: "Bar" },
  { value: "hotel", label: "Hotel" },
  { value: "park", label: "Park" },
  { value: "nature_trail", label: "Nature Trail" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "patisserie", label: "Patisserie" },
  { value: "store", label: "Retail Store" },
  { value: "office", label: "Office" },
  { value: "other", label: "Other" },
];

export const petFriendlyPlaceTypeLabels: Record<string, string> = Object.fromEntries(
  petFriendlyPlaceTypes.map(({ value, label }) => [value, label])
);

export const sortPetFriendlyPlaceTypesByLabel = (
  types: string[],
  getLabel: (value: string) => string,
  language: string
): string[] => {
  return [...types].sort((a, b) => {
    const aIsOther = a === "other";
    const bIsOther = b === "other";
    if (aIsOther && !bIsOther) return 1;
    if (!aIsOther && bIsOther) return -1;
    return getLabel(a).localeCompare(getLabel(b), language);
  });
};