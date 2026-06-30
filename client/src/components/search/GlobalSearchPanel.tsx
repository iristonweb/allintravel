import { Button } from "@/components/ui/button";
import { Calendar, Compass, Hash, MapPin, Search, Users } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import SmartSearchField from "@/components/search/SmartSearchField";
import DestinationSearch from "@/components/search/DestinationSearch";
import { useChatGroupSearchDialog } from "@/components/chat/ChatGroupSearchContext";
import { buildDestinationHref } from "@/lib/destination-search";
import { useFilterLabels } from "@/hooks/useFilterLabels";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export default function GlobalSearchPanel() {
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const filters = useFilterLabels();
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
    "flex items-center gap-3 px-3 py-2.5 min-w-0 rounded-xl bg-white/[0.03] border border-white/[0.06] lg:rounded-none lg:border-0 lg:border-r lg:border-white/[0.06] lg:last:border-r-0 lg:bg-transparent lg:px-4 lg:py-3";

  return (
    <div className="ait-glass-strong rounded-2xl md:rounded-[28px] p-2.5 md:p-3 ait-gradient-border shadow-xl backdrop-blur-xl">
      <div
        className={cn(
          "flex flex-col gap-2 lg:grid lg:gap-0 lg:items-stretch",
          isGroupsTarget
            ? "lg:grid-cols-[minmax(0,1.28fr)_minmax(0,1.12fr)_minmax(11.5rem,0.72fr)]"
            : "lg:grid-cols-[minmax(0,1.28fr)_minmax(0,1.12fr)_minmax(0,1fr)_minmax(0,1.12fr)_minmax(11.5rem,0.72fr)]",
        )}
      >
        <div className={fieldClass}>
          {isGroupsTarget ? (
            <Hash className="h-5 w-5 text-ait-purple shrink-0" />
          ) : (
            <MapPin className="h-5 w-5 text-ait-purple shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-slate-400 block mb-0.5">
              {isGroupsTarget ? t("chat.hero.groupLabel") : t("searchPanel.where")}
            </span>
            {isGroupsTarget ? (
              <SmartSearchField
                embedded
                showLeadingIcon={false}
                value={where}
                onChange={setWhere}
                onKeyDown={(e) => e.key === "Enter" && search()}
                placeholder={t("chat.hero.groupPlaceholder")}
                inputClassName="text-sm w-full"
              />
            ) : (
              <DestinationSearch
                value={where}
                onChange={setWhere}
                onNavigate={navigate}
                embedded
                showLeadingIcon={false}
                showSubmit={false}
                showPopular={false}
                placeholder={t("searchPanel.wherePlaceholder")}
                inputClassName="border-0 h-8 px-0 text-sm w-full"
                hrefMode="map"
              />
            )}
          </div>
        </div>

        {!isGroupsTarget && (
          <>
            <div className={cn(fieldClass, "items-start lg:items-center")}>
              <Calendar className="h-5 w-5 text-ait-orange shrink-0 mt-0.5 lg:mt-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-slate-400 block mb-0.5 lg:mb-1">
                  {t("searchPanel.dates")}
                </span>
                <div className="flex gap-2 min-w-0">
                  <label className="flex-1 min-w-0">
                    <span className="text-[10px] text-slate-500 lg:block mb-0.5 sr-only lg:not-sr-only">
                      {t("searchPanel.dateFrom")}
                    </span>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full bg-transparent border-0 outline-none text-sm text-foreground [color-scheme:dark]"
                    />
                  </label>
                  <label className="flex-1 min-w-0">
                    <span className="text-[10px] text-slate-500 lg:block mb-0.5 sr-only lg:not-sr-only">
                      {t("searchPanel.dateTo")}
                    </span>
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
            </div>

            <label className={fieldClass}>
              <Users className="h-5 w-5 text-ait-cyan shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-slate-400 block mb-0.5">
                  {t("searchPanel.travelers")}
                </span>
                <select
                  value={travelers}
                  onChange={(e) => setTravelers(e.target.value)}
                  className="w-full bg-transparent border-0 outline-none text-sm text-foreground cursor-pointer pr-1 h-8"
                >
                  {filters.heroTravelers.map((o) => (
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
          <Compass className="h-5 w-5 text-ait-gold shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-slate-400 block mb-0.5">
              {t("searchPanel.searchIn")}
            </span>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-transparent border-0 outline-none text-sm text-foreground cursor-pointer pr-1 h-8"
            >
              {filters.heroSearchTargets.map((o) => (
                <option key={o.value} value={o.value} className="bg-[#0f1428]">
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </label>

        <div className={cn(fieldClass, "lg:border-r-0 lg:px-3 lg:py-2 lg:flex lg:items-center")}>
          <Button
            type="button"
            variant="premium"
            size="cta"
            className="w-full lg:h-11"
            onClick={search}
          >
            <Search className="h-5 w-5 shrink-0" />
            {t("searchPanel.find")}
          </Button>
        </div>
      </div>
    </div>
  );
}
