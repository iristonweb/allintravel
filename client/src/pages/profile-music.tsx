import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Music2, Play, Trash2, Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { uploadMediaFile } from "@/lib/upload-media";
import { useToast } from "@/hooks/use-toast";
import type { UserTrack } from "@shared/schema";
import { useMusicPlayer, type PlayerTrack } from "@/contexts/MusicPlayerContext";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

function toPlayerTrack(t: UserTrack): PlayerTrack {
  return { id: t.id, title: t.title, fileUrl: t.fileUrl };
}

export function ProfileMusic() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { playTrack, setQueue } = useMusicPlayer();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: tracks = [], isLoading } = useQuery<UserTrack[]>({
    queryKey: ["/api/music/tracks"],
    enabled: isAuthenticated,
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

  if (!isAuthenticated) {
    return (
      <AppLayout contentClassName="py-16">
        <p className="text-center text-muted-foreground">Войдите в систему</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout contentClassName="py-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Music2 className="h-6 w-6 text-primary" />
            Моя музыка
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Загружайте свои треки — плеер работает в фоне на всех страницах.
          </p>
        </div>

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
              {uploading ? "Загрузка…" : "Загрузить трек"}
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
                Пока нет треков. Загрузите MP3, M4A, OGG или WAV.
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
                    <p className="text-xs text-muted-foreground">
                      {track.createdAt &&
                        formatDistanceToNow(new Date(track.createdAt), {
                          addSuffix: true,
                          locale: ru,
                        })}
                      {track.fileSizeBytes
                        ? ` · ${(track.fileSizeBytes / (1024 * 1024)).toFixed(1)} МБ`
                        : ""}
                    </p>
                  </div>
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
                          .catch(() => toast({ title: "Не удалось скачать", variant: "destructive" }));
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
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
