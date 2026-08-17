"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  AlertTriangle,
  Building2,
  Camera,
  Compass,
  Crosshair,
  MapPin,
  Navigation,
  Newspaper,
  PhoneCall,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import type { EssentialService, ServiceCategory } from "@/lib/nearbyServicesData";
import {
  calculateDistanceMeters,
  formatDistance,
  getSortedNearbyServices,
  POPULAR_NAGPUR_LOCATIONS,
  type ServiceWithDistance,
  type UserLocation,
} from "@/lib/geoUtils";
import type { Zone } from "@/lib/types";
import type { RealNewsArticle } from "@/lib/newsTypes";

interface GlobalSearchBarProps {
  userLocation: UserLocation;
  zones: Zone[];
  services: EssentialService[];
  newsArticles?: RealNewsArticle[];
  onSelectZone: (zoneId: string, lat: number, lng: number) => void;
  onSelectService: (service: EssentialService) => void;
  onSelectNewsArticle?: (article: RealNewsArticle) => void;
  onSelectCustomLocation?: (loc: { name: string; lat: number; lng: number }) => void;
  className?: string;
  placeholder?: string;
}

export function GlobalSearchBar({
  userLocation,
  zones = [],
  services = [],
  newsArticles = [],
  onSelectZone,
  onSelectService,
  onSelectNewsArticle,
  onSelectCustomLocation,
  className = "",
  placeholder = "Search hospitals, police, Sitabuldi, Dharampeth...",
}: GlobalSearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Compute Search Results
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    // If query matches general category keywords
    let matchedCategory: ServiceCategory | null = null;
    if (q.includes("hospital") || q.includes("clinic") || q.includes("doctor") || q.includes("trauma") || q.includes("medical care")) {
      matchedCategory = "hospital";
    } else if (q.includes("police") || q.includes("thana") || q.includes("cop") || q.includes("chowki") || q.includes("station")) {
      matchedCategory = "police";
    } else if (q.includes("pharmacy") || q.includes("medical") || q.includes("chemist") || q.includes("medicine") || q.includes("drug")) {
      matchedCategory = "pharmacy";
    } else if (q.includes("ambulance") || q.includes("ems")) {
      matchedCategory = "ambulance";
    } else if (q.includes("fire") || q.includes("brigade")) {
      matchedCategory = "fire_station";
    }

    // 1. Matched Services (Hospitals, Police, Pharmacies, etc. sorted by distance)
    let matchingServices: ServiceWithDistance[] = [];
    if (matchedCategory) {
      // Return all services in that category sorted by nearest distance
      matchingServices = getSortedNearbyServices(services, userLocation, [matchedCategory]);
    } else if (q.length > 0) {
      // Search by specific service name or address
      const filtered = services.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          (s.landmark && s.landmark.toLowerCase().includes(q))
      );
      matchingServices = filtered.map((s) => {
        const dist = calculateDistanceMeters(userLocation.lat, userLocation.lng, s.lat, s.lng);
        return {
          ...s,
          distanceMeters: dist,
          formattedDistance: formatDistance(dist),
        };
      }).sort((a, b) => a.distanceMeters - b.distanceMeters);
    }

    // 2. Matched Zones / Sectors (Nagpur Areas)
    let matchingZones: (Zone & { distanceMeters: number; formattedDistance: string })[] = [];
    if (q.length > 0 && !matchedCategory) {
      matchingZones = zones
        .filter(
          (z) =>
            z.name.toLowerCase().includes(q) ||
            z.code.toLowerCase().includes(q) ||
            z.officerInCharge.toLowerCase().includes(q)
        )
        .map((z) => {
          const dist = calculateDistanceMeters(userLocation.lat, userLocation.lng, z.lat, z.lng);
          return {
            ...z,
            distanceMeters: dist,
            formattedDistance: formatDistance(dist),
          };
        })
        .sort((a, b) => a.distanceMeters - b.distanceMeters);
    }

    // 3. Matched Popular Landmarks
    let matchingLandmarks: { name: string; lat: number; lng: number; formattedDistance: string }[] = [];
    if (q.length > 0 && !matchedCategory) {
      matchingLandmarks = POPULAR_NAGPUR_LOCATIONS
        .filter((l) => l.name.toLowerCase().includes(q))
        .map((l) => {
          const dist = calculateDistanceMeters(userLocation.lat, userLocation.lng, l.lat, l.lng);
          return {
            ...l,
            formattedDistance: formatDistance(dist),
          };
        });
    }

    // 4. Matched News Incidents
    let matchingNews: RealNewsArticle[] = [];
    if (q.length > 0 && !matchedCategory && newsArticles.length > 0) {
      matchingNews = newsArticles
        .filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.category.toLowerCase().includes(q) ||
            (n.location?.name && n.location.name.toLowerCase().includes(q))
        )
        .slice(0, 3);
    }

    return {
      categoryKeyword: matchedCategory,
      services: matchingServices.slice(0, 6),
      zones: matchingZones.slice(0, 5),
      landmarks: matchingLandmarks.slice(0, 4),
      news: matchingNews,
      totalCount:
        matchingServices.length +
        matchingZones.length +
        matchingLandmarks.length +
        matchingNews.length,
    };
  }, [query, services, zones, newsArticles, userLocation]);

  const handleSelectServiceItem = (service: EssentialService) => {
    onSelectService(service);
    setIsOpen(false);
    setQuery(service.name);
    scrollToMap();
  };

  const handleSelectZoneItem = (zone: Zone) => {
    onSelectZone(zone.id, zone.lat, zone.lng);
    setIsOpen(false);
    setQuery(zone.name);
    scrollToMap();
  };

  const handleSelectLandmarkItem = (loc: { name: string; lat: number; lng: number }) => {
    if (onSelectCustomLocation) {
      onSelectCustomLocation(loc);
    }
    const matchingZone = zones.find((z) =>
      loc.name.toLowerCase().includes(z.name.toLowerCase()) ||
      z.name.toLowerCase().includes(loc.name.toLowerCase())
    );
    if (matchingZone) {
      onSelectZone(matchingZone.id, loc.lat, loc.lng);
    }
    setIsOpen(false);
    setQuery(loc.name);
    scrollToMap();
  };

  const handleSelectNewsItem = (article: RealNewsArticle) => {
    if (onSelectNewsArticle) {
      onSelectNewsArticle(article);
    }
    setIsOpen(false);
    setQuery(article.title);
    scrollToMap();
  };

  const scrollToMap = () => {
    const mapSection = document.getElementById("safety-map-section");
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const getServiceIcon = (category: ServiceCategory) => {
    switch (category) {
      case "police":
        return "🚓";
      case "hospital":
        return "🏥";
      case "pharmacy":
        return "💊";
      case "ambulance":
        return "🚑";
      case "fire_station":
        return "🚒";
      default:
        return "🛡️";
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      
      {/* Search Input Bar */}
      <div className="relative flex items-center w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/90 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-950 transition-all shadow-xs">
        <Search className="h-4 w-4 text-indigo-500 shrink-0 mr-2" />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 font-medium"
        />

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <kbd className="hidden sm:inline-block ml-1.5 shrink-0 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
            /
          </kbd>
        )}
      </div>

      {/* Autocomplete Results Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[75vh] sm:max-h-96 overflow-y-auto space-y-3">
          
          {query.trim().length === 0 ? (
            /* Quick Suggestions when input is empty */
            <div className="space-y-3 p-1">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2">
                Quick Category Search
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setQuery("hospital");
                    setIsOpen(true);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-900/60 p-2.5 text-left transition hover:bg-rose-100"
                >
                  <span className="text-lg">🏥</span>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Hospitals</div>
                    <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">Find nearest</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQuery("police");
                    setIsOpen(true);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-900/60 p-2.5 text-left transition hover:bg-blue-100"
                >
                  <span className="text-lg">🚓</span>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Police</div>
                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Find nearest</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQuery("pharmacy");
                    setIsOpen(true);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-900/60 p-2.5 text-left transition hover:bg-emerald-100"
                >
                  <span className="text-lg">💊</span>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Pharmacies</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">24/7 medical</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQuery("fire station");
                    setIsOpen(true);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200/80 dark:border-orange-900/60 p-2.5 text-left transition hover:bg-orange-100"
                >
                  <span className="text-lg">🚒</span>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Fire Brigade</div>
                    <div className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold">Rescue stations</div>
                  </div>
                </button>
              </div>

              {/* Popular Nagpur Areas */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                  Popular Nagpur Sectors
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Sitabuldi", "Dharampeth", "Sadar", "Mahal", "Civil Lines", "Wardha Road", "Ambazari", "MIHAN"].map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => {
                        setQuery(area);
                        setIsOpen(true);
                      }}
                      className="inline-flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 transition"
                    >
                      <MapPin className="h-3 w-3 text-indigo-500" />
                      <span>{area}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : searchResults.totalCount === 0 ? (
            /* No Results Found */
            <div className="py-8 text-center text-xs text-slate-400 space-y-1">
              <MapPin className="mx-auto h-7 w-7 text-slate-300 dark:text-slate-600 mb-1" />
              <p className="font-bold text-slate-700 dark:text-slate-300">
                No matching results found for &ldquo;{query}&rdquo;
              </p>
              <p>Try searching &ldquo;hospital&rdquo;, &ldquo;police&rdquo;, &ldquo;Sitabuldi&rdquo;, or &ldquo;Dharampeth&rdquo;.</p>
            </div>
          ) : (
            /* Matching Results List */
            <div className="space-y-3">
              
              {/* 1. Nearest Emergency Services (Hospitals, Police, Pharmacies, etc.) */}
              {searchResults.services.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                    <span>
                      {searchResults.categoryKeyword
                        ? `Nearest ${searchResults.categoryKeyword.toUpperCase()} Services (Sorted by Distance)`
                        : "Essential Emergency Services"}
                    </span>
                    <span>{searchResults.services.length} found</span>
                  </div>

                  <div className="space-y-1">
                    {searchResults.services.map((service) => (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => handleSelectServiceItem(service)}
                        className="w-full flex items-center justify-between gap-3 rounded-2xl p-2.5 text-left transition hover:bg-indigo-50/80 dark:hover:bg-indigo-950/60 hover:border-indigo-200 border border-transparent group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-base">
                            {getServiceIcon(service.category)}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition truncate">
                              {service.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {service.address}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="rounded-lg bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300">
                            {service.formattedDistance}
                          </span>
                          <span className="text-[11px] font-bold text-indigo-600 hidden sm:inline">
                            View on Map →
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Nagpur City Areas & Crime Risk Zones */}
              {searchResults.zones.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                    Nagpur Safety Sectors & Areas
                  </div>

                  <div className="space-y-1">
                    {searchResults.zones.map((zone) => (
                      <button
                        key={zone.id}
                        type="button"
                        onClick={() => handleSelectZoneItem(zone)}
                        className="w-full flex items-center justify-between gap-3 rounded-2xl p-2.5 text-left transition hover:bg-indigo-50/80 dark:hover:bg-indigo-950/60 border border-transparent group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold text-xs">
                            📍
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition">
                              {zone.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Sector Code: {zone.code} · Patrols: {zone.activePatrols} units
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-slate-500 font-medium">
                            {zone.formattedDistance}
                          </span>
                          <span className="text-[11px] font-bold text-indigo-600">
                            Focus Map →
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Popular Landmarks */}
              {searchResults.landmarks.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                    Landmarks & Public Places
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {searchResults.landmarks.map((loc) => (
                      <button
                        key={loc.name}
                        type="button"
                        onClick={() => handleSelectLandmarkItem(loc)}
                        className="flex items-center justify-between gap-2 rounded-xl p-2 text-left bg-slate-50/60 dark:bg-slate-800/40 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition"
                      >
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          📍 {loc.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {loc.formattedDistance}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Matching Recent Real News Stories */}
              {searchResults.news.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                    Recent Safety News & Incidents
                  </div>
                  <div className="space-y-1">
                    {searchResults.news.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectNewsItem(item)}
                        className="w-full flex items-center justify-between gap-2 rounded-xl p-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                            🚨 {item.title}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {item.location?.name || "Nagpur"} · {item.relativeTime}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 shrink-0">
                          View →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
