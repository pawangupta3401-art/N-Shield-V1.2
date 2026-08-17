"use client";

import {
  AlertTriangle,
  Camera,
  MapPin,
  Shield,
  TrendingUp,
} from "lucide-react";
import type { CCTVCamera, Incident, Zone } from "@/lib/types";
import { getCityOverviewStats } from "@/lib/zoneAnalytics";

type OverviewPanelProps = {
  incidents: Incident[];
  zones: Zone[];
  cameras: CCTVCamera[];
  simulatedHour: number;
};

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: typeof Shield;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <Icon className={`h-3.5 w-3.5 ${accent}`} />
      </div>
      <p className="mt-1 font-mono text-lg font-bold text-slate-900">{value}</p>
      {sub && <p className="text-[10px] font-medium text-slate-500">{sub}</p>}
    </div>
  );
}

export function OverviewPanel({
  incidents,
  zones,
  cameras,
  simulatedHour,
}: OverviewPanelProps) {
  const stats = getCityOverviewStats(zones, incidents, cameras, simulatedHour);
  const recentIncidents = incidents.slice(0, 5);

  return (
    <aside className="pointer-events-auto flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-indigo-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            City Intelligence Overview
          </h2>
        </div>
        <p className="mt-1 text-[11px] font-medium text-slate-400">
          Nagpur metro · {String(simulatedHour).padStart(2, "0")}:00 snapshot
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 p-4">
        <StatCard
          label="Avg Risk"
          value={stats.avgRiskScore}
          sub="City score"
          icon={AlertTriangle}
          accent="text-rose-500"
        />
        <StatCard
          label="Incidents"
          value={stats.totalIncidents}
          sub={`${stats.openIncidents} open`}
          icon={MapPin}
          accent="text-amber-500"
        />
        <StatCard
          label="CCTV Online"
          value={`${stats.operationalCameras}/${stats.totalCameras}`}
          sub={`${stats.offlineCameras} offline`}
          icon={Camera}
          accent="text-blue-500"
        />
        <StatCard
          label="Patrols"
          value={stats.totalPatrols}
          sub="5 zones"
          icon={Shield}
          accent="text-emerald-500"
        />
      </div>

      <div className="border-t border-slate-100 px-5 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Zone Risk Ranking
        </p>
        <div className="mt-2.5 space-y-2">
          {stats.zoneStats.map((zone) => (
            <div key={zone.zoneId} className="flex items-center gap-2">
              <span className="w-20 truncate text-xs font-medium text-slate-700">
                {zone.zoneName}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    zone.riskScore > 70
                      ? "bg-rose-500"
                      : zone.riskScore > 40
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }`}
                  style={{ width: `${zone.riskScore}%` }}
                />
              </div>
              <span className="w-6 font-mono text-xs font-bold text-slate-800">
                {zone.riskScore}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto border-t border-slate-100 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Recent Incident Activity
        </p>
        <div className="mt-2.5 space-y-2">
          {recentIncidents.map((incident) => (
            <div
              key={incident.id}
              className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  {incident.type}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    incident.severity === "critical" || incident.severity === "high"
                      ? "border border-rose-200 bg-rose-50 text-rose-700"
                      : "border border-slate-200 bg-slate-100 text-slate-600"
                  }`}
                >
                  {incident.severity}
                </span>
              </div>
              <p className="mt-1 text-[11px] font-medium text-slate-500">
                {zones.find((z) => z.id === incident.zoneId)?.name ?? incident.zoneId}
              </p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
