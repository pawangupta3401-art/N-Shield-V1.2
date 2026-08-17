"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Car,
  GripVertical,
  RotateCcw,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import type { CCTVCamera, Incident, Zone } from "@/lib/types";
import { computeZoneAnalytics } from "@/lib/zoneAnalytics";
import {
  buildChartData,
  computeAiDeployment,
  createPoliceUnits,
  assignmentsFromDeployment,
  TOTAL_POLICE_UNITS,
} from "@/lib/deploymentEngine";

type PoliceDeploymentSimulatorProps = {
  incidents: Incident[];
  zones: Zone[];
  cameras: CCTVCamera[];
  simulatedHour: number;
  loading?: boolean;
};

function riskColor(score: number) {
  if (score > 70) return "text-red-400 border-red-500/40 bg-red-950/20";
  if (score > 40) return "text-yellow-400 border-yellow-500/40 bg-yellow-950/15";
  return "text-emerald-400 border-emerald-500/40 bg-emerald-950/15";
}

function PoliceCarIcon({
  unitId,
  draggable = true,
  compact = false,
  glowing = false,
}: {
  unitId: string;
  draggable?: boolean;
  compact?: boolean;
  glowing?: boolean;
}) {
  return (
    <motion.div
      layout
      layoutId={unitId}
      draggable={draggable}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.6, opacity: 0 }}
      whileHover={draggable ? { scale: 1.08, y: -2 } : undefined}
      whileDrag={{ scale: 1.12, zIndex: 50, boxShadow: "0 0 24px rgba(34,211,238,0.5)" }}
      className={`flex cursor-grab items-center gap-1.5 rounded-xl border active:cursor-grabbing ${
        compact ? "px-2 py-1.5" : "px-3 py-2"
      } ${
        glowing
          ? "border-cyan-400/60 bg-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.35)]"
          : "border-cyan-500/30 bg-slate-900/80 shadow-lg shadow-cyan-500/10"
      }`}
    >
      <GripVertical className="h-3 w-3 shrink-0 text-slate-600" />
      <Car className={`shrink-0 text-cyan-400 ${compact ? "h-4 w-4" : "h-5 w-5"}`} />
      {!compact && (
        <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-200/90">
          {unitId.replace("unit-", "P-")}
        </span>
      )}
    </motion.div>
  );
}

