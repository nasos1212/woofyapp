// Cyprus (Greek Cypriot controlled areas) - Cities and their areas
export interface CyprusArea {
  name: string;
  areas: string[];
}

export const cyprusCities: CyprusArea[] = [
  {
    name: "Nicosia (Lefkosia)",
    areas: [
      "City Center",
      "Strovolos",
      "Lakatamia",
      "Engomi",
      "Aglantzia",
      "Latsia",
      "Geri",
      "Dali",
      "Tseri",
      "Pallouriotissa",
      "Kaimakli",
    ],
  },
  {
    name: "Limassol (Lemesos)",
    areas: [
      "City Center",
      "Tourist Area",
      "Germasogeia",
      "Agios Athanasios",
      "Mesa Geitonia",
      "Zakaki",
      "Polemidia",
      "Ypsonas",
      "Erimi",
      "Parekklisia",
      "Mouttagiaka",
    ],
  },
  {
    name: "Larnaca (Larnaka)",
    areas: [
      "City Center",
      "Finikoudes",
      "Mackenzie",
      "Livadia",
      "Aradippou",
      "Dromolaxia",
      "Oroklini",
      "Pervolia",
      "Kiti",
      "Kamares",
    ],
  },
  {
    name: "Paphos (Pafos)",
    areas: [
      "Kato Paphos",
      "Paphos Town",
      "Chloraka",
      "Emba",
      "Tala",
      "Peyia",
      "Geroskipou",
      "Kissonerga",
      "Coral Bay",
      "Yeroskipou",
    ],
  },
  {
    name: "Famagusta (Ammochostos)",
    areas: [
      "Paralimni",
      "Ayia Napa",
      "Protaras",
      "Deryneia",
      "Sotira",
      "Frenaros",
      "Liopetri",
      "Xylofagou",
    ],
  },
];

// Flat list of all cities for simple selection
export const cyprusCityNames = cyprusCities.map((city) => city.name);

// Get areas for a specific city
export const getAreasForCity = (cityName: string): string[] => {
  const city = cyprusCities.find((c) => c.name === cityName);
  return city ? city.areas : [];
};

// Format location string (city + area)
export const formatLocation = (city: string, area?: string): string => {
  if (area) {
    return `${area}, ${city}`;
  }
  return city;
};
