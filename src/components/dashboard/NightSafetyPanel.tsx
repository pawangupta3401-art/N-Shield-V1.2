"use client";

import { AlertOctagon, Clock, MapPin, Shield } from "lucide-react";
import type { CriticalBlindSpot } from "@/lib/blindSpotIntelligence";
import { getPatrolRecommendations } from "@/lib/blindSpotIntelligence";

type NightSafetyPanelProps = {
  blindSpots: CriticalBlindSpot[];
  nightSafetyMode: boolean;
};

export function NightSafetyPanel({
  blindSpots,
  nightSafetyMode,
}: NightSafetyPanelProps) {
  const recommendations = getPatrolRecommendations(blindSpots);

  if (!nightSafetyMode && recommendations.length === 0) return null;

  return (
    <aside
      className={`pointer-events-auto flex w-72 shrink-0 flex-col overflow-hidden rounded-xl border backdrop-blur-xl transition-all duration-500 sm:w-80 ${
        nightSafetyMode
          ? "border-red-500/40 bg-black/85 shadow-[0_0_40px_rgba(239,68,68,0.15)]"
          : "border-slate-600/40 bg-slate-950/90"
      }`}
    >
      <div
        className={`border-b px-4 py-3 ${
          nightSafetyMode ? "border-red-500/30 bg-red-950/30" : "border-slate-700/50"
        }`}
      >
        <div className="flex items-center gap-2">
          <AlertOctagon
            className={`h-4 w-4 ${nightSafetyMode ? "animate-pulse text-red-400" : "text-amber-400"}`}
          />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">
            CCTV Blind-Spot Intelligence
          </h2>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          High crime risk ∩ low CCTV coverage
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {recommendations.length === 0 ? (
          <p className="text-sm text-slate-500">No critical blind spots detected.</p>
        ) : (
          recommendations.map((spot) => (
            <div
              key={spot.zoneId}
              className={`rounded-lg border p-3 ${
                nightSafetyMode
                  ? "border-red-500/30 bg-red-950/20"
                  : "border-slate-700/50 bg-slate-900/50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-red-400" />
                  <span className="text-sm font-semibold text-slate-100">
                    {spot.zoneName}
                  </span>
                </div>
                <span
                  className={`rounded px-1.5 py-0.5 font-mono text-xs font-bold ${
                    spot.riskScore > 85
                      ? "bg-red-500/20 text-red-300"
                      : "bg-amber-500/20 text-amber-300"
                  }`}
                >
                  {spot.riskScore}
                </span>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-red-200/90">
                <span className="font-semibold text-red-300">
                  Critical Intervention Required:
                </span>{" "}
                {spot.patrolWindow} Patrols recommended at {spot.zoneName}.
              </p>

              <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  CCTV {spot.cctvCoverage}%
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Light {spot.lightingScore}%
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {nightSafetyMode && (
        <div className="border-t border-red-500/20 bg-red-950/20 px-4 py-2.5">
          <p className="text-center text-[10px] font-semibold uppercase tracking-wider text-red-400/90">
            Showing poor lighting + weak CCTV only
          </p>
        </div>
      )}
    </aside>
  );
}
