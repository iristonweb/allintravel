import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/app-layout";
import ReelsPageLayout from "@/components/feed/ReelsPageLayout";
import AitSectionHeader from "@/components/ait-ui/AitSectionHeader";
import AitButton from "@/components/ait-ui/AitButton";
import AitSurface from "@/components/ait-ui/AitSurface";
import EmptyState from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SmartSearchField from "@/components/search/SmartSearchField";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, Music2, Play, Plus, Trash2, Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { uploadMediaFile } from "@/lib/upload-media";
import { useToast } from "@/hooks/use-toast";
import type { UserTrack } from "@shared/schema";
import { useMusicPlayer, type PlayerTrack } from "@/contexts/MusicPlayerContext";
import { formatDistanceToNow } from "date-fns";
import { enUS, ru } from "date-fns/locale";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <AppLayout contentClassName="py-16">
        <EmptyState
          variant="glass"
          title={t("profileMusic.signInRequired")}
          className="max-w-md mx-auto"
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout contentClassName="py-6">
      <div className="max-w-3xl mx-auto">
        <ReelsPageLayout
          header={
            <div className="space-y-2">
              <Link
                href="/profile"
                className="text-xs text-muted-foreground hover:text-ait-purple transition-colors"
              >
                ← {t("profileMusic.breadcrumbProfile")}
              </Link>
              <AitSectionHeader
                title={t("profileMusic.title")}
                description={t("profileMusic.description")}
              />
            </div>
          }
          feed={<ProfileMusicContent />}
        />
      </div>
    </AppLayout>
  );
}

