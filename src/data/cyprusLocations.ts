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
      // Urban areas
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
      { name: "Anthoupolis", lat: 35.1500, lng: 33.3300 },
      { name: "Makedonitissa", lat: 35.1600, lng: 33.3400 },
      // Suburban & villages
      { name: "Deftera (Pano)", lat: 35.1100, lng: 33.2900 },
      { name: "Deftera (Kato)", lat: 35.1000, lng: 33.2800 },
      { name: "Kokkinotrimithia", lat: 35.1500, lng: 33.2600 },
      { name: "Ergates", lat: 35.1100, lng: 33.4200 },
      { name: "Lythrodontas", lat: 34.9700, lng: 33.4500 },
      { name: "Psimolofou", lat: 35.1000, lng: 33.2500 },
      { name: "Peristerona", lat: 35.1200, lng: 33.0800 },
      { name: "Akaki", lat: 35.1300, lng: 33.2200 },
      { name: "Meniko", lat: 35.1100, lng: 33.1900 },
      { name: "Astromeritis", lat: 35.1400, lng: 33.1200 },
      { name: "Orounta", lat: 35.1100, lng: 33.1500 },
      { name: "Politiko", lat: 35.0600, lng: 33.4300 },
      { name: "Pera Chorio", lat: 35.0400, lng: 33.4400 },
      { name: "Pera Orinis", lat: 35.0200, lng: 33.3500 },
      { name: "Mammari", lat: 35.1800, lng: 33.2700 },
      // Troodos foothills / mountain villages
      { name: "Kakopetria", lat: 34.9800, lng: 32.9000 },
      { name: "Galata", lat: 34.9900, lng: 32.9100 },
      { name: "Kalopanagiotis", lat: 34.9900, lng: 32.8300 },
      { name: "Pedoulas", lat: 34.9700, lng: 32.8300 },
      { name: "Moutoullas", lat: 34.9800, lng: 32.8400 },
      { name: "Evrychou", lat: 35.0200, lng: 32.9200 },
      { name: "Agros", lat: 34.9200, lng: 33.0200 },
      { name: "Askas", lat: 34.9500, lng: 33.0000 },
      { name: "Lagoudera", lat: 34.9500, lng: 33.0300 },
      { name: "Platanistasa", lat: 34.9600, lng: 33.0500 },
      { name: "Polystypos", lat: 34.9600, lng: 33.0200 },
      { name: "Agios Sozomenos", lat: 35.0500, lng: 33.5000 },
      { name: "Mathiatis", lat: 35.0400, lng: 33.3700 },
      { name: "Kampia", lat: 35.0500, lng: 33.2800 },
      // Additional villages & communities
      { name: "Agios Dhometios", lat: 35.1700, lng: 33.3500 },
      { name: "Agrokipia", lat: 35.0700, lng: 33.3400 },
      { name: "Alampra", lat: 35.0300, lng: 33.4800 },
      { name: "Analiontas", lat: 35.0300, lng: 33.3200 },
      { name: "Arediou", lat: 35.1100, lng: 33.1700 },
      { name: "Deneia", lat: 35.1700, lng: 33.2400 },
      { name: "Farmakas", lat: 34.9400, lng: 33.0800 },
      { name: "Fikardou", lat: 34.9700, lng: 33.1200 },
      { name: "Flasou", lat: 35.0800, lng: 32.9600 },
      { name: "Gourri", lat: 34.9700, lng: 33.1500 },
      { name: "Kapedes", lat: 35.0100, lng: 33.2200 },
      { name: "Kataliontas", lat: 35.0200, lng: 33.3000 },
      { name: "Kato Pyrgos", lat: 35.1700, lng: 32.6800 },
      { name: "Katydata", lat: 35.0800, lng: 32.9200 },
      { name: "Klirou", lat: 35.0300, lng: 33.2600 },
      { name: "Linou", lat: 35.0600, lng: 33.0200 },
      { name: "Lympia", lat: 35.0100, lng: 33.4700 },
      { name: "Mitsero", lat: 35.0500, lng: 33.1400 },
      { name: "Nikitari", lat: 35.0300, lng: 32.9400 },
      { name: "Nisou", lat: 35.0300, lng: 33.4500 },
      { name: "Paliometocho", lat: 35.1200, lng: 33.2800 },
      { name: "Potamia", lat: 35.0200, lng: 33.4600 },
      { name: "Sia", lat: 35.0400, lng: 33.3200 },
      { name: "Spilia", lat: 34.9800, lng: 32.9500 },
      { name: "Xyliatos", lat: 35.0000, lng: 33.0000 },
      { name: "Lazanias", lat: 34.9600, lng: 33.1300 },
      { name: "Fterikoudi", lat: 34.9500, lng: 33.0500 },
      { name: "Kannavia", lat: 34.9300, lng: 32.9500 },
      { name: "Korakou", lat: 35.0000, lng: 32.9200 },
      { name: "Tembria", lat: 35.0100, lng: 32.9300 },
      { name: "Vyzakia", lat: 35.1100, lng: 33.1800 },
    ],
  },
  {
    name: "Limassol",
    lat: 34.6786,
    lng: 33.0413,
    areas: [
      // Urban areas
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
      { name: "Agios Tychonas", lat: 34.7200, lng: 33.1300 },
      { name: "Palodeia", lat: 34.7300, lng: 33.0100 },
      { name: "Pyrgos", lat: 34.7400, lng: 33.1800 },
      // Suburban & coastal
      { name: "Episkopi", lat: 34.6700, lng: 32.8900 },
      { name: "Kolossi", lat: 34.6700, lng: 32.9300 },
      { name: "Akrotiri", lat: 34.5900, lng: 32.9600 },
      { name: "Pissouri", lat: 34.6700, lng: 32.7000 },
      { name: "Avdimou", lat: 34.6800, lng: 32.7700 },
      // Wine villages & mountain areas
      { name: "Omodos", lat: 34.8400, lng: 32.8100 },
      { name: "Platres", lat: 34.8900, lng: 32.8600 },
      { name: "Troodos", lat: 34.9200, lng: 32.8700 },
      { name: "Kyperounta", lat: 34.9400, lng: 32.9700 },
      { name: "Chandria", lat: 34.9300, lng: 32.9200 },
      { name: "Agros", lat: 34.9200, lng: 33.0200 },
      { name: "Koilani", lat: 34.8300, lng: 32.8300 },
      { name: "Vouni", lat: 34.8500, lng: 32.8000 },
      { name: "Lofou", lat: 34.8200, lng: 32.8500 },
      { name: "Silikou", lat: 34.8100, lng: 32.8800 },
      { name: "Pachna", lat: 34.8000, lng: 32.7800 },
      { name: "Pera Pedi", lat: 34.8600, lng: 32.8500 },
      { name: "Mandria", lat: 34.6500, lng: 32.9000 },
      { name: "Dora", lat: 34.8800, lng: 32.8000 },
      { name: "Agios Amvrosios", lat: 34.7800, lng: 32.8700 },
      { name: "Zoopigi", lat: 34.7700, lng: 32.8900 },
      { name: "Laneia", lat: 34.8400, lng: 32.8400 },
      { name: "Trimiklini", lat: 34.8200, lng: 32.9000 },
      { name: "Monagri", lat: 34.8100, lng: 32.9200 },
      { name: "Kellaki", lat: 34.7700, lng: 33.0300 },
      { name: "Vikla", lat: 34.7500, lng: 33.0200 },
      { name: "Vasa Kilaniou", lat: 34.8300, lng: 32.8000 },
      { name: "Souni-Zanakia", lat: 34.7500, lng: 32.8900 },
      { name: "Foinikaria", lat: 34.7600, lng: 33.0000 },
      { name: "Paramytha", lat: 34.7900, lng: 32.9500 },
      { name: "Moniatis", lat: 34.8500, lng: 32.9200 },
      { name: "Arakapas", lat: 34.8000, lng: 33.0500 },
      { name: "Louvaras", lat: 34.8300, lng: 32.9800 },
      { name: "Apsiou", lat: 34.7600, lng: 32.9700 },
      { name: "Spitali", lat: 34.7100, lng: 32.9800 },
      { name: "Monagroulli", lat: 34.7400, lng: 33.0500 },
      { name: "Dierona", lat: 34.8000, lng: 32.9600 },
      { name: "Kapileio", lat: 34.8200, lng: 32.9500 },
      { name: "Asgata", lat: 34.7500, lng: 33.1000 },
      { name: "Pentakomo", lat: 34.7200, lng: 33.1600 },
      { name: "Tserkezoi", lat: 34.7500, lng: 32.9500 },
      { name: "Kato Kivides", lat: 34.8100, lng: 32.8100 },
      { name: "Gerasa", lat: 34.7900, lng: 33.1000 },
    ],
  },
  {
    name: "Larnaca",
    lat: 34.9229,
    lng: 33.6232,
    areas: [
      // Urban areas
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
      { name: "Meneou", lat: 34.8600, lng: 33.5900 },
      // Suburban & villages
      { name: "Kellia", lat: 34.9700, lng: 33.6700 },
      { name: "Troulloi", lat: 35.0000, lng: 33.6900 },
      { name: "Athienou", lat: 35.0600, lng: 33.5400 },
      { name: "Pyla", lat: 34.9500, lng: 33.6900 },
      { name: "Ormideia", lat: 34.9900, lng: 33.7800 },
      { name: "Xylofagou", lat: 35.0200, lng: 33.8500 },
      { name: "Xylotymbou", lat: 34.9800, lng: 33.7500 },
      { name: "Softades", lat: 34.9200, lng: 33.5500 },
      { name: "Kofinou", lat: 34.8200, lng: 33.3800 },
      { name: "Agios Theodoros", lat: 34.7997, lng: 33.3839 },
      { name: "Kornos", lat: 34.8800, lng: 33.3900 },
      { name: "Maroni", lat: 34.7700, lng: 33.3300 },
      { name: "Zygi", lat: 34.7300, lng: 33.3300 },
      { name: "Kalavasos", lat: 34.7700, lng: 33.3100 },
      { name: "Chirokitia", lat: 34.7900, lng: 33.3400 },
      { name: "Tochni", lat: 34.7600, lng: 33.3100 },
      // Lefkara area
      { name: "Lefkara (Pano)", lat: 34.8600, lng: 33.3100 },
      { name: "Lefkara (Kato)", lat: 34.8500, lng: 33.3000 },
      { name: "Vavla", lat: 34.8400, lng: 33.2600 },
      { name: "Vasilikos", lat: 34.7100, lng: 33.3200 },
      { name: "Skarinou", lat: 34.8000, lng: 33.3500 },
      { name: "Alaminos", lat: 34.7900, lng: 33.3800 },
      { name: "Melini", lat: 34.8300, lng: 33.2400 },
      // Additional villages & communities
      { name: "Avdellero", lat: 34.9300, lng: 33.5700 },
      { name: "Anglisides", lat: 34.8900, lng: 33.5500 },
      { name: "Agioi Vavatsinias", lat: 34.8200, lng: 33.2200 },
      { name: "Alethriko", lat: 34.8700, lng: 33.5200 },
      { name: "Anafotia", lat: 34.8100, lng: 33.4200 },
      { name: "Delikipos", lat: 34.9500, lng: 33.4600 },
      { name: "Kalo Chorio", lat: 34.9600, lng: 33.6400 },
      { name: "Kato Drys", lat: 34.8400, lng: 33.2700 },
      { name: "Klavdia", lat: 34.9100, lng: 33.5600 },
      { name: "Mazotos", lat: 34.7800, lng: 33.4700 },
      { name: "Mari", lat: 34.7600, lng: 33.3500 },
      { name: "Mosfiloti", lat: 34.9400, lng: 33.4800 },
      { name: "Odou", lat: 34.8700, lng: 33.2500 },
      { name: "Ora", lat: 34.8600, lng: 33.2300 },
      { name: "Pergamos", lat: 35.0300, lng: 33.7200 },
      { name: "Pyrga", lat: 34.8600, lng: 33.4500 },
      { name: "Psematismenos", lat: 34.7700, lng: 33.3800 },
      { name: "Tersefanou", lat: 34.8500, lng: 33.5300 },
      { name: "Tremetousia", lat: 34.9600, lng: 33.5200 },
      { name: "Aplanta", lat: 34.8300, lng: 33.2100 },
      { name: "Kivisili", lat: 34.8300, lng: 33.2500 },
    ],
  },
  {
    name: "Paphos",
    lat: 34.7754,
    lng: 32.4245,
    areas: [
      // Urban areas
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
      { name: "Acheleia", lat: 34.7500, lng: 32.4700 },
      { name: "Mandria", lat: 34.7200, lng: 32.4200 },
      { name: "Anarita", lat: 34.7400, lng: 32.5000 },
      { name: "Kouklia", lat: 34.7100, lng: 32.5700 },
      // Polis Chrysochous area
      { name: "Polis Chrysochous", lat: 35.0400, lng: 32.4300 },
      { name: "Latchi", lat: 35.0500, lng: 32.3900 },
      { name: "Prodromi", lat: 35.0300, lng: 32.4000 },
      { name: "Goudi", lat: 35.0200, lng: 32.4200 },
      { name: "Neo Chorio", lat: 35.0500, lng: 32.3500 },
      { name: "Pomos", lat: 35.1000, lng: 32.4800 },
      // Akamas & rural
      { name: "Akamas Peninsula", lat: 35.0600, lng: 32.3000 },
      { name: "Inia", lat: 34.9200, lng: 32.3400 },
      { name: "Dhrousha", lat: 34.9300, lng: 32.3800 },
      { name: "Kathikas", lat: 34.9000, lng: 32.3700 },
      { name: "Giolou", lat: 34.9400, lng: 32.4600 },
      // Villages
      { name: "Fyti", lat: 34.9100, lng: 32.5200 },
      { name: "Polemi", lat: 34.8500, lng: 32.4800 },
      { name: "Stroumbi", lat: 34.8400, lng: 32.4500 },
      { name: "Tsada", lat: 34.8300, lng: 32.4400 },
      { name: "Mesogi", lat: 34.8000, lng: 32.4300 },
      { name: "Tremithousa", lat: 34.8000, lng: 32.4400 },
      { name: "Armou", lat: 34.8100, lng: 32.4600 },
      { name: "Nata", lat: 34.7800, lng: 32.5300 },
      { name: "Amargeti", lat: 34.8400, lng: 32.5500 },
      { name: "Panagia", lat: 34.9300, lng: 32.6200 },
      { name: "Statos-Agios Fotios", lat: 34.8800, lng: 32.5500 },
      { name: "Agia Marinouda", lat: 34.7300, lng: 32.4300 },
      { name: "Kelokedara", lat: 34.8600, lng: 32.5000 },
      { name: "Miliou", lat: 34.9500, lng: 32.4500 },
      // Additional villages & communities
      { name: "Agia Varvara", lat: 34.7900, lng: 32.4800 },
      { name: "Agios Nikolaos", lat: 34.8800, lng: 32.4200 },
      { name: "Argaka", lat: 35.0600, lng: 32.4900 },
      { name: "Arodes", lat: 34.8800, lng: 32.3500 },
      { name: "Choletria", lat: 34.7800, lng: 32.6000 },
      { name: "Choulou", lat: 34.8600, lng: 32.5300 },
      { name: "Drymou", lat: 34.9200, lng: 32.4200 },
      { name: "Episkopi Paphou", lat: 34.9400, lng: 32.5200 },
      { name: "Evretou", lat: 34.9600, lng: 32.4800 },
      { name: "Kallepia", lat: 34.8300, lng: 32.5200 },
      { name: "Kannaviou", lat: 34.9100, lng: 32.5600 },
      { name: "Konia", lat: 34.7900, lng: 32.4200 },
      { name: "Kritou Terra", lat: 34.9200, lng: 32.5000 },
      { name: "Lemba", lat: 34.7900, lng: 32.4000 },
      { name: "Letymbou", lat: 34.8500, lng: 32.5100 },
      { name: "Lysos", lat: 35.0100, lng: 32.4800 },
      { name: "Nea Dimmata", lat: 35.0400, lng: 32.5000 },
      { name: "Nikokleia", lat: 34.7200, lng: 32.5400 },
      { name: "Pentalia", lat: 34.8700, lng: 32.5800 },
      { name: "Salamiou", lat: 34.8300, lng: 32.6300 },
      { name: "Simou", lat: 34.9300, lng: 32.4400 },
      { name: "Skoulli", lat: 34.9600, lng: 32.4100 },
      { name: "Timi", lat: 34.7300, lng: 32.4800 },
      { name: "Peristerona Chrysochous", lat: 35.0600, lng: 32.5100 },
      { name: "Gialia", lat: 35.0800, lng: 32.4300 },
      { name: "Kritou Marottou", lat: 34.9100, lng: 32.5200 },
      { name: "Praitori", lat: 34.8000, lng: 32.5700 },
      { name: "Lasa", lat: 34.8700, lng: 32.5100 },
      { name: "Galataria", lat: 34.8900, lng: 32.4800 },
      { name: "Theletra", lat: 34.8600, lng: 32.5400 },
      { name: "Mamonia", lat: 34.7900, lng: 32.6100 },
      { name: "Fasoula Paphou", lat: 34.7700, lng: 32.5500 },
      { name: "Kidasi", lat: 34.8500, lng: 32.5600 },
      { name: "Psathi", lat: 34.9000, lng: 32.5400 },
      { name: "Lapithiou", lat: 34.9700, lng: 32.4400 },
      { name: "Pegeia", lat: 34.8700, lng: 32.3600 },
      { name: "Koili", lat: 34.8200, lng: 32.6100 },
      { name: "Axylou", lat: 34.8100, lng: 32.5800 },
      { name: "Malounta", lat: 34.9800, lng: 32.4600 },
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
      { name: "Achna", lat: 35.0600, lng: 33.8600 },
      { name: "Avgorou", lat: 35.0400, lng: 33.8400 },
      { name: "Vrysoulles", lat: 35.0700, lng: 33.9100 },
      { name: "Cape Greco", lat: 34.9600, lng: 34.0800 },
      { name: "Dasaki Achnas", lat: 35.0500, lng: 33.8700 },
      { name: "Kapparis", lat: 35.0500, lng: 34.0300 },
      { name: "Pernera", lat: 35.0200, lng: 34.0600 },
      { name: "Makronissos", lat: 34.9800, lng: 34.0000 },
      { name: "Derynia", lat: 35.0600, lng: 33.9600 },
      { name: "Ormideia", lat: 34.9900, lng: 33.7800 },
      { name: "Xylotymbou", lat: 34.9800, lng: 33.7500 },
      { name: "Acheritou", lat: 35.0800, lng: 33.9000 },
      { name: "Augoros", lat: 35.0400, lng: 33.8200 },
      { name: "Makrasyka", lat: 35.0200, lng: 33.8600 },
      { name: "Pergamos", lat: 35.0300, lng: 33.7200 },
      { name: "Agios Georgios", lat: 34.9800, lng: 34.0700 },
      { name: "Kokkinochoria", lat: 35.0300, lng: 33.9500 },
      { name: "Agia Thekla", lat: 34.9800, lng: 33.9700 },
      { name: "Vrysoules", lat: 35.0700, lng: 33.9100 },
      { name: "Kalopsida", lat: 35.0600, lng: 33.8000 },
      { name: "Agios Nikolaos", lat: 35.0300, lng: 34.0000 },
      { name: "Potamos Liopetriou", lat: 35.0000, lng: 33.8800 },
      { name: "Dhekelia", lat: 34.9800, lng: 33.7300 },
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
  return city ? city.areas.map(a => a.name).sort((a, b) => a.localeCompare(b)) : [];
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
