"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  CitizenSubmittedReport,
  NewsApiResponse,
  NewsCategory,
  RealNewsArticle,
} from "@/lib/newsTypes";

const DEFAULT_CATEGORY_COUNTS: Record<NewsCategory, number> = {
  "All Updates": 0,
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

export function useRealNews() {
  const [articles, setArticles] = useState<RealNewsArticle[]>([]);
  const [allArticles, setAllArticles] = useState<RealNewsArticle[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<NewsCategory, number>>(DEFAULT_CATEGORY_COUNTS);
  const [citizenReports, setCitizenReports] = useState<CitizenSubmittedReport[]>([
    {
      id: "cit-rep-01",
      title: "Broken Streetlight & Low Visibility Near Variety Square Alley",
      description: "Streetlights have been non-functional for 3 days along the back lane, creating poor visibility after 8 PM.",
      category: "Other",
      locationName: "Sitabuldi",
      lat: 21.1472,
      lng: 79.0838,
      timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      submittedBy: "Verified Citizen",
      status: "under_review",
    },
    {
      id: "cit-rep-02",
      title: "Pothole Hazard Causing Two-Wheeler Skids on Wardha Road Flyover Descent",
      description: "Severe asphalt patch near the flyover descent has caused multiple near-miss motorcycle slips.",
      category: "Accident",
      locationName: "Wardha Road",
      lat: 21.1065,
      lng: 79.0722,
      timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      submittedBy: "Citizen Volunteer",
      status: "unverified",
    },
  ]);

  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>("All Updates");
  const [sortBy, setSortBy] = useState<"latest" | "relevant">("latest");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchNews = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setIsRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const url = new URL("/api/news", window.location.origin);
        url.searchParams.set("category", selectedCategory);
        url.searchParams.set("sort", sortBy);
        if (isManualRefresh) {
          url.searchParams.set("_t", Date.now().toString());
        }

        const res = await fetch(url.toString(), {
          cache: isManualRefresh ? "no-store" : "default",
        });
        const data: NewsApiResponse = await res.json();

        if (data.error && data.articles.length === 0 && (!data.allArticles || data.allArticles.length === 0)) {
          setError(data.error);
          setArticles([]);
          setAllArticles([]);
        } else {
          setArticles(data.articles || []);
          setAllArticles(data.allArticles || data.articles || []);
          if (data.categoryCounts) {
            setCategoryCounts(data.categoryCounts);
          }
          setError(null);
        }

        const now = new Date();
        setLastUpdated(
          now.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
        );
      } catch (err: any) {
        setError(err.message || "Unable to retrieve news reports.");
        setArticles([]);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedCategory, sortBy]
  );

  useEffect(() => {
    fetchNews(false);
  }, [fetchNews]);

  const submitCitizenReport = (report: Omit<CitizenSubmittedReport, "id" | "timestamp" | "status">) => {
    const newReport: CitizenSubmittedReport = {
      ...report,
      id: `cit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: "unverified",
    };
    setCitizenReports((prev) => [newReport, ...prev]);
    return newReport;
  };

  return {
    articles,
    allArticles,
    categoryCounts,
    citizenReports,
    loading,
    isRefreshing,
    error,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    lastUpdated,
    refreshNews: () => fetchNews(true),
    submitCitizenReport,
  };
}
