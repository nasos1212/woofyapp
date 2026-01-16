import { dogBreeds } from "./dogBreeds";
import { catBreeds } from "./catBreeds";

export type PetType = "dog" | "cat";

export const getBreedsByPetType = (petType: PetType): string[] => {
  return petType === "dog" ? dogBreeds : catBreeds;
};

export const getPetTypeEmoji = (petType: PetType): string => {
  return petType === "dog" ? "🐕" : "🐱";
};

export const getPetTypeLabel = (petType: PetType): string => {
  return petType === "dog" ? "Dog" : "Cat";
};
