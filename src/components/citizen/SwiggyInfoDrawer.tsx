"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShieldCheck,
  Lightbulb,
  Users,
  Building2,
  AlertCircle,
  Navigation,
  Clock,
  Sparkles,
  Phone,
  CheckCircle2,
  Info,
  ChevronRight,
  ShieldAlert,
  Volume2,
  Share2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  STATUS_COLORS,
  type ZoneCitizenData,
  type SafeSpot,
} from "@/lib/citizenData";
import { citizenAudio } from "@/lib/audioService";

interface SwiggyInfoDrawerProps {
  zone: ZoneCitizenData | null;
  onClose: () => void;
  onGetDirections: (zone: ZoneCitizenData) => void;
  onShareZone: (zone: ZoneCitizenData) => void;
}

export function SwiggyInfoDrawer({
  zone,
  onClose,
  onGetDirections,
  onShareZone,
}: SwiggyInfoDrawerProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "safespots">("overview");

  if (!zone) return null;

  const status = STATUS_COLORS[zone.tier];

  // Custom minimalist tooltip for 24-hour safety trend chart
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-2.5 rounded-xl bg-zinc-900/90 dark:bg-zinc-800/90 text-white backdrop-blur-md border border-white/10 shadow-lg text-xs">
          <div className="font-semibold text-zinc-200">{data.time}</div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-medium">Safety Score: {data.safetyScore}%</span>
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            Crowd: {data.crowdLevel} • Light: {data.lightingLevel}
          </div>
        </div>
      );
    }
    return null;
  };

  const getSpotIcon = (category: SafeSpot["category"]) => {
    switch (category) {
      case "metro":
        return <Navigation className="w-4 h-4 text-sky-500" />;
      case "pharmacy":
        return <Building2 className="w-4 h-4 text-emerald-500" />;
      case "hospital":
        return <Building2 className="w-4 h-4 text-rose-500" />;
      case "cafe":
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case "kiosk":
      default:
        return <ShieldCheck className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 80, y: 20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, x: 80, y: 20 }}
        transition={{
          type: "spring",
          damping: 28,
          stiffness: 300,
          mass: 0.8,
        }}
        className="fixed z-40 right-0 sm:right-6 bottom-0 sm:bottom-6 top-auto sm:top-24 w-full sm:w-[440px] max-h-[88vh] sm:max-h-[calc(100vh-120px)] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-white/80 dark:border-zinc-800/90 rounded-t-3xl sm:rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.14)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden"
      >
        {/* Top Handle / Drag bar on mobile */}
        <div className="sm:hidden w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mt-2.5 mb-1" />

        {/* Drawer Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {zone.name}
                </h2>
                <button
                  onClick={() => onShareZone(zone)}
                  title="Share safety status"
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                {zone.tagline}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                citizenAudio.playUiTap();
                onClose();
              }}
              className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Safety Score Badge Pill (Pastel Aesthetic) */}
          <div className="mt-3.5 flex items-center justify-between gap-2">
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border ${status.badgeBg} ${status.bgClass} transition-colors`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${status.dotClass} animate-pulse`} />
              <span className="font-semibold text-xs sm:text-sm tracking-tight">
                {zone.safetyScore}% Safety Score
              </span>
              <span className="text-xs font-normal opacity-80">• {status.pillLabel}</span>
            </div>

            <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{zone.bestHours}</span>
            </div>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-5">
          
          {/* "Why this score?" Breakdown Cards */}
          <section>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                Why this score?
              </h3>
              <span className="text-[11px] text-zinc-600 dark:text-zinc-300">Updated 5 min ago</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Street Lighting Card */}
              <div className="p-3 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800/80">
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-medium">Street Lighting</span>
                </div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {zone.lightingScore}% • {zone.lightingStatus}
                </div>
              </div>

              {/* Live Crowd Footfall Card */}
              <div className="p-3 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800/80">
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
                  <Users className="w-4 h-4 text-sky-500" />
                  <span className="text-xs font-medium">Footfall</span>
                </div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {zone.crowdLevel}
                </div>
              </div>

              {/* Verified Safe Hubs Card */}
              <div className="p-3 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800/80">
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-medium">Safe Havens</span>
                </div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {zone.verifiedSafeSpotsCount} Verified Spots
                </div>
              </div>

              {/* Past Incidents Index Card */}
              <div className="p-3 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800/80">
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-1">
                  <AlertCircle className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-medium">Past Incidents</span>
                </div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {zone.recentIncidentIndex}
                </div>
              </div>
            </div>
          </section>

          {/* Minimalist 24-Hour Safety Trend Chart */}
          <section className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800/80">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                  24-Hour Safety Trend
                </h3>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-300">Hourly rating based on lighting & open stores</p>
              </div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Live Curve
              </span>
            </div>

            <div className="h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={zone.hourlyTrends}
                  margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="safetyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={status.hex} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={status.hex} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="time"
                    stroke="#a1a1aa"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis hide domain={[40, 100]} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="safetyScore"
                    stroke={status.hex}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#safetyGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Caution Note if Applicable */}
          {zone.cautionNotes && (
            <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>{zone.cautionNotes}</span>
            </div>
          )}

          {/* Community Tip */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-300">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Local Citizen Tip: </span>
              {zone.communityTip}
            </div>
          </div>

          {/* Verified Safe Spots in this Zone */}
          <section>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                Verified Safe Havens Nearby
              </h3>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {zone.safeSpots.length} spots
              </span>
            </div>

            <div className="space-y-2">
              {zone.safeSpots.map((spot) => (
                <div
                  key={spot.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800/80 hover:bg-zinc-100/80 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white dark:bg-zinc-700 shadow-xs">
                      {getSpotIcon(spot.category)}
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {spot.name}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                        {spot.address}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {spot.is24x7 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        24x7
                      </span>
                    )}
                    {spot.phone && (
                      <a
                        href={`tel:${spot.phone}`}
                        className="p-1.5 rounded-full bg-zinc-200/80 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-emerald-500 hover:text-white transition-colors"
                        title="Call safe spot"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Action Button (Swiggy-style high-intent checkout button) */}
        <div className="p-4 sm:p-5 border-t border-zinc-100 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 shrink-0">
          <button
            onClick={() => {
              citizenAudio.playUiTap();
              onGetDirections(zone);
            }}
            className="w-full flex items-center justify-between px-6 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-semibold text-sm sm:text-base shadow-lg shadow-emerald-600/25 transition-all duration-200 group"
          >
            <div className="flex items-center gap-2.5">
              <Navigation className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              <span>Get Safe Directions</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-100">
              <span className="bg-emerald-700/60 px-2 py-0.5 rounded-full">
                {zone.lightingScore}% Well-Lit
              </span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
