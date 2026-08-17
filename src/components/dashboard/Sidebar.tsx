"use client";

import { ChevronLeft, ChevronRight, Shield } from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  activeId: string;
  onNavigate: (id: string) => void;
};

export function Sidebar({
  collapsed,
  onToggle,
  activeId,
  onNavigate,
}: SidebarProps) {
  return (
    <aside
      className={`relative flex h-full shrink-0 flex-col border-r border-slate-200/80 bg-white shadow-[1px_0_4px_rgba(0,0,0,0.01)] transition-[width] duration-300 ease-out ${
        collapsed ? "w-[72px]" : "w-64"
      }`}
    >
      {/* Brand Badge */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
          <Shield className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-xs font-bold uppercase tracking-wider text-indigo-600">
              NAGPUR HQ
            </p>
            <p className="truncate text-[11px] font-medium text-slate-400">
              Command Center
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
                isActive
                  ? "bg-indigo-50/90 text-indigo-700 font-semibold shadow-xs"
                  : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-indigo-600" />
              )}
              <Icon
                className={`h-5 w-5 shrink-0 transition-colors ${
                  isActive
                    ? "text-indigo-600"
                    : "text-slate-400 group-hover:text-slate-600"
                }`}
              />
              {!collapsed && (
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium">
                    {item.label}
                  </span>
                  <span className="block truncate text-[11px] text-slate-400 font-normal">
                    {item.description}
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-slate-100 p-3">
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse Menu</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
