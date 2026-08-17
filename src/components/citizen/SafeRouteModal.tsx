"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Navigation,
  ShieldCheck,
  Zap,
  Lightbulb,
  Clock,
  MapPin,
  Share2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Footprints,
} from "lucide-react";
import {
  SAMPLE_SAFE_ROUTES,
  type ZoneCitizenData,
  type SafeRouteOption,
} from "@/lib/citizenData";
import { citizenAudio } from "@/lib/audioService";

interface SafeRouteModalProps {
  isOpen: boolean;
  destinationZone: ZoneCitizenData | null;
  onClose: () => void;
}

export function SafeRouteModal({
  isOpen,
  destinationZone,
  onClose,
}: SafeRouteModalProps) {
  const [selectedRouteId, setSelectedRouteId] = useState<string>("route-well-lit");
  const [isShared, setIsShared] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  if (!isOpen || !destinationZone) return null;

  const routes: SafeRouteOption[] = SAMPLE_SAFE_ROUTES["dharampeth-to-sitabuldi"] || [];
  const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];

  const handleShare = () => {
    citizenAudio.playUiTap();
    setIsShared(true);
    setTimeout(() => setIsShared(false), 3000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-xl bg-white dark:bg-zinc-900 border border-white/80 dark:border-zinc-800 rounded-3xl shadow-[0_24px_70px_rgba(0,0,0,0.18)] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300">
                  <Navigation className="w-4 h-4" />
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  Safe Route Navigator
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 mt-1">
                Destination: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{destinationZone.name}</span> • Nagpur
              </p>
            </div>

            <button
              onClick={() => {
                citizenAudio.playUiTap();
                onClose();
              }}
              className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Route Choice Cards */}
          <div className="p-6 overflow-y-auto space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
              Select Your Travel Preference
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {routes.map((route) => {
                const isSelected = selectedRouteId === route.id;
                return (
                  <button
                    key={route.id}
                    onClick={() => {
                      setSelectedRouteId(route.id);
                      citizenAudio.playUiTap();
                    }}
                    className={`p-4 rounded-2xl text-left border transition-all duration-200 relative ${
                      isSelected
                        ? "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                        : "bg-zinc-50/70 dark:bg-zinc-800/40 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    {route.isRecommended && (
                      <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-xs">
                        Recommended
                      </span>
                    )}

                    <div className="flex items-center justify-between mb-1.5">
                      <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {route.name}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mb-2.5">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {route.durationMinutes} mins
                      </span>
                      <span>•</span>
                      <span>{route.distanceKm} km</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                          route.safetyScore >= 80
                            ? "bg-emerald-100/70 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-amber-100/70 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {route.safetyScore}% Safety
                      </span>
                      <span className="text-[11px] text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3 text-amber-500" />
                        {route.lightingPercent}% lit
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Route Highlights */}
            {activeRoute && (
              <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800/80 space-y-3">
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {activeRoute.description}
                </p>

                {/* Waypoint Steps */}
                <div className="space-y-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                    Safe Waypoints Along Route
                  </div>
                  {activeRoute.waypoints.map((wp, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">
                        {wp.name}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 ml-auto font-medium">
                        ✓ Well-Lit
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Share Notice */}
            {isShared && (
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Live journey tracking link copied & sent to your 3 emergency contacts!</span>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3 bg-zinc-50/50 dark:bg-zinc-900">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-3 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium text-xs sm:text-sm transition-colors shrink-0"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Live Trip</span>
            </button>

            <button
              onClick={() => {
                citizenAudio.playSafeChime();
                setIsNavigating(true);
              }}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all duration-200"
            >
              <Footprints className="w-4 h-4" />
              <span>{isNavigating ? "Navigation Active (Stay on lit roads)" : "Start Safe Navigation"}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
