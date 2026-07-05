import { SEED_PLACE_IDS } from "./seed-data";

export type CatalogPlace = {
  id: string;
  name: string;
  description: string;
  type: "attraction" | "hotel" | "restaurant";
  latitude: string;
  longitude: string;
  address: string;
  imageUrl?: string | null;
  priceRange?: string | null;
  cuisine?: string | null;
  averageRating?: string;
  reviewCount?: number;
  isVerified?: boolean;
};

function catalogId(seq: number): string {
  return `55555555-5555-4555-a555-${String(seq).padStart(12, "0")}`;
}

type CityBundle = {
  city: string;
  country: string;
  lat: string;
  lon: string;
  attractions: string[];
  hotels?: string[];
  restaurants?: { name: string; cuisine: string }[];
};

const IMG = {
  city: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800",
  landmark: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800",
  beach: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
  food: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
  hotel: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
  nature: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800",
};

const CITY_BUNDLES: CityBundle[] = [
  {
    city: "Paris",
    country: "France",
    lat: "48.8566",
    lon: "2.3522",
    attractions: ["Eiffel Tower", "Louvre Museum", "Notre-Dame", "Montmartre", "Palace of Versailles"],
    hotels: ["Le Meurice", "Hotel Plaza Athénée"],
    restaurants: [
      { name: "Le Comptoir du Relais", cuisine: "French" },
      { name: "Septime", cuisine: "Modern French" },
    ],
  },
  {
    city: "London",
    country: "United Kingdom",
    lat: "51.5074",
    lon: "-0.1278",
    attractions: ["British Museum", "Tower of London", "Buckingham Palace", "Hyde Park", "Westminster Abbey"],
    hotels: ["The Savoy", "Claridge's"],
    restaurants: [
      { name: "Dishoom", cuisine: "Indian" },
      { name: "Sketch", cuisine: "European" },
    ],
  },
  {
    city: "Rome",
    country: "Italy",
    lat: "41.9028",
    lon: "12.4964",
    attractions: ["Colosseum", "Vatican Museums", "Trevi Fountain", "Roman Forum", "Pantheon"],
    hotels: ["Hotel de Russie", "Portrait Roma"],
    restaurants: [
      { name: "Roscioli", cuisine: "Italian" },
      { name: "Armando al Pantheon", cuisine: "Roman" },
    ],
  },
  {
    city: "Barcelona",
    country: "Spain",
    lat: "41.3874",
    lon: "2.1686",
    attractions: ["Sagrada Família", "Park Güell", "La Rambla", "Gothic Quarter", "Casa Batlló"],
    hotels: ["Hotel Arts Barcelona", "Majestic Hotel"],
    restaurants: [
      { name: "Tickets Bar", cuisine: "Tapas" },
      { name: "Cervecería Catalana", cuisine: "Spanish" },
    ],
  },
  {
    city: "Amsterdam",
    country: "Netherlands",
    lat: "52.3676",
    lon: "4.9041",
    attractions: ["Rijksmuseum", "Anne Frank House", "Van Gogh Museum", "Canal Ring", "Vondelpark"],
    hotels: ["Pulitzer Amsterdam", "Waldorf Astoria"],
    restaurants: [
      { name: "Foodhallen", cuisine: "Street food" },
      { name: "Restaurant Rijks", cuisine: "Dutch" },
    ],
  },
  {
    city: "Berlin",
    country: "Germany",
    lat: "52.52",
    lon: "13.405",
    attractions: ["Brandenburg Gate", "Museum Island", "East Side Gallery", "Reichstag", "Charlottenburg Palace"],
    hotels: ["Hotel Adlon Kempinski", "SO/Berlin"],
    restaurants: [
      { name: "Zur Letzten Instanz", cuisine: "German" },
      { name: "Cookies Cream", cuisine: "Vegetarian" },
    ],
  },
  {
    city: "Prague",
    country: "Czech Republic",
    lat: "50.0755",
    lon: "14.4378",
    attractions: ["Charles Bridge", "Prague Castle", "Old Town Square", "Astronomical Clock", "Vyšehrad"],
    hotels: ["Augustine Hotel", "Four Seasons Prague"],
    restaurants: [
      { name: "Lokál Dlouhááá", cuisine: "Czech" },
      { name: "Field Restaurant", cuisine: "Fine dining" },
    ],
  },
  {
    city: "Vienna",
    country: "Austria",
    lat: "48.2082",
    lon: "16.3738",
    attractions: ["Schönbrunn Palace", "St. Stephen's Cathedral", "Belvedere", "Hofburg", "Prater"],
    hotels: ["Hotel Sacher", "Park Hyatt Vienna"],
    restaurants: [
      { name: "Figlmüller", cuisine: "Viennese" },
      { name: "Steirereck", cuisine: "Austrian" },
    ],
  },
  {
    city: "Istanbul",
    country: "Turkey",
    lat: "41.0082",
    lon: "28.9784",
    attractions: ["Hagia Sophia", "Blue Mosque", "Grand Bazaar", "Topkapi Palace", "Bosphorus Cruise"],
    hotels: ["Four Seasons Sultanahmet", "Çırağan Palace"],
    restaurants: [
      { name: "Mikla", cuisine: "Turkish" },
      { name: "Karaköy Lokantası", cuisine: "Anatolian" },
    ],
  },
  {
    city: "Dubai",
    country: "UAE",
    lat: "25.2048",
    lon: "55.2708",
    attractions: ["Burj Khalifa", "Dubai Mall", "Palm Jumeirah", "Dubai Marina", "Desert Safari"],
    hotels: ["Burj Al Arab", "Atlantis The Palm"],
    restaurants: [
      { name: "Al Mallah", cuisine: "Lebanese" },
      { name: "Zuma Dubai", cuisine: "Japanese" },
    ],
  },
  {
    city: "Tokyo",
    country: "Japan",
    lat: "35.6762",
    lon: "139.6503",
    attractions: ["Senso-ji Temple", "Shibuya Crossing", "Meiji Shrine", "Tokyo Skytree", "Tsukiji Outer Market"],
    hotels: ["Aman Tokyo", "Park Hyatt Tokyo"],
    restaurants: [
      { name: "Ichiran Ramen", cuisine: "Japanese" },
      { name: "Narisawa", cuisine: "Fine dining" },
    ],
  },
  {
    city: "Kyoto",
    country: "Japan",
    lat: "35.0116",
    lon: "135.7681",
    attractions: ["Fushimi Inari Shrine", "Arashiyama Bamboo Grove", "Kinkaku-ji", "Gion District", "Philosopher's Path"],
    hotels: ["Hoshinoya Kyoto", "The Ritz-Carlton Kyoto"],
    restaurants: [
      { name: "Nishiki Market Stalls", cuisine: "Japanese" },
      { name: "Kikunoi", cuisine: "Kaiseki" },
    ],
  },
  {
    city: "Seoul",
    country: "South Korea",
    lat: "37.5665",
    lon: "126.978",
    attractions: ["Gyeongbokgung Palace", "Bukchon Hanok Village", "N Seoul Tower", "Myeongdong", "DMZ Tour"],
    hotels: ["Signiel Seoul", "Lotte Hotel Seoul"],
    restaurants: [
      { name: "Gwangjang Market", cuisine: "Korean" },
      { name: "Jungsik", cuisine: "Modern Korean" },
    ],
  },
  {
    city: "Bangkok",
    country: "Thailand",
    lat: "13.7563",
    lon: "100.5018",
    attractions: ["Grand Palace", "Wat Pho", "Chatuchak Market", "Wat Arun", "Chao Phraya River"],
    hotels: ["Mandarin Oriental Bangkok", "The Siam"],
    restaurants: [
      { name: "Jay Fai", cuisine: "Thai" },
      { name: "Gaggan Anand", cuisine: "Progressive Indian" },
    ],
  },
  {
    city: "Singapore",
    country: "Singapore",
    lat: "1.3521",
    lon: "103.8198",
    attractions: ["Gardens by the Bay", "Marina Bay Sands", "Sentosa Island", "Chinatown", "Singapore Zoo"],
    hotels: ["Raffles Singapore", "Marina Bay Sands"],
    restaurants: [
      { name: "Hawker Chan", cuisine: "Chinese" },
      { name: "Odette", cuisine: "French" },
    ],
  },
  {
    city: "Bali",
    country: "Indonesia",
    lat: "-8.3405",
    lon: "115.092",
    attractions: ["Tegallalang Rice Terraces", "Uluwatu Temple", "Ubud Monkey Forest", "Tanah Lot", "Mount Batur"],
    hotels: ["Four Seasons Bali", "COMO Shambhala"],
    restaurants: [
      { name: "Locavore", cuisine: "Indonesian" },
      { name: "Mozaic", cuisine: "Fusion" },
    ],
  },
  {
    city: "Sydney",
    country: "Australia",
    lat: "-33.8688",
    lon: "151.2093",
    attractions: ["Sydney Opera House", "Harbour Bridge", "Bondi Beach", "Royal Botanic Garden", "Manly Ferry"],
    hotels: ["Park Hyatt Sydney", "Capella Sydney"],
    restaurants: [
      { name: "Quay Restaurant", cuisine: "Australian" },
      { name: "Bennelong", cuisine: "Modern Australian" },
    ],
  },
  {
    city: "Melbourne",
    country: "Australia",
    lat: "-37.8136",
    lon: "144.9631",
    attractions: ["Federation Square", "Great Ocean Road", "Royal Exhibition Building", "St Kilda Beach", "Queen Victoria Market"],
    hotels: ["Crown Towers", "The Langham Melbourne"],
    restaurants: [
      { name: "Attica", cuisine: "Australian" },
      { name: "Chin Chin", cuisine: "Asian fusion" },
    ],
  },
  {
    city: "New York",
    country: "USA",
    lat: "40.7128",
    lon: "-74.006",
    attractions: ["Statue of Liberty", "Central Park", "Times Square", "Brooklyn Bridge", "Metropolitan Museum"],
    hotels: ["The Plaza", "The Standard High Line"],
    restaurants: [
      { name: "Katz's Delicatessen", cuisine: "American" },
      { name: "Le Bernardin", cuisine: "French seafood" },
    ],
  },
  {
    city: "Los Angeles",
    country: "USA",
    lat: "34.0522",
    lon: "-118.2437",
    attractions: ["Hollywood Sign", "Griffith Observatory", "Santa Monica Pier", "Getty Center", "Venice Beach"],
    hotels: ["Beverly Hills Hotel", "The Line Hotel"],
    restaurants: [
      { name: "Republique", cuisine: "French" },
      { name: "Grand Central Market", cuisine: "Street food" },
    ],
  },
  {
    city: "San Francisco",
    country: "USA",
    lat: "37.7749",
    lon: "-122.4194",
    attractions: ["Golden Gate Bridge", "Alcatraz Island", "Fisherman's Wharf", "Lombard Street", "Golden Gate Park"],
    hotels: ["Fairmont San Francisco", "Proper Hotel"],
    restaurants: [
      { name: "Tartine Bakery", cuisine: "Bakery" },
      { name: "State Bird Provisions", cuisine: "Californian" },
    ],
  },
  {
    city: "Miami",
    country: "USA",
    lat: "25.7617",
    lon: "-80.1918",
    attractions: ["South Beach", "Art Deco District", "Wynwood Walls", "Vizcaya Museum", "Everglades Tour"],
    hotels: ["Faena Hotel", "The Setai"],
    restaurants: [
      { name: "Joe's Stone Crab", cuisine: "Seafood" },
      { name: "Versailles Restaurant", cuisine: "Cuban" },
    ],
  },
  {
    city: "Mexico City",
    country: "Mexico",
    lat: "19.4326",
    lon: "-99.1332",
    attractions: ["Zócalo", "Teotihuacán Pyramids", "Frida Kahlo Museum", "Chapultepec Castle", "Xochimilco"],
    hotels: ["Four Seasons Mexico City", "Condesa DF"],
    restaurants: [
      { name: "Pujol", cuisine: "Mexican" },
      { name: "Contramar", cuisine: "Seafood" },
    ],
  },
  {
    city: "Rio de Janeiro",
    country: "Brazil",
    lat: "-22.9068",
    lon: "-43.1729",
    attractions: ["Christ the Redeemer", "Sugarloaf Mountain", "Copacabana Beach", "Selarón Steps", "Tijuca Forest"],
    hotels: ["Belmond Copacabana Palace", "Fasano Rio"],
    restaurants: [
      { name: "Aprazível", cuisine: "Brazilian" },
      { name: "Lasai", cuisine: "Contemporary" },
    ],
  },
  {
    city: "Buenos Aires",
    country: "Argentina",
    lat: "-34.6037",
    lon: "-58.3816",
    attractions: ["La Boca", "Recoleta Cemetery", "Teatro Colón", "Palermo Soho", "Tigre Delta"],
    hotels: ["Alvear Palace", "Faena Hotel Buenos Aires"],
    restaurants: [
      { name: "Don Julio", cuisine: "Steakhouse" },
      { name: "Aramburu", cuisine: "Fine dining" },
    ],
  },
  {
    city: "Lima",
    country: "Peru",
    lat: "-12.0464",
    lon: "-77.0428",
    attractions: ["Historic Center", "Miraflores", "Barranco", "Larco Museum", "Machu Picchu Gateway"],
    hotels: ["Country Club Lima Hotel", "Atemporal"],
    restaurants: [
      { name: "Central", cuisine: "Peruvian" },
      { name: "Maido", cuisine: "Nikkei" },
    ],
  },
  {
    city: "Cape Town",
    country: "South Africa",
    lat: "-33.9249",
    lon: "18.4241",
    attractions: ["Table Mountain", "Cape of Good Hope", "V&A Waterfront", "Boulders Beach Penguins", "Robben Island"],
    hotels: ["One&Only Cape Town", "Ellerman House"],
    restaurants: [
      { name: "The Test Kitchen", cuisine: "South African" },
      { name: "Gold Restaurant", cuisine: "African" },
    ],
  },
  {
    city: "Marrakech",
    country: "Morocco",
    lat: "31.6295",
    lon: "-7.9811",
    attractions: ["Jemaa el-Fnaa", "Bahia Palace", "Majorelle Garden", "Medina Souks", "Atlas Mountains Day Trip"],
    hotels: ["Royal Mansour", "La Mamounia"],
    restaurants: [
      { name: "Nomad", cuisine: "Moroccan" },
      { name: "Le Jardin", cuisine: "Mediterranean" },
    ],
  },
  {
    city: "Cairo",
    country: "Egypt",
    lat: "30.0444",
    lon: "31.2357",
    attractions: ["Pyramids of Giza", "Egyptian Museum", "Khan el-Khalili", "Saqqara", "Nile Felucca Ride"],
    hotels: ["Marriott Mena House", "Four Seasons Nile Plaza"],
    restaurants: [
      { name: "Abou El Sid", cuisine: "Egyptian" },
      { name: "Osmanly Restaurant", cuisine: "Ottoman" },
    ],
  },
  {
    city: "Moscow",
    country: "Russia",
    lat: "55.7558",
    lon: "37.6173",
    attractions: ["Red Square", "Kremlin", "St. Basil's Cathedral", "Bolshoi Theatre", "Gorky Park"],
    hotels: ["Four Seasons Moscow", "Lotte Hotel Moscow"],
    restaurants: [
      { name: "White Rabbit", cuisine: "Russian" },
      { name: "Café Pushkin", cuisine: "Russian" },
    ],
  },
  {
    city: "Saint Petersburg",
    country: "Russia",
    lat: "59.9311",
    lon: "30.3609",
    attractions: ["Hermitage Museum", "Church of the Savior on Spilled Blood", "Peterhof Palace", "Nevsky Prospect", "Mariinsky Theatre"],
    hotels: ["Belmond Grand Hotel Europe", "Four Seasons Lion Palace"],
    restaurants: [
      { name: "Palkin", cuisine: "Russian" },
      { name: "Mansarda", cuisine: "European" },
    ],
  },
  {
    city: "Athens",
    country: "Greece",
    lat: "37.9838",
    lon: "23.7275",
    attractions: ["Acropolis", "Parthenon", "Plaka", "Ancient Agora", "Temple of Poseidon"],
    hotels: ["Hotel Grande Bretagne", "King George Athens"],
    restaurants: [
      { name: "Dionysos", cuisine: "Greek" },
      { name: "Funky Gourmet", cuisine: "Modern Greek" },
    ],
  },
  {
    city: "Santorini",
    country: "Greece",
    lat: "36.3932",
    lon: "25.4615",
    attractions: ["Oia Sunset", "Fira Caldera View", "Red Beach", "Akrotiri Ruins", "Santorini Wine Tour"],
    hotels: ["Canaves Oia", "Katikies Hotel"],
    restaurants: [
      { name: "Ambrosia", cuisine: "Greek" },
      { name: "Selene", cuisine: "Cycladic" },
    ],
  },
  {
    city: "Lisbon",
    country: "Portugal",
    lat: "38.7223",
    lon: "-9.1393",
    attractions: ["Belém Tower", "Jerónimos Monastery", "Alfama", "Tram 28", "Sintra Day Trip"],
    hotels: ["Bairro Alto Hotel", "Four Seasons Ritz Lisbon"],
    restaurants: [
      { name: "Time Out Market", cuisine: "Portuguese" },
      { name: "Belcanto", cuisine: "Fine dining" },
    ],
  },
  {
    city: "Reykjavik",
    country: "Iceland",
    lat: "64.1466",
    lon: "-21.9426",
    attractions: ["Blue Lagoon", "Golden Circle", "Northern Lights Tour", "Hallgrímskirkja", "Glacier Hike"],
    hotels: ["Ion Adventure Hotel", "Canopy by Hilton"],
    restaurants: [
      { name: "Dill Restaurant", cuisine: "Nordic" },
      { name: "Fish Market", cuisine: "Seafood" },
    ],
  },
  {
    city: "Zurich",
    country: "Switzerland",
    lat: "47.3769",
    lon: "8.5417",
    attractions: ["Lake Zurich", "Old Town", "Bahnhofstrasse", "Uetliberg", "Rhine Falls Day Trip"],
    hotels: ["Baur au Lac", "Dolder Grand"],
    restaurants: [
      { name: "Kronenhalle", cuisine: "Swiss" },
      { name: "Restaurant Pavillon", cuisine: "French" },
    ],
  },
  {
    city: "Copenhagen",
    country: "Denmark",
    lat: "55.6761",
    lon: "12.5683",
    attractions: ["Nyhavn", "Tivoli Gardens", "Rosenborg Castle", "Little Mermaid", "Christiania"],
    hotels: ["Hotel d'Angleterre", "Nimb Hotel"],
    restaurants: [
      { name: "Noma", cuisine: "Nordic" },
      { name: "Torvehallerne", cuisine: "Market hall" },
    ],
  },
  {
    city: "Stockholm",
    country: "Sweden",
    lat: "59.3293",
    lon: "18.0686",
    attractions: ["Gamla Stan", "Vasa Museum", "ABBA Museum", "Djurgården", "Archipelago Cruise"],
    hotels: ["Grand Hôtel Stockholm", "Lydmar Hotel"],
    restaurants: [
      { name: "Frantzén", cuisine: "Swedish" },
      { name: "Pelikan", cuisine: "Traditional Swedish" },
    ],
  },
  {
    city: "Hanoi",
    country: "Vietnam",
    lat: "21.0278",
    lon: "105.8342",
    attractions: ["Old Quarter", "Hoan Kiem Lake", "Temple of Literature", "Ha Long Bay Tour", "Train Street"],
    hotels: ["Sofitel Legend Metropole", "Capella Hanoi"],
    restaurants: [
      { name: "Pho Gia Truyen", cuisine: "Vietnamese" },
      { name: "Gia", cuisine: "Modern Vietnamese" },
    ],
  },
  {
    city: "Ho Chi Minh City",
    country: "Vietnam",
    lat: "10.8231",
    lon: "106.6297",
    attractions: ["Ben Thanh Market", "War Remnants Museum", "Cu Chi Tunnels", "Notre-Dame Cathedral", "Mekong Delta"],
    hotels: ["Park Hyatt Saigon", "The Reverie Saigon"],
    restaurants: [
      { name: "Pizza 4P's", cuisine: "Italian" },
      { name: "Hum Vegetarian", cuisine: "Vietnamese" },
    ],
  },
  {
    city: "Hong Kong",
    country: "China",
    lat: "22.3193",
    lon: "114.1694",
    attractions: ["Victoria Peak", "Star Ferry", "Temple Street Night Market", "Big Buddha", "Dragon's Back Hike"],
    hotels: ["The Peninsula", "Mandarin Oriental"],
    restaurants: [
      { name: "Tim Ho Wan", cuisine: "Dim sum" },
      { name: "Lung King Heen", cuisine: "Cantonese" },
    ],
  },
  {
    city: "Shanghai",
    country: "China",
    lat: "31.2304",
    lon: "121.4737",
    attractions: ["The Bund", "Yu Garden", "Shanghai Tower", "French Concession", "Zhujiajiao Water Town"],
    hotels: ["Fairmont Peace Hotel", "Capella Shanghai"],
    restaurants: [
      { name: "Din Tai Fung", cuisine: "Chinese" },
      { name: "Ultraviolet", cuisine: "Fine dining" },
    ],
  },
  {
    city: "Beijing",
    country: "China",
    lat: "39.9042",
    lon: "116.4074",
    attractions: ["Great Wall", "Forbidden City", "Temple of Heaven", "Summer Palace", "798 Art District"],
    hotels: ["Aman Summer Palace", "The Peninsula Beijing"],
    restaurants: [
      { name: "Da Dong Roast Duck", cuisine: "Peking duck" },
      { name: "TRB Hutong", cuisine: "European" },
    ],
  },
  {
    city: "Mumbai",
    country: "India",
    lat: "19.076",
    lon: "72.8777",
    attractions: ["Gateway of India", "Marine Drive", "Elephanta Caves", "Chhatrapati Shivaji Terminus", "Dharavi Tour"],
    hotels: ["Taj Mahal Palace", "The Oberoi Mumbai"],
    restaurants: [
      { name: "Britannia & Co.", cuisine: "Parsi" },
      { name: "Masque", cuisine: "Indian" },
    ],
  },
  {
    city: "Delhi",
    country: "India",
    lat: "28.6139",
    lon: "77.209",
    attractions: ["Red Fort", "India Gate", "Qutub Minar", "Humayun's Tomb", "Chandni Chowk"],
    hotels: ["The Leela Palace", "Oberoi New Delhi"],
    restaurants: [
      { name: "Karim's", cuisine: "Mughlai" },
      { name: "Indian Accent", cuisine: "Modern Indian" },
    ],
  },
  {
    city: "Kathmandu",
    country: "Nepal",
    lat: "27.7172",
    lon: "85.324",
    attractions: ["Boudhanath Stupa", "Pashupatinath Temple", "Durbar Square", "Swayambhunath", "Everest Flight"],
    hotels: ["Dwarika's Hotel", "Hyatt Regency Kathmandu"],
    restaurants: [
      { name: "Bhojan Griha", cuisine: "Nepali" },
      { name: "Yangling Tibetan Restaurant", cuisine: "Tibetan" },
    ],
  },
  {
    city: "Queenstown",
    country: "New Zealand",
    lat: "-45.0312",
    lon: "168.6626",
    attractions: ["Milford Sound", "Skyline Gondola", "Lake Wakatipu", "Bungee Jumping", "Arrowtown"],
    hotels: ["Eichardt's Private Hotel", "Matakauri Lodge"],
    restaurants: [
      { name: "Fergburger", cuisine: "Burgers" },
      { name: "Botswana Butchery", cuisine: "Steakhouse" },
    ],
  },
  {
    city: "Hawaii",
    country: "USA",
    lat: "21.3069",
    lon: "-157.8583",
    attractions: ["Waikiki Beach", "Pearl Harbor", "Diamond Head", "Hanauma Bay", "Road to Hana"],
    hotels: ["Royal Hawaiian", "Four Seasons Hualalai"],
    restaurants: [
      { name: "Helena's Hawaiian Food", cuisine: "Hawaiian" },
      { name: "Senia", cuisine: "Hawaiian fusion" },
    ],
  },
  {
    city: "Las Vegas",
    country: "USA",
    lat: "36.1699",
    lon: "-115.1398",
    attractions: ["The Strip", "Fremont Street", "Grand Canyon Tour", "Bellagio Fountains", "Red Rock Canyon"],
    hotels: ["Bellagio", "The Venetian"],
    restaurants: [
      { name: "é by José Andrés", cuisine: "Spanish" },
      { name: "Raku", cuisine: "Japanese" },
    ],
  },
  {
    city: "Toronto",
    country: "Canada",
    lat: "43.6532",
    lon: "-79.3832",
    attractions: ["CN Tower", "Royal Ontario Museum", "Distillery District", "Niagara Falls Day Trip", "Toronto Islands"],
    hotels: ["Fairmont Royal York", "Shangri-La Toronto"],
    restaurants: [
      { name: "St. Lawrence Market", cuisine: "Market" },
      { name: "Alo Restaurant", cuisine: "French" },
    ],
  },
  {
    city: "Vancouver",
    country: "Canada",
    lat: "49.2827",
    lon: "-123.1207",
    attractions: ["Stanley Park", "Capilano Suspension Bridge", "Granville Island", "Grouse Mountain", "Seawall"],
    hotels: ["Fairmont Pacific Rim", "Rosewood Hotel Georgia"],
    restaurants: [
      { name: "Miku", cuisine: "Japanese" },
      { name: "Hawksworth", cuisine: "Canadian" },
    ],
  },
];

