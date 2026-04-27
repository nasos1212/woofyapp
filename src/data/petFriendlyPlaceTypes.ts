export const petFriendlyPlaceTypes = [
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
] as const;

export const petFriendlyPlaceTypeLabels: Record<string, string> = Object.fromEntries(
  petFriendlyPlaceTypes.map(({ value, label }) => [value, label])
);