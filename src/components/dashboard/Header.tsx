"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Menu,
  PhoneCall,
  Search,
  ShieldCheck,
  Siren,
} from "lucide-react";
import { NotificationDropdown } from "./NotificationDropdown";
import { GlobalSearchBar } from "./GlobalSearchBar";
import type { EssentialService } from "@/lib/nearbyServicesData";
import type { UserLocation } from "@/lib/geoUtils";
import type { Zone } from "@/lib/types";
import type { RealNewsArticle } from "@/lib/newsTypes";

interface HeaderProps {
  onOpenMobileNav?: () => void;
  onOpenEmergencySOS?: () => void;
  onSelectZone?: (zoneId: string, lat?: number, lng?: number) => void;
  userLocation: UserLocation;
  zones?: Zone[];
  services?: EssentialService[];
  newsArticles?: RealNewsArticle[];
  onSelectService?: (service: EssentialService) => void;
  onSelectNewsArticle?: (article: RealNewsArticle) => void;
}

export function Header({
  onOpenMobileNav,
  onOpenEmergencySOS,
  onSelectZone,
  userLocation,
  zones = [],
  services = [],
  newsArticles = [],
  onSelectService,
  onSelectNewsArticle,
}: HeaderProps) {
  const [time, setTime] = useState<string>("--:--:--");
  const [date, setDate] = useState<string>("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
      setDate(
        now.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "2-digit",
          month: "short",
        })
      );
    };

    updateClock();
    const interval = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <header className="relative z-20 flex h-14 sm:h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/95 dark:bg-slate-900/95 px-3 sm:px-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] backdrop-blur-md">
      
      {/* Left: Mobile Hamburger + Brand Logo */}
      <div className="flex items-center gap-2.5 sm:gap-6 min-w-0 flex-1 max-w-2xl">
        {/* Mobile Hamburger Menu Button (44px target) */}
        {onOpenMobileNav && (
          <button
            type="button"
            onClick={onOpenMobileNav}
            aria-label="Open Mobile Menu"
            className="flex md:hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-indigo-600 shadow-md shadow-indigo-200 ring-2 ring-indigo-100 dark:ring-indigo-900 text-white">
            <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-50 tracking-tight leading-none">
                N-SHIELD
              </h1>
              <span className="rounded-md bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-extrabold uppercase text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Nagpur
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden xl:block truncate">
              AI-Powered Urban Safety Intelligence
            </p>
          </div>
        </div>

        {/* Desktop Interactive Search Bar */}
        <div className="hidden md:block flex-1 max-w-sm lg:max-w-md">
          <GlobalSearchBar
            userLocation={userLocation}
            zones={zones}
            services={services}
            newsArticles={newsArticles}
            onSelectZone={(zoneId, lat, lng) => {
              if (onSelectZone) onSelectZone(zoneId, lat, lng);
            }}
            onSelectService={(service) => {
              if (onSelectService) onSelectService(service);
            }}
            onSelectNewsArticle={(article) => {
              if (onSelectNewsArticle) onSelectNewsArticle(article);
            }}
          />
        </div>
      </div>

      {/* Right: Actions, SOS, Status, & Profile */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        
        {/* Emergency SOS Button (Mobile & Desktop) */}
        {onOpenEmergencySOS && (
          <button
            type="button"
            onClick={onOpenEmergencySOS}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-1.5 sm:py-2 text-xs font-black text-white shadow-xs hover:bg-rose-700 active:scale-95 transition"
            title="Emergency Services"
          >
            <Siren className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Emergency</span>
            <span>SOS</span>
          </button>
        )}

        {/* Live Status Badge */}
        <div className="hidden 2xl:flex items-center gap-2 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live Protection Active
        </div>

        {/* Live Time */}
        <div className="hidden 2xl:block text-right">
          <p className="font-mono text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-200">
            {time} IST
          </p>
          <p className="text-[10px] font-medium text-slate-400">{date}</p>
        </div>

        {/* Notification Bell Button (Interactive) */}
        <button
          type="button"
          onClick={() => setNotificationsOpen((prev) => !prev)}
          aria-label="Open Safety Notifications"
          className={`relative min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border transition-all active:scale-95 shadow-xs ${
            notificationsOpen
              ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
          }`}
          title="Safety Notifications & Broadcasts"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-600 ring-2 ring-white dark:ring-slate-900" />
            </span>
          )}
        </button>

        {/* Citizen Profile Icon */}
        <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-700 text-xs font-bold text-white shadow-xs">
            🛡️
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
              Citizen Portal
            </p>
            <p className="text-[10px] text-slate-400 font-medium">Nagpur Safe City</p>
          </div>
        </div>
      </div>

      {/* Notification Dropdown / Panel */}
      <NotificationDropdown
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onSelectZone={(zoneId) => {
          if (onSelectZone) onSelectZone(zoneId);
        }}
      />
    </header>
  );
}
