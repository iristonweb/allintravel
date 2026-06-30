import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import SmartSearchField from "@/components/search/SmartSearchField";
import MentionAutocomplete, {
  getSmartUserQuery,
  type MentionAutocompleteHandle,
} from "@/components/chat/MentionAutocomplete";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { getUserDisplayLabel, getUserHandle, getUserInitial } from "@shared/user-display";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

export type TripInvitePickerHandle = {
  /** Resolve pending input text into inviteUsers; returns updated list or null if unresolved. */
  flushPending: () => Promise<User[] | null>;
};

type TripInvitePickerProps = {
  value: User[];
  onChange: (users: User[]) => void;
  onDraftChange?: (text: string) => void;
  max?: number;
  currentUserId?: string;
};

export default function TripInvitePicker({
  value,
  onChange,
  onDraftChange,
  max = 20,
  currentUserId,
}: TripInvitePickerProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const mentionRef = useRef<MentionAutocompleteHandle>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  const { data: friends = [] } = useQuery<User[]>({
    queryKey: ["/api/friends"],
    staleTime: 60_000,
  });

  const searchQuery = useMemo(() => getSmartUserQuery(text), [text]);
  const selectedIds = useMemo(() => new Set(value.map((u) => u.id)), [value]);

  const suggestUsers = useMemo(
    () => friends.filter((f) => !selectedIds.has(f.id) && f.id !== currentUserId),
    [friends, selectedIds, currentUserId],
  );

  const addUser = (user: User) => {
    if (!user.id || user.id === currentUserId || selectedIds.has(user.id)) return false;
    if (value.length >= max) {
      toast({
        title: t("tripsPage.create.inviteMaxTitle"),
        description: t("tripsPage.create.inviteMaxHint", { max }),
        variant: "destructive",
      });
      return false;
    }
    onChange([...value, user]);
    setText("");
    setMentionIndex(0);
    return true;
  };

  const resolveByUsername = async (username: string): Promise<User | null> => {
    const fromFriends = friends.find((f) => f.username === username);
    if (fromFriends) return fromFriends;
    const res = await fetch(`/api/search/users?q=${encodeURIComponent(username)}&exact=1&limit=1`, {
      credentials: "include",
    });
    if (!res.ok) return null;
    const list = (await res.json()) as User[];
    return list.find((x) => x.username === username) ?? null;
  };

  const pickActiveUser = async (): Promise<boolean> => {
    const active = mentionRef.current?.pickActiveUser();
    if (active) return addUser(active);
    if (searchQuery.length >= 1) {
      const u = await resolveByUsername(searchQuery);
      if (u) return addUser(u);
    }
    return false;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (searchQuery.length >= 1) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((i) => i + 1);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((i) => Math.max(0, i - 1));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        void pickActiveUser();
        return;
      }
    }
    if (e.key === "Enter") {
      e.preventDefault();
      return;
    }
    if (e.key === "Backspace" && text === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const dropdownOpen = searchQuery.length >= 1 && value.length < max;

  return (
    <div className="space-y-2" ref={anchorRef}>
      <Label>{t("tripsPage.create.inviteLabel")}</Label>
      <p className="text-xs text-muted-foreground">{t("tripsPage.create.inviteHint")}</p>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((u) => (
            <Badge key={u.id} variant="secondary" className="gap-1.5 py-1 pl-1 pr-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={resolveMediaUrl(u.profileImageUrl)} />
                <AvatarFallback className="text-[10px]">{getUserInitial(u)}</AvatarFallback>
              </Avatar>
              {getUserHandle(u) || getUserDisplayLabel(u)}
              <button
                type="button"
                className="rounded-full hover:bg-white/10 p-0.5"
                onClick={() => onChange(value.filter((x) => x.id !== u.id))}
                aria-label={t("tripsPage.create.inviteRemove")}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <SmartSearchField
        value={text}
        onChange={(v) => {
          setText(v);
          onDraftChange?.(v);
          setMentionIndex(0);
        }}
        placeholder={t("tripsPage.create.invitePlaceholder")}
        disabled={value.length >= max}
        onKeyDown={onKeyDown}
        size="md"
        dropdownOpen={false}
      />
      {dropdownOpen && (
        <MentionAutocomplete
          ref={mentionRef}
          query={searchQuery}
          suggestUsers={suggestUsers}
          activeIndex={mentionIndex}
          onActiveIndexChange={setMentionIndex}
          onSelectUser={addUser}
          dropdownPortal
          anchorRef={anchorRef}
          position="below"
          searchingLabel={t("tripsPage.create.inviteSearching")}
        />
      )}
    </div>
  );
}

/** Resolve pending invite text before form submit. */
export async function flushTripInvitePending(
  text: string,
  value: User[],
  friends: User[],
  currentUserId?: string,
  max = 20,
): Promise<{ users: User[]; unresolved: boolean }> {
  const q = getSmartUserQuery(text);
  if (!q) return { users: value, unresolved: false };
  const selectedIds = new Set(value.map((u) => u.id));
  const fromFriends = friends.find((f) => f.username === q);
  if (fromFriends && fromFriends.id && !selectedIds.has(fromFriends.id) && fromFriends.id !== currentUserId) {
    if (value.length >= max) return { users: value, unresolved: true };
    return { users: [...value, fromFriends], unresolved: false };
  }
  const res = await fetch(`/api/search/users?q=${encodeURIComponent(q)}&exact=1&limit=1`, {
    credentials: "include",
  });
  if (!res.ok) return { users: value, unresolved: true };
  const list = (await res.json()) as User[];
  const u = list.find((x) => x.username === q);
  if (!u?.id || selectedIds.has(u.id) || u.id === currentUserId) {
    return { users: value, unresolved: true };
  }
  if (value.length >= max) return { users: value, unresolved: true };
  return { users: [...value, u], unresolved: false };
}
