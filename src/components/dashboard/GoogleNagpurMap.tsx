"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import {
  APIProvider,
  Map as GoogleMap,
  Marker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  Camera,
  Car,
  Check,
  CheckCircle2,
  Compass,
  Crosshair,
  EyeOff,
  Filter,
  Flame,
  Hospital,
  Info,
  Layers,
  MapPin,
  Newspaper,
  PhoneCall,
  Pill,
  Radio,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";
import type {
  BlindSpot,
  CCTVCamera,
  CrimeCategoryFilter,
  Incident,
  PolicePatrolUnit,
  TimeFilterPeriod,
  Zone,
  ZoneCrimeRiskAnalytics,
} from "@/lib/types";
import {
  computeAllZonesCrimeRisk,
  filterIncidentsByCategory,
  filterIncidentsByTime,
} from "@/lib/riskEngine";
import { policePatrolUnits as mockPatrolUnits } from "@/lib/mockData";
import {
  NAGPUR_ESSENTIAL_SERVICES,
  SERVICE_CATEGORIES,
  type EssentialService,
  type ServiceCategory,
} from "@/lib/nearbyServicesData";
import {
  calculateDistanceMeters,
  DEFAULT_NAGPUR_USER_LOCATION,
  formatDistance,
  POPULAR_NAGPUR_LOCATIONS,
  type UserLocation,
} from "@/lib/geoUtils";
import { ServiceInfoCard } from "./ServiceInfoCard";
import type { RealNewsArticle } from "@/lib/newsTypes";

const NAGPUR_CENTER = {
  lat: 21.1458,
  lng: 79.0882,
};

const CRIME_CATEGORIES: CrimeCategoryFilter[] = [
  "All Crime",
  "Theft",
  "Robbery",
  "Assault",
  "Vehicle Theft",
  "Burglary",
  "Other",
];

const TIME_FILTERS: TimeFilterPeriod[] = [
  "Today",
  "Last 7 Days",
  "Last 30 Days",
  "Last 6 Months",
  "All Time",
];

const GOOGLE_MAPS_DARK_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#cbd5e1" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64748b" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#475569" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#334155" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#334155" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#cbd5e1" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0284c7" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#38bdf8" }],
  },
];

/**
 * Custom Native Google Maps Circle Component
 */
interface GoogleCircleProps {
  center: { lat: number; lng: number };
  radius: number;
  options: google.maps.CircleOptions;
  onClick?: () => void;
}

function GoogleCircle({ center, radius, options, onClick }: GoogleCircleProps) {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map) return;

    if (!circleRef.current) {
      circleRef.current = new google.maps.Circle({
        map,
        center,
        radius,
        ...options,
      });
    } else {
      circleRef.current.setCenter(center);
      circleRef.current.setRadius(radius);
      circleRef.current.setOptions({ ...options, map });
    }

    let listener: google.maps.MapsEventListener | null = null;
    if (onClick && circleRef.current) {
      listener = circleRef.current.addListener("click", onClick);
    }

    return () => {
      if (listener) google.maps.event.removeListener(listener);
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
    };
  }, [map, center.lat, center.lng, radius, options.fillColor, options.strokeColor, options.strokeWeight, options.fillOpacity]);

  return null;
}

/**
 * Helper to smoothly pan/zoom camera when targeted
 */
function MapCameraHandler({ targetLocation }: { targetLocation: { lat: number; lng: number } | null }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !targetLocation) return;
    map.panTo(targetLocation);
    const currentZoom = map.getZoom() || 13;
    if (currentZoom < 14) {
      map.setZoom(14.5);
    }
  }, [map, targetLocation]);

  return null;
}

