import { NextRequest, NextResponse } from "next/server";
import {
  calculateCategoryCounts,
  deduplicateArticles,
  isCrimeCategory,
  parseNewsDataArticle,
} from "@/lib/newsService";
import type { NewsApiResponse, NewsCategory, RealNewsArticle } from "@/lib/newsTypes";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const categoryParam = (searchParams.get("category") || "All Updates") as NewsCategory;
  const sortParam = searchParams.get("sort") || "latest";

  const apiKey =
    process.env.NEWSDATA_API_KEY ||
    process.env.NEXT_PUBLIC_NEWSDATA_API_KEY;

  if (!apiKey || apiKey === "YOUR_NEW_ROTATED_API_KEY") {
    return NextResponse.json<NewsApiResponse>(
      {
        articles: [],
        allArticles: [],
        totalResults: 0,
        lastUpdated: new Date().toISOString(),
        source: "newsdata.io",
        categoryCounts: {
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
        },
        error: "NewsData.io API key is not configured in environment variables.",
      },
      { status: 200 }
    );
  }

  try {
    // 1. Fetch general Nagpur news (contains all latest city stories)
    const primaryUrl = new URL("https://newsdata.io/api/1/latest");
    primaryUrl.searchParams.set("apikey", apiKey);
    primaryUrl.searchParams.set("q", "Nagpur");
    primaryUrl.searchParams.set("language", "en");

    let rawResults: any[] = [];

    const res = await fetch(primaryUrl.toString(), {
      next: { revalidate: 180 },
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      rawResults = data.results || [];
    }

    // 2. Fetch specific safety/crime query if a specific crime category is selected
    if (categoryParam !== "All Updates" && categoryParam !== "Other") {
      let specificQuery = "Nagpur crime OR Nagpur safety";
      if (categoryParam === "Theft") specificQuery = "Nagpur theft OR Nagpur stolen";
      else if (categoryParam === "Robbery") specificQuery = "Nagpur robbery OR Nagpur loot";
      else if (categoryParam === "Assault") specificQuery = "Nagpur assault OR Nagpur attack";
      else if (categoryParam === "Burglary") specificQuery = "Nagpur burglary OR Nagpur break-in";
      else if (categoryParam === "Vehicle Theft") specificQuery = "Nagpur vehicle theft OR Nagpur bike theft";
      else if (categoryParam === "Accident") specificQuery = "Nagpur accident OR Nagpur collision";
      else if (categoryParam === "Fire") specificQuery = "Nagpur fire OR Nagpur blaze";
      else if (categoryParam === "Missing Person") specificQuery = "Nagpur missing";

      try {
        const specificUrl = new URL("https://newsdata.io/api/1/latest");
        specificUrl.searchParams.set("apikey", apiKey);
        specificUrl.searchParams.set("q", specificQuery);
        specificUrl.searchParams.set("language", "en");

        const specificRes = await fetch(specificUrl.toString(), {
          next: { revalidate: 180 },
          headers: { Accept: "application/json" },
        });

        if (specificRes.ok) {
          const specificData = await specificRes.json();
          rawResults = [...rawResults, ...(specificData.results || [])];
        }
      } catch (e) {
        console.warn("Secondary query fetch error:", e);
      }
    }

    // Parse all raw articles with strict priority classification
    const parsedArticles: RealNewsArticle[] = rawResults.map((item: any, idx: number) =>
      parseNewsDataArticle(item, idx)
    );

    // Deduplicate across queries
    const uniqueArticles = deduplicateArticles(parsedArticles);

    // Calculate dynamic counts
    const categoryCounts = calculateCategoryCounts(uniqueArticles);

    // Filter by selected category
    let filteredArticles = uniqueArticles;

    if (categoryParam === "All Updates") {
      filteredArticles = uniqueArticles;
    } else if (categoryParam === "All Crimes") {
      filteredArticles = uniqueArticles.filter(
        (article) => article.isCrime || isCrimeCategory(article.category)
      );
    } else {
      filteredArticles = uniqueArticles.filter(
        (article) => article.category === categoryParam
      );
    }

    // Apply sorting
    if (sortParam === "latest") {
      filteredArticles.sort(
        (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
      );
      uniqueArticles.sort(
        (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
      );
    }

    return NextResponse.json<NewsApiResponse>(
      {
        articles: filteredArticles,
        allArticles: uniqueArticles,
        totalResults: filteredArticles.length,
        categoryCounts,
        lastUpdated: new Date().toISOString(),
        source: "newsdata.io",
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err: any) {
    console.error("NewsData route error:", err);
    return NextResponse.json<NewsApiResponse>(
      {
        articles: [],
        allArticles: [],
        totalResults: 0,
        categoryCounts: {
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
        },
        lastUpdated: new Date().toISOString(),
        source: "newsdata.io",
        error: err.message || "Failed to communicate with NewsData API",
      },
      { status: 200 }
    );
  }
}
