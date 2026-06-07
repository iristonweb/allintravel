import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Hash, Loader2, MapPin, Search } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import RoomAvatar from "@/components/chat/RoomAvatar";
import type { ChatRoom } from "@shared/schema";

type DiscoverRoom = ChatRoom & { memberCount: number; matchScore: number };

type ChatGroupSearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
};

export default function ChatGroupSearchDialog({
  open,
  onOpenChange,
  initialQuery = "",
}: ChatGroupSearchDialogProps) {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"groups" | "places">("groups");
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    if (!open) return;
    setTab("groups");
    setQuery(initialQuery);
  }, [open, initialQuery]);

  const search = query.trim();
  const { data: groups = [], isFetching } = useQuery<DiscoverRoom[]>({
    queryKey: ["/api/chat/rooms/discover", search],
    queryFn: async () => {
      const params = new URLSearchParams({ q: search, limit: "12" });
      const res = await fetch(`/api/chat/rooms/discover?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("discover failed");
      return res.json() as Promise<DiscoverRoom[]>;
    },
    enabled: open && tab === "groups" && search.length >= 2,
    staleTime: 20_000,
  });

  const joinMutation = useMutation({
    mutationFn: async (room: DiscoverRoom) => {
      await apiRequest("POST", `/api/chat/rooms/${room.id}/join`);
      return room;
    },
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
      toast({ title: t("chat.joinGate.joinedToast", { title: room.title }) });
      onOpenChange(false);
      navigate(`/chat?room=${encodeURIComponent(room.slug)}`);
    },
    onError: () => toast({ title: t("chat.joinGate.joinError"), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg ait-glass-strong border-white/10">
        <DialogHeader>
          <DialogTitle>{t("chat.searchDialog.title")}</DialogTitle>
          <DialogDescription>{t("chat.searchDialog.description")}</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "groups" | "places")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="groups" className="gap-1.5">
              <Hash className="h-4 w-4" />
              {t("chat.searchDialog.tabs.groups")}
            </TabsTrigger>
            <TabsTrigger value="places" className="gap-1.5">
              <MapPin className="h-4 w-4" />
              {t("chat.searchDialog.tabs.places")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="groups" className="space-y-3 mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("chat.searchDialog.placeholder")}
                className="pl-9"
                autoFocus
              />
            </div>
            {search.length < 2 ? (
              <p className="text-sm text-muted-foreground px-1">{t("chat.searchDialog.hint")}</p>
            ) : isFetching ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-ait-purple" />
              </div>
            ) : groups.length === 0 ? (
              <p className="text-sm text-muted-foreground px-1">{t("chat.searchDialog.empty")}</p>
            ) : (
              <ul className="space-y-1 max-h-[min(50vh,320px)] overflow-y-auto">
                {groups.map((room) => (
                  <li
                    key={room.id}
                    className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/[0.05]"
                  >
                    <RoomAvatar
                      title={room.title}
                      avatarUrl={room.avatarUrl}
                      className="h-11 w-11"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{room.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {t("chat.searchDialog.memberCount", { count: room.memberCount })}
                        {room.description ? ` · ${room.description}` : ""}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={joinMutation.isPending}
                      onClick={() => joinMutation.mutate(room)}
                    >
                      {t("chat.searchDialog.join")}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="places" className="space-y-3 mt-3">
            <p className="text-sm text-muted-foreground">{t("chat.searchDialog.placesHint")}</p>
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                onOpenChange(false);
                navigate(search ? `/map?q=${encodeURIComponent(search)}` : "/map");
              }}
            >
              <MapPin className="h-4 w-4 mr-2" />
              {t("chat.searchDialog.openMap")}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
