import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import RoomAvatar from "@/components/chat/RoomAvatar";
import { cn } from "@/lib/utils";
import type { ChatRoom } from "@shared/schema";

export type DiscoverRoom = ChatRoom & { memberCount: number; matchScore?: number };

type GroupSearchPreviewProps = {
  rooms: DiscoverRoom[];
  loading?: boolean;
  empty?: boolean;
  onJoin: (room: DiscoverRoom) => void;
  joinPending?: boolean;
  className?: string;
  memberCountKey?: string;
  joinLabelKey?: string;
  emptyKey?: string;
};

export default function GroupSearchPreview({
  rooms,
  loading,
  empty,
  onJoin,
  joinPending,
  className,
  memberCountKey = "chat.discover.memberCount",
  joinLabelKey = "chat.discover.join",
  emptyKey = "chat.discover.empty",
}: GroupSearchPreviewProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className={cn("flex justify-center py-6", className)}>
        <Loader2 className="h-5 w-5 animate-spin text-ait-purple" />
      </div>
    );
  }

  if (empty || rooms.length === 0) {
    return (
      <p className={cn("px-3 py-4 text-sm text-muted-foreground text-center", className)}>
        {t(emptyKey)}
      </p>
    );
  }

  return (
    <ul
      className={cn("space-y-1 p-1.5", className)}
      onMouseDown={(e) => e.preventDefault()}
    >
      {rooms.map((room) => (
        <li
          key={room.id}
          className="flex items-center gap-3 rounded-2xl p-2.5 transition-colors hover:bg-white/[0.06]"
        >
          <RoomAvatar title={room.title} avatarUrl={room.avatarUrl} className="h-11 w-11 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{room.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {t(memberCountKey, { count: room.memberCount })}
              {room.description ? ` · ${room.description}` : ""}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 h-8 text-xs border-white/15"
            disabled={joinPending}
            onClick={() => onJoin(room)}
          >
            {t(joinLabelKey)}
          </Button>
        </li>
      ))}
    </ul>
  );
}
