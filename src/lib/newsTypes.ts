export type NewsCategory =
  | "All Updates"
  | "All Crimes"
  | "Theft"
  | "Robbery"
  | "Assault"
  | "Burglary"
  | "Vehicle Theft"
  | "Accident"
  | "Fire"
  | "Missing Person"
  | "Other";

export type ReportSourceType = "news" | "citizen" | "official";

export interface RecognizedLocation {
  name: string;
  lat: number;
  lng: number;
  isSpecificZone: boolean;
}

export interface RealNewsArticle {
  id: string;
  title: string;
  description: string | null;
  content?: string | null;
  link: string; // Real article URL
  imageUrl: string | null;
  pubDate: string; // ISO string
  relativeTime: string; // "2 hours ago"
  sourceName: string; // e.g. "Times of India", "The Hitavada", "Lokmat Times"
  sourceUrl?: string | null;
  category: NewsCategory;
  isCrime: boolean;
  sourceType: ReportSourceType;
  location: RecognizedLocation;
  verificationStatus: "Reported by News Source" | "Citizen Report (Unverified)" | "Official Police / Civic Source";
  severity?: "low" | "medium" | "high" | "critical";
}

export interface CitizenSubmittedReport {
  id: string;
  title: string;
  description: string;
  category: NewsCategory;
  locationName: string;
  lat: number;
  lng: number;
  timestamp: string;
  submittedBy?: string;
  status: "unverified" | "under_review" | "verified_by_patrol";
}

export interface NewsApiResponse {
  articles: RealNewsArticle[];
  allArticles?: RealNewsArticle[]; // Unfiltered full feed for sidebar
  totalResults: number;
  lastUpdated: string;
  source: "newsdata.io" | "fallback_offline";
  categoryCounts?: Record<NewsCategory, number>;
  error?: string | null;
}
