"use client";

import { useMemo } from "react";
import { BrainCircuit, CalendarPlus, Clock, Sparkles, Zap } from "lucide-react";
import type { PublicEventSimulation } from "@/lib/eventImpactEngine";
import type { CCTVCamera, Incident, Zone } from "@/lib/types";
import { getPeakRiskHours, predictEvents } from "@/lib/eventPredictor";

type EventPredictorPanelProps = {
  incidents: Incident[];
  zones: Zone[];
  cameras: CCTVCamera[];
  simulatedHour: number;
  onSimulateEvent?: () => void;
  activeEvent?: PublicEventSimulation | null;
};

export function EventPredictorPanel({
  incidents,
  zones,
  cameras,
  simulatedHour,
  onSimulateEvent,
  activeEvent = null,
}: EventPredictorPanelProps) {
  const { events, hourly } = useMemo(
    () => predictEvents(zones, incidents, cameras, simulatedHour),
    [zones, incidents, cameras, simulatedHour],
  );

  const peakHours = getPeakRiskHours(hourly, 4);
  const topPredictions = events.slice(0, 6);
  const maxProb = hourly.reduce(
    (max, h) => Math.max(max, h.totalProbability),
    1,
  );

  return (
    <aside className="pointer-events-auto flex w-72 shrink-0 flex-col overflow-hidden rounded-xl border border-violet-500/30 bg-slate-950/90 backdrop-blur-xl sm:w-80">
      <div className="border-b border-violet-500/20 bg-violet-950/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-violet-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">
            AI Event Predictor
          </h2>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          24-hour incident forecast from {String(simulatedHour).padStart(2, "0")}:00
        </p>
        {onSimulateEvent && (
          <button
            type="button"
            onClick={onSimulateEvent}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-violet-500/40 bg-violet-950/40 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-violet-200 transition hover:border-violet-400/50 hover:bg-violet-900/50"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            Simulate Public Event
          </button>
        )}
        {activeEvent && (
          <p className="mt-2 rounded-lg border border-red-500/30 bg-red-950/30 px-2 py-1.5 text-[10px] leading-relaxed text-red-200">
            Active simulation: {activeEvent.eventName} · {activeEvent.zoneName}
          </p>
        )}
      </div>

      <div className="border-b border-slate-700/50 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Probability Timeline
        </p>
        <div className="mt-3 flex h-16 items-end gap-0.5">
          {hourly.slice(0, 24).map((slot) => (
            <div
              key={slot.hour}
              className="group relative flex-1"
              title={`${slot.label}: ${slot.predictedCount} predicted`}
            >
              <div
                className="w-full rounded-t bg-gradient-to-t from-violet-600 to-fuchsia-400 transition-all group-hover:from-violet-500 group-hover:to-fuchsia-300"
                style={{
                  height: `${Math.max(8, (slot.totalProbability / maxProb) * 100)}%`,
                  opacity: slot.hour >= 20 || slot.hour <= 5 ? 1 : 0.65,
                }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[9px] text-slate-600">
          <span>+1h</span>
          <span>+12h</span>
          <span>+24h</span>
        </div>
      </div>

      <div className="border-b border-slate-700/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Peak Risk Windows
          </p>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {peakHours.map((slot) => (
            <span
              key={slot.hour}
              className="rounded-full border border-amber-500/30 bg-amber-950/30 px-2 py-0.5 text-[10px] font-medium text-amber-300"
            >
              {slot.label} · {slot.topZone}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Top Predictions
          </p>
        </div>
        <div className="mt-2 space-y-2">
          {topPredictions.map((event) => (
            <div
              key={event.id}
              className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-slate-100">
                    {event.type}
                  </p>
                  <p className="text-[10px] text-slate-500">{event.zoneName}</p>
                </div>
                <span
                  className={`rounded px-1.5 py-0.5 font-mono text-xs font-bold ${
                    event.confidence === "high"
                      ? "bg-red-500/20 text-red-300"
                      : event.confidence === "medium"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-slate-700/50 text-slate-400"
                  }`}
                >
                  {Math.round(event.probability * 100)}%
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
                <Clock className="h-3 w-3" />
                Expected around {String(event.hour).padStart(2, "0")}:00
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