export function PoliceDeploymentSimulator({
  incidents,
  zones,
  cameras,
  simulatedHour,
  loading = false,
}: PoliceDeploymentSimulatorProps) {
  const units = useMemo(() => createPoliceUnits(TOTAL_POLICE_UNITS), []);
  const zoneStats = useMemo(
    () =>
      computeZoneAnalytics(zones, incidents, cameras, simulatedHour).sort(
        (a, b) => b.riskScore - a.riskScore,
      ),
    [zones, incidents, cameras, simulatedHour],
  );

  const zoneOrder = useMemo(
    () => zoneStats.map((zone) => zone.zoneId),
    [zoneStats],
  );

  const [assignments, setAssignments] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(units.map((unit) => [unit.id, null])),
  );
  const [draggingUnitId, setDraggingUnitId] = useState<string | null>(null);
  const [dropTargetZoneId, setDropTargetZoneId] = useState<string | null>(null);
  const [isAutoDeploying, setIsAutoDeploying] = useState(false);
  const [autoDeployPhase, setAutoDeployPhase] = useState(0);

  const deployments = useMemo(() => {
    const counts: Record<string, number> = Object.fromEntries(
      zoneOrder.map((id) => [id, 0]),
    );
    for (const zoneId of Object.values(assignments)) {
      if (zoneId) counts[zoneId] = (counts[zoneId] ?? 0) + 1;
    }
    return counts;
  }, [assignments, zoneOrder]);

  const poolUnits = units.filter((unit) => !assignments[unit.id]);
  const chartData = useMemo(
    () => buildChartData(zoneStats, deployments),
    [zoneStats, deployments],
  );

  const totalDeployed = TOTAL_POLICE_UNITS - poolUnits.length;

  const handleDragStart = (unitId: string) => (event: React.DragEvent) => {
    event.dataTransfer.setData("text/unit-id", unitId);
    event.dataTransfer.effectAllowed = "move";
    setDraggingUnitId(unitId);
  };

  const handleDragEnd = () => {
    setDraggingUnitId(null);
    setDropTargetZoneId(null);
  };

  const assignUnit = useCallback((unitId: string, zoneId: string | null) => {
    setAssignments((prev) => ({ ...prev, [unitId]: zoneId }));
  }, []);

  const handleDropOnZone = (zoneId: string) => (event: React.DragEvent) => {
    event.preventDefault();
    const unitId = event.dataTransfer.getData("text/unit-id");
    if (unitId) assignUnit(unitId, zoneId);
    setDropTargetZoneId(null);
    setDraggingUnitId(null);
  };

  const handleDropOnPool = (event: React.DragEvent) => {
    event.preventDefault();
    const unitId = event.dataTransfer.getData("text/unit-id");
    if (unitId) assignUnit(unitId, null);
    setDraggingUnitId(null);
  };

  const handleAutoDeploy = async () => {
    if (isAutoDeploying) return;
    setIsAutoDeploying(true);
    setAutoDeployPhase(0);

    const aiPlan = computeAiDeployment(zoneStats, TOTAL_POLICE_UNITS);

    setAssignments(Object.fromEntries(units.map((unit) => [unit.id, null])));

    for (let step = 0; step <= TOTAL_POLICE_UNITS; step++) {
      setAutoDeployPhase(step);
      const partial: Record<string, number> = {};
      let assigned = 0;
      for (const zoneId of zoneOrder) {
        const target = aiPlan[zoneId] ?? 0;
        const stepShare = Math.round((target / TOTAL_POLICE_UNITS) * step);
        partial[zoneId] = Math.min(target, stepShare);
        assigned += partial[zoneId] ?? 0;
      }
      let remainder = step - assigned;
      for (const zoneId of zoneOrder) {
        while (remainder > 0 && (partial[zoneId] ?? 0) < (aiPlan[zoneId] ?? 0)) {
          partial[zoneId] = (partial[zoneId] ?? 0) + 1;
          remainder -= 1;
        }
      }

      setAssignments(
        assignmentsFromDeployment(units, partial, zoneOrder),
      );
      await new Promise((resolve) => setTimeout(resolve, 180));
    }

    setAssignments(
      assignmentsFromDeployment(units, aiPlan, zoneOrder),
    );
    setIsAutoDeploying(false);
    setAutoDeployPhase(TOTAL_POLICE_UNITS);
  };

  const handleReset = () => {
    setAssignments(Object.fromEntries(units.map((unit) => [unit.id, null])));
    setAutoDeployPhase(0);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-emerald-500/20 bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-400" />
          <p className="text-sm text-slate-400">Loading deployment intelligence…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-emerald-500/25 bg-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      {/* Header */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-950/90 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-bold tracking-tight text-slate-100">
              Police Deployment Simulator
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Drag patrol units into Nagpur zones · AI optimizes by live risk score
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={isAutoDeploying}
            className="flex items-center gap-1.5 rounded-lg border border-slate-600/50 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-400 transition hover:border-slate-500 hover:text-slate-200 disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
          <button
            type="button"
            onClick={handleAutoDeploy}
            disabled={isAutoDeploying}
            className="relative flex items-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-violet-500/25 transition hover:shadow-violet-500/40 disabled:opacity-70"
          >
            {isAutoDeploying && (
              <motion.span
                className="absolute inset-0 bg-white/20"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 0.6, repeat: Infinity }}
              />
            )}
            <Sparkles className="h-4 w-4" />
            Auto-Deploy via AI
          </button>
        </div>
      </div>

      {/* Main drag-drop area */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden p-4 lg:grid-cols-[280px_1fr]">
        {/* Left — unit pool */}
        <section
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDropOnPool}
          className={`flex flex-col rounded-xl border-2 border-dashed p-4 transition-colors ${
            draggingUnitId && dropTargetZoneId === null
              ? "border-cyan-500/50 bg-cyan-950/20"
              : "border-slate-700/60 bg-slate-900/40"
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Available Units
              </p>
              <p className="text-[10px] text-slate-500">Drag cars to zones →</p>
            </div>
            <span className="rounded-full bg-cyan-500/15 px-2.5 py-0.5 font-mono text-sm font-bold text-cyan-300">
              {poolUnits.length}/{TOTAL_POLICE_UNITS}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {poolUnits.map((unit) => (
                <div
                  key={unit.id}
                  draggable
                  onDragStart={handleDragStart(unit.id)}
                  onDragEnd={handleDragEnd}
                >
                  <PoliceCarIcon unitId={unit.id} glowing={isAutoDeploying} />
                </div>
              ))}
            </AnimatePresence>
          </div>

          {poolUnits.length === 0 && (
            <p className="mt-auto pt-4 text-center text-[11px] text-slate-600">
              All units deployed — drop here to recall
            </p>
          )}

          {isAutoDeploying && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 flex items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-950/30 px-3 py-2"
            >
              <Zap className="h-3.5 w-3.5 animate-pulse text-violet-400" />
              <span className="text-[10px] font-medium text-violet-300">
                AI distributing… {autoDeployPhase}/{TOTAL_POLICE_UNITS}
              </span>
            </motion.div>
          )}
        </section>

        {/* Right — zone cards */}
        <section className="flex min-h-0 flex-col gap-3 overflow-y-auto">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {chartData.map((row, index) => {
              const zoneUnits = units.filter(
                (unit) => assignments[unit.id] === row.zoneId,
              );
              const isDropTarget = dropTargetZoneId === row.zoneId;

              return (
                <motion.div
                  key={row.zoneId}
                  layout
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDropTargetZoneId(row.zoneId);
                  }}
                  onDragLeave={() => setDropTargetZoneId(null)}
                  onDrop={handleDropOnZone(row.zoneId)}
                  className={`rounded-xl border p-4 transition-all ${
                    isDropTarget
                      ? "border-cyan-400/60 bg-cyan-950/25 shadow-[0_0_30px_rgba(34,211,238,0.15)]"
                      : "border-slate-700/50 bg-slate-900/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                        Zone {String.fromCharCode(65 + index)}
                      </p>
                      <h3 className="text-sm font-semibold text-slate-100">
                        {row.zoneName}
                      </h3>
                    </div>
                    <span
                      className={`rounded-lg border px-2 py-0.5 font-mono text-xs font-bold ${riskColor(row.riskScore)}`}
                    >
                      {row.riskScore}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-slate-500">
                    <span>Coverage {row.currentCoverage}%</span>
                    <span className="text-emerald-400/80">
                      −{row.expectedRiskReduction}% risk
                    </span>
                  </div>

                  <div
                    className={`mt-3 min-h-[72px] rounded-lg border-2 border-dashed p-2 transition-colors ${
                      zoneUnits.length > 0
                        ? "border-emerald-500/30 bg-emerald-950/10"
                        : "border-slate-700/40 bg-slate-950/50"
                    }`}
                  >
                    <p className="mb-2 text-[9px] uppercase tracking-wider text-slate-600">
                      {zoneUnits.length} unit{zoneUnits.length !== 1 ? "s" : ""} stationed
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <AnimatePresence mode="popLayout">
                        {zoneUnits.map((unit) => (
                          <div
                            key={unit.id}
                            draggable={!isAutoDeploying}
                            onDragStart={handleDragStart(unit.id)}
                            onDragEnd={handleDragEnd}
                          >
                            <PoliceCarIcon
                              unitId={unit.id}
                              compact
                              draggable={!isAutoDeploying}
                            />
                          </div>
                        ))}
                      </AnimatePresence>
                      {zoneUnits.length === 0 && (
                        <p className="text-[10px] italic text-slate-600">
                          Drop patrol units here
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Bar chart */}
      <div className="shrink-0 border-t border-slate-800/80 bg-slate-950/80 px-4 py-4 sm:px-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Deployment Impact Analysis
            </p>
            <p className="text-[10px] text-slate-500">
              {totalDeployed} units deployed across {zones.length} zones
            </p>
          </div>
          <div className="flex gap-4 text-[10px]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-sm bg-cyan-500" />
              Current Coverage
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-sm bg-emerald-500" />
              Risk Reduction
            </span>
          </div>
        </div>

        <div className="h-48 w-full sm:h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
              barGap={4}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="zoneLabel"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={{ stroke: "#334155" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#64748b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#94a3b8" }}
                formatter={(value, name) => {
                  const numericValue =
                    typeof value === "number" ? value : Number(value ?? 0);
                  const label =
                    name === "currentCoverage"
                      ? "Current Coverage"
                      : "Expected Risk Reduction";
                  return [`${numericValue}%`, label];
                }}
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as (typeof chartData)[0];
                  return row ? `${row.zoneLabel} · ${row.zoneName}` : "";
                }}
              />
              <Legend wrapperStyle={{ display: "none" }} />
              <Bar
                dataKey="currentCoverage"
                name="currentCoverage"
                fill="#06b6d4"
                radius={[4, 4, 0, 0]}
                animationDuration={isAutoDeploying ? 300 : 600}
              />
              <Bar
                dataKey="expectedRiskReduction"
                name="expectedRiskReduction"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                animationDuration={isAutoDeploying ? 300 : 600}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
