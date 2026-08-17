"use client";

import React, { useState } from "react";
import {
  Building2,
  Compass,
  Crosshair,
  MapPin,
  Navigation,
  PhoneCall,
  Shield,
  Sparkles,
} from "lucide-react";
import type { EssentialService, ServiceCategory } from "@/lib/nearbyServicesData";
import {
  formatDistance,
  getGoogleMapsDirectionsUrl,
  getNearestPerCategory,
  getPhoneDialerUrl,
  POPULAR_NAGPUR_LOCATIONS,
  type ServiceWithDistance,
  type UserLocation,
} from "@/lib/geoUtils";

interface NearestServicesBarProps {
  services: EssentialService[];
  userLocation: UserLocation;
  onSelectService: (service: EssentialService) => void;
  onUpdateLocation: (newLocation: UserLocation) => void;
  onDetectLocation: () => void;
  isDetectingLocation?: boolean;
}

export function NearestServicesBar({
  services,
  userLocation,
  onSelectService,
  onUpdateLocation,
  onDetectLocation,
  isDetectingLocation = false,
}: NearestServicesBarProps) {
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const nearestByCategory = getNearestPerCategory(services, userLocation);

  const displayCategories: { id: ServiceCategory; title: string; icon: string; badge: string }[] = [
    { id: "police", title: "Police Station", icon: "🚓", badge: "bg-blue-500" },
    { id: "hospital", title: "Hospital", icon: "🏥", badge: "bg-rose-500" },
    { id: "pharmacy", title: "Medical Shop", icon: "💊", badge: "bg-emerald-500" },
    { id: "ambulance", title: "Ambulance", icon: "🚑", badge: "bg-amber-500" },
    { id: "fire_station", title: "Fire Station", icon: "🚒", badge: "bg-orange-500" },
  ];

  return (
    <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-4 sm:p-5 shadow-sm backdrop-blur-md">
      
      {/* Header with Location Detector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5 mb-3.5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Emergency Services Near You
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Real-time nearest verified Nagpur facilities sorted by distance
            </p>
          </div>
        </div>

        {/* Location Selector & GPS Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDetectLocation}
            disabled={isDetectingLocation}
            className="min-h-[40px] flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            title="Detect My GPS Location"
          >
            <Crosshair className={`h-3.5 w-3.5 text-indigo-600 ${isDetectingLocation ? "animate-spin" : ""}`} />
            <span>{isDetectingLocation ? "Locating…" : "My Location"}</span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLocationPicker((prev) => !prev)}
              className="min-h-[40px] flex items-center gap-1 rounded-xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition"
            >
              <MapPin className="h-3.5 w-3.5" />
              <span className="max-w-[120px] truncate">{userLocation.label || "Nagpur"}</span>
            </button>

            {/* Quick Location Dropdown */}
            {showLocationPicker && (
              <div className="absolute right-0 top-full mt-1.5 z-40 w-56 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400">
                  Switch Reference Location
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {POPULAR_NAGPUR_LOCATIONS.map((loc) => (
                    <button
                      key={loc.name}
                      type="button"
                      onClick={() => {
                        onUpdateLocation({
                          lat: loc.lat,
                          lng: loc.lng,
                          label: loc.name,
                        });
                        setShowLocationPicker(false);
                      }}
                      className="w-full min-h-[38px] text-left rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 transition"
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cards Grid: Police, Hospital, Pharmacy, Ambulance, Fire */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {displayCategories.map(({ id, title, icon }) => {
          const service = nearestByCategory[id];
          if (!service) return null;

          const directionsUrl = getGoogleMapsDirectionsUrl(userLocation, service);
          const dialerUrl = getPhoneDialerUrl(service.phone);

          return (
            <div
              key={id}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 sm:p-4 transition-all hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md"
            >
              {/* Top Row: Category & Distance */}
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                    <span className="text-base">{icon}</span>
                    <span>{title}</span>
                  </span>
                  <span className="rounded-lg bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 text-[11px] font-extrabold text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                    {service.formattedDistance}
                  </span>
                </div>

                {/* Service Name */}
                <button
                  type="button"
                  onClick={() => onSelectService(service)}
                  className="mt-2 text-left text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 hover:text-indigo-600 transition"
                >
                  {service.name}
                </button>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                  {service.address}
                </p>
              </div>

              {/* Action Buttons: [Call] & [Directions] (with min 44px touch target) */}
              <div className="mt-3.5 flex items-center gap-2 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60">
                {dialerUrl ? (
                  <a
                    href={dialerUrl}
                    className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-2.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
                    title={`Call ${service.name}`}
                  >
                    <PhoneCall className="h-3.5 w-3.5" />
                    <span>Call</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectService(service)}
                    className="flex-1 min-h-[44px] rounded-xl bg-slate-200 dark:bg-slate-700 px-2.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300"
                  >
                    View
                  </button>
                )}

                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-2.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700 active:scale-95"
                  title={`Get directions to ${service.name}`}
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>Directions</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
