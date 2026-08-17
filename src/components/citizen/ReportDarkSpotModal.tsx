"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Lightbulb,
  MapPin,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Send,
  Eye,
} from "lucide-react";
import { citizenAudio } from "@/lib/audioService";

interface ReportDarkSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReportDarkSpotModal({
  isOpen,
  onClose,
}: ReportDarkSpotModalProps) {
  const [category, setCategory] = useState<"broken-light" | "deserted-alley" | "safe-haven">("broken-light");
  const [locationName, setLocationName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    citizenAudio.playSafeChime();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-white/80 dark:border-zinc-800 rounded-3xl shadow-[0_24px_70px_rgba(0,0,0,0.18)] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                <Lightbulb className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  Citizen Safety Report
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Help fellow Nagpur citizens navigate safely
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                citizenAudio.playUiTap();
                onClose();
              }}
              className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          {isSubmitted ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Report Added to Nagpur Map
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Thank you! Your report has been pinned for fellow citizens and flagged for municipal street lighting maintenance.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                  What are you reporting?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "broken-light", label: "Dark / Broken Lamp", icon: Lightbulb },
                    { id: "deserted-alley", label: "Deserted Alley", icon: Eye },
                    { id: "safe-haven", label: "New Safe Spot", icon: CheckCircle2 },
                  ].map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setCategory(cat.id as any)}
                      className={`p-3 rounded-2xl text-left border flex flex-col gap-1.5 transition-all ${
                        category === cat.id
                          ? "bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-900 dark:text-amber-200"
                          : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                      }`}
                    >
                      <cat.icon className="w-4 h-4" />
                      <span className="text-xs font-medium">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Location / Landmark in Nagpur
                </label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                  <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                  <input
                    type="text"
                    required
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g. Munje Square underpass, Sitabuldi"
                    className="w-full text-xs sm:text-sm bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Citizen Notes / Helpful Details
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 3 street lamps are unlit on the left side of the road after 9 PM. Better to take the right avenue."
                  className="w-full p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-full text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Pin</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
