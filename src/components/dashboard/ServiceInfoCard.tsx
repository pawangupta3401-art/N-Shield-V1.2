"use client";

import React from "react";
import {
  Building2,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  MapPin,
  Navigation,
  Phone,
  PhoneCall,
  ShieldCheck,
  X,
} from "lucide-react";
import type { EssentialService, ServiceCategory } from "@/lib/nearbyServicesData";
import {
  getGoogleMapsDirectionsUrl,
  getPhoneDialerUrl,
  type UserLocation,
} from "@/lib/geoUtils";

const CATEGORY_META: Record<
  ServiceCategory,
  { label: string; icon: string; bgBadge: string; textBadge: string; borderBadge: string }
> = {
  police: {
    label: "Police Station",
    icon: "🚓",
    bgBadge: "bg-blue-50 dark:bg-blue-950/60",
    textBadge: "text-blue-700 dark:text-blue-300",
    borderBadge: "border-blue-200 dark:border-blue-800",
  },
  hospital: {
    label: "Hospital",
    icon: "🏥",
    bgBadge: "bg-rose-50 dark:bg-rose-950/60",
    textBadge: "text-rose-700 dark:text-rose-300",
    borderBadge: "border-rose-200 dark:border-rose-800",
  },
  pharmacy: {
    label: "Medical Shop / Pharmacy",
    icon: "💊",
    bgBadge: "bg-emerald-50 dark:bg-emerald-950/60",
    textBadge: "text-emerald-700 dark:text-emerald-300",
    borderBadge: "border-emerald-200 dark:border-emerald-800",
  },
  ambulance: {
    label: "Ambulance / Emergency",
    icon: "🚑",
    bgBadge: "bg-amber-50 dark:bg-amber-950/60",
    textBadge: "text-amber-700 dark:text-amber-300",
    borderBadge: "border-amber-200 dark:border-amber-800",
  },
  fire_station: {
    label: "Fire Station",
    icon: "🚒",
    bgBadge: "bg-orange-50 dark:bg-orange-950/60",
    textBadge: "text-orange-700 dark:text-orange-300",
    borderBadge: "border-orange-200 dark:border-orange-800",
  },
  emergency_other: {
    label: "Emergency Service",
    icon: "🛡️",
    bgBadge: "bg-purple-50 dark:bg-purple-950/60",
    textBadge: "text-purple-700 dark:text-purple-300",
    borderBadge: "border-purple-200 dark:border-purple-800",
  },
};

interface ServiceInfoCardProps {
  service: EssentialService;
  userLocation: UserLocation;
  formattedDistance: string;
  onClose: () => void;
}

export function ServiceInfoCard({
  service,
  userLocation,
  formattedDistance,
  onClose,
}: ServiceInfoCardProps) {
  const meta = CATEGORY_META[service.category] || CATEGORY_META.police;
  const directionsUrl = getGoogleMapsDirectionsUrl(userLocation, service);
  const dialerUrl = getPhoneDialerUrl(service.phone);

  return (
    <div className="absolute inset-x-3 bottom-3 sm:bottom-auto sm:inset-x-auto sm:left-6 sm:top-28 z-30 w-auto sm:w-full sm:max-w-md rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-2xl space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-left-4 duration-200 max-h-[75vh] sm:max-h-[calc(100vh-140px)] overflow-y-auto">
      
      {/* Category Pill & Close Button */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide border ${meta.bgBadge} ${meta.textBadge} ${meta.borderBadge}`}
          >
            <span className="text-sm">{meta.icon}</span>
            <span>{meta.label}</span>
          </span>
          {service.verified && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Service Name & Distance */}
      <div>
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-50 leading-tight">
          {service.name}
        </h3>
        <div className="mt-2 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 px-3 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300">
            <MapPin className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            📍 {formattedDistance}
          </span>
          <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Open / Available
          </span>
        </div>
      </div>

      {/* Route Distance Flow Preview */}
      <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 p-3.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
          <span>Route from current location</span>
          <span className="text-indigo-600 dark:text-indigo-400">{formattedDistance}</span>
        </div>
        <div className="relative pl-6 space-y-3 text-xs">
          {/* Vertical path line */}
          <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-dashed border-l-2 border-indigo-400 dark:border-indigo-600" />
          
          <div className="relative flex items-center gap-2">
            <span className="absolute -left-6 h-3 w-3 rounded-full bg-indigo-600 ring-4 ring-indigo-100 dark:ring-indigo-950" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {userLocation.label || "Your Location"}
            </span>
          </div>

          <div className="relative flex items-center gap-2">
            <span className="absolute -left-6 h-3 w-3 rounded-full bg-emerald-600 ring-4 ring-emerald-100 dark:ring-emerald-950" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {meta.icon} {service.name}
            </span>
          </div>
        </div>
      </div>

      {/* Address & Details Grid */}
      <div className="space-y-2 text-xs">
        <div className="flex items-start gap-2.5 text-slate-600 dark:text-slate-300">
          <Building2 className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{service.address}</p>
            {service.landmark && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Landmark: {service.landmark}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
          <Clock className="h-4 w-4 text-slate-400 shrink-0" />
          <span className="font-medium">Timing: {service.timing}</span>
        </div>

        {service.notes && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800">
            ℹ️ {service.notes}
          </p>
        )}
      </div>

      {/* Action Buttons: [ 📞 Call ] & [ 🧭 Directions ] */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        {dialerUrl ? (
          <a
            href={dialerUrl}
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-md transition hover:bg-emerald-700 active:scale-98"
          >
            <PhoneCall className="h-4 w-4" />
            <span>📞 Call</span>
          </a>
        ) : (
          <div className="flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-medium px-4 py-3">
            Phone Unavailable
          </div>
        )}

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-md transition hover:bg-indigo-700 active:scale-98"
        >
          <Compass className="h-4 w-4" />
          <span>🧭 Directions</span>
        </a>
      </div>
    </div>
  );
}
