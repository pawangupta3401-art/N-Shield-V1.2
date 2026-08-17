import type {
  NewsCategory,
  NewsApiResponse,
  RealNewsArticle,
  RecognizedLocation,
  ReportSourceType,
} from "./newsTypes";

/**
 * Recognized Nagpur geographical sectors and landmark coordinates
 */
const NAGPUR_GEO_MAPPINGS: { keywords: string[]; name: string; lat: number; lng: number }[] = [
  { keywords: ["sitabuldi", "munje square", "variety square", "metro interchange"], name: "Sitabuldi", lat: 21.1489, lng: 79.0876 },
  { keywords: ["dharampeth", "zenda chowk", "whc road", "gokulpeth", "shivaji nagar"], name: "Dharampeth", lat: 21.1415, lng: 79.0535 },
  { keywords: ["sadar", "mount road", "residency road", "raj bhavan", "liberty chowk"], name: "Sadar", lat: 21.1612, lng: 79.0788 },
  { keywords: ["dhantoli", "ramdaspeth", "mehadia square", "lokmat square", "canal road"], name: "Dhantoli", lat: 21.1384, lng: 79.0623 },
  { keywords: ["mahal", "gandhibagh", "itwari", "badkas square", "tilak putla", "kotwali"], name: "Mahal", lat: 21.144, lng: 79.111 },
  { keywords: ["pardi", "bhandara road", "kalamna", "surabardi", "chikhali"], name: "Pardi", lat: 21.1186, lng: 79.0954 },
  { keywords: ["hudkeshwar", "manewada", "narendra nagar", "besa", "pipla", "dighori"], name: "Hudkeshwar", lat: 21.0982, lng: 79.0741 },
  { keywords: ["mankapur", "koradi", "chhindwara road", "godhani", "fariq nagar"], name: "Mankapur", lat: 21.189, lng: 79.076 },
  { keywords: ["medical square", "gmch", "ajni", "rambagh", "untkhana"], name: "Medical Square", lat: 21.1274, lng: 79.0968 },
  { keywords: ["wardha road", "somalwada", "chhatrapati square", "rahate colony", "khamla"], name: "Wardha Road", lat: 21.105, lng: 79.071 },
  { keywords: ["hingna", "midc", "trimurti nagar", "pratap nagar", "subhash nagar"], name: "Hingna Road", lat: 21.112, lng: 79.022 },
  { keywords: ["jaripatka", "indora", "kadbi chowk", "kamal chowk", "pachpaoli"], name: "Jaripatka", lat: 21.178, lng: 79.089 },
  { keywords: ["ambazari", "futala", "vnit", "it park", "gayatri nagar", "pandhrabodi"], name: "Ambazari", lat: 21.1332, lng: 79.0435 },
  { keywords: ["civil lines", "high court", "vidhan bhavan", "ravi nagar", "seminary hills"], name: "Civil Lines", lat: 21.154, lng: 79.0685 },
  { keywords: ["ganeshpeth", "cotton market", "st stand", "model mills"], name: "Ganeshpeth", lat: 21.1448, lng: 79.0988 },
  { keywords: ["lakadganj", "central avenue", "telephone exchange square", "garoba maidan"], name: "Lakadganj", lat: 21.1492, lng: 79.1189 },
  { keywords: ["mihan", "aiims", "butibori", "khapri"], name: "MIHAN / AIIMS", lat: 21.0585, lng: 79.0267 },
];

/**
 * Extract specific recognizable Nagpur sector or fallback to general Nagpur
 */
export function extractNagpurLocation(text: string): RecognizedLocation {
  const normalized = text.toLowerCase();

  for (const mapping of NAGPUR_GEO_MAPPINGS) {
    for (const keyword of mapping.keywords) {
      if (normalized.includes(keyword)) {
        return {
          name: mapping.name,
          lat: mapping.lat,
          lng: mapping.lng,
          isSpecificZone: true,
        };
      }
    }
  }

  // Fallback to central Nagpur without guessing
  return {
    name: "Nagpur",
    lat: 21.1458,
    lng: 79.0882,
    isSpecificZone: false,
  };
}

/**
 * Strict Multi-Layer Category Classifier
 * Follows the specified priority:
 * Vehicle Theft -> Burglary -> Robbery -> Assault -> Missing Person -> Accident -> Fire -> Theft -> Other
 */
