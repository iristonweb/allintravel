import { motion } from "framer-motion";
import { Calendar, MapPin, Search, Sparkles, Users } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import DestinationSearch from "@/components/search/DestinationSearch";
import { buildDestinationHref } from "@/lib/destination-search";

export default function GlobalSearchPanel() {
  const [, navigate] = useLocation();
  const [where, setWhere] = useState("");
  const [when, setWhen] = useState("");
  const [who, setWho] = useState("");
  const [interests, setInterests] = useState("");

  const search = () => {
    const q = where.trim();
    if (!q) {
      navigate("/map");
      return;
    }
    const tripParams = new URLSearchParams();
    if (when.trim()) tripParams.set("when", when.trim());
    if (who.trim()) tripParams.set("who", who.trim());
    if (interests.trim()) tripParams.set("interests", interests.trim());
    const href = buildDestinationHref({ type: "text", query: q });
    const sep = href.includes("?") ? "&" : "?";
    const extra = tripParams.toString();
    navigate(extra ? `${href}${sep}${extra}` : href);
  };

  return (
    <div className="ait-glass-strong rounded-[28px] p-2 md:p-3 ait-gradient-border shadow-2xl">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 md:gap-0 md:divide-x divide-white/10">
        <div className="flex items-start gap-3 px-4 py-3 md:py-4 min-w-0">
          <MapPin className="h-5 w-5 text-ait-purple shrink-0 mt-2" />
          <div className="flex-1 min-w-0">
            <span className="text-xs text-muted-foreground block mb-1">Куда?</span>
            <DestinationSearch
              value={where}
              onChange={setWhere}
              onNavigate={navigate}
              showSubmit={false}
              showPopular={false}
              placeholder="Страна, город, место"
              inputClassName="border-0 bg-transparent h-9 px-0 focus-visible:ring-0"
            />
          </div>
        </div>
        <label className="flex items-center gap-3 px-4 py-3 md:py-4">
          <Calendar className="h-5 w-5 text-ait-orange shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs text-muted-foreground block">Когда?</span>
            <input
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              placeholder="Даты поездки"
              className="w-full bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </label>
        <label className="flex items-center gap-3 px-4 py-3 md:py-4">
          <Users className="h-5 w-5 text-ait-cyan shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs text-muted-foreground block">Кто едет?</span>
            <input
              value={who}
              onChange={(e) => setWho(e.target.value)}
              placeholder="Путешественники"
              className="w-full bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </label>
        <label className="flex items-center gap-3 px-4 py-3 md:py-4">
          <Sparkles className="h-5 w-5 text-ait-gold shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs text-muted-foreground block">Интересы</span>
            <input
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="Природа, гастро, adventure"
              className="w-full bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </label>
        <div className="p-2 md:pl-3 flex items-center">
          <motion.button
            type="button"
            onClick={search}
            className="w-full md:w-auto ait-btn-glow rounded-2xl px-8 py-4 flex items-center justify-center gap-2 font-semibold text-white"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Search className="h-5 w-5" />
            <span className="hidden sm:inline">Поиск</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
