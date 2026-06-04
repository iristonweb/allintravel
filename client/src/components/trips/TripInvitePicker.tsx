import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import MentionAutocomplete, {
  getMentionQuery,
  type MentionAutocompleteHandle,
} from "@/components/chat/MentionAutocomplete";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { getUserDisplayLabel, getUserHandle, getUserInitial } from "@shared/user-display";
import type { User } from "@shared/schema";

type TripInvitePickerProps = {
  value: User[];
  onChange: (users: User[]) => void;
  max?: number;
  currentUserId?: string;
};

export default function TripInvitePicker({
  value,
  onChange,
  max = 20,
  currentUserId,
}: TripInvitePickerProps) {
  const [text, setText] = useState("");
  const [cursor, setCursor] = useState(0);
  const [mentionIndex, setMentionIndex] = useState(0);
  const mentionRef = useRef<MentionAutocompleteHandle>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: friends = [] } = useQuery<User[]>({
    queryKey: ["/api/friends"],
    staleTime: 60_000,
  });

  const mentionQuery = useMemo(() => getMentionQuery(text, cursor), [text, cursor]);
  const selectedIds = useMemo(() => new Set(value.map((u) => u.id)), [value]);

  const suggestUsers = useMemo(
    () => friends.filter((f) => !selectedIds.has(f.id) && f.id !== currentUserId),
    [friends, selectedIds, currentUserId],
  );

  const addUser = (user: User) => {
    if (!user.id || user.id === currentUserId || selectedIds.has(user.id)) return;
    if (value.length >= max) return;
    onChange([...value, user]);
    setText("");
    setMentionIndex(0);
  };

  const pickByUsername = async (username: string) => {
    const fromFriends = friends.find((f) => f.username === username);
    if (fromFriends) {
      addUser(fromFriends);
      return;
    }
    const res = await fetch(`/api/search/users?q=${encodeURIComponent(username)}&exact=1&limit=1`, {
      credentials: "include",
    });
    if (!res.ok) return;
    const list = (await res.json()) as User[];
    const u = list.find((x) => x.username === username);
    if (u) addUser(u);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (mentionQuery !== null) {
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
        const uname = mentionRef.current?.pickActive();
        if (uname) {
          e.preventDefault();
          void pickByUsername(uname);
          return;
        }
      }
    }
    if (e.key === "Backspace" && text === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="space-y-2">
      <Label>Участники группы</Label>
      <p className="text-xs text-muted-foreground">
        Введите @ник — друзья попадут в поездку и в приватный чат группы сразу после создания.
      </p>
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
                aria-label="Убрать"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="relative">
        <Input
          ref={inputRef}
          className="ait-glass rounded-xl"
          placeholder="@username друга"
          value={text}
          disabled={value.length >= max}
          onChange={(e) => {
            setText(e.target.value);
            setCursor(e.target.selectionStart ?? e.target.value.length);
            setMentionIndex(0);
          }}
          onSelect={(e) => setCursor(e.currentTarget.selectionStart ?? text.length)}
          onKeyDown={onKeyDown}
        />
        {mentionQuery !== null && value.length < max && (
          <MentionAutocomplete
            ref={mentionRef}
            query={mentionQuery}
            suggestUsers={suggestUsers}
            activeIndex={mentionIndex}
            onActiveIndexChange={setMentionIndex}
            onSelect={(username) => void pickByUsername(username)}
          />
        )}
      </div>
    </div>
  );
}
