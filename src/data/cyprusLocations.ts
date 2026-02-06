// Cyprus (Greek Cypriot controlled areas) - Cities and their areas with coordinates

export interface AreaWithCoords {
  name: string;
  lat: number;
  lng: number;
}

export interface CyprusCityWithCoords {
  name: string;
  lat: number;
  lng: number;
  areas: AreaWithCoords[];
}

export const cyprusCitiesWithCoords: CyprusCityWithCoords[] = [
  {
    name: "Nicosia",
    lat: 35.1856,
    lng: 33.3823,
    areas: [
      { name: "City Center", lat: 35.1746, lng: 33.3639 },
      { name: "Strovolos", lat: 35.1333, lng: 33.3500 },
      { name: "Lakatamia", lat: 35.1167, lng: 33.3000 },
      { name: "Engomi", lat: 35.1667, lng: 33.3500 },
      { name: "Aglantzia", lat: 35.1500, lng: 33.4000 },
      { name: "Latsia", lat: 35.0833, lng: 33.3667 },
      { name: "Geri", lat: 35.0667, lng: 33.4167 },
      { name: "Dali", lat: 35.0167, lng: 33.4167 },
      { name: "Tseri", lat: 35.0667, lng: 33.3167 },
      { name: "Pallouriotissa", lat: 35.1833, lng: 33.3833 },
      { name: "Kaimakli", lat: 35.1833, lng: 33.3667 },
    ],
  },
  {
    name: "Limassol",
    lat: 34.6786,
    lng: 33.0413,
    areas: [
      { name: "City Center", lat: 34.6786, lng: 33.0413 },
      { name: "Tourist Area", lat: 34.6900, lng: 33.0900 },
      { name: "Germasogeia", lat: 34.7000, lng: 33.1000 },
      { name: "Agios Athanasios", lat: 34.6900, lng: 33.0100 },
      { name: "Mesa Geitonia", lat: 34.6700, lng: 33.0300 },
      { name: "Zakaki", lat: 34.6600, lng: 32.9900 },
      { name: "Polemidia", lat: 34.7000, lng: 32.9900 },
      { name: "Ypsonas", lat: 34.6900, lng: 32.9600 },
      { name: "Erimi", lat: 34.6700, lng: 32.9100 },
      { name: "Parekklisia", lat: 34.7300, lng: 33.1400 },
      { name: "Mouttagiaka", lat: 34.7100, lng: 33.1200 },
    ],
  },
  {
    name: "Larnaca",
    lat: 34.9229,
    lng: 33.6232,
    areas: [
      { name: "City Center", lat: 34.9229, lng: 33.6232 },
      { name: "Finikoudes", lat: 34.9150, lng: 33.6350 },
      { name: "Mackenzie", lat: 34.8800, lng: 33.6100 },
      { name: "Livadia", lat: 34.9500, lng: 33.6300 },
      { name: "Aradippou", lat: 34.9500, lng: 33.5800 },
      { name: "Dromolaxia", lat: 34.8700, lng: 33.5900 },
      { name: "Oroklini", lat: 34.9800, lng: 33.6500 },
      { name: "Pervolia", lat: 34.8400, lng: 33.5600 },
      { name: "Kiti", lat: 34.8400, lng: 33.5700 },
      { name: "Kamares", lat: 34.9300, lng: 33.5900 },
    ],
  },
  {
    name: "Paphos",
    lat: 34.7754,
    lng: 32.4245,
    areas: [
      { name: "Kato Paphos", lat: 34.7550, lng: 32.4100 },
      { name: "Paphos Town", lat: 34.7754, lng: 32.4245 },
      { name: "Chloraka", lat: 34.7900, lng: 32.4100 },
      { name: "Emba", lat: 34.8100, lng: 32.4200 },
      { name: "Tala", lat: 34.8500, lng: 32.4300 },
      { name: "Peyia", lat: 34.8700, lng: 32.3600 },
      { name: "Geroskipou", lat: 34.7600, lng: 32.4500 },
      { name: "Kissonerga", lat: 34.8200, lng: 32.3800 },
      { name: "Coral Bay", lat: 34.8500, lng: 32.3500 },
      { name: "Yeroskipou", lat: 34.7600, lng: 32.4500 },
    ],
  },
  {
    name: "Famagusta",
    lat: 35.1174,
    lng: 33.9420,
    areas: [
      { name: "Paralimni", lat: 35.0400, lng: 33.9800 },
      { name: "Ayia Napa", lat: 34.9900, lng: 34.0000 },
      { name: "Protaras", lat: 35.0100, lng: 34.0500 },
      { name: "Deryneia", lat: 35.0600, lng: 33.9600 },
      { name: "Sotira", lat: 35.0300, lng: 33.9200 },
      { name: "Frenaros", lat: 35.0500, lng: 33.9200 },
      { name: "Liopetri", lat: 35.0100, lng: 33.9000 },
      { name: "Xylofagou", lat: 35.0200, lng: 33.8500 },
    ],
  },
];

// Legacy interface for backwards compatibility
export interface CyprusArea {
  name: string;
  areas: string[];
}

// Legacy array for backwards compatibility
export const cyprusCities: CyprusArea[] = cyprusCitiesWithCoords.map(city => ({
  name: city.name,
  areas: city.areas.map(a => a.name),
}));

// Flat list of all cities for simple selection
export const cyprusCityNames = cyprusCitiesWithCoords.map((city) => city.name);

// Get areas for a specific city
export const getAreasForCity = (cityName: string): string[] => {
  const city = cyprusCitiesWithCoords.find((c) => c.name === cityName);
  return city ? city.areas.map(a => a.name) : [];
};

// Get coordinates for a specific city and optionally area
export const getCoordinatesForLocation = (
  cityName: string,
  areaName?: string
): { lat: number; lng: number } => {
  const city = cyprusCitiesWithCoords.find((c) => c.name === cityName);
  
  if (!city) {
    // Default to Cyprus center
    return { lat: 35.1264, lng: 33.4299 };
  }
  
  if (areaName) {
    const area = city.areas.find((a) => a.name === areaName);
    if (area) {
      return { lat: area.lat, lng: area.lng };
    }
  }
  
  // Return city center if no area specified or area not found
  return { lat: city.lat, lng: city.lng };
};

// Format location string (city + area)
export const formatLocation = (city: string, area?: string): string => {
  if (area) {
    return `${area}, ${city}`;
  }
  return city;
};
