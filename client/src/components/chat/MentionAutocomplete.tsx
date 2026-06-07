import { useEffect, useMemo, useImperativeHandle, forwardRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { getUserDisplayLabel, getUserHandle, getUserInitial } from "@shared/user-display";
import type { User } from "@shared/schema";

const MENTION_RE = /@([a-zA-Z0-9_]{0,30})$/;

export function getMentionQuery(text: string, cursorPos: number): string | null {
  const before = text.slice(0, cursorPos);
  const match = before.match(MENTION_RE);
  return match ? match[1] : null;
}

type MentionAutocompleteProps = {
  query: string;
  suggestUsers?: User[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onSelect: (username: string) => void;
  className?: string;
};

export type MentionAutocompleteHandle = {
  pickActive: () => string | null;
};

const MentionAutocomplete = forwardRef<MentionAutocompleteHandle, MentionAutocompleteProps>(
  function MentionAutocomplete(
    { query, suggestUsers = [], activeIndex, onActiveIndexChange, onSelect, className },
    ref,
  ) {
    const { data: searchResults = [], isFetching } = useQuery<User[]>({
      queryKey: ["/api/search/users", { q: query, limit: 8 }],
      enabled: query.length >= 1,
      staleTime: 30_000,
    });

    const results = useMemo(() => {
      const q = query.toLowerCase();
      const fromSuggest = suggestUsers.filter(
        (u) =>
          u.username &&
          (q.length === 0 ||
            u.username.toLowerCase().includes(q) ||
            getUserDisplayLabel(u).toLowerCase().includes(q)),
      );
      const seen = new Set(fromSuggest.map((u) => u.id));
      const merged = [...fromSuggest];
      for (const u of searchResults) {
        if (u.username && !seen.has(u.id)) {
          merged.push(u);
          seen.add(u.id);
        }
      }
      return merged.slice(0, 8);
    }, [query, suggestUsers, searchResults]);

    useEffect(() => {
      if (activeIndex >= results.length) {
        onActiveIndexChange(Math.max(0, results.length - 1));
      }
    }, [results.length, activeIndex, onActiveIndexChange]);

    useImperativeHandle(ref, () => ({
      pickActive: () => results[activeIndex]?.username ?? results[0]?.username ?? null,
    }));

    if (results.length === 0 && !isFetching) return null;

    return (
      <div
        className={cn(
          "absolute bottom-full left-0 right-0 mb-1 z-50 rounded-xl ait-glass-ios border border-white/15 shadow-lg overflow-hidden",
          className,
        )}
      >
        {isFetching && results.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">Поиск…</p>
        ) : (
          <ul className="max-h-48 overflow-y-auto py-1">
            {results.map((u, i) => (
              <li key={u.id}>
                <button
                  type="button"
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                    i === activeIndex
                      ? "bg-white/10 text-white"
                      : "text-slate-300 hover:bg-white/8",
                  )}
                  onMouseEnter={() => onActiveIndexChange(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (u.username) onSelect(u.username);
                  }}
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={resolveMediaUrl(u.profileImageUrl)} />
                    <AvatarFallback className="text-xs">{getUserInitial(u)}</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{getUserDisplayLabel(u)}</span>
                  {u.username && (
                    <span className="text-muted-foreground text-xs shrink-0">
                      {getUserHandle(u)}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
);

export default MentionAutocomplete;
