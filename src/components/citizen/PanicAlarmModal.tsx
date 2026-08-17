"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  AlertOctagon,
  Volume2,
  VolumeX,
  Phone,
  Radio,
  ShieldAlert,
  Send,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import { citizenAudio } from "@/lib/audioService";

interface PanicAlarmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PanicAlarmModal({ isOpen, onClose }: PanicAlarmModalProps) {
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Auto-trigger audible panic alarm to deter threat
      citizenAudio.startPanicAlarm();
      setIsAlarmActive(true);
    } else {
      citizenAudio.stopAlarm();
      setIsAlarmActive(false);
    }
    return () => {
      citizenAudio.stopAlarm();
    };
  }, [isOpen]);

  const toggleAlarmSound = () => {
    if (isAlarmActive) {
      citizenAudio.stopAlarm();
      setIsAlarmActive(false);
    } else {
      citizenAudio.startPanicAlarm();
      setIsAlarmActive(true);
    }
  };

  const handleSendLocation = () => {
    setSmsSent(true);
    citizenAudio.playUiTap();
    setTimeout(() => setSmsSent(false), 4000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/60 rounded-3xl shadow-[0_24px_80px_rgba(244,63,94,0.25)] overflow-hidden flex flex-col"
        >
          {/* Pulsing Emergency Top Banner */}
          <div className="p-6 text-center bg-gradient-to-b from-rose-50 to-white dark:from-rose-950/40 dark:to-zinc-900 border-b border-rose-100 dark:border-rose-950">
            <div className="relative inline-flex items-center justify-center mb-3">
              <span className="absolute w-20 h-20 rounded-full bg-rose-500/20 animate-ping" />
              <button
                onClick={toggleAlarmSound}
                className="relative flex items-center justify-center w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/30 transition-transform active:scale-95"
              >
                <AlertOctagon className="w-8 h-8" />
              </button>
            </div>

            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
              {isAlarmActive ? "LOUD SOS ALARM ACTIVE" : "SOS EMERGENCY MODE"}
            </h2>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-1">
              {isAlarmActive
                ? "Siren sounding to deter threats & attract nearby citizen help"
                : "Audio siren paused. Tap the red circle above to resume siren."}
            </p>
          </div>

          {/* Quick Actions Content */}
          <div className="p-6 space-y-4">
            {/* Quick Call 112 & 1091 Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href="tel:112"
                className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md shadow-rose-600/20 transition-all text-center"
              >
                <Phone className="w-4 h-4" />
                <span>Call 112 Emergency</span>
              </a>

              <a
                href="tel:1091"
                className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-md shadow-purple-600/20 transition-all text-center"
              >
                <Phone className="w-4 h-4" />
                <span>Call 1091 Women Line</span>
              </a>
            </div>

            {/* Broadcast GPS Link Button */}
            <button
              onClick={handleSendLocation}
              className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold text-xs sm:text-sm border border-zinc-200 dark:border-zinc-700 transition-colors"
            >
              <Send className="w-4 h-4 text-emerald-500" />
              <span>Broadcast Live GPS to 3 Emergency Guardians</span>
            </button>

            {smsSent && (
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Live coordinates sent to Mother, Sister & Amit via SMS.</span>
              </div>
            )}

            {/* Nearby Verified Safety Centers in Nagpur */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700 text-xs space-y-1.5">
              <div className="font-semibold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                <span>Nearest 24/7 Citizen Safe Haven:</span>
              </div>
              <p className="text-zinc-500 dark:text-zinc-400">
                Sitabuldi Interchange Metro Station (240m away, active security post)
              </p>
            </div>
          </div>

          {/* Close & Stop Alarm */}
          <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900">
            <button
              onClick={() => {
                citizenAudio.stopAlarm();
                onClose();
              }}
              className="w-full py-3 rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs sm:text-sm transition-colors"
            >
              I am Safe Now • Stop Alarm & Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
