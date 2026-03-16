export interface BusinessCategoryOption {
  value: string;
  label: string;
}

export const businessCategories: BusinessCategoryOption[] = [
  { value: "trainer", label: "Dog Trainer" },
  { value: "pet_shop", label: "Pet Shop" },
  { value: "hotel", label: "Pet Hotel" },
  { value: "grooming", label: "Grooming" },
  { value: "vet", label: "Veterinary" },
  { value: "daycare", label: "Daycare / Pet Sitter" },
  { value: "physio", label: "Physiotherapy" },
  { value: "accessories", label: "Accessories" },
  { value: "pet_transport", label: "Pet Transport" },
  { value: "pet_photography", label: "Pet Photography" },
  { value: "dog_walking", label: "Dog Walking" },
  { value: "pet_insurance", label: "Pet Insurance" },
  { value: "other", label: "Other" },
];

export const getCategoryLabel = (category: string): string => {
  return businessCategories.find((c) => c.value === category)?.label || category;
};

export const getCategoriesLabel = (categories: string[]): string => {
  if (!categories || categories.length === 0) return "N/A";
  return categories.map(getCategoryLabel).join(", ");
};
