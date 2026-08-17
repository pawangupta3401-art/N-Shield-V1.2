"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Compass,
  Crosshair,
  Lightbulb,
  MapPin,
  Navigation,
  Shield,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { POPULAR_NAGPUR_LOCATIONS, type UserLocation } from "@/lib/geoUtils";

interface SafeRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: UserLocation;
}

export function SafeRouteModal({
  isOpen,
  onClose,
  userLocation,
}: SafeRouteModalProps) {
  const [origin, setOrigin] = useState(userLocation.label || "Sitabuldi Metro Interchange");
  const [destination, setDestination] = useState("Dharampeth (WHC Road)");
  const [isCalculated, setIsCalculated] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600">
              <Navigation className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                Safe Route Planner
              </h3>
              <p className="text-xs text-slate-400">
                AI-Guided Well-Lit Transit Corridors
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Inputs (Stacked for Mobile) */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              From (Origin)
            </label>
            <div className="relative flex items-center">
              <MapPin className="absolute left-3 h-4 w-4 text-emerald-500" />
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Current Location / Starting Point"
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              To (Destination)
            </label>
            <div className="relative flex items-center">
              <Navigation className="absolute left-3 h-4 w-4 text-indigo-500" />
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
              >
                {POPULAR_NAGPUR_LOCATIONS.map((loc) => (
                  <option key={loc.name} value={loc.name}>
                    📍 {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Route Comparison Cards */}
        <div className="space-y-3 pt-1">
          {/* 1. Recommended Safest Route */}
          <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-black text-white uppercase tracking-wider">
                <ShieldCheck className="h-3.5 w-3.5" /> Recommended Safest
              </span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                14 mins · 3.2 km
              </span>
            </div>

            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Via West High Court (WHC) Road & Shankar Nagar Corridor
            </p>

            <div className="grid grid-cols-3 gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1">
                <Camera className="h-3 w-3 text-emerald-600" /> 18 CCTV Cams
              </div>
              <div className="flex items-center gap-1">
                <Lightbulb className="h-3 w-3 text-emerald-600" /> 100% Lit
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-emerald-600" /> Active Patrol
              </div>
            </div>

            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
                origin + ", Nagpur"
              )}&destination=${encodeURIComponent(destination + ", Nagpur")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition"
            >
              <Navigation className="h-4 w-4" />
              <span>Start Navigation in Google Maps</span>
            </a>
          </div>

          {/* 2. Secondary Alternative Route */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3.5 space-y-1.5 opacity-80">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600 dark:text-slate-300">
                Alternative: Canal Road Transit
              </span>
              <span className="text-slate-500 font-mono text-[11px]">11 mins · 2.8 km</span>
            </div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              ⚠️ Moderate lighting & narrow lanes after 9:30 PM.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
