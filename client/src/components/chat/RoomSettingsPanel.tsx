import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Camera, Globe, Link2, Lock, LogOut, UserPlus, UserMinus, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { uploadRoomAvatar } from "@/lib/upload-media";
import RoomAvatar from "@/components/chat/RoomAvatar";
import { getUserDisplayLabel, getUserHandle, getUserInitial } from "@shared/user-display";
import type { ChatRoom, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CHAT_BACKGROUND_PRESETS, type ChatBackgroundId } from "@/lib/chat-backgrounds";

type RoomListItem = ChatRoom & { memberCount: number; myRole: string | null };

type RoomMemberRow = {
  id: string;
  roomId: string;
  userId: string;
  role: string;
  status: string;
  user?: User | null;
};

type RoomSettingsPanelProps = {
  room: RoomListItem;
  currentUserId?: string;
  onClose?: () => void;
  onLeft?: () => void;
};

const roleLabels: Record<string, string> = {
  owner: "Владелец",
  admin: "Админ",
  member: "Участник",
};

export default function RoomSettingsPanel({
  room,
  currentUserId,
  onClose,
  onLeft,
}: RoomSettingsPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [editTitle, setEditTitle] = useState(room.title);
  const [editDescription, setEditDescription] = useState(room.description ?? "");
  const [editVisibility, setEditVisibility] = useState<"public" | "private">(
    room.visibility as "public" | "private",
  );
  const [memberSearch, setMemberSearch] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [chatBackground, setChatBackground] = useState<ChatBackgroundId>(
    (room.settings?.chatBackground as ChatBackgroundId) ?? "default",
  );

  const effectiveRole =
    room.myRole ?? (room.createdBy && room.createdBy === currentUserId ? "owner" : null);
  const isAdmin = effectiveRole === "admin" || effectiveRole === "owner";
  const isOwner = effectiveRole === "owner";
  const isMember = effectiveRole != null;

  const membersKey = [`/api/chat/rooms/${room.id}/members`] as const;

  const { data: members = [], isLoading: membersLoading } = useQuery<RoomMemberRow[]>({
    queryKey: membersKey,
    enabled: Boolean(room.id),
  });

  const { data: searchResults = [] } = useQuery<User[]>({
    queryKey: ["/api/search/users", { q: memberSearch.replace(/^@/, ""), limit: 6 }],
    enabled: isAdmin && memberSearch.replace(/^@/, "").length >= 2,
  });

  const invalidateRoom = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
    queryClient.invalidateQueries({ queryKey: [`/api/chat/${room.slug}`] });
    queryClient.invalidateQueries({ queryKey: membersKey });
  };

  const updateRoomMutation = useMutation({
    mutationFn: async (patch: Partial<ChatRoom> & { settings?: ChatRoom["settings"] }) => {
      const res = await apiRequest("PATCH", `/api/chat/rooms/${room.id}`, patch);
      return (await res.json()) as ChatRoom;
    },
    onSuccess: () => {
      toast({ title: "Группа обновлена" });
      invalidateRoom();
    },
    onError: () => toast({ title: "Не удалось сохранить", variant: "destructive" }),
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/chat/rooms/${room.id}/invite`);
      return (await res.json()) as { inviteUrl: string };
    },
    onSuccess: (data) => {
      const full = `${window.location.origin}${data.inviteUrl}`;
      void navigator.clipboard.writeText(full);
      toast({ title: "Ссылка приглашения скопирована" });
    },
    onError: () => toast({ title: "Не удалось создать ссылку", variant: "destructive" }),
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/chat/rooms/${room.id}/join`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Вы вступили в группу" });
      invalidateRoom();
    },
    onError: () => toast({ title: "Не удалось вступить", variant: "destructive" }),
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/chat/rooms/${room.id}/leave`);
    },
    onSuccess: () => {
      toast({ title: "Вы покинули группу" });
      invalidateRoom();
      onLeft?.();
      onClose?.();
    },
    onError: () => toast({ title: "Не удалось выйти", variant: "destructive" }),
  });

  const addMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("POST", `/api/chat/rooms/${room.id}/members`, { userId });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Участник добавлен" });
      setMemberSearch("");
      invalidateRoom();
    },
    onError: () => toast({ title: "Не удалось добавить", variant: "destructive" }),
  });

  const roleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "member" }) => {
      const res = await apiRequest("PATCH", `/api/chat/rooms/${room.id}/members/${userId}`, { role });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Роль обновлена" });
      invalidateRoom();
    },
    onError: () => toast({ title: "Не удалось изменить роль", variant: "destructive" }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/chat/rooms/${room.id}/members/${userId}`);
    },
    onSuccess: () => {
      toast({ title: "Участник удалён" });
      invalidateRoom();
    },
    onError: () => toast({ title: "Не удалось удалить", variant: "destructive" }),
  });

  const handleAvatarChange = async (file: File) => {
    if (!isAdmin) return;
    const maxBytes = 4 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast({
        title: "Файл слишком большой",
        description: "Для загрузки на сервер используйте изображение до 4 МБ.",
        variant: "destructive",
      });
      return;
    }
    setAvatarUploading(true);
    try {
      await uploadRoomAvatar(room.id, file);
      toast({ title: "Аватар обновлён" });
      invalidateRoom();
    } catch (err) {
      toast({
        title: "Не удалось загрузить аватар",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSave = () => {
    updateRoomMutation.mutate({
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
      visibility: editVisibility,
      settings: { ...room.settings, chatBackground },
    });
  };

  const memberUserIds = new Set(members.map((m) => m.userId));
  const addCandidates = searchResults.filter((u) => u.id && !memberUserIds.has(u.id));

  return (
    <div className="px-4 pb-6 pt-2 text-sm space-y-4">
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <RoomAvatar title={room.title} avatarUrl={room.avatarUrl} className="h-16 w-16" />
          {isAdmin && (
            <>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleAvatarChange(file);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full"
                disabled={avatarUploading}
                onClick={() => avatarInputRef.current?.click()}
              >
                <Camera className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <p className="font-semibold truncate">{room.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {room.memberCount ?? members.length} участников ·{" "}
            {room.visibility === "private" ? "Закрытая" : "Открытая"}
            {effectiveRole && ` · ${roleLabels[effectiveRole] ?? effectiveRole}`}
          </p>
        </div>
      </div>

      {!isMember && room.visibility === "public" && (
        <Button className="w-full" onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending}>
          <UserPlus className="h-4 w-4 mr-2" />
          Вступить в группу
        </Button>
      )}

      {isAdmin && (
        <div className="space-y-3 rounded-xl border border-border/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Настройки группы
          </p>
          <div>
            <Label className="text-xs">Название</Label>
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="mt-1 h-8" />
          </div>
          <div>
            <Label className="text-xs">Описание</Label>
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={2}
              className="mt-1 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={editVisibility === "public" ? "default" : "outline"}
              onClick={() => setEditVisibility("public")}
            >
              <Globe className="h-3.5 w-3.5 mr-1" />
              Открытая
            </Button>
            <Button
              type="button"
              size="sm"
              variant={editVisibility === "private" ? "default" : "outline"}
              onClick={() => setEditVisibility("private")}
            >
              <Lock className="h-3.5 w-3.5 mr-1" />
              Закрытая
            </Button>
          </div>
          <div>
            <Label className="text-xs">Фон чата</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {CHAT_BACKGROUND_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  title={preset.label}
                  onClick={() => setChatBackground(preset.id)}
                  className={cn(
                    "aspect-square rounded-xl border-2 transition-all",
                    chatBackground === preset.id
                      ? "border-ait-purple ring-2 ring-ait-purple/30 scale-[1.02]"
                      : "border-transparent hover:border-white/20",
                  )}
                  style={{ background: preset.preview }}
                />
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {CHAT_BACKGROUND_PRESETS.find((p) => p.id === chatBackground)?.label ?? "Стандарт"}
            </p>
          </div>
          <Button
            size="sm"
            className="w-full"
            onClick={handleSave}
            disabled={!editTitle.trim() || updateRoomMutation.isPending}
          >
            Сохранить изменения
          </Button>
        </div>
      )}

      {!isAdmin && room.description && (
        <p className="text-muted-foreground">{room.description}</p>
      )}

      {room.visibility === "private" && isAdmin && (
        <Button size="sm" variant="outline" onClick={() => inviteMutation.mutate()} disabled={inviteMutation.isPending}>
          <Link2 className="h-4 w-4 mr-1" />
          Скопировать ссылку-приглашение
        </Button>
      )}

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Участники</p>
        {isAdmin && (
          <div className="space-y-2">
            <Input
              placeholder="Добавить по @username"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="h-8"
            />
            {addCandidates.length > 0 && (
              <div className="rounded-lg border border-border/40 overflow-hidden">
                {addCandidates.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 text-left"
                    onClick={() => addMemberMutation.mutate(u.id!)}
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={resolveMediaUrl(u.profileImageUrl)} />
                      <AvatarFallback className="text-xs">{getUserInitial(u)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{getUserDisplayLabel(u)}</span>
                    {u.username && (
                      <span className="text-muted-foreground text-xs">{getUserHandle(u)}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {membersLoading ? (
          <p className="text-xs text-muted-foreground">Загрузка…</p>
        ) : (
          <ul className="space-y-1 max-h-48 overflow-y-auto">
            {members.map((m) => {
              const u = m.user;
              const canManage = isAdmin && m.role !== "owner" && m.userId !== currentUserId;
              const canChangeRole = isOwner && m.role !== "owner" && m.userId !== currentUserId;
              return (
                <li
                  key={m.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/30"
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={resolveMediaUrl(u?.profileImageUrl)} />
                    <AvatarFallback className="text-xs">{u ? getUserInitial(u) : "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm">{u ? getUserDisplayLabel(u) : "Участник"}</p>
                    {u?.username && (
                      <p className="text-xs text-muted-foreground truncate">{getUserHandle(u)}</p>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {roleLabels[m.role] ?? m.role}
                  </Badge>
                  {canChangeRole && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0"
                      title={m.role === "admin" ? "Снять админа" : "Назначить админом"}
                      onClick={() =>
                        roleMutation.mutate({
                          userId: m.userId,
                          role: m.role === "admin" ? "member" : "admin",
                        })
                      }
                    >
                      <Shield className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {canManage && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                      title="Удалить из группы"
                      onClick={() => removeMemberMutation.mutate(m.userId)}
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {isMember && effectiveRole !== "owner" && (
        <Button
          variant="outline"
          size="sm"
          className={cn("w-full text-destructive hover:text-destructive")}
          onClick={() => leaveMutation.mutate()}
          disabled={leaveMutation.isPending}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Покинуть группу
        </Button>
      )}
    </div>
  );
}
