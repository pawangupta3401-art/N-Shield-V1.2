"use client";

import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Newspaper,
  Radio,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import type { RealNewsArticle } from "@/lib/newsTypes";

type LiveIncidentFeedProps = {
  articles: RealNewsArticle[];
  loading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onSelectArticleLocation?: (article: RealNewsArticle) => void;
  onSelectZone?: (zoneId: string) => void;
};

export function LiveIncidentFeed({
  articles = [],
  loading = false,
  isRefreshing = false,
  onRefresh,
  onSelectArticleLocation,
  onSelectZone,
}: LiveIncidentFeedProps) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-900">
      {/* Feed Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600">
            <Radio className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Live Incident & News Feed
            </h2>
            <p className="text-[11px] font-medium text-slate-400">
              Real-time verified Nagpur safety reports
            </p>
          </div>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition active:scale-95"
            title="Reload latest news"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-indigo-600 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Reload</span>
          </button>
        )}
      </div>

      {/* Feed Content */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {loading && articles.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3.5 space-y-2.5"
              >
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-4 w-4/5 bg-slate-300 dark:bg-slate-600 rounded" />
                <div className="h-3 w-3/5 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-2">
            <p>No recent reports available right now.</p>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-xs"
              >
                Reload Live Feed
              </button>
            )}
          </div>
        ) : (
          articles.map((item) => (
            <article
              key={item.id}
              className="group relative rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3.5 transition-all duration-200 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-white dark:hover:bg-slate-800"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  <span>{item.category}</span>
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                  <Clock className="h-3 w-3" />
                  {item.relativeTime}
                </span>
              </div>

              <h3 className="mt-2 text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                {item.title}
              </h3>

              {item.description && (
                <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              )}

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60 pt-2.5 text-[11px]">
                <div className="flex items-center gap-1 font-semibold text-slate-500">
                  <MapPin className="h-3 w-3 text-indigo-500" />
                  <span>📍 {item.location?.name || "Nagpur"}</span>
                </div>

                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <span>Source: {item.sourceName}</span>
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
