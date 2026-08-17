"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  ShieldCheck,
  MapPin,
  Sparkles,
  Navigation,
  AlertOctagon,
  X,
  ChevronRight,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { NAGPUR_ZONES_DATA, STATUS_COLORS, type ZoneCitizenData } from "@/lib/citizenData";
import { citizenAudio } from "@/lib/audioService";

interface CitizenHeaderProps {
  darkMode: boolean;
  onToggleTheme: () => void;
  onSelectZone: (zoneId: string) => void;
  onOpenPanicModal: () => void;
  onOpenReportModal: () => void;
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
}

export function CitizenHeader({
  darkMode,
  onToggleTheme,
  onSelectZone,
  onOpenPanicModal,
  onOpenReportModal,
  selectedFilter,
  onSelectFilter,
}: CitizenHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSoundEnabled(citizenAudio.isSoundEnabled());
  }, []);

  // Handle click outside search results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSoundToggle = () => {
    const next = citizenAudio.toggleSound();
    setSoundEnabled(next);
  };

  const zonesList = Object.values(NAGPUR_ZONES_DATA);
  const filteredZones = zonesList.filter(
    (z) =>
      z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.areaType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.safeSpots.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filters = [
    { id: "all", label: "All Neighborhoods" },
    { id: "safe", label: "Safe Havens (80%+)" },
    { id: "24x7", label: "24/7 Active Spots" },
    { id: "metro", label: "Metro Corridors" },
  ];

  return (
    <header className="absolute top-0 left-0 right-0 z-30 pointer-events-none p-3 sm:p-5 flex flex-col gap-2.5 max-w-7xl mx-auto">
      {/* Top Floating Glass Bar */}
      <div className="pointer-events-auto w-full flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/70 dark:border-zinc-800/80 shadow-[0_10px_35px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.4)] transition-all duration-300">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-sm shadow-emerald-500/20">
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="hidden sm:flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-base tracking-tight text-zinc-900 dark:text-zinc-50">
                Aura
              </span>
              <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                Nagpur
              </span>
            </div>
            <span className="text-[11px] text-zinc-600 dark:text-zinc-300 font-medium">
              Citizen Safety Network
            </span>
          </div>
        </div>

        {/* Center: Minimalist Global Search Pill */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-lg mx-auto">
          <div
            className={`flex items-center gap-2.5 px-3.5 sm:px-4 py-2 rounded-full bg-zinc-100/80 dark:bg-zinc-800/80 border transition-all duration-200 ${
              isSearchFocused
                ? "bg-white dark:bg-zinc-800 border-zinc-400/80 dark:border-zinc-600 shadow-sm ring-2 ring-emerald-500/20"
                : "border-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Search your destination, area or safe spot..."
              className="w-full text-xs sm:text-sm bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full text-zinc-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchFocused && (
            <div className="absolute top-full left-0 right-0 mt-2 p-2 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-[0_16px_40px_rgba(0,0,0,0.12)] max-h-80 overflow-y-auto z-50">
              <div className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Nagpur Neighborhoods & Safe Spots
              </div>
              {filteredZones.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {filteredZones.map((zone) => {
                    const status = STATUS_COLORS[zone.tier];
                    return (
                      <button
                        key={zone.id}
                        onClick={() => {
                          onSelectZone(zone.id);
                          setIsSearchFocused(false);
                          setSearchQuery("");
                          citizenAudio.playUiTap();
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${status.dotClass}`} />
                          <div>
                            <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {zone.name}
                            </div>
                            <div className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-1">
                              {zone.tagline}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${status.badgeBg}`}
                          >
                            {zone.safetyScore}%
                          </span>
                          <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-zinc-500">
                  No matching locations found in Nagpur. Try searching "Dharampeth" or "Sitabuldi".
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Actions (Theme icon, Audio toggle, Panic SOS, Avatar) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Ambient Safety Sound Toggle */}
          <button
            onClick={handleSoundToggle}
            title={soundEnabled ? "Audio cues active" : "Audio muted"}
            className={`p-2 sm:p-2.5 rounded-full transition-all duration-200 ${
              soundEnabled
                ? "bg-zinc-100 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Clean Sun/Moon Icon Theme Switcher */}
          <button
            onClick={onToggleTheme}
            title={darkMode ? "Switch to Day Mode" : "Switch to Night Mode"}
            className="p-2 sm:p-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all duration-200"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
          </button>

          {/* Quick SOS Siren Alarm Button */}
          <button
            onClick={onOpenPanicModal}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 text-xs font-semibold shadow-sm transition-all duration-200 group"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-500 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">SOS Alarm</span>
          </button>

          {/* User Avatar with Safe Guardians Status */}
          <button
            onClick={onOpenReportModal}
            title="Report street light or safety spot"
            className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:ring-2 hover:ring-emerald-500/40 transition-all text-xs font-semibold"
          >
            <span>KA</span>
            <span
              title="3 Guardians connected"
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900"
            />
          </button>
        </div>
      </div>

      {/* Floating Filter Pills */}
      <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 px-1">
        {filters.map((filter) => {
          const isActive = selectedFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => {
                onSelectFilter(filter.id);
                citizenAudio.playUiTap();
              }}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-medium backdrop-blur-md transition-all duration-200 shadow-sm ${
                isActive
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-zinc-900/10"
                  : "bg-white/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-300 border border-white/60 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