export function classifyNewsCategory(title: string, description?: string | null): { category: NewsCategory; isCrime: boolean } {
  const content = `${title} ${description || ""}`.toLowerCase();

  // 1. VEHICLE THEFT (Highest specificity for vehicle-related stealing)
  const vehicleTheftPatterns = [
    "vehicle theft",
    "car theft",
    "bike theft",
    "motorcycle theft",
    "scooter theft",
    "stolen vehicle",
    "stolen car",
    "stolen bike",
    "stolen motorcycle",
    "stolen scooter",
    "two-wheeler theft",
    "two wheeler theft",
    "auto theft",
    "stolen two-wheeler",
    "stolen two wheeler",
    "stole bike",
    "stole car",
    "stole motorcycle",
  ];
  if (vehicleTheftPatterns.some((pattern) => content.includes(pattern))) {
    return { category: "Vehicle Theft", isCrime: true };
  }

  // 2. BURGLARY (Break-in, housebreaking, unauthorized entry theft)
  const burglaryPatterns = [
    "burglary",
    "burglar",
    "break-in",
    "break in",
    "broke into",
    "breaking into",
    "housebreaking",
    "house breaking",
    "house break-in",
    "house break in",
    "shop break-in",
    "office break-in",
    "locker broken",
    "broken into",
  ];
  if (burglaryPatterns.some((pattern) => content.includes(pattern))) {
    return { category: "Burglary", isCrime: true };
  }

  // 3. ROBBERY (Force, loot, armed robbery, dacoity, gunpoint)
  const robberyPatterns = [
    "robbery",
    "robbed",
    "robbers",
    "robber",
    "armed robbery",
    "loot",
    "looted",
    "looting",
    "dacoity",
    "dacoit",
    "gunpoint",
    "knifepoint",
    "heist",
    "highway loot",
  ];
  if (robberyPatterns.some((pattern) => content.includes(pattern))) {
    return { category: "Robbery", isCrime: true };
  }

  // 4. ASSAULT (Violent attacks, physical altercations, severe injury)
  const assaultPatterns = [
    "assault",
    "assaulted",
    "attacked",
    "violent attack",
    "physical altercation",
    "beaten up",
    "brutally beaten",
    "stabbed",
    "stabbing",
    "murder",
    "murdered",
    "homicide",
    "slain",
    "hacked to death",
    "lynched",
    "inflicted injury",
  ];
  if (assaultPatterns.some((pattern) => content.includes(pattern))) {
    return { category: "Assault", isCrime: true };
  }

  // 5. MISSING PERSON
  const missingPersonPatterns = [
    "missing person",
    "missing girl",
    "missing boy",
    "missing woman",
    "missing man",
    "reported missing",
    "went missing",
    "disappeared",
    "untraced",
    "kidnapped",
    "abducted",
    "kidnapping",
    "abduction",
  ];
  if (missingPersonPatterns.some((pattern) => content.includes(pattern))) {
    return { category: "Missing Person", isCrime: true };
  }

  // 6. ACCIDENTS (Road traffic collisions, flyover accidents, vehicular crashes)
  const accidentPatterns = [
    "road accident",
    "traffic accident",
    "collision",
    "crash",
    "crashed",
    "hit and run",
    "hit-and-run",
    "vehicle accident",
    "overturned",
    "speeding vehicle",
    "flyover accident",
    "car crash",
    "bike crash",
    "truck collision",
    "mishap",
    "skidded",
    "pedestrian hit",
    "injured in crash",
    "accident",
  ];
  if (accidentPatterns.some((pattern) => content.includes(pattern))) {
    return { category: "Accident", isCrime: false };
  }

  // 7. FIRE (Flames, blaze, explosions, fire brigade)
  const firePatterns = [
    "fire broke out",
    "building fire",
    "shop fire",
    "vehicle fire",
    "industrial fire",
    "fire brigade",
    "blaze",
    "inferno",
    "gutted in fire",
    "cylinder blast",
    "cylinder explosion",
    "short circuit fire",
    "flames",
    "fire outbreak",
    "fire incident",
  ];
  if (firePatterns.some((pattern) => content.includes(pattern))) {
    return { category: "Fire", isCrime: false };
  }

  // 8. THEFT (General stealing, pickpocketing, shoplifting, mobile/cash/gold theft)
  const theftPatterns = [
    "theft",
    "thieves",
    "thief",
    "stolen",
    "stealing",
    "stole",
    "shoplifting",
    "pickpocket",
    "pickpocketing",
    "chain snatching",
    "chain snatcher",
    "mobile snatching",
    "cash stolen",
    "jewelry stolen",
    "gold stolen",
    "stolen goods",
    "cheating",
    "extortion",
    "contraband",
    "smuggling",
    "fraud",
  ];
  if (theftPatterns.some((pattern) => content.includes(pattern))) {
    return { category: "Theft", isCrime: true };
  }

  // 9. OTHER (Civic updates, court rulings, protests, traffic notices, public advisories)
  const isCrimeIncident =
    content.includes("crime") ||
    content.includes("arrest") ||
    content.includes("police probe") ||
    content.includes("fir lodged") ||
    content.includes("racket busted") ||
    content.includes("custody") ||
    content.includes("protest") ||
    content.includes("glitches") ||
    content.includes("law trend") ||
    content.includes("high court");

  return {
    category: "Other",
    isCrime: isCrimeIncident,
  };
}

