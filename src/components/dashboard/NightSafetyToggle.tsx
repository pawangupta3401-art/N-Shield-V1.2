"use client";

import { Moon, ShieldAlert } from "lucide-react";

type NightSafetyToggleProps = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
};

export function NightSafetyToggle({ enabled, onChange }: NightSafetyToggleProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3.5 py-2 backdrop-blur-md transition-all duration-300 shadow-sm ${
        enabled
          ? "border-rose-200 bg-rose-50/95"
          : "border-slate-200 bg-white/95"
      }`}
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
          enabled ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-500"
        }`}
      >
        {enabled ? (
          <ShieldAlert className="h-4 w-4 animate-pulse" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`text-xs font-bold uppercase tracking-wider ${
            enabled ? "text-rose-900" : "text-slate-800"
          }`}
        >
          Night Safety Mode
        </p>
        <p className="text-[10px] font-medium text-slate-400">
          {enabled ? "Vulnerability scan active" : "Enable 10PM-4AM scan"}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Toggle Night Safety Mode"
        onClick={() => onChange(!enabled)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${
          enabled ? "bg-rose-500" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
            enabled ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
