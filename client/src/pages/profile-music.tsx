import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, Music2, Play, Plus, Search, Trash2, Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { uploadMediaFile } from "@/lib/upload-media";
import { useToast } from "@/hooks/use-toast";
import type { UserTrack } from "@shared/schema";
import { useMusicPlayer, type PlayerTrack } from "@/contexts/MusicPlayerContext";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

type JamendoResult = {
  source: "jamendo";
  id: string;
  title: string;
  artist: string;
  durationSeconds: number;
  license: string | null;
  streamUrl: string;
};

type ItunesResult = {
  source: "itunes";
  id: string;
  title: string;
  artist: string;
  durationSeconds: number;
  previewUrl: string;
  trackViewUrl: string;
  album: string | null;
};

type MusicSearchResponse = {
  jamendo: JamendoResult[];
  itunes: ItunesResult[];
};

function toPlayerTrack(t: UserTrack): PlayerTrack {
  return { id: t.id, title: t.title, fileUrl: t.fileUrl };
}

function formatDuration(sec: number): string {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ProfileMusic() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { playTrack, setQueue } = useMusicPlayer();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: tracks = [], isLoading } = useQuery<UserTrack[]>({
    queryKey: ["/api/music/tracks"],
    enabled: isAuthenticated,
  });

  const { data: searchResults, isFetching: searchLoading } = useQuery<MusicSearchResponse>({
    queryKey: ["/api/music/search", { q: searchQuery }],
    enabled: isAuthenticated && searchQuery.length >= 2,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/music/tracks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/music/tracks"] });
      toast({ title: "Трек удалён" });
    },
    onError: () => toast({ title: "Не удалось удалить", variant: "destructive" }),
  });

  const importMutation = useMutation({
    mutationFn: async (payload: { source: "jamendo" | "itunes"; externalId: string }) => {
      const res = await apiRequest("POST", "/api/music/tracks/import", payload);
      return (await res.json()) as UserTrack;
    },
    onSuccess: (track) => {
      queryClient.invalidateQueries({ queryKey: ["/api/music/tracks"] });
      toast({
        title: track.isPreview ? "Превью добавлено" : "Трек добавлен в библиотеку",
      });
      playTrack(toPlayerTrack(track), [...tracks.map(toPlayerTrack), toPlayerTrack(track)]);
    },
    onError: (err) =>
      toast({
        title: "Не удалось добавить",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      }),
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const fileUrl = await uploadMediaFile(file);
      const baseTitle = uploadTitle.trim() || file.name.replace(/\.[^.]+$/, "");
      const res = await apiRequest("POST", "/api/music/tracks", {
        title: baseTitle.slice(0, 200),
        fileUrl,
        mimeType: file.type || undefined,
        fileSizeBytes: file.size,
        sourceProvider: "upload",
      });
      const track = (await res.json()) as UserTrack;
      queryClient.invalidateQueries({ queryKey: ["/api/music/tracks"] });
      setUploadTitle("");
      toast({ title: "Трек загружен" });
      playTrack(toPlayerTrack(track), [...tracks.map(toPlayerTrack), toPlayerTrack(track)]);
    } catch (err) {
      toast({
        title: "Не удалось загрузить",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const playAll = (startId?: string) => {
    const playerTracks = tracks.map(toPlayerTrack);
    if (playerTracks.length === 0) return;
    const idx = startId ? playerTracks.findIndex((t) => t.id === startId) : 0;
    setQueue(playerTracks, idx >= 0 ? idx : 0);
  };

  const previewExternal = (title: string, url: string) => {
    playTrack({ id: `preview-${url}`, title, fileUrl: url });
  };

  if (!isAuthenticated) {
    return (
      <AppLayout contentClassName="py-16">
        <p className="text-center text-muted-foreground">Войдите в систему</p>
      </AppLayout>
    );
  }

  const jamendoResults = searchResults?.jamendo ?? [];
  const itunesResults = searchResults?.itunes ?? [];

  return (
    <AppLayout contentClassName="py-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Music2 className="h-6 w-6 text-primary" />
            Моя музыка
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Загружайте свои треки или ищите CC-музыку (Jamendo) и превью популярных треков (iTunes).
          </p>
        </div>

        <Card className="border-border/60">
          <CardContent className="p-4 space-y-3">
            <Label htmlFor="music-search">Поиск по названию</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="music-search"
                placeholder="Исполнитель или название…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            {searchQuery.length >= 2 && (
              <div className="space-y-4 pt-1">
                {searchLoading && (
                  <p className="text-xs text-muted-foreground">Поиск…</p>
                )}
                {jamendoResults.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Jamendo — полные CC-треки
                    </p>
                    {jamendoResults.map((item) => (
                      <div
                        key={`jamendo-${item.id}`}
                        className="flex items-center gap-2 rounded-xl border border-border/50 p-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.artist}
                            {item.durationSeconds ? ` · ${formatDuration(item.durationSeconds)}` : ""}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          title="Послушать"
                          onClick={() => previewExternal(`${item.title} — ${item.artist}`, item.streamUrl)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={importMutation.isPending}
                          onClick={() =>
                            importMutation.mutate({ source: "jamendo", externalId: item.id })
                          }
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          В библиотеку
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {itunesResults.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      iTunes — превью 30 сек
                    </p>
                    {itunesResults.map((item) => (
                      <div
                        key={`itunes-${item.id}`}
                        className="flex items-center gap-2 rounded-xl border border-border/50 p-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.artist}
                            {item.album ? ` · ${item.album}` : ""}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          title="Превью"
                          onClick={() => previewExternal(`${item.title} — ${item.artist}`, item.previewUrl)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={importMutation.isPending}
                          onClick={() =>
                            importMutation.mutate({ source: "itunes", externalId: item.id })
                          }
                        >
                          Сохранить превью
                        </Button>
                        {item.trackViewUrl && (
                          <Button type="button" size="icon" variant="ghost" asChild>
                            <a href={item.trackViewUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {!searchLoading &&
                  jamendoResults.length === 0 &&
                  itunesResults.length === 0 && (
                    <p className="text-sm text-muted-foreground">Ничего не найдено</p>
                  )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 space-y-4">
            <div>
              <Label htmlFor="track-title">Название (необязательно)</Label>
              <Input
                id="track-title"
                placeholder="Будет взято из имени файла"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/mpeg,audio/mp4,audio/ogg,audio/wav,audio/x-m4a,.mp3,.m4a,.ogg,.wav"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(file);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              className="w-full"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Загрузка…" : "Загрузить свой трек"}
            </Button>
          </CardContent>
        </Card>

        {tracks.length > 0 && (
          <Button type="button" variant="outline" onClick={() => playAll()}>
            <Play className="h-4 w-4 mr-2" />
            Воспроизвести все
          </Button>
        )}

        <div className="space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Загрузка…</p>
          ) : tracks.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="p-8 text-center text-muted-foreground text-sm">
                Пока нет треков. Загрузите MP3 или найдите музыку выше.
              </CardContent>
            </Card>
          ) : (
            tracks.map((track) => (
              <Card key={track.id} className="border-border/60">
                <CardContent className="p-3 flex items-center gap-3">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="shrink-0 h-10 w-10 rounded-xl"
                    onClick={() => playAll(track.id)}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{track.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {track.artist && `${track.artist} · `}
                      {track.createdAt &&
                        formatDistanceToNow(new Date(track.createdAt), {
                          addSuffix: true,
                          locale: ru,
                        })}
                      {track.isPreview && " · превью 30 сек"}
                      {track.fileSizeBytes
                        ? ` · ${(track.fileSizeBytes / (1024 * 1024)).toFixed(1)} МБ`
                        : ""}
                    </p>
                    {track.license && (
                      <p className="text-[10px] text-muted-foreground truncate">{track.license}</p>
                    )}
                  </div>
                  {track.sourceProvider && (
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {track.sourceProvider}
                    </Badge>
                  )}
                  {!track.isPreview && (
                    <Button type="button" size="icon" variant="ghost" asChild>
                      <a
                        href={`/api/music/tracks/${track.id}/download`}
                        download
                        onClick={(e) => {
                          e.preventDefault();
                          void fetch(`/api/music/tracks/${track.id}/download`, { credentials: "include" })
                            .then(async (r) => {
                              if (!r.ok) throw new Error("Download failed");
                              const blob = await r.blob();
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `${track.title}.mp3`;
                              a.click();
                              URL.revokeObjectURL(url);
                            })
                            .catch(() =>
                              toast({ title: "Не удалось скачать", variant: "destructive" }),
                            );
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate(track.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default ProfileMusic;
