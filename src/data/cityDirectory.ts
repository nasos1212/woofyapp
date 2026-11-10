export interface DirectoryCity {
  slug: string;
  name: string;
  intro: string;
}

// Short, factual intros only; no invented business claims.
export const DIRECTORY_CITIES: DirectoryCity[] = [
  { slug: "limassol", name: "Limassol", intro: "Find pet shops, vets, groomers and dog-friendly cafés, restaurants and beaches in Limassol, listed by the Wooffy community." },
  { slug: "nicosia", name: "Nicosia", intro: "Find pet shops, vets, groomers and dog-friendly cafés, restaurants and parks in Nicosia, listed by the Wooffy community." },
  { slug: "larnaca", name: "Larnaca", intro: "Find pet shops, vets, groomers and dog-friendly cafés, restaurants and beaches in Larnaca, listed by the Wooffy community." },
  { slug: "paphos", name: "Paphos", intro: "Find pet shops, vets, groomers and dog-friendly cafés, restaurants and beaches in Paphos, listed by the Wooffy community." },
  { slug: "famagusta", name: "Famagusta", intro: "Find pet shops, vets, groomers and dog-friendly places in the Famagusta district, listed by the Wooffy community." },
];

export const getDirectoryCity = (slug?: string) => DIRECTORY_CITIES.find((c) => c.slug === slug?.toLowerCase());
