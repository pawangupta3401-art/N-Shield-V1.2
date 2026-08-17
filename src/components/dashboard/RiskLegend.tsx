"use client";

import { getTopRiskZones, type RiskHeatmapPoint } from "@/lib/riskHeatmap";
import { Activity } from "lucide-react";

type RiskLegendProps = {
  points: RiskHeatmapPoint[];
  simulatedHour: number;
  avgScore: number;
};

export function RiskLegend({ points, simulatedHour, avgScore }: RiskLegendProps) {
  const topZones = getTopRiskZones(points, 3);

  return (
    <div className="pointer-events-none rounded-xl border border-slate-200/90 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-2 text-indigo-600">
        <Activity className="h-4 w-4" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Dynamic Risk Scoring
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1">
        <div
          className="h-2 flex-1 rounded-full"
          style={{
            background: "linear-gradient(to right, #fef08a, #facc15, #fb923c, #ef4444)",
          }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] font-semibold text-slate-500">
        <span>Low 0–40</span>
        <span>Med 41–70</span>
        <span className="text-rose-600">High 71–100</span>
      </div>

      <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            City Avg · {String(simulatedHour).padStart(2, "0")}:00
          </p>
          <span className="font-mono text-xs font-bold text-slate-900">{avgScore}</span>
        </div>
        {topZones.map((zone) => (
          <div
            key={zone.zoneId}
            className="flex items-center justify-between text-xs"
          >
            <span className="font-medium text-slate-600">{zone.zoneName}</span>
            <span
              className={`font-mono font-bold ${
                zone.score > 70
                  ? "text-rose-600"
                  : zone.score > 40
                    ? "text-amber-600"
                    : "text-emerald-600"
              }`}
            >
              {zone.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
