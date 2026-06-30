import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
      <div className={cn("space-y-1.5 p-2", className)}>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-center gap-2.5 px-3 py-2">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ))}
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
    <ul className={cn("space-y-0.5 p-1.5", className)} onMouseDown={(e) => e.preventDefault()}>
      {rooms.map((room) => (
        <li key={room.id} className="ait-chat-room-item text-slate-300">
          <RoomAvatar
            title={room.title}
            avatarUrl={room.avatarUrl}
            className="h-10 w-10 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{room.title}</p>
            <p className="text-[11px] text-muted-foreground truncate">
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
