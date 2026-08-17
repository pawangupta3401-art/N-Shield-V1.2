"use client";

import React from "react";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Compass,
  Eye,
  HeartPulse,
  Lightbulb,
  PhoneCall,
  Shield,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export function SafetyTipsSection() {
  const tips = [
    {
      title: "Night Travel & Transit Corridors",
      description: "When traveling late through commercial hubs like Sitabuldi or Sadar, prefer well-lit primary transit arteries (WHC Road, Wardha Road) over narrow back alleys.",
      category: "Night Safety",
      icon: "🌙",
    },
    {
      title: "Emergency Speed Dials",
      description: "Always remember: 112 for Police & Integrated Emergency, 108 for Free Ambulance Dispatch, and 1091 for Damini Women Safety Squad.",
      category: "Emergency Helpline",
      icon: "🚨",
    },
    {
      title: "Vehicle & Valuables Precaution",
      description: "Always park vehicles in well-lit CCTV-monitored lots near Metro stations and avoid leaving mobile phones or bags unattended at market counters.",
      category: "Crime Prevention",
      icon: "🔒",
    },
    {
      title: "Monsoon & Road Hazard Awareness",
      description: "Exercise extreme caution on flyover descents (Wardha Rd, Pardi) during heavy monsoon showers to prevent two-wheeler skid hazards.",
      category: "Road Safety",
      icon: "🌧️",
    },
  ];

  return (
    <section className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-5 shadow-sm backdrop-blur-md space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
            <Lightbulb className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Nagpur Citizen Safety Tips & Guidelines
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Practical precautions for daily urban commutes and public transit
            </p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 hidden sm:inline-flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5" /> Civic Advisory
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tips.map((tip, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-lg">{tip.icon}</span>
              <span className="rounded-md bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                {tip.category}
              </span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {tip.title}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {tip.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
