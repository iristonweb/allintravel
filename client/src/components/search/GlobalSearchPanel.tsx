import { motion } from "framer-motion";
import { Calendar, Compass, MapPin, Search, Users } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import DestinationSearch from "@/components/search/DestinationSearch";
import { buildDestinationHref } from "@/lib/destination-search";
import {
  HERO_SEARCH_TARGETS,
  HERO_TRAVELER_OPTIONS,
} from "@/lib/filter-config";
import { cn } from "@/lib/utils";

export default function GlobalSearchPanel() {
  const [, navigate] = useLocation();
  const [where, setWhere] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [travelers, setTravelers] = useState("");
  const [target, setTarget] = useState("map");

  const search = () => {
    const q = where.trim();
    const extra = new URLSearchParams();
    if (dateFrom) extra.set("from", dateFrom);
    if (dateTo) extra.set("to", dateTo);
    if (travelers) extra.set("travelers", travelers);

    if (target === "trips") {
      if (q) extra.set("search", q);
      const qs = extra.toString();
      navigate(qs ? `/trips?${qs}` : "/trips");
      return;
    }

    if (target === "events") {
      if (q) extra.set("q", q);
      const qs = extra.toString();
      navigate(qs ? `/events?${qs}` : "/events");
      return;
    }

    if (target === "places") {
      if (q) extra.set("search", q);
      const qs = extra.toString();
      navigate(qs ? `/places?${qs}` : "/places");
      return;
    }

    if (!q) {
      navigate("/map");
      return;
    }
    const href = buildDestinationHref({ type: "text", query: q }, undefined, "map");
    const sep = href.includes("?") ? "&" : "?";
    const qs = extra.toString();
    navigate(qs ? `${href}${sep}${qs}` : href);
  };

  const fieldClass =
    "flex items-start gap-3 px-4 py-3 min-w-0 border-b border-white/10 lg:border-b-0 lg:border-r lg:last:border-r-0";

  return (
    <div className="ait-glass-strong rounded-2xl md:rounded-[28px] p-3 md:p-4 ait-gradient-border shadow-2xl">
      <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1.1fr)_minmax(0,0.85fr)_minmax(0,1fr)_auto] lg:divide-x divide-white/10 gap-0">
        <div className={fieldClass}>
          <MapPin className="h-5 w-5 text-ait-purple shrink-0 mt-1.5" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-slate-400 block mb-1">Куда</span>
            <DestinationSearch
              value={where}
              onChange={setWhere}
              onNavigate={navigate}
              showSubmit={false}
              showPopular={false}
              placeholder="Страна, город или место"
              inputClassName="border-0 bg-transparent h-9 px-0 focus-visible:ring-0 text-sm"
              hrefMode="map"
            />
          </div>
        </div>

        <div className={cn(fieldClass, "flex-col sm:flex-row sm:items-center gap-2 lg:flex-col lg:items-stretch")}>
          <div className="flex items-center gap-2 shrink-0">
            <Calendar className="h-5 w-5 text-ait-orange shrink-0" />
            <span className="text-xs font-medium text-slate-400 lg:hidden">Даты</span>
          </div>
          <div className="flex flex-1 gap-2 min-w-0">
            <label className="flex-1 min-w-0">
              <span className="text-xs text-slate-500 hidden lg:block mb-0.5">С</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-transparent border-0 outline-none text-sm text-foreground [color-scheme:dark]"
              />
            </label>
            <label className="flex-1 min-w-0">
              <span className="text-xs text-slate-500 hidden lg:block mb-0.5">По</span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-transparent border-0 outline-none text-sm text-foreground [color-scheme:dark]"
              />
            </label>
          </div>
        </div>

        <label className={fieldClass}>
          <Users className="h-5 w-5 text-ait-cyan shrink-0 mt-1.5" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-slate-400 block mb-1">Участники</span>
            <select
              value={travelers}
              onChange={(e) => setTravelers(e.target.value)}
              className="w-full bg-transparent border-0 outline-none text-sm text-foreground cursor-pointer"
            >
              {HERO_TRAVELER_OPTIONS.map((o) => (
                <option key={o.value || "any"} value={o.value} className="bg-[#0f1428]">
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </label>

        <label className={fieldClass}>
          <Compass className="h-5 w-5 text-ait-gold shrink-0 mt-1.5" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-slate-400 block mb-1">Искать в</span>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-transparent border-0 outline-none text-sm text-foreground cursor-pointer"
            >
              {HERO_SEARCH_TARGETS.map((o) => (
                <option key={o.value} value={o.value} className="bg-[#0f1428]">
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </label>

        <div className="flex items-stretch p-2 lg:p-3 lg:pl-4">
          <motion.button
            type="button"
            onClick={search}
            className="w-full lg:w-auto min-h-[48px] ait-btn-glow rounded-2xl px-6 lg:px-8 flex items-center justify-center gap-2 font-semibold text-white whitespace-nowrap"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Search className="h-5 w-5 shrink-0" />
            <span>Найти</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
