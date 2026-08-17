"use client";

import { Moon, Sun } from "lucide-react";
import { formatHourLabel, isNightHour } from "@/lib/riskEngine";

type TimeSimulatorProps = {
  hour: number;
  onChange: (hour: number) => void;
};

export function TimeSimulator({ hour, onChange }: TimeSimulatorProps) {
  const night = isNightHour(hour);

  return (
    <div className="pointer-events-auto rounded-xl border border-slate-200/90 bg-white/95 px-4 py-3 shadow-md backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between gap-3">
        <label
          htmlFor="time-simulator"
          className="text-xs font-bold uppercase tracking-wider text-slate-800"
        >
          Time-of-Day Simulator (24 Hours)
        </label>
        <div className="flex items-center gap-2">
          {night ? (
            <Moon className="h-3.5 w-3.5 text-indigo-600" />
          ) : (
            <Sun className="h-3.5 w-3.5 text-amber-500" />
          )}
          <span
            className={`font-mono text-xs font-bold tabular-nums ${
              night ? "text-rose-600" : "text-indigo-600"
            }`}
          >
            {formatHourLabel(hour)}
          </span>
        </div>
      </div>

      <input
        id="time-simulator"
        type="range"
        min={0}
        max={23}
        step={1}
        value={hour}
        onChange={(event) => onChange(Number(event.target.value))}
        className="time-slider h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-100"
        aria-valuemin={0}
        aria-valuemax={23}
        aria-valuenow={hour}
        aria-label="Simulate time of day"
      />

      <div className="mt-2 flex justify-between text-[10px] font-semibold text-slate-400">
        <span>00:00</span>
        <span>12:00</span>
        <span>23:00</span>
      </div>
    </div>
  );
}
