import type { FeatureCollection, Feature, Polygon } from "geojson";

export type SafetyTier = "safe" | "moderate" | "caution";

export interface SafeSpot {
  id: string;
  name: string;
  category: "metro" | "pharmacy" | "cafe" | "hospital" | "kiosk";
  address: string;
  is24x7: boolean;
  lat: number;
  lng: number;
  phone?: string;
}

export interface HourlySafetyPoint {
  time: string; // e.g. "6 AM", "12 PM", "6 PM", "10 PM", "2 AM"
  hour: number; // 0-23
  safetyScore: number; // 0-100
  crowdLevel: "High" | "Medium" | "Low";
  lightingLevel: "Bright" | "Moderate" | "Dim";
}

export interface ZoneCitizenData {
  id: string;
  name: string;
  tagline: string;
  areaType: string;
  tier: SafetyTier;
  safetyScore: number; // 0 to 100
  lightingScore: number; // e.g. 94%
  lightingStatus: "Excellent" | "Good" | "Moderate" | "Needs Improvement";
  crowdLevel: "High & Vibrant" | "Moderate Footfall" | "Low / Quiet";
  verifiedSafeSpotsCount: number;
  recentIncidentIndex: "Very Low (0.4/10)" | "Low (1.2/10)" | "Moderate (2.8/10)" | "Elevated (4.1/10)";
  primaryVibe: string;
  bestHours: string;
  cautionNotes?: string;
  communityTip: string;
  center: { lat: number; lng: number };
  safeSpots: SafeSpot[];
  hourlyTrends: HourlySafetyPoint[];
}

export interface SafeRouteOption {
  id: string;
  name: string;
  tag: string;
  durationMinutes: number;
  distanceKm: number;
  safetyScore: number;
  isRecommended: boolean;
  lightingPercent: number;
  cctvCoveragePercent: number;
  description: string;
  waypoints: { name: string; type: "safe-hub" | "well-lit-street" | "metro-station" | "checkpoint"; safety: "high" | "medium" }[];
  pathCoordinates: [number, number][]; // [lng, lat]
}

// ---------------------------------------------------------------------------
// Pastel Status Color Palette (Apple / Airbnb style, never blinding)
// ---------------------------------------------------------------------------
export const STATUS_COLORS = {
  safe: {
    fill: [16, 185, 129, 50], // Soft Mint Translucent Fill [r, g, b, a]
    border: [16, 185, 129, 210], // Soft Mint Line
    hex: "#10B981",
    bgClass: "bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
    badgeBg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    dotClass: "bg-emerald-500",
    pillLabel: "Safe to Travel",
    glow: "rgba(16, 185, 129, 0.25)",
  },
  moderate: {
    fill: [245, 158, 11, 50], // Soft Peach/Amber Translucent Fill
    border: [245, 158, 11, 210],
    hex: "#F59E0B",
    bgClass: "bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
    badgeBg: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    dotClass: "bg-amber-500",
    pillLabel: "Moderate Caution",
    glow: "rgba(245, 158, 11, 0.25)",
  },
  caution: {
    fill: [244, 63, 94, 50], // Soft Coral/Rose Translucent Fill
    border: [244, 63, 94, 210],
    hex: "#F43F5E",
    bgClass: "bg-rose-50 text-rose-800 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
    badgeBg: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
    dotClass: "bg-rose-500",
    pillLabel: "Stay on Main Roads",
    glow: "rgba(244, 63, 94, 0.25)",
  },
} as const;

