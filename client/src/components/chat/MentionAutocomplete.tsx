import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useImperativeHandle,
  forwardRef,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
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

/** Strip leading @ for smart search — works with or without mention prefix. */
export function getSmartUserQuery(text: string): string {
  return text.replace(/^@+/, "").trim();
}

type MentionAutocompleteProps = {
  query: string;
  suggestUsers?: User[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  onSelect?: (username: string) => void;
  onSelectUser?: (user: User) => void;
  className?: string;
  dropdownPortal?: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
  position?: "above" | "below";
  searchingLabel?: string;
};

export type MentionAutocompleteHandle = {
  pickActive: () => string | null;
  pickActiveUser: () => User | null;
};

const MentionAutocomplete = forwardRef<MentionAutocompleteHandle, MentionAutocompleteProps>(
  function MentionAutocomplete(
    {
      query,
      suggestUsers = [],
      activeIndex,
      onActiveIndexChange,
      onSelect,
      onSelectUser,
      className,
      dropdownPortal = false,
      anchorRef,
      position = "below",
      searchingLabel = "Поиск…",
    },
    ref,
  ) {
    const localAnchorRef = useRef<HTMLDivElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<{ top: number; left: number; width: number } | null>(null);

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
      pickActiveUser: () => results[activeIndex] ?? results[0] ?? null,
    }));

    useLayoutEffect(() => {
      if (!dropdownPortal || !anchorRef?.current) {
        setDropdownStyle(null);
        return;
      }
      const update = () => {
        const el = anchorRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        setDropdownStyle({
          top: position === "below" ? rect.bottom + 6 : rect.top - 6,
          left: rect.left,
          width: rect.width,
        });
      };
      update();
      window.addEventListener("resize", update);
      window.addEventListener("scroll", update, true);
      return () => {
        window.removeEventListener("resize", update);
        window.removeEventListener("scroll", update, true);
      };
    }, [dropdownPortal, anchorRef, position, query, results.length, isFetching]);

    const handlePick = (u: User) => {
      if (onSelectUser) {
        onSelectUser(u);
      } else if (u.username && onSelect) {
        onSelect(u.username);
      }
    };

    if (results.length === 0 && !isFetching) return null;

    const listContent = (
      <>
        {isFetching && results.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">{searchingLabel}</p>
        ) : (
          <ul className="max-h-48 overflow-y-auto ait-scrollbar py-1">
            {results.map((u, i) => (
              <li key={u.id}>
                <button
                  type="button"
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                    i === activeIndex
                      ? "bg-white/10 text-foreground"
                      : "text-slate-300 hover:bg-white/8",
                  )}
                  onMouseEnter={() => onActiveIndexChange(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handlePick(u);
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
      </>
    );

    const dropdown = (
      <div
        ref={localAnchorRef}
        className={cn(
          "z-[120] ait-smart-search-dropdown",
          dropdownPortal ? "fixed" : "absolute left-0 right-0 z-50",
          !dropdownPortal && position === "below" && "top-[calc(100%+6px)]",
          !dropdownPortal && position === "above" && "bottom-[calc(100%+6px)]",
          className,
        )}
        style={
          dropdownPortal && dropdownStyle
            ? {
                top: position === "below" ? dropdownStyle.top : undefined,
                bottom:
                  position === "above"
                    ? `calc(100vh - ${dropdownStyle.top}px + 6px)`
                    : undefined,
                left: dropdownStyle.left,
                width: dropdownStyle.width,
                transform: position === "above" ? "translateY(-100%)" : undefined,
              }
            : undefined
        }
      >
        {listContent}
      </div>
    );

    if (dropdownPortal && dropdownStyle) {
      return createPortal(dropdown, document.body);
    }

    if (!dropdownPortal) {
      return dropdown;
    }

    return null;
  },
);

export default MentionAutocomplete;