export interface GoogleNagpurMapProps {
  className?: string;
  incidents?: Incident[];
  zones?: Zone[];
  cameras?: CCTVCamera[];
  blindSpots?: BlindSpot[];
  patrolUnits?: PolicePatrolUnit[];
  essentialServices?: EssentialService[];
  realNewsArticles?: RealNewsArticle[];
  selectedNewsArticle?: RealNewsArticle | null;
  onSelectNewsArticle?: (article: RealNewsArticle | null) => void;
  loading?: boolean;
  error?: string | null;
  nightSafetyMode?: boolean;
  simulatedHour?: number;
  onZoneSelect?: (zoneId: string) => void;
  selectedZoneId?: string | null;
  userLocation?: UserLocation;
  onUpdateUserLocation?: (loc: UserLocation) => void;
  selectedService?: EssentialService | null;
  onSelectService?: (service: EssentialService | null) => void;
  activeServiceCategoryFilter?: ServiceCategory | null;
}

export default function GoogleNagpurMap({
  className = "",
  incidents = [],
  zones = [],
  cameras = [],
  blindSpots = [],
  patrolUnits = mockPatrolUnits,
  essentialServices = NAGPUR_ESSENTIAL_SERVICES,
  realNewsArticles = [],
  selectedNewsArticle = null,
  onSelectNewsArticle,
  loading = false,
  error = null,
  nightSafetyMode = false,
  simulatedHour = 22,
  onZoneSelect,
  selectedZoneId = null,
  userLocation: propUserLocation,
  onUpdateUserLocation,
  selectedService: propSelectedService = null,
  onSelectService: propOnSelectService,
  activeServiceCategoryFilter = null,
}: GoogleNagpurMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Citizen user location state
  const [internalUserLocation, setInternalUserLocation] = useState<UserLocation>(
    propUserLocation || DEFAULT_NAGPUR_USER_LOCATION
  );
  const userLocation = propUserLocation || internalUserLocation;

  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [targetCameraLocation, setTargetCameraLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Crime Filter States
  const [selectedCategory, setSelectedCategory] = useState<CrimeCategoryFilter>("All Crime");
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimeFilterPeriod>("Last 30 Days");

  // Nearby Services Layer Toggle State
  const [showNearbyServicesPanel, setShowNearbyServicesPanel] = useState(false);
  const [serviceCategoryToggles, setServiceCategoryToggles] = useState<Record<ServiceCategory, boolean>>({
    police: true,
    hospital: true,
    pharmacy: true,
    ambulance: false,
    fire_station: false,
    emergency_other: false,
  });

  // Base Layers Toggles
  const [layerToggles, setLayerToggles] = useState({
    crimeRisk: true,
    realNews: true,
    cctvCameras: false,
    policePatrols: false,
  });

  // Selection states for popups
  const [activeZoneDetail, setActiveZoneDetail] = useState<ZoneCrimeRiskAnalytics | null>(null);
  const [activeService, setActiveService] = useState<EssentialService | null>(propSelectedService);
  const [activeNewsArticle, setActiveNewsArticle] = useState<RealNewsArticle | null>(selectedNewsArticle);
  const [selectedCamera, setSelectedCamera] = useState<CCTVCamera | null>(null);
  const [selectedPatrol, setSelectedPatrol] = useState<PolicePatrolUnit | null>(null);

  // Sync prop changes for selectedService
  useEffect(() => {
    if (propSelectedService !== undefined) {
      setActiveService(propSelectedService);
      if (propSelectedService) {
        setTargetCameraLocation({ lat: propSelectedService.lat, lng: propSelectedService.lng });
        setServiceCategoryToggles((prev) => ({
          ...prev,
          [propSelectedService.category]: true,
        }));
      }
    }
  }, [propSelectedService]);

  // Sync external news article selection (e.g. from Real News section)
  useEffect(() => {
    if (selectedNewsArticle !== undefined) {
      setActiveNewsArticle(selectedNewsArticle);
      if (selectedNewsArticle?.location) {
        setTargetCameraLocation({
          lat: selectedNewsArticle.location.lat,
          lng: selectedNewsArticle.location.lng,
        });
        setActiveService(null);
        setActiveZoneDetail(null);
      }
    }
  }, [selectedNewsArticle]);

  // Sync external category filter trigger
  useEffect(() => {
    if (activeServiceCategoryFilter) {
      setServiceCategoryToggles((prev) => ({
        ...prev,
        [activeServiceCategoryFilter]: true,
      }));
    }
  }, [activeServiceCategoryFilter]);

  // GPS Geolocation Handler
  const handleDetectLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLoc: UserLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          label: "Your GPS Location",
        };
        setInternalUserLocation(newLoc);
        if (onUpdateUserLocation) onUpdateUserLocation(newLoc);
        setTargetCameraLocation({ lat: newLoc.lat, lng: newLoc.lng });
        setIsDetectingGps(false);
      },
      (err) => {
        console.warn("Geolocation error:", err.message);
        setIsDetectingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onUpdateUserLocation]);

  const toggleServiceCategory = (cat: ServiceCategory) => {
    setServiceCategoryToggles((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const zoneAnalyticsList = useMemo(() => {
    if (zones.length === 0) return [];
    return computeAllZonesCrimeRisk(
      zones,
      incidents,
      selectedTimePeriod,
      selectedCategory,
      cameras,
      simulatedHour
    );
  }, [zones, incidents, selectedTimePeriod, selectedCategory, cameras, simulatedHour]);

  useEffect(() => {
    if (selectedZoneId) {
      const found = zoneAnalyticsList.find((z) => z.zoneId === selectedZoneId);
      if (found) {
        setActiveZoneDetail(found);
        setTargetCameraLocation({ lat: found.lat, lng: found.lng });
      }
    }
  }, [selectedZoneId, zoneAnalyticsList]);

  const visibleServices = useMemo(() => {
    return essentialServices.filter((s) => serviceCategoryToggles[s.category]);
  }, [essentialServices, serviceCategoryToggles]);

  const toggleLayer = (layerKey: keyof typeof layerToggles) => {
    setLayerToggles((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const handleSelectServiceItem = (srv: EssentialService) => {
    setActiveService(srv);
    setActiveNewsArticle(null);
    setActiveZoneDetail(null);
    if (propOnSelectService) propOnSelectService(srv);
    setTargetCameraLocation({ lat: srv.lat, lng: srv.lng });
  };

  if (!apiKey) {
    return (
      <div className={`flex h-full w-full flex-col items-center justify-center bg-slate-950 p-6 text-center text-white ${className}`}>
        <ShieldAlert className="h-12 w-12 text-rose-500" />
        <h3 className="mt-3 text-lg font-bold">Google Maps API Key Required</h3>
        <p className="mt-1 max-w-md text-xs text-slate-400">
          Please verify that <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> is configured in your <code>.env.local</code> file.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full overflow-hidden ${nightSafetyMode ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"} ${className}`}>
      
      {/* --------------------------------------------------------------------- */}
      {/* 1. TOP CONTROL BAR: TIME PERIOD, CATEGORIES & NEARBY SERVICES         */}
      {/* --------------------------------------------------------------------- */}
      <div className="absolute inset-x-0 top-0 z-20 p-3 sm:p-4 pointer-events-none flex flex-col gap-2.5 max-w-7xl mx-auto">
        <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 p-3 shadow-md backdrop-blur-md border border-slate-200/80 dark:border-slate-800">
          
          {/* Left: Time Period Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1">
              <Zap className="h-3 w-3 text-indigo-500" /> Period:
            </span>
            {TIME_FILTERS.map((period) => {
              const isActive = selectedTimePeriod === period;
              return (
                <button
                  key={period}
                  onClick={() => setSelectedTimePeriod(period)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {period}
                </button>
              );
            })}
          </div>

          {/* Right: "Nearby Services" Main Button & Layer Toggles */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs font-medium">
            
            {/* Dedicated "Nearby Services" Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNearbyServicesPanel((prev) => !prev)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black tracking-wide uppercase transition-all shadow-xs ${
                  showNearbyServicesPanel || Object.values(serviceCategoryToggles).some(Boolean)
                    ? "bg-indigo-600 text-white ring-2 ring-indigo-300 dark:ring-indigo-800"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                }`}
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Nearby Services</span>
                <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-bold">
                  {Object.values(serviceCategoryToggles).filter(Boolean).length}
                </span>
              </button>

              {/* Nearby Services Toggle Dropdown */}
              {showNearbyServicesPanel && (
                <div className="absolute right-0 top-full mt-2 z-40 w-72 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2.5">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                        Nearby Services
                      </h4>
                      <p className="text-[10px] text-slate-400">Toggle essential emergency facilities</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNearbyServicesPanel(false)}
                      className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {SERVICE_CATEGORIES.map((cat) => {
                      const isChecked = serviceCategoryToggles[cat.id];
                      return (
                        <label
                          key={cat.id}
                          className={`flex items-center justify-between rounded-xl px-2.5 py-2 cursor-pointer transition ${
                            isChecked
                              ? "bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                          }`}
                        >
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                            <span className="text-base">{cat.icon}</span>
                            <span>{cat.label}</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleServiceCategory(cat.id)}
                            className="h-4 w-4 rounded accent-indigo-600 cursor-pointer"
                          />
                        </label>
                      );
                    })}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={isDetectingGps}
                      className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <Crosshair className={`h-3.5 w-3.5 ${isDetectingGps ? "animate-spin" : ""}`} />
                      <span>{isDetectingGps ? "Locating…" : "Update My GPS"}</span>
                    </button>
                    <span className="text-[10px] text-slate-400 font-mono">Nagpur Live</span>
                  </div>
                </div>
              )}
            </div>

            {/* Base Layer Toggles */}
            <label className="flex items-center gap-1.5 cursor-pointer bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition">
              <input
                type="checkbox"
                checked={layerToggles.crimeRisk}
                onChange={() => toggleLayer("crimeRisk")}
                className="rounded accent-indigo-600 cursor-pointer"
              />
              <span className="text-slate-700 dark:text-slate-200 font-semibold">🔴 Crime Risk</span>
            </label>

            {/* Real News Incidents Layer */}
            <label className="flex items-center gap-1.5 cursor-pointer bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition">
              <input
                type="checkbox"
                checked={layerToggles.realNews}
                onChange={() => toggleLayer("realNews")}
                className="rounded accent-rose-600 cursor-pointer"
              />
              <span className="text-slate-700 dark:text-slate-200 font-semibold">🚨 Real News</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition">
              <input
                type="checkbox"
                checked={layerToggles.cctvCameras}
                onChange={() => toggleLayer("cctvCameras")}
                className="rounded accent-blue-600 cursor-pointer"
              />
              <span className="text-slate-700 dark:text-slate-200">📹 CCTV</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition">
              <input
                type="checkbox"
                checked={layerToggles.policePatrols}
                onChange={() => toggleLayer("policePatrols")}
                className="rounded accent-emerald-600 cursor-pointer"
              />
              <span className="text-slate-700 dark:text-slate-200">🚓 Patrols</span>
            </label>
          </div>
        </div>

        {/* Secondary Bar: Crime Category Filter Chips */}
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto py-1 px-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Category:
          </span>
          {CRIME_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 2. MAIN GOOGLE MAP CONTAINER                                         */}
      {/* --------------------------------------------------------------------- */}
      <APIProvider apiKey={apiKey}>
        <GoogleMap
          defaultCenter={NAGPUR_CENTER}
          defaultZoom={12.8}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={true}
          styles={nightSafetyMode ? GOOGLE_MAPS_DARK_STYLE : undefined}
          style={{ width: "100%", height: "100%" }}
        >
          <MapCameraHandler targetLocation={targetCameraLocation} />

          {/* Citizen's Location Marker */}
          <Marker
            position={{ lat: userLocation.lat, lng: userLocation.lng }}
            title={userLocation.label || "Your Location"}
            zIndex={100}
          />
          <GoogleCircle
            center={{ lat: userLocation.lat, lng: userLocation.lng }}
            radius={250}
            options={{
              fillColor: "#4F46E5",
              fillOpacity: 0.18,
              strokeColor: "#6366F1",
              strokeWeight: 2,
              clickable: false,
              zIndex: 99,
            }}
          />

          {/* Render Dynamic Crime Risk Circles */}
          {layerToggles.crimeRisk &&
            zoneAnalyticsList.map((zoneData) => {
              const isSelected = activeZoneDetail?.zoneId === zoneData.zoneId;
              return (
                <React.Fragment key={zoneData.zoneId}>
                  <GoogleCircle
                    center={{ lat: zoneData.lat, lng: zoneData.lng }}
                    radius={zoneData.circleRadiusMeters}
                    options={{
                      fillColor: zoneData.circleColorHex,
                      fillOpacity: isSelected ? Math.min(0.7, zoneData.circleFillOpacity + 0.18) : zoneData.circleFillOpacity,
                      strokeColor: zoneData.circleColorHex,
                      strokeOpacity: 0.9,
                      strokeWeight: isSelected ? 3.5 : 2,
                      clickable: true,
                      zIndex: isSelected ? 30 : zoneData.riskLevel === "HIGH" ? 20 : 10,
                    }}
                    onClick={() => {
                      setActiveZoneDetail(zoneData);
                      setActiveService(null);
                      setActiveNewsArticle(null);
                      if (onZoneSelect) onZoneSelect(zoneData.zoneId);
                    }}
                  />

                  {(zoneData.isEmergingHotspot || zoneData.isCriticalPriority) && (
                    <GoogleCircle
                      center={{ lat: zoneData.lat, lng: zoneData.lng }}
                      radius={zoneData.circleRadiusMeters * 1.3}
                      options={{
                        fillColor: zoneData.circleColorHex,
                        fillOpacity: 0.12,
                        strokeColor: zoneData.circleColorHex,
                        strokeOpacity: 0.7,
                        strokeWeight: 1.5,
                        clickable: false,
                        zIndex: 5,
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}

          {/* Render Essential & Emergency Services Markers */}
          {visibleServices.map((service) => {
            const isSelected = activeService?.id === service.id;
            const dist = calculateDistanceMeters(userLocation.lat, userLocation.lng, service.lat, service.lng);
            const distLabel = formatDistance(dist);

            return (
              <Marker
                key={service.id}
                position={{ lat: service.lat, lng: service.lng }}
                title={`${service.name} (${distLabel})`}
                onClick={() => {
                  handleSelectServiceItem(service);
                }}
                zIndex={isSelected ? 60 : 40}
              />
            );
          })}

          {/* Render Real News Incident Markers on Map */}
          {layerToggles.realNews &&
            realNewsArticles
              .filter((article) => article.location)
              .map((article) => (
                <Marker
                  key={`news-marker-${article.id}`}
                  position={{ lat: article.location.lat, lng: article.location.lng }}
                  title={`Incident Report: ${article.title}`}
                  onClick={() => {
                    setActiveNewsArticle(article);
                    setActiveService(null);
                    setActiveZoneDetail(null);
                    if (onSelectNewsArticle) onSelectNewsArticle(article);
                  }}
                  zIndex={55}
                />
              ))}

          {/* CCTV Camera Markers */}
          {layerToggles.cctvCameras &&
            cameras.map((camera) => (
              <Marker
                key={camera.id}
                position={{ lat: camera.lat, lng: camera.lng }}
                title={`CCTV: ${camera.name} (${camera.isOperational ? "Operational" : "OFFLINE"})`}
                onClick={() => setSelectedCamera(camera)}
              />
            ))}

          {/* Police Patrol Units Markers */}
          {layerToggles.policePatrols &&
            patrolUnits.map((unit) => (
              <Marker
                key={unit.id}
                position={{ lat: unit.lat, lng: unit.lng }}
                title={`Patrol Unit: ${unit.unitCode} (${unit.vehicleType})`}
                onClick={() => setSelectedPatrol(unit)}
              />
            ))}

          {/* CCTV InfoWindow */}
          {selectedCamera && (
            <InfoWindow
              position={{ lat: selectedCamera.lat, lng: selectedCamera.lng }}
              onCloseClick={() => setSelectedCamera(null)}
            >
              <div className="p-1 text-slate-900 max-w-xs">
                <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1 text-xs font-bold">
                  <Camera className="h-4 w-4 text-indigo-600" />
                  {selectedCamera.name}
                </div>
                <p className="mt-1.5 text-xs">
                  Status:{" "}
                  <strong className={selectedCamera.isOperational ? "text-emerald-600" : "text-rose-600 font-black"}>
                    {selectedCamera.isOperational ? "OPERATIONAL" : "OFFLINE / BLIND SPOT"}
                  </strong>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Coverage Radius: {selectedCamera.coverageRadiusM} meters
                </p>
              </div>
            </InfoWindow>
          )}

          {/* Patrol Unit InfoWindow */}
          {selectedPatrol && (
            <InfoWindow
              position={{ lat: selectedPatrol.lat, lng: selectedPatrol.lng }}
              onCloseClick={() => setSelectedPatrol(null)}
            >
              <div className="p-1 text-slate-900 max-w-xs">
                <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1 text-xs font-bold text-indigo-600">
                  <Shield className="h-4 w-4" />
                  Unit {selectedPatrol.unitCode} ({selectedPatrol.vehicleType})
                </div>
                <p className="mt-1.5 text-xs text-slate-700">
                  Deployment Status: <strong className="text-emerald-600 uppercase">{selectedPatrol.status}</strong>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Personnel: {selectedPatrol.officerCount} Officers • Last Ping: {selectedPatrol.lastPing}
                </p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </APIProvider>

      {/* --------------------------------------------------------------------- */}
      {/* 3. REPORTED INCIDENT POPUP CARD (ON REAL NEWS MARKER CLICK)           */}
      {/* --------------------------------------------------------------------- */}
      {activeNewsArticle && (
        <div className="absolute inset-x-3 bottom-3 sm:bottom-auto sm:inset-x-auto sm:left-6 sm:top-28 z-30 w-auto sm:w-full sm:max-w-md rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-2xl space-y-3 sm:space-y-3.5 animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-left-4 duration-200 max-h-[75vh] sm:max-h-[calc(100vh-140px)] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 font-bold">
                🚨
              </span>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Reported Incident
              </h3>
            </div>
            <button
              onClick={() => {
                setActiveNewsArticle(null);
                if (onSelectNewsArticle) onSelectNewsArticle(null);
              }}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
              <span>Headline:</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {activeNewsArticle.title}
            </h4>
            {activeNewsArticle.description && (
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                {activeNewsArticle.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400">Location</span>
              <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                📍 {activeNewsArticle.location.name}, Nagpur
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400">Published</span>
              <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                🕒 {activeNewsArticle.relativeTime}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Source: <strong>{activeNewsArticle.sourceName}</strong>
            </span>

            <a
              href={activeNewsArticle.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700 active:scale-95"
            >
              <span>Read Full Story</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 4. INTERACTIVE SERVICE INFORMATION CARD (ON SERVICE CLICK)            */}
      {/* --------------------------------------------------------------------- */}
      {activeService && !activeNewsArticle && (
        <ServiceInfoCard
          service={activeService}
          userLocation={userLocation}
          formattedDistance={formatDistance(
            calculateDistanceMeters(
              userLocation.lat,
              userLocation.lng,
              activeService.lat,
              activeService.lng
            )
          )}
          onClose={() => {
            setActiveService(null);
            if (propOnSelectService) propOnSelectService(null);
          }}
        />
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 5. INTERACTIVE CRIME INFORMATION POPUP / CARD (ON CIRCLE CLICK)       */}
      {/* --------------------------------------------------------------------- */}
      {activeZoneDetail && !activeService && !activeNewsArticle && (
        <div className="absolute z-30 inset-x-3 bottom-3 sm:bottom-auto sm:inset-x-auto sm:left-6 sm:top-28 w-auto sm:w-full sm:max-w-md p-4 sm:p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-2xl space-y-3 sm:space-y-4 max-h-[75vh] sm:max-h-[calc(100vh-140px)] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-left-4 duration-200">
          
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                  Area: {activeZoneDetail.zoneName}
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {activeZoneDetail.code}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Nagpur Metropolitan Crime Risk Sector
              </p>
            </div>

            <button
              onClick={() => setActiveZoneDetail(null)}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase shadow-xs ${
                activeZoneDetail.status === "CRITICAL PRIORITY"
                  ? "bg-rose-600 text-white animate-pulse"
                  : activeZoneDetail.status === "EMERGING HOTSPOT"
                  ? "bg-amber-500 text-white animate-pulse"
                  : activeZoneDetail.status === "HIGH PRIORITY"
                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-300"
                  : activeZoneDetail.status === "MODERATE"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300"
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Status: {activeZoneDetail.status}
            </span>

            <div className="flex items-center gap-1 text-xs font-bold">
              <span className="text-slate-400">Risk Score:</span>
              <span
                className={`text-base font-black ${
                  activeZoneDetail.riskLevel === "HIGH"
                    ? "text-rose-600"
                    : activeZoneDetail.riskLevel === "MEDIUM"
                    ? "text-amber-600"
                    : "text-emerald-600"
                }`}
              >
                {activeZoneDetail.riskScore}/100
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-slate-400 font-medium">Crime Level</div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 flex items-center gap-1.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    activeZoneDetail.riskLevel === "HIGH"
                      ? "bg-rose-500"
                      : activeZoneDetail.riskLevel === "MEDIUM"
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                />
                {activeZoneDetail.riskLevel}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-slate-400 font-medium">Crime Trend ({selectedTimePeriod})</div>
              <div className="text-sm font-bold mt-0.5 flex items-center gap-1 text-slate-900 dark:text-slate-100">
                {activeZoneDetail.crimeTrendPercentage > 0 ? (
                  <span className="text-rose-600 flex items-center gap-0.5">
                    <TrendingUp className="h-3.5 w-3.5" /> ↑ {activeZoneDetail.crimeTrendPercentage}%
                  </span>
                ) : (
                  <span className="text-emerald-600 flex items-center gap-0.5">
                    <TrendingDown className="h-3.5 w-3.5" /> ↓ {Math.abs(activeZoneDetail.crimeTrendPercentage)}%
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-slate-400 font-medium">Recent Incidents</div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {activeZoneDetail.recentIncidentsCount} Incidents
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-slate-400 font-medium">Historical Incidents</div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {activeZoneDetail.historicalIncidentsCount} Recorded
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-slate-400 font-medium">CCTV Coverage</div>
              <div className="text-sm font-bold mt-0.5 text-slate-900 dark:text-slate-100">
                {activeZoneDetail.cctvCoverageStatus} ({activeZoneDetail.cctvCoveragePercent}%)
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <div className="text-slate-400 font-medium">Night Risk Index</div>
              <div className="text-sm font-bold mt-0.5 text-slate-900 dark:text-slate-100">
                {activeZoneDetail.nightRiskLevel}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-indigo-500" /> Why is this area {activeZoneDetail.riskLevel.toLowerCase()} risk?
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              {activeZoneDetail.highRiskReasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /> AI Recommendation
            </h4>
            <p className="text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed font-medium">
              {activeZoneDetail.aiRecommendation}
            </p>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 6. BOTTOM-RIGHT FLOATING LEGEND                                      */}
      {/* --------------------------------------------------------------------- */}
      <div className="hidden sm:block absolute right-4 sm:right-6 bottom-6 z-20 p-3 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xl max-w-xs pointer-events-auto">
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-indigo-600" /> RISK LEVEL & SERVICES
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-rose-500 shrink-0 shadow-xs" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">🔴 High Risk (70–100)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-amber-500 shrink-0 shadow-xs" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">🟠 Medium Risk (40–69)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500 shrink-0 shadow-xs" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">🟢 Low Risk (0–39)</span>
          </div>

          <div className="pt-1.5 mt-1.5 border-t border-slate-200 dark:border-slate-800 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2 font-medium">
              <span>🚓 Police</span>
              <span>🏥 Hospital</span>
              <span>💊 Pharmacy</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping shrink-0" />
              <span>🚨 Real-Time News Incidents</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}