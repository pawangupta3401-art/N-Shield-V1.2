"use client";

import React from "react";
import {
  Compass,
  Home,
  MapPin,
  Map as MapIcon,
  Navigation,
  PlusCircle,
  Shield,
  ShieldAlert,
  Siren,
} from "lucide-react";

interface MobileBottomNavProps {
  activeNav: string;
  onNavigate: (id: string) => void;
  onOpenReportModal: () => void;
  onOpenSafeRouteModal: () => void;
  onOpenEmergencySOS: () => void;
}

export function MobileBottomNav({
  activeNav,
  onNavigate,
  onOpenReportModal,
  onOpenSafeRouteModal,
  onOpenEmergencySOS,
}: MobileBottomNavProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 block lg:hidden border-t border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl safe-area-pb">
      <nav className="flex items-center justify-around px-1 py-1 max-w-lg mx-auto">
        
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => {
            onNavigate("live-map");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          aria-label="Home"
          className={`flex min-h-[48px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 text-[10px] font-bold transition-all min-w-0 ${
            activeNav === "live-map"
              ? "text-indigo-600 dark:text-indigo-400 font-black"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
          }`}
        >
          <Home className="h-4.5 w-4.5 sm:h-5 sm:w-5 shrink-0" />
          <span className="truncate">Home</span>
        </button>

        {/* 2. Map */}
        <button
          type="button"
          onClick={() => {
            onNavigate("live-map");
            const mapEl = document.getElementById("safety-map-section");
            if (mapEl) {
              mapEl.scrollIntoView({ behavior: "smooth", block: "center" });
            } else {
              window.scrollTo({ top: 120, behavior: "smooth" });
            }
          }}
          aria-label="Safety Map"
          className={`flex min-h-[48px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 text-[10px] font-bold transition-all min-w-0 ${
            activeNav === "live-map"
              ? "text-indigo-600 dark:text-indigo-400 font-black"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
          }`}
        >
          <MapIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5 shrink-0" />
          <span className="truncate">Map</span>
        </button>

        {/* 3. Safe Route */}
        <button
          type="button"
          onClick={onOpenSafeRouteModal}
          aria-label="Safe Route Planner"
          className="flex min-h-[48px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 min-w-0"
        >
          <Navigation className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-indigo-500 shrink-0" />
          <span className="truncate">Safe Route</span>
        </button>

        {/* 4. Report Incident */}
        <button
          type="button"
          onClick={onOpenReportModal}
          aria-label="Report Incident"
          className="flex min-h-[48px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 min-w-0"
        >
          <PlusCircle className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-amber-500 shrink-0" />
          <span className="truncate">Report</span>
        </button>

        {/* 5. Emergency SOS Speed Dial */}
        <button
          type="button"
          onClick={onOpenEmergencySOS}
          aria-label="Emergency SOS 112"
          className="flex min-h-[48px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 text-[10px] font-black text-rose-600 dark:text-rose-400 animate-pulse min-w-0"
        >
          <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-rose-600 text-white shadow-md shadow-rose-300 dark:shadow-rose-950 shrink-0">
            <Siren className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </div>
          <span className="truncate">SOS 112</span>
        </button>
      </nav>
    </div>
  );
}
