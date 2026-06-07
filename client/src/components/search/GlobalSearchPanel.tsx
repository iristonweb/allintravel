import { motion } from "framer-motion";
import { Calendar, Compass, Hash, MapPin, Search, Users } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import DestinationSearch from "@/components/search/DestinationSearch";
import { useChatGroupSearchDialog } from "@/components/chat/ChatGroupSearchContext";
import { buildDestinationHref } from "@/lib/destination-search";
import { HERO_SEARCH_TARGETS, HERO_TRAVELER_OPTIONS } from "@/lib/filter-config";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export default function GlobalSearchPanel() {
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { open: openGroupSearch } = useChatGroupSearchDialog();
  const [where, setWhere] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [travelers, setTravelers] = useState("");
  const [target, setTarget] = useState("map");

  const isGroupsTarget = target === "groups";

  const search = () => {
    const q = where.trim();
    const extra = new URLSearchParams();
    if (dateFrom) extra.set("from", dateFrom);
    if (dateTo) extra.set("to", dateTo);
    if (travelers) extra.set("travelers", travelers);

    if (target === "groups") {
      if (isAuthenticated) {
        openGroupSearch(q);
        return;
      }
      navigate(q ? `/chat?q=${encodeURIComponent(q)}` : "/chat");
      return;
    }

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
    "flex items-start gap-3 px-4 py-3 min-w-0 rounded-xl lg:rounded-none border-b border-white/10 lg:border-0 last:border-b-0 lg:px-5";

  return (
    <div className="ait-glass-strong rounded-2xl md:rounded-[28px] p-3 md:p-4 ait-gradient-border shadow-2xl">
      <div
        className={cn(
          "flex flex-col lg:grid lg:gap-1 gap-0",
          isGroupsTarget
            ? "lg:grid-cols-[minmax(0,1.28fr)_minmax(0,1.12fr)_minmax(11.5rem,0.72fr)]"
            : "lg:grid-cols-[minmax(0,1.28fr)_minmax(0,1.12fr)_minmax(0,1fr)_minmax(0,1.12fr)_minmax(11.5rem,0.72fr)]",
        )}
      >
        <div className={fieldClass}>
          {isGroupsTarget ? (
            <Hash className="h-5 w-5 text-ait-purple shrink-0 mt-1.5" />
          ) : (
            <MapPin className="h-5 w-5 text-ait-purple shrink-0 mt-1.5" />
          )}
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-slate-400 block mb-1">
              {isGroupsTarget ? t("chat.hero.groupLabel") : "Куда"}
            </span>
            {isGroupsTarget ? (
              <input
                type="text"
                value={where}
                onChange={(e) => setWhere(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
                placeholder={t("chat.hero.groupPlaceholder")}
                className="w-full bg-transparent border-0 outline-none text-sm text-foreground h-9"
              />
            ) : (
              <DestinationSearch
                value={where}
                onChange={setWhere}
                onNavigate={navigate}
                showSubmit={false}
                showPopular={false}
                showLeadingIcon={false}
                placeholder="Страна, город или место"
                inputClassName="border-0 bg-transparent h-9 px-0 focus-visible:ring-0 text-sm w-full"
                hrefMode="map"
              />
            )}
          </div>
        </div>

        {!isGroupsTarget && (
          <>
            <div
              className={cn(
                fieldClass,
                "flex-col sm:flex-row sm:items-center gap-2 lg:flex-col lg:items-stretch",
              )}
            >
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
                  className="w-full bg-transparent border-0 outline-none text-sm text-foreground cursor-pointer pr-1"
                >
                  {HERO_TRAVELER_OPTIONS.map((o) => (
                    <option key={o.value || "any"} value={o.value} className="bg-[#0f1428]">
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          </>
        )}

        <label className={fieldClass}>
          <Compass className="h-5 w-5 text-ait-gold shrink-0 mt-1.5" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-slate-400 block mb-1">Искать в</span>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-transparent border-0 outline-none text-sm text-foreground cursor-pointer pr-1"
            >
              {HERO_SEARCH_TARGETS.map((o) => (
                <option key={o.value} value={o.value} className="bg-[#0f1428]">
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </label>

        <div className="flex items-stretch p-2 lg:p-3 lg:pl-2 lg:pr-3">
          <motion.button
            type="button"
            onClick={search}
            className="w-full min-h-[52px] lg:min-h-[56px] ait-btn-glow rounded-2xl px-8 lg:px-10 flex items-center justify-center gap-2.5 font-semibold text-white whitespace-nowrap text-[15px] lg:text-base tracking-wide"
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