// ---------------------------------------------------------------------------
// Nagpur Neighborhoods Data
// ---------------------------------------------------------------------------
export const NAGPUR_ZONES_DATA: Record<string, ZoneCitizenData> = {
  dharampeth: {
    id: "dharampeth",
    name: "Dharampeth",
    tagline: "Vibrant high street, cafes & family neighborhood",
    areaType: "Residential & Commercial High-Street",
    tier: "safe",
    safetyScore: 94,
    lightingScore: 96,
    lightingStatus: "Excellent",
    crowdLevel: "High & Vibrant",
    verifiedSafeSpotsCount: 22,
    recentIncidentIndex: "Very Low (0.4/10)",
    primaryVibe: "Active shopping avenues, families, well-lit cafes",
    bestHours: "6:00 AM – 11:30 PM",
    communityTip: "Zenda Chowk and WHC Road are bustling with open eateries and well-illuminated pavements even past 11 PM.",
    center: { lat: 21.1415, lng: 79.0635 },
    safeSpots: [
      { id: "sp-1", name: "Dharampeth Metro Station", category: "metro", address: "WHC Road, Dharampeth", is24x7: false, lat: 21.141, lng: 79.064, phone: "0712-2550100" },
      { id: "sp-2", name: "Apollo Pharmacy 24x7", category: "pharmacy", address: "Gokulpeth Market Chowk", is24x7: true, lat: 21.1425, lng: 79.061, phone: "+91 712 2548900" },
      { id: "sp-3", name: "Cafe Coffee Day — WHC Road", category: "cafe", address: "Opp. Shivaji Nagar Park", is24x7: false, lat: 21.1432, lng: 79.066 },
      { id: "sp-4", name: "Citizen Support Mitra Kiosk", category: "kiosk", address: "Dharampeth Police Corner", is24x7: true, lat: 21.1395, lng: 79.0645 },
    ],
    hourlyTrends: [
      { time: "6 AM", hour: 6, safetyScore: 96, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "9 AM", hour: 9, safetyScore: 98, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "12 PM", hour: 12, safetyScore: 95, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "3 PM", hour: 15, safetyScore: 93, crowdLevel: "Medium", lightingLevel: "Bright" },
      { time: "6 PM", hour: 18, safetyScore: 97, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "9 PM", hour: 21, safetyScore: 94, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "11 PM", hour: 23, safetyScore: 88, crowdLevel: "Medium", lightingLevel: "Bright" },
      { time: "2 AM", hour: 2, safetyScore: 82, crowdLevel: "Low", lightingLevel: "Moderate" },
      { time: "4 AM", hour: 4, safetyScore: 84, crowdLevel: "Low", lightingLevel: "Moderate" },
    ],
  },

  sitabuldi: {
    id: "sitabuldi",
    name: "Sitabuldi",
    tagline: "Central interchange, buzzing bazaars & transit interchange",
    areaType: "Major Transit & Commercial Hub",
    tier: "moderate",
    safetyScore: 78,
    lightingScore: 84,
    lightingStatus: "Good",
    crowdLevel: "High & Vibrant",
    verifiedSafeSpotsCount: 31,
    recentIncidentIndex: "Low (1.2/10)",
    primaryVibe: "Nagpur Metro interchange, busy markets, commuters",
    bestHours: "6:00 AM – 10:30 PM",
    cautionNotes: "Market alleyways behind main road become quiet after 10:30 PM. Keep to Munje Square and Metro corridor.",
    communityTip: "The Sitabuldi interchange station is equipped with 24/7 security desks and illuminated passenger skywalks.",
    center: { lat: 21.1465, lng: 79.0835 },
    safeSpots: [
      { id: "sp-5", name: "Sitabuldi Interchange Metro Hub", category: "metro", address: "Munje Square, Sitabuldi", is24x7: true, lat: 21.1462, lng: 79.0832, phone: "0712-2550101" },
      { id: "sp-6", name: "MedPlus 24-Hour Chemist", category: "pharmacy", address: "Variety Square, Sitabuldi", is24x7: true, lat: 21.148, lng: 79.0815 },
      { id: "sp-7", name: "Nagpur Railway Station West Helpdesk", category: "kiosk", address: "Station Road corridor", is24x7: true, lat: 21.152, lng: 79.089 },
    ],
    hourlyTrends: [
      { time: "6 AM", hour: 6, safetyScore: 82, crowdLevel: "Medium", lightingLevel: "Bright" },
      { time: "9 AM", hour: 9, safetyScore: 86, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "12 PM", hour: 12, safetyScore: 84, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "3 PM", hour: 15, safetyScore: 82, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "6 PM", hour: 18, safetyScore: 80, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "9 PM", hour: 21, safetyScore: 76, crowdLevel: "Medium", lightingLevel: "Bright" },
      { time: "11 PM", hour: 23, safetyScore: 70, crowdLevel: "Low", lightingLevel: "Moderate" },
      { time: "2 AM", hour: 2, safetyScore: 64, crowdLevel: "Low", lightingLevel: "Dim" },
      { time: "4 AM", hour: 4, safetyScore: 72, crowdLevel: "Low", lightingLevel: "Moderate" },
    ],
  },

  "civil-lines": {
    id: "civil-lines",
    name: "Civil Lines",
    tagline: "Serene tree-lined avenues, government hub & promenade",
    areaType: "Administrative & Promenade Zone",
    tier: "safe",
    safetyScore: 92,
    lightingScore: 94,
    lightingStatus: "Excellent",
    crowdLevel: "Moderate Footfall",
    verifiedSafeSpotsCount: 19,
    recentIncidentIndex: "Very Low (0.4/10)",
    primaryVibe: "Spacious green boulevards, joggers, institutional security",
    bestHours: "5:30 AM – 11:00 PM",
    communityTip: "Japanese Garden road and High Court stretch have continuous street lighting and active round-the-clock patrol posts.",
    center: { lat: 21.1575, lng: 79.0715 },
    safeSpots: [
      { id: "sp-8", name: "High Court Citizen Help Desk", category: "kiosk", address: "Palm Road, Civil Lines", is24x7: true, lat: 21.158, lng: 79.072 },
      { id: "sp-9", name: "CCD VIP Road", category: "cafe", address: "VIP Road, Civil Lines", is24x7: false, lat: 21.155, lng: 79.0735 },
      { id: "sp-10", name: "Wockhardt Super Speciality", category: "hospital", address: "North Ambazari Road, Shivaji Nagar", is24x7: true, lat: 21.149, lng: 79.068, phone: "0712-6624444" },
    ],
    hourlyTrends: [
      { time: "6 AM", hour: 6, safetyScore: 95, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "9 AM", hour: 9, safetyScore: 96, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "12 PM", hour: 12, safetyScore: 94, crowdLevel: "Medium", lightingLevel: "Bright" },
      { time: "3 PM", hour: 15, safetyScore: 92, crowdLevel: "Medium", lightingLevel: "Bright" },
      { time: "6 PM", hour: 18, safetyScore: 95, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "9 PM", hour: 21, safetyScore: 90, crowdLevel: "Medium", lightingLevel: "Bright" },
      { time: "11 PM", hour: 23, safetyScore: 84, crowdLevel: "Low", lightingLevel: "Bright" },
      { time: "2 AM", hour: 2, safetyScore: 79, crowdLevel: "Low", lightingLevel: "Moderate" },
      { time: "4 AM", hour: 4, safetyScore: 82, crowdLevel: "Low", lightingLevel: "Moderate" },
    ],
  },

  sadar: {
    id: "sadar",
    name: "Sadar",
    tagline: "Historic food street, dining destination & retail heart",
    areaType: "Commercial & Dining Precinct",
    tier: "safe",
    safetyScore: 89,
    lightingScore: 91,
    lightingStatus: "Excellent",
    crowdLevel: "High & Vibrant",
    verifiedSafeSpotsCount: 26,
    recentIncidentIndex: "Low (1.2/10)",
    primaryVibe: "Mount Road dining, ice cream joints, well-patronized night street",
    bestHours: "7:00 AM – 12:30 AM",
    communityTip: "Mount Road and Residency Road remain vibrant until midnight with lively crowd presence outside dessert parlors and restaurants.",
    center: { lat: 21.164, lng: 79.082 },
    safeSpots: [
      { id: "sp-11", name: "Sadar Flyover Citizen Assistance Point", category: "kiosk", address: "Mount Road Junction", is24x7: true, lat: 21.163, lng: 79.0815 },
      { id: "sp-12", name: "Haldiram's Multi-Storey Hub", category: "cafe", address: "Residency Road, Sadar", is24x7: false, lat: 21.165, lng: 79.083 },
      { id: "sp-13", name: "24/7 Relief Chemist Sadar", category: "pharmacy", address: "Tumpalliwar Square", is24x7: true, lat: 21.162, lng: 79.0845 },
    ],
    hourlyTrends: [
      { time: "6 AM", hour: 6, safetyScore: 88, crowdLevel: "Low", lightingLevel: "Bright" },
      { time: "9 AM", hour: 9, safetyScore: 91, crowdLevel: "Medium", lightingLevel: "Bright" },
      { time: "12 PM", hour: 12, safetyScore: 92, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "3 PM", hour: 15, safetyScore: 90, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "6 PM", hour: 18, safetyScore: 94, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "9 PM", hour: 21, safetyScore: 93, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "11 PM", hour: 23, safetyScore: 87, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "2 AM", hour: 2, safetyScore: 76, crowdLevel: "Low", lightingLevel: "Moderate" },
      { time: "4 AM", hour: 4, safetyScore: 78, crowdLevel: "Low", lightingLevel: "Moderate" },
    ],
  },

  "it-park": {
    id: "it-park",
    name: "IT Park (Gayatri Nagar)",
    tagline: "Tech campus hub, co-working spaces & startup avenue",
    areaType: "Technology & Innovation Park",
    tier: "safe",
    safetyScore: 91,
    lightingScore: 93,
    lightingStatus: "Excellent",
    crowdLevel: "High & Vibrant",
    verifiedSafeSpotsCount: 17,
    recentIncidentIndex: "Very Low (0.4/10)",
    primaryVibe: "24x7 work culture, continuous security, shuttle corridors",
    bestHours: "24 Hours Accessible",
    communityTip: "Parsodi and VNIT boundary stretches have 24/7 security patrols and illuminated tech park perimeter lighting.",
    center: { lat: 21.1235, lng: 79.052 },
    safeSpots: [
      { id: "sp-14", name: "South Ambazari Metro Station", category: "metro", address: "Subhash Nagar Road", is24x7: false, lat: 21.127, lng: 79.057 },
      { id: "sp-15", name: "Infocepts Campus 24/7 Guardhouse", category: "kiosk", address: "Gayatri Nagar IT Park", is24x7: true, lat: 21.122, lng: 79.051 },
      { id: "sp-16", name: "CCD VNIT Square", category: "cafe", address: "Opp VNIT Main Gate", is24x7: false, lat: 21.126, lng: 79.054 },
    ],
    hourlyTrends: [
      { time: "6 AM", hour: 6, safetyScore: 92, crowdLevel: "Medium", lightingLevel: "Bright" },
      { time: "9 AM", hour: 9, safetyScore: 95, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "12 PM", hour: 12, safetyScore: 94, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "3 PM", hour: 15, safetyScore: 93, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "6 PM", hour: 18, safetyScore: 96, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "9 PM", hour: 21, safetyScore: 92, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "11 PM", hour: 23, safetyScore: 89, crowdLevel: "Medium", lightingLevel: "Bright" },
      { time: "2 AM", hour: 2, safetyScore: 85, crowdLevel: "Medium", lightingLevel: "Bright" },
      { time: "4 AM", hour: 4, safetyScore: 86, crowdLevel: "Low", lightingLevel: "Bright" },
    ],
  },

  ramdaspeth: {
    id: "ramdaspeth",
    name: "Ramdaspeth & Dhantoli",
    tagline: "Medical district, leafy avenues & 24/7 care centers",
    areaType: "Healthcare & High-End Residential",
    tier: "safe",
    safetyScore: 93,
    lightingScore: 95,
    lightingStatus: "Excellent",
    crowdLevel: "High & Vibrant",
    verifiedSafeSpotsCount: 28,
    recentIncidentIndex: "Very Low (0.4/10)",
    primaryVibe: "24/7 hospital staff, round-the-clock pharmacies, well-lit roads",
    bestHours: "24 Hours Active",
    communityTip: "Central Bazaar Road and Canal Road have the highest density of 24-hour illuminated open medical facilities in Nagpur.",
    center: { lat: 21.137, lng: 79.0735 },
    safeSpots: [
      { id: "sp-17", name: "Rahate Colony Metro Station", category: "metro", address: "Wardha Road, Dhantoli", is24x7: false, lat: 21.134, lng: 79.078 },
      { id: "sp-18", name: "Care Hospitals 24x7 Emergency", category: "hospital", address: "Panchsheel Square, Ramdaspeth", is24x7: true, lat: 21.138, lng: 79.072, phone: "0712-3982222" },
      { id: "sp-19", name: "Apollo Pharmacy Round-the-Clock", category: "pharmacy", address: "Central Bazaar Road", is24x7: true, lat: 21.1365, lng: 79.074 },
    ],
    hourlyTrends: [
      { time: "6 AM", hour: 6, safetyScore: 94, crowdLevel: "Medium", lightingLevel: "Bright" },
      { time: "9 AM", hour: 9, safetyScore: 96, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "12 PM", hour: 12, safetyScore: 95, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "3 PM", hour: 15, safetyScore: 94, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "6 PM", hour: 18, safetyScore: 97, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "9 PM", hour: 21, safetyScore: 95, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "11 PM", hour: 23, safetyScore: 91, crowdLevel: "Medium", lightingLevel: "Bright" },
      { time: "2 AM", hour: 2, safetyScore: 88, crowdLevel: "Medium", lightingLevel: "Bright" },
      { time: "4 AM", hour: 4, safetyScore: 89, crowdLevel: "Medium", lightingLevel: "Bright" },
    ],
  },

  "futala-seminary": {
    id: "futala-seminary",
    name: "Futala Lake & Seminary Hills",
    tagline: "Waterfront promenade, lush gardens & sunset point",
    areaType: "Recreational & Scenic Waterfront",
    tier: "moderate",
    safetyScore: 76,
    lightingScore: 79,
    lightingStatus: "Moderate",
    crowdLevel: "High & Vibrant",
    verifiedSafeSpotsCount: 14,
    recentIncidentIndex: "Moderate (2.8/10)",
    primaryVibe: "Evening food kiosks, lake breeze, scenic joggers",
    bestHours: "5:00 AM – 9:30 PM",
    cautionNotes: "Lake back-curves and secluded Seminary Hills forest tracks get dark after sunset. Stick to the main paved promenade.",
    communityTip: "Futala Chowpatty has LED floodlights and family crowds until 10 PM. Avoid unlit inner garden trails after dusk.",
    center: { lat: 21.153, lng: 79.0435 },
    safeSpots: [
      { id: "sp-20", name: "Futala Lake Promenade Help Desk", category: "kiosk", address: "Main Lake Road", is24x7: false, lat: 21.152, lng: 79.044 },
      { id: "sp-21", name: "Seminary Hills Forest Post", category: "kiosk", address: "Telangkhedi Garden Gate", is24x7: false, lat: 21.159, lng: 79.048 },
      { id: "sp-22", name: "Lakeview Cafe Hub", category: "cafe", address: "Futala Frontage", is24x7: false, lat: 21.151, lng: 79.042 },
    ],
    hourlyTrends: [
      { time: "6 AM", hour: 6, safetyScore: 92, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "9 AM", hour: 9, safetyScore: 86, crowdLevel: "Medium", lightingLevel: "Bright" },
      { time: "12 PM", hour: 12, safetyScore: 80, crowdLevel: "Medium", lightingLevel: "Bright" },
      { time: "3 PM", hour: 15, safetyScore: 78, crowdLevel: "Medium", lightingLevel: "Bright" },
      { time: "6 PM", hour: 18, safetyScore: 88, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "9 PM", hour: 21, safetyScore: 75, crowdLevel: "High", lightingLevel: "Moderate" },
      { time: "11 PM", hour: 23, safetyScore: 62, crowdLevel: "Low", lightingLevel: "Dim" },
      { time: "2 AM", hour: 2, safetyScore: 54, crowdLevel: "Low", lightingLevel: "Dim" },
      { time: "4 AM", hour: 4, safetyScore: 66, crowdLevel: "Low", lightingLevel: "Dim" },
    ],
  },

  mahal: {
    id: "mahal",
    name: "Mahal & Gandhibagh",
    tagline: "Old historic quarter, heritage markets & narrow bazaars",
    areaType: "Traditional Heritage & Wholesale Market",
    tier: "caution",
    safetyScore: 58,
    lightingScore: 65,
    lightingStatus: "Needs Improvement",
    crowdLevel: "High & Vibrant",
    verifiedSafeSpotsCount: 11,
    recentIncidentIndex: "Elevated (4.1/10)",
    primaryVibe: "Dense lanes, cloth markets, antique architecture",
    bestHours: "8:00 AM – 9:00 PM",
    cautionNotes: "Multiple narrow alleys have low street lamp coverage. Recommended to take the main Tilak Statue road at night.",
    communityTip: "Stick to the main central road connecting Tilak Statue and Gandhi Gate. Use the illuminated auto stand near Town Hall.",
    center: { lat: 21.144, lng: 79.111 },
    safeSpots: [
      { id: "sp-23", name: "Town Hall Citizen Stand", category: "kiosk", address: "Mahal Town Hall Square", is24x7: true, lat: 21.1445, lng: 79.112 },
      { id: "sp-24", name: "Gandhibagh Chemist", category: "pharmacy", address: "Main Bazaar Road", is24x7: false, lat: 21.149, lng: 79.108 },
    ],
    hourlyTrends: [
      { time: "6 AM", hour: 6, safetyScore: 74, crowdLevel: "Medium", lightingLevel: "Bright" },
      { time: "9 AM", hour: 9, safetyScore: 79, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "12 PM", hour: 12, safetyScore: 78, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "3 PM", hour: 15, safetyScore: 75, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "6 PM", hour: 18, safetyScore: 70, crowdLevel: "High", lightingLevel: "Moderate" },
      { time: "9 PM", hour: 21, safetyScore: 58, crowdLevel: "Medium", lightingLevel: "Dim" },
      { time: "11 PM", hour: 23, safetyScore: 48, crowdLevel: "Low", lightingLevel: "Dim" },
      { time: "2 AM", hour: 2, safetyScore: 44, crowdLevel: "Low", lightingLevel: "Dim" },
      { time: "4 AM", hour: 4, safetyScore: 52, crowdLevel: "Low", lightingLevel: "Dim" },
    ],
  },

  "medical-square": {
    id: "medical-square",
    name: "Medical Square & Ajni",
    tagline: "GMC Hospital corridor, railway terminus & transit point",
    areaType: "Medical Campus & Railway Junction",
    tier: "safe",
    safetyScore: 87,
    lightingScore: 90,
    lightingStatus: "Good",
    crowdLevel: "High & Vibrant",
    verifiedSafeSpotsCount: 24,
    recentIncidentIndex: "Low (1.2/10)",
    primaryVibe: "24-hour emergency wards, active nursing colleges, student doctors",
    bestHours: "24 Hours Accessible",
    communityTip: "Medical College road is constantly patrolled and all pharmacy clusters operate throughout the night.",
    center: { lat: 21.127, lng: 79.096 },
    safeSpots: [
      { id: "sp-25", name: "GMC Government Medical College 24/7 Emergency", category: "hospital", address: "Medical Square", is24x7: true, lat: 21.128, lng: 79.098, phone: "0712-2744100" },
      { id: "sp-26", name: "Congress Nagar Metro Station", category: "metro", address: "Ajni Chowk corridor", is24x7: false, lat: 21.131, lng: 79.087 },
      { id: "sp-27", name: "Sanjivani 24-Hour Chemist", category: "pharmacy", address: "Opp GMC Gate 2", is24x7: true, lat: 21.1265, lng: 79.095 },
    ],
    hourlyTrends: [
      { time: "6 AM", hour: 6, safetyScore: 89, crowdLevel: "Medium", lightingLevel: "Bright" },
      { time: "9 AM", hour: 9, safetyScore: 92, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "12 PM", hour: 12, safetyScore: 91, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "3 PM", hour: 15, safetyScore: 89, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "6 PM", hour: 18, safetyScore: 90, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "9 PM", hour: 21, safetyScore: 88, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "11 PM", hour: 23, safetyScore: 83, crowdLevel: "Medium", lightingLevel: "Bright" },
      { time: "2 AM", hour: 2, safetyScore: 78, crowdLevel: "Medium", lightingLevel: "Moderate" },
      { time: "4 AM", hour: 4, safetyScore: 81, crowdLevel: "Low", lightingLevel: "Moderate" },
    ],
  },

  mankapur: {
    id: "mankapur",
    name: "Mankapur & Koradi Road",
    tagline: "Sports complex, residential colonies & northern gateway",
    areaType: "Sports & Residential Suburb",
    tier: "moderate",
    safetyScore: 77,
    lightingScore: 82,
    lightingStatus: "Good",
    crowdLevel: "Moderate Footfall",
    verifiedSafeSpotsCount: 15,
    recentIncidentIndex: "Low (1.2/10)",
    primaryVibe: "Stadium visitors, evening families, broad bypass road",
    bestHours: "6:00 AM – 10:00 PM",
    cautionNotes: "Open ring road bypass stretches have high vehicular speed; pedestrian crossings require care at night.",
    communityTip: "Mankapur Indoor Stadium ring road has bright LED illumination and regular security posts.",
    center: { lat: 21.189, lng: 79.076 },
    safeSpots: [
      { id: "sp-28", name: "Mankapur Sports Complex Safety Desk", category: "kiosk", address: "Koradi Road, Mankapur", is24x7: false, lat: 21.188, lng: 79.075 },
      { id: "sp-29", name: "Alexis / Max Healthcare", category: "hospital", address: "Mankapur Square", is24x7: true, lat: 21.192, lng: 79.078, phone: "0712-7120000" },
    ],
    hourlyTrends: [
      { time: "6 AM", hour: 6, safetyScore: 86, crowdLevel: "Medium", lightingLevel: "Bright" },
      { time: "9 AM", hour: 9, safetyScore: 88, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "12 PM", hour: 12, safetyScore: 84, crowdLevel: "Medium", lightingLevel: "Bright" },
      { time: "3 PM", hour: 15, safetyScore: 82, crowdLevel: "Medium", lightingLevel: "Bright" },
      { time: "6 PM", hour: 18, safetyScore: 86, crowdLevel: "High", lightingLevel: "Bright" },
      { time: "9 PM", hour: 21, safetyScore: 78, crowdLevel: "Medium", lightingLevel: "Bright" },
      { time: "11 PM", hour: 23, safetyScore: 70, crowdLevel: "Low", lightingLevel: "Moderate" },
      { time: "2 AM", hour: 2, safetyScore: 65, crowdLevel: "Low", lightingLevel: "Dim" },
      { time: "4 AM", hour: 4, safetyScore: 72, crowdLevel: "Low", lightingLevel: "Moderate" },
    ],
  },
};

