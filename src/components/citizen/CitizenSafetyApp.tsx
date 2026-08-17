"use client";

import React, { useState, useEffect } from "react";
import { CitizenHeader } from "./CitizenHeader";
import { CitizenMap } from "./CitizenMap";
import { SwiggyInfoDrawer } from "./SwiggyInfoDrawer";
import { SafeRouteModal } from "./SafeRouteModal";
import { PanicAlarmModal } from "./PanicAlarmModal";
import { ReportDarkSpotModal } from "./ReportDarkSpotModal";
import {
  NAGPUR_ZONES_DATA,
  type ZoneCitizenData,
} from "@/lib/citizenData";
import { citizenAudio } from "@/lib/audioService";
import { CheckCircle2 } from "lucide-react";

export function CitizenSafetyApp() {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [selectedZone, setSelectedZone] = useState<ZoneCitizenData | null>(
    NAGPUR_ZONES_DATA.dharampeth
  );
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [isRouteModalOpen, setIsRouteModalOpen] = useState<boolean>(false);
  const [isPanicModalOpen, setIsPanicModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize theme from localStorage or prefers-color-scheme
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("aura_theme");
      if (savedTheme === "dark") {
        setDarkMode(true);
        document.documentElement.classList.add("dark");
      } else {
        setDarkMode(false);
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  const handleToggleTheme = () => {
    citizenAudio.playUiTap();
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("aura_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("aura_theme", "light");
    }
  };

  const handleSelectZoneById = (zoneId: string) => {
    const found = NAGPUR_ZONES_DATA[zoneId];
    if (found) {
      setSelectedZone(found);
      if (found.tier === "safe") {
        citizenAudio.playSafeChime();
      } else {
        citizenAudio.playCautionChime();
      }
    }
  };

  const handleGetDirections = (zone: ZoneCitizenData) => {
    setSelectedZone(zone);
    setIsRouteModalOpen(true);
  };

  const handleShareZone = (zone: ZoneCitizenData) => {
    citizenAudio.playUiTap();
    setToastMessage(`Safety status for ${zone.name} (${zone.safetyScore}% Safe) copied to clipboard!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className={`relative w-screen h-screen overflow-hidden ${darkMode ? "dark bg-zinc-950 text-zinc-100" : "bg-white text-zinc-900"}`}>
      {/* 1. Floating Minimalist Frosted Glass Header */}
      <CitizenHeader
        darkMode={darkMode}
        onToggleTheme={handleToggleTheme}
        onSelectZone={handleSelectZoneById}
        onOpenPanicModal={() => setIsPanicModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        selectedFilter={selectedFilter}
        onSelectFilter={setSelectedFilter}
      />

      {/* 2. Edge-to-Edge Interactive Google Maps (100vh) */}
      <CitizenMap
        darkMode={darkMode}
        selectedZoneId={selectedZone?.id || null}
        onSelectZone={(zone: ZoneCitizenData) => setSelectedZone(zone)}
        selectedFilter={selectedFilter}
        isSafeRouteActive={isRouteModalOpen}
      />

      {/* 3. The Swiggy-Style Information Drawer */}
      <SwiggyInfoDrawer
        zone={selectedZone}
        onClose={() => setSelectedZone(null)}
        onGetDirections={handleGetDirections}
        onShareZone={handleShareZone}
      />

      {/* 4. Safe Route Navigator Modal */}
      <SafeRouteModal
        isOpen={isRouteModalOpen}
        destinationZone={selectedZone}
        onClose={() => setIsRouteModalOpen(false)}
      />

      {/* 5. SOS Panic Alarm Modal */}
      <PanicAlarmModal
        isOpen={isPanicModalOpen}
        onClose={() => setIsPanicModalOpen(false)}
      />

      {/* 6. Report Dark Spot / Citizen Pin Modal */}
      <ReportDarkSpotModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-zinc-900/90 dark:bg-zinc-100/90 text-white dark:text-zinc-900 backdrop-blur-md text-xs font-medium shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