function jitter(base: string, index: number, scale = 0.02): string {
  const n = parseFloat(base);
  const delta = ((index % 7) - 3) * scale * 0.001;
  return (n + delta).toFixed(4);
}

export function buildPlacesCatalog(): CatalogPlace[] {
  const out: CatalogPlace[] = [];
  let seq = 1;

  const push = (place: Omit<CatalogPlace, "id">) => {
    out.push({ id: catalogId(seq++), ...place });
  };

  // Preserve original demo seed IDs for the first 6 world highlights
  const legacy = [
    {
      id: SEED_PLACE_IDS.santorini,
      name: "Santorini Sunset Terrace",
      description: "Breathtaking caldera views with iconic white-washed buildings and stunning sunsets.",
      type: "attraction" as const,
      address: "Oia, Santorini 847 02, Greece",
      latitude: "36.4618",
      longitude: "25.3753",
      imageUrl: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800",
      priceRange: "$$",
      averageRating: "4.80",
      reviewCount: 247,
    },
    {
      id: SEED_PLACE_IDS.kyoto,
      name: "Kyoto Bamboo Grove",
      description: "Walk through towering bamboo stalks in the Arashiyama district.",
      type: "attraction" as const,
      address: "Sagatenryuji Susukinobabachou, Ukyo Ward, Kyoto",
      latitude: "35.0094",
      longitude: "135.6727",
      imageUrl: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800",
      priceRange: "$",
      averageRating: "4.70",
      reviewCount: 183,
    },
    {
      id: SEED_PLACE_IDS.machuPicchu,
      name: "Machu Picchu",
      description: "The iconic Inca citadel set high in the Andes Mountains of Peru.",
      type: "attraction" as const,
      address: "Machu Picchu, Cusco Region, Peru",
      latitude: "-13.1631",
      longitude: "-72.5450",
      imageUrl: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800",
      priceRange: "$$$",
      averageRating: "4.90",
      reviewCount: 512,
    },
    {
      id: SEED_PLACE_IDS.amalfi,
      name: "Amalfi Coast",
      description: "One of Europe's most scenic drives along dramatic cliffs.",
      type: "attraction" as const,
      address: "Amalfi Coast, Province of Salerno, Italy",
      latitude: "40.6340",
      longitude: "14.6027",
      imageUrl: "https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?w=800",
      priceRange: "$$$",
      averageRating: "4.60",
      reviewCount: 318,
    },
    {
      id: SEED_PLACE_IDS.iceland,
      name: "Northern Lights, Iceland",
      description: "Witness the spectacular Aurora Borealis dancing across Iceland's night sky.",
      type: "attraction" as const,
      address: "Thingvellir National Park, Iceland",
      latitude: "64.2559",
      longitude: "-21.1294",
      imageUrl: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800",
      priceRange: "$$",
      averageRating: "4.90",
      reviewCount: 421,
    },
    {
      id: SEED_PLACE_IDS.louvre,
      name: "The Louvre Museum",
      description: "World's largest art museum housing thousands of iconic works.",
      type: "attraction" as const,
      address: "Rue de Rivoli, 75001 Paris, France",
      latitude: "48.8606",
      longitude: "2.3376",
      imageUrl: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800",
      priceRange: "$$",
      averageRating: "4.70",
      reviewCount: 892,
    },
  ];

  for (const p of legacy) {
    out.push({ ...p, isVerified: true });
    seq = Math.max(seq, parseInt(p.id.slice(-12), 10) + 1);
  }

  for (const bundle of CITY_BUNDLES) {
    const addrBase = `${bundle.city}, ${bundle.country}`;
    bundle.attractions.forEach((name, i) => {
      push({
        name,
        description: `Must-see landmark in ${bundle.city} — a favorite stop for travelers exploring ${bundle.country}.`,
        type: "attraction",
        latitude: jitter(bundle.lat, i, 0.08),
        longitude: jitter(bundle.lon, i + 1, 0.08),
        address: `${name}, ${addrBase}`,
        imageUrl: i % 2 === 0 ? IMG.landmark : IMG.nature,
        priceRange: i % 3 === 0 ? "$" : "$$",
        averageRating: (4.3 + (i % 5) * 0.1).toFixed(1),
        reviewCount: 80 + i * 37 + bundle.city.length,
        isVerified: true,
      });
    });

    (bundle.hotels ?? []).forEach((name, i) => {
      push({
        name,
        description: `Premium stay in ${bundle.city} with great location for explorers and digital nomads.`,
        type: "hotel",
        latitude: jitter(bundle.lat, i + 3, 0.05),
        longitude: jitter(bundle.lon, i + 4, 0.05),
        address: `${name}, ${addrBase}`,
        imageUrl: IMG.hotel,
        priceRange: i === 0 ? "$$$" : "$$$$",
        averageRating: (4.5 + i * 0.2).toFixed(1),
        reviewCount: 120 + i * 55,
        isVerified: true,
      });
    });

    (bundle.restaurants ?? []).forEach((r, i) => {
      push({
        name: r.name,
        description: `Popular ${r.cuisine.toLowerCase()} spot loved by locals and travelers in ${bundle.city}.`,
        type: "restaurant",
        latitude: jitter(bundle.lat, i + 6, 0.04),
        longitude: jitter(bundle.lon, i + 7, 0.04),
        address: `${r.name}, ${addrBase}`,
        imageUrl: IMG.food,
        priceRange: i === 0 ? "$$" : "$$$",
        cuisine: r.cuisine,
        averageRating: (4.4 + i * 0.15).toFixed(1),
        reviewCount: 95 + i * 41,
        isVerified: i === 0,
      });
    });
  }

  return out;
}