// ---------------------------------------------------------------------------
// GeoJSON Polygonal Boundaries for Nagpur Zones
// ---------------------------------------------------------------------------
export const CITIZEN_GEOJSON: FeatureCollection<Polygon, ZoneCitizenData> = {
  type: "FeatureCollection",
  features: [
    // Dharampeth
    {
      type: "Feature",
      id: "dharampeth",
      properties: NAGPUR_ZONES_DATA.dharampeth,
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [79.052, 21.132],
            [79.074, 21.13],
            [79.075, 21.148],
            [79.053, 21.15],
            [79.052, 21.132],
          ],
        ],
      },
    },
    // Sitabuldi
    {
      type: "Feature",
      id: "sitabuldi",
      properties: NAGPUR_ZONES_DATA.sitabuldi,
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [79.074, 21.14],
            [79.091, 21.139],
            [79.093, 21.152],
            [79.076, 21.153],
            [79.074, 21.14],
          ],
        ],
      },
    },
    // Civil Lines
    {
      type: "Feature",
      id: "civil-lines",
      properties: NAGPUR_ZONES_DATA["civil-lines"],
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [79.058, 21.15],
            [79.082, 21.151],
            [79.084, 21.166],
            [79.06, 21.165],
            [79.058, 21.15],
          ],
        ],
      },
    },
    // Sadar
    {
      type: "Feature",
      id: "sadar",
      properties: NAGPUR_ZONES_DATA.sadar,
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [79.075, 21.158],
            [79.095, 21.157],
            [79.096, 21.172],
            [79.074, 21.173],
            [79.075, 21.158],
          ],
        ],
      },
    },
    // Ramdaspeth
    {
      type: "Feature",
      id: "ramdaspeth",
      properties: NAGPUR_ZONES_DATA.ramdaspeth,
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [79.065, 21.129],
            [79.083, 21.128],
            [79.085, 21.141],
            [79.066, 21.142],
            [79.065, 21.129],
          ],
        ],
      },
    },
    // IT Park
    {
      type: "Feature",
      id: "it-park",
      properties: NAGPUR_ZONES_DATA["it-park"],
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [79.043, 21.116],
            [79.062, 21.115],
            [79.063, 21.13],
            [79.042, 21.131],
            [79.043, 21.116],
          ],
        ],
      },
    },
    // Futala & Seminary
    {
      type: "Feature",
      id: "futala-seminary",
      properties: NAGPUR_ZONES_DATA["futala-seminary"],
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [79.034, 21.145],
            [79.054, 21.146],
            [79.055, 21.164],
            [79.035, 21.163],
            [79.034, 21.145],
          ],
        ],
      },
    },
    // Mahal
    {
      type: "Feature",
      id: "mahal",
      properties: NAGPUR_ZONES_DATA.mahal,
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [79.1, 21.136],
            [79.122, 21.135],
            [79.124, 21.152],
            [79.099, 21.153],
            [79.1, 21.136],
          ],
        ],
      },
    },
    // Medical Square
    {
      type: "Feature",
      id: "medical-square",
      properties: NAGPUR_ZONES_DATA["medical-square"],
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [79.086, 21.118],
            [79.108, 21.117],
            [79.11, 21.134],
            [79.088, 21.135],
            [79.086, 21.118],
          ],
        ],
      },
    },
    // Mankapur
    {
      type: "Feature",
      id: "mankapur",
      properties: NAGPUR_ZONES_DATA.mankapur,
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [79.066, 21.178],
            [79.09, 21.177],
            [79.092, 21.198],
            [79.068, 21.199],
            [79.066, 21.178],
          ],
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Pre-calculated Safe Routes Sample (e.g. from Dharampeth to Sitabuldi)
// ---------------------------------------------------------------------------
export const SAMPLE_SAFE_ROUTES: Record<string, SafeRouteOption[]> = {
  "dharampeth-to-sitabuldi": [
    {
      id: "route-well-lit",
      name: "Well-Lit & Populated Avenue",
      tag: "Safest Choice",
      durationMinutes: 11,
      distanceKm: 2.8,
      safetyScore: 95,
      isRecommended: true,
      lightingPercent: 98,
      cctvCoveragePercent: 94,
      description: "Follows West High Court Road directly along the Metro viaduct with continuous street lights and verified open cafes.",
      waypoints: [
        { name: "Dharampeth Zenda Chowk", type: "checkpoint", safety: "high" },
        { name: "WHC Road Metro Corridor", type: "metro-station", safety: "high" },
        { name: "Variety Square 24/7 Chemist", type: "safe-hub", safety: "high" },
        { name: "Sitabuldi Interchange Entrance", type: "metro-station", safety: "high" },
      ],
      pathCoordinates: [
        [79.0635, 21.1415],
        [79.067, 21.142],
        [79.072, 21.144],
        [79.078, 21.1455],
        [79.0835, 21.1465],
      ],
    },
    {
      id: "route-shortest",
      name: "Shortest Back-Road Route",
      tag: "Faster, Less Lit",
      durationMinutes: 8,
      distanceKm: 2.2,
      safetyScore: 68,
      isRecommended: false,
      lightingPercent: 64,
      cctvCoveragePercent: 50,
      description: "Cuts through residential lanes behind Shivaji Nagar. Shorter by 3 mins, but passes through 2 unlit alleyways.",
      waypoints: [
        { name: "Dharampeth Back Lane", type: "checkpoint", safety: "medium" },
        { name: "Shivaji Nagar Inner Cross", type: "checkpoint", safety: "medium" },
        { name: "Railway Underpass Cut", type: "checkpoint", safety: "medium" },
        { name: "Sitabuldi West Edge", type: "checkpoint", safety: "high" },
      ],
      pathCoordinates: [
        [79.0635, 21.1415],
        [79.068, 21.139],
        [79.075, 21.141],
        [79.0835, 21.1465],
      ],
    },
  ],
};