/**
 * Checks if a category is part of "All Crimes"
 */
export function isCrimeCategory(cat: NewsCategory): boolean {
  return (
    cat === "All Crimes" ||
    cat === "Theft" ||
    cat === "Robbery" ||
    cat === "Assault" ||
    cat === "Burglary" ||
    cat === "Vehicle Theft" ||
    cat === "Missing Person"
  );
}

/**
 * Deduplicate real news articles by link or ID
 */
export function deduplicateArticles(articles: RealNewsArticle[]): RealNewsArticle[] {
  const seen = new Set<string>();
  const results: RealNewsArticle[] = [];

  for (const article of articles) {
    const key = article.link || article.id || article.title;
    if (!seen.has(key)) {
      seen.add(key);
      results.push(article);
    }
  }

  return results;
}

/**
 * Format relative time (e.g. "2 hours ago", "45 mins ago", "Yesterday")
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Recently";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "Recently";
  }
}

/**
 * Clean & normalize source name
 */
export function formatSourceName(sourceId?: string | null, sourceName?: string | null): string {
  if (sourceName && sourceName.trim().length > 0) return sourceName.trim();
  if (sourceId && sourceId.trim().length > 0) {
    return sourceId
      .replace(/[_\-]/g, " ")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  return "NewsData";
}

/**
 * Parse raw NewsData.io article into standardized RealNewsArticle
 */
export function parseNewsDataArticle(rawItem: any, index: number): RealNewsArticle {
  const title = (rawItem.title || "Nagpur Urban Safety Report").trim();
  const description = rawItem.description || rawItem.content || null;
  const combinedText = `${title} ${description || ""}`;

  const { category, isCrime } = classifyNewsCategory(title, description);
  const location = extractNagpurLocation(combinedText);
  const sourceName = formatSourceName(rawItem.source_id, rawItem.source_name || rawItem.creator?.[0]);
  const pubDate = rawItem.pubDate || new Date().toISOString();
  const relativeTime = formatRelativeTime(pubDate);

  return {
    id: rawItem.article_id || `news-${index}-${Date.now()}`,
    title,
    description,
    content: rawItem.content || null,
    link: rawItem.link || "https://newsdata.io",
    imageUrl: rawItem.image_url || null,
    pubDate,
    relativeTime,
    sourceName,
    sourceUrl: rawItem.source_url || null,
    category,
    isCrime,
    sourceType: "news",
    location,
    verificationStatus: "Reported by News Source",
  };
}

/**
 * Calculate dynamic counts for each category from fetched articles
 */
export function calculateCategoryCounts(articles: RealNewsArticle[]): Record<NewsCategory, number> {
  const counts: Record<NewsCategory, number> = {
    "All Updates": articles.length,
    "All Crimes": 0,
    Theft: 0,
    Robbery: 0,
    Assault: 0,
    Burglary: 0,
    "Vehicle Theft": 0,
    Accident: 0,
    Fire: 0,
    "Missing Person": 0,
    Other: 0,
  };

  for (const article of articles) {
    if (article.category in counts) {
      counts[article.category]++;
    }
    if (article.isCrime || isCrimeCategory(article.category)) {
      counts["All Crimes"]++;
    }
  }

  return counts;
}