function ProfileMusicContent() {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith("ru") ? ru : enUS;
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

  const {
    data: tracks = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<UserTrack[]>({
    queryKey: ["/api/music/tracks"],
  });

  const { data: searchResults, isFetching: searchLoading } = useQuery<MusicSearchResponse>({
    queryKey: ["/api/music/search", { q: searchQuery }],
    enabled: searchQuery.length >= 2,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/music/tracks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/music/tracks"] });
      toast({ title: t("profileMusic.toast.deleted") });
    },
    onError: () => toast({ title: t("profileMusic.toast.deleteFailed"), variant: "destructive" }),
  });

  const importMutation = useMutation({
    mutationFn: async (payload: { source: "jamendo" | "itunes"; externalId: string }) => {
      const res = await apiRequest("POST", "/api/music/tracks/import", payload);
      return (await res.json()) as UserTrack;
    },
    onSuccess: (track) => {
      queryClient.invalidateQueries({ queryKey: ["/api/music/tracks"] });
      toast({
        title: track.isPreview
          ? t("profileMusic.toast.previewAdded")
          : t("profileMusic.toast.trackAdded"),
      });
      playTrack(toPlayerTrack(track), [...tracks.map(toPlayerTrack), toPlayerTrack(track)]);
    },
    onError: (err) =>
      toast({
        title: t("profileMusic.toast.addFailed"),
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
      toast({ title: t("profileMusic.toast.uploaded") });
      playTrack(toPlayerTrack(track), [...tracks.map(toPlayerTrack), toPlayerTrack(track)]);
    } catch (err) {
      toast({
        title: t("profileMusic.toast.uploadFailed"),
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

  const jamendoResults = searchResults?.jamendo ?? [];
  const itunesResults = searchResults?.itunes ?? [];

  return (
    <div className="space-y-section">
      <AitSurface padding="sm" className="space-y-3">
        <Label htmlFor="music-search">{t("profileMusic.searchLabel")}</Label>
        <SmartSearchField
          id="music-search"
          placeholder={t("profileMusic.searchPlaceholder")}
          value={searchInput}
          onChange={setSearchInput}
        />
        {searchQuery.length >= 2 && (
          <div className="space-y-4 pt-1">
            {searchLoading && (
              <p className="text-xs text-muted-foreground">{t("profileMusic.searching")}</p>
            )}
            {jamendoResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("profileMusic.jamendoSection")}
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
                      title={t("profileMusic.listen")}
                      aria-label={t("profileMusic.listen")}
                      onClick={() =>
                        previewExternal(`${item.title} — ${item.artist}`, item.streamUrl)
                      }
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
                      {t("profileMusic.addToLibrary")}
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {itunesResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("profileMusic.itunesSection")}
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
                      title={t("profileMusic.preview")}
                      aria-label={t("profileMusic.preview")}
                      onClick={() =>
                        previewExternal(`${item.title} — ${item.artist}`, item.previewUrl)
                      }
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
                      {t("profileMusic.savePreview")}
                    </Button>
                    {item.trackViewUrl && (
                      <Button type="button" size="icon" variant="ghost" asChild>
                        <a
                          href={item.trackViewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={t("profileMusic.openAppleMusic")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!searchLoading && jamendoResults.length === 0 && itunesResults.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("profileMusic.noResults")}</p>
            )}
          </div>
        )}
      </AitSurface>

      <AitSurface padding="sm" className="space-y-4">
        <div>
          <Label htmlFor="track-title">{t("profileMusic.trackTitleLabel")}</Label>
          <Input
            id="track-title"
            placeholder={t("profileMusic.trackTitlePlaceholder")}
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
        <AitButton
          type="button"
          className="w-full"
          variant="primary"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4 mr-2" strokeWidth={1.5} />
          {uploading ? t("profileMusic.uploading") : t("profileMusic.uploadTrack")}
        </AitButton>
      </AitSurface>

      {tracks.length > 0 && (
        <AitButton type="button" variant="glass" size="sm" onClick={() => playAll()}>
          <Play className="h-4 w-4 mr-2" strokeWidth={1.5} />
          {t("profileMusic.playAll")}
        </AitButton>
      )}

      <div className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("profileMusic.loading")}</p>
        ) : isError ? (
          <EmptyState
            variant="glass"
            title={t("profileMusic.loadError")}
            description={error instanceof Error ? error.message : t("profileMusic.serverError")}
            action={
              <AitButton type="button" variant="glass" size="sm" onClick={() => void refetch()}>
                {t("profileMusic.retry")}
              </AitButton>
            }
          />
        ) : tracks.length === 0 ? (
          <EmptyState
            variant="glass"
            icon={Music2}
            title={t("profileMusic.emptyLibraryTitle")}
            description={t("profileMusic.emptyLibrary")}
          />
        ) : (
          tracks.map((track) => (
            <AitSurface key={track.id} padding="sm">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="shrink-0 h-10 w-10 rounded-xl"
                  onClick={() => playAll(track.id)}
                  aria-label={t("profileMusic.playTrack", { title: track.title })}
                >
                  <Play className="h-4 w-4" strokeWidth={1.5} />
                </Button>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{track.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {track.artist && `${track.artist} · `}
                    {track.createdAt &&
                      formatDistanceToNow(new Date(track.createdAt), {
                        addSuffix: true,
                        locale: dateLocale,
                      })}
                    {track.isPreview && t("profileMusic.previewBadge")}
                    {track.fileSizeBytes
                      ? ` · ${(track.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`
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
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    asChild
                    aria-label={t("profileMusic.downloadTrack")}
                  >
                    <a
                      href={`/api/music/tracks/${track.id}/download`}
                      download
                      onClick={(e) => {
                        e.preventDefault();
                        void fetch(`/api/music/tracks/${track.id}/download`, {
                          credentials: "include",
                        })
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
                            toast({
                              title: t("profileMusic.toast.downloadFailed"),
                              variant: "destructive",
                            }),
                          );
                      }}
                    >
                      <Download className="h-4 w-4" strokeWidth={1.5} />
                    </a>
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteMutation.mutate(track.id)}
                  aria-label={t("profileMusic.deleteTrack", { title: track.title })}
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                </Button>
              </div>
            </AitSurface>
          ))
        )}
      </div>
    </div>
  );
}

export default ProfileMusic;
