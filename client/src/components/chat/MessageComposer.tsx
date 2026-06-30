import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import EmojiPicker, { type EmojiClickData, Theme } from "emoji-picker-react";
import { ImageIcon, Mic, Music, Paperclip, Plus, Reply, Smile, Sticker, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  encodeAudioMessage,
  encodeGifMessage,
  encodeImageMessage,
  encodeStickerMessage,
  encodeVideoMessage,
  encodeVoiceMessage,
} from "@/lib/chat-message";
import { isAudioFile, isImageFile, isVideoFile, uploadMediaFile } from "@/lib/upload-media";
import { useToast } from "@/hooks/use-toast";
import MentionAutocomplete, {
  getMentionQuery,
  type MentionAutocompleteHandle,
} from "@/components/chat/MentionAutocomplete";
import type { User, UserTrack } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import FormatToolbar from "@/components/rich-text/FormatToolbar";
import { mergeTextAndMedia } from "@/lib/rich-text";
import { useTranslation } from "react-i18next";

const STICKER_IDS = ["plane", "map", "sun", "camera", "heart", "wave"] as const;

type GiphyGif = { id: string; url: string; preview: string; title: string };

type GiphyItem = {
  id: string;
  title: string;
  images: {
    downsized?: { url: string };
    fixed_height: { url: string };
    preview_gif: { url: string };
  };
};

function mapGiphyItems(items: GiphyItem[]): GiphyGif[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    url: item.images.downsized?.url ?? item.images.fixed_height.url,
    preview: item.images.preview_gif.url,
  }));
}

function getGiphyKey(): string | undefined {
  return import.meta.env.VITE_GIPHY_API_KEY as string | undefined;
}

async function fetchGiphyTrending(): Promise<GiphyGif[]> {
  const key = getGiphyKey();
  if (!key) return [];
  const params = new URLSearchParams({
    api_key: key,
    limit: "12",
    rating: "g",
  });
  const res = await fetch(`https://api.giphy.com/v1/gifs/trending?${params}`);
  if (!res.ok) return [];
  const json = await res.json();
  return mapGiphyItems(json.data ?? []);
}

async function searchGiphy(query: string): Promise<GiphyGif[]> {
  const key = getGiphyKey();
  if (!key || query.trim().length < 2) return [];
  const params = new URLSearchParams({
    api_key: key,
    q: query.trim(),
    limit: "12",
    rating: "g",
    lang: "ru",
  });
  const res = await fetch(`https://api.giphy.com/v1/gifs/search?${params}`);
  if (!res.ok) return [];
  const json = await res.json();
  return mapGiphyItems(json.data ?? []);
}

type MessageComposerProps = {
  value: string;
  onChange: (value: string) => void;
  /** Pass explicit content for GIF/sticker-only sends */
  onSend: (contentOverride?: string) => void;
  /** Keep text + media in the field after attach (draft mode: broadcast, push) */
  persistAfterMediaSend?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  suggestUsers?: User[];
  replyTo?: { username: string; label: string; preview?: string } | null;
  onCancelReply?: () => void;
};

export default function MessageComposer({
  value,
  onChange,
  onSend,
  persistAfterMediaSend = false,
  placeholder,
  disabled,
  className,
  suggestUsers,
  replyTo,
  onCancelReply,
}: MessageComposerProps) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);
  const [gifOpen, setGifOpen] = useState(false);
  const [stickerOpen, setStickerOpen] = useState(false);
  const [gifQuery, setGifQuery] = useState("");
  const [gifResults, setGifResults] = useState<GiphyGif[]>([]);
  const [gifTrending, setGifTrending] = useState<GiphyGif[]>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [extrasOpen, setExtrasOpen] = useState(false);
  const gifSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mentionRef = useRef<MentionAutocompleteHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);
  const voiceStartedRef = useRef<number>(0);
  const { toast } = useToast();
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t("chat.composer.defaultPlaceholder");

  const commitMediaSend = (merged: string) => {
    onSend(merged);
    onChange(persistAfterMediaSend ? merged : "");
  };

  useEffect(() => {
    if (!replyTo) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [replyTo]);

  const { data: musicTracks = [], isLoading: musicLoading } = useQuery<UserTrack[]>({
    queryKey: ["/api/music/tracks"],
    enabled: musicOpen,
  });

  const giphyEnabled = Boolean(getGiphyKey());
  const mentionQuery = getMentionQuery(value, cursorPos);
  const showMentions = mentionQuery !== null;
  const displayedGifs = gifQuery.trim().length >= 2 ? gifResults : gifTrending;

  const handleGifOpenChange = (open: boolean) => {
    setGifOpen(open);
    if (open) {
      setGifLoading(true);
      void fetchGiphyTrending()
        .then(setGifTrending)
        .finally(() => setGifLoading(false));
    } else {
      setGifQuery("");
      setGifResults([]);
    }
  };

  const handleGifSearch = (q: string) => {
    setGifQuery(q);
    if (gifSearchRef.current) clearTimeout(gifSearchRef.current);
    if (q.trim().length < 2) {
      setGifResults([]);
      return;
    }
    gifSearchRef.current = setTimeout(async () => {
      setGifLoading(true);
      try {
        setGifResults(await searchGiphy(q));
      } finally {
        setGifLoading(false);
      }
    }, 400);
  };

  const insertSticker = (src: string) => {
    setStickerOpen(false);
    commitMediaSend(mergeTextAndMedia(value, encodeStickerMessage(src)));
  };

  const sendMusicTrack = (track: UserTrack) => {
    const url = resolveMediaUrl(track.fileUrl) ?? track.fileUrl;
    if (!url) {
      toast({ title: t("chat.composer.trackUnavailable"), variant: "destructive" });
      return;
    }
    setMusicOpen(false);
    commitMediaSend(mergeTextAndMedia(value, encodeAudioMessage(url)));
  };

  const handleAttachFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadMediaFile(file);
      let token: string;
      if (isImageFile(file)) {
        token = encodeImageMessage(url);
      } else if (isVideoFile(file)) {
        token = encodeVideoMessage(url);
      } else if (isAudioFile(file)) {
        token = encodeAudioMessage(url);
      } else {
        toast({ title: t("chat.composer.unsupportedFile"), variant: "destructive" });
        return;
      }
      commitMediaSend(mergeTextAndMedia(value, token));
    } catch (err) {
      toast({
        title: t("chat.composer.uploadFailed"),
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const stopVoiceRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    setRecording(false);
  };

  const startVoiceRecording = async () => {
    if (disabled || uploading) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
      const recorder = new MediaRecorder(stream, { mimeType });
      voiceChunksRef.current = [];
      voiceStartedRef.current = Date.now();
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) voiceChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        void (async () => {
          const blob = new Blob(voiceChunksRef.current, { type: mimeType });
          if (blob.size < 100) {
            toast({
              title: t("chat.composer.voiceTooShort"),
              description: t("chat.composer.voiceTooShortHint"),
              variant: "destructive",
            });
            return;
          }
          const durationSec = Math.max(
            1,
            Math.round((Date.now() - voiceStartedRef.current) / 1000),
          );
          setUploading(true);
          try {
            const ext = mimeType.includes("ogg") ? "ogg" : "webm";
            const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: mimeType });
            const url = await uploadMediaFile(file);
            commitMediaSend(mergeTextAndMedia(value, encodeVoiceMessage(url, durationSec)));
          } catch (err) {
            toast({
              title: t("chat.composer.voiceSendFailed"),
              description: err instanceof Error ? err.message : undefined,
              variant: "destructive",
            });
          } finally {
            setUploading(false);
          }
        })();
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      toast({ title: t("chat.composer.micDenied"), variant: "destructive" });
    }
  };

  const onEmojiClick = (data: EmojiClickData) => {
    onChange(value + data.emoji);
    setEmojiOpen(false);
  };

  const applyMention = (username: string) => {
    const before = value.slice(0, cursorPos);
    const after = value.slice(cursorPos);
    const atIdx = before.lastIndexOf("@");
    if (atIdx === -1) return;
    const next = `${before.slice(0, atIdx)}@${username} ${after}`;
    onChange(next);
    const newPos = atIdx + username.length + 2;
    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(newPos, newPos);
      inputRef.current?.focus();
    });
    setMentionIndex(0);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMentions && mentionQuery !== null) {
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
      if (e.key === "Escape") {
        e.preventDefault();
        return;
      }
    }
    if (e.key === "Enter") {
      if (showMentions) {
        const username = mentionRef.current?.pickActive();
        if (username) {
          e.preventDefault();
          applyMention(username);
          return;
        }
      }
      e.preventDefault();
      if (!uploading) onSend();
    }
  };

  const composerDisabled = disabled || uploading;

  return (
    <div className={cn("flex flex-col gap-1.5 min-w-0", className)}>
      {replyTo && (
        <div className="flex items-center gap-2 rounded-xl border border-ait-purple/25 bg-ait-purple/5 px-3 py-2 text-xs">
          <Reply className="h-3.5 w-3.5 text-ait-purple shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-ait-purple truncate">
              {t("chat.composer.replyTo", { username: replyTo.username })}
            </p>
            {replyTo.preview && (
              <p className="text-muted-foreground truncate mt-0.5">{replyTo.preview}</p>
            )}
          </div>
          {onCancelReply && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={onCancelReply}
              aria-label={t("chat.composer.cancelReply")}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
      <FormatToolbar
        value={value}
        onChange={onChange}
        inputRef={inputRef}
        disabled={composerDisabled}
        compact
        className="px-1 hidden md:flex"
      />
      <div className="ait-chat-composer-bar flex items-center gap-1.5 min-w-0">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,audio/mpeg,audio/mp4,audio/ogg,audio/wav,audio/webm,.mp3,.m4a,.ogg,.wav,.webm"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleAttachFile(file);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          disabled={composerDisabled}
          title={t("chat.composer.attachFile")}
          aria-label={t("chat.composer.attachFile")}
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 md:hidden"
          disabled={composerDisabled}
          aria-label={t("chat.composer.moreActions")}
          aria-expanded={extrasOpen}
          onClick={() => setExtrasOpen((open) => !open)}
        >
          <Plus className={cn("h-5 w-5 transition-transform", extrasOpen && "rotate-45")} />
        </Button>
        <div
          className={cn("flex items-center gap-1 shrink-0", extrasOpen ? "flex" : "hidden md:flex")}
        >
          <Popover open={musicOpen} onOpenChange={setMusicOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                disabled={composerDisabled}
                title={t("chat.composer.musicLibrary")}
                aria-label={t("chat.composer.musicLibrary")}
              >
                <Music className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-2 ait-glass-ios" align="start" side="top">
              <p className="text-xs font-medium px-1 pb-2 text-muted-foreground">
                {t("chat.composer.myMusic")}
              </p>
              {musicLoading ? (
                <p className="text-xs text-muted-foreground px-1 py-3">
                  {t("chat.composer.uploading")}
                </p>
              ) : musicTracks.length === 0 ? (
                <p className="text-xs text-muted-foreground px-1 py-3">
                  {t("chat.composer.addMusicHint")}{" "}
                  <Link href="/profile/music" className="text-ait-purple hover:underline">
                    {t("chat.composer.myMusicLink")}
                  </Link>
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {musicTracks.map((track) => (
                    <button
                      key={track.id}
                      type="button"
                      className="w-full text-left rounded-lg px-2 py-1.5 hover:bg-accent text-sm truncate"
                      onClick={() => sendMusicTrack(track)}
                    >
                      {track.title}
                      {track.artist ? (
                        <span className="text-muted-foreground text-xs block truncate">
                          {track.artist}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("shrink-0", recording && "text-red-400 animate-pulse")}
            disabled={composerDisabled}
            title={recording ? t("chat.composer.stopRecording") : t("chat.composer.voiceMessage")}
            aria-label={
              recording ? t("chat.composer.stopRecording") : t("chat.composer.voiceMessage")
            }
            onClick={() => (recording ? stopVoiceRecording() : void startVoiceRecording())}
          >
            <Mic className="h-5 w-5" />
          </Button>
          <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                disabled={composerDisabled}
                aria-label={t("chat.composer.emoji")}
              >
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-0 ait-glass-ios" align="start" side="top">
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                theme={Theme.DARK}
                width={320}
                height={360}
              />
            </PopoverContent>
          </Popover>

          <Popover open={stickerOpen} onOpenChange={setStickerOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                disabled={composerDisabled}
                aria-label={t("chat.composer.stickers")}
              >
                <Sticker className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-64 p-3 ait-glass-ios border-white/15"
              align="start"
              side="top"
            >
              <p className="text-xs text-muted-foreground mb-2">{t("chat.composer.stickers")}</p>
              <div className="grid grid-cols-3 gap-2">
                {STICKER_IDS.map((id) => {
                  const src = `/stickers/${id}.svg`;
                  const label = t(`chat.composer.stickerLabels.${id}`);
                  return (
                    <button
                      key={id}
                      type="button"
                      className="rounded-lg p-2 hover:bg-muted transition-colors"
                      onClick={() => insertSticker(src)}
                      title={label}
                    >
                      <img src={src} alt={label} className="h-12 w-12 mx-auto" />
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          {giphyEnabled && (
            <Popover open={gifOpen} onOpenChange={handleGifOpenChange}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  disabled={composerDisabled}
                  aria-label={t("chat.composer.gif")}
                >
                  <ImageIcon className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 p-3 ait-glass-ios border-white/15"
                align="start"
                side="top"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium">{t("chat.composer.gif")}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setGifOpen(false)}
                    aria-label={t("chat.composer.closeGif")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder={t("chat.composer.gifSearch")}
                  value={gifQuery}
                  onChange={(e) => handleGifSearch(e.target.value)}
                  className="mb-2 h-8"
                />
                {gifLoading && displayedGifs.length === 0 && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {t("chat.composer.uploading")}
                  </p>
                )}
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {displayedGifs.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      className="rounded-lg bg-transparent p-1 hover:bg-white/8 transition-colors"
                      onClick={() => {
                        setGifOpen(false);
                        commitMediaSend(mergeTextAndMedia(value, encodeGifMessage(g.url)));
                      }}
                    >
                      <img
                        src={g.preview}
                        alt={g.title}
                        className="w-full h-16 object-contain bg-transparent"
                      />
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        <div className="relative flex-1 min-w-0">
          {showMentions && mentionQuery !== null && (
            <MentionAutocomplete
              ref={mentionRef}
              query={mentionQuery}
              suggestUsers={suggestUsers}
              activeIndex={mentionIndex}
              onActiveIndexChange={setMentionIndex}
              onSelect={applyMention}
            />
          )}
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setCursorPos(e.target.selectionStart ?? e.target.value.length);
            }}
            onSelect={(e) => {
              const target = e.target as HTMLInputElement;
              setCursorPos(target.selectionStart ?? value.length);
            }}
            onClick={(e) => {
              const target = e.target as HTMLInputElement;
              setCursorPos(target.selectionStart ?? value.length);
            }}
            placeholder={
              uploading
                ? t("chat.composer.uploading")
                : recording
                  ? t("chat.composer.recording")
                  : resolvedPlaceholder
            }
            disabled={composerDisabled}
            className="w-full border-0 bg-transparent shadow-none focus-visible:ring-0"
            onKeyDown={handleInputKeyDown}
          />
        </div>
      </div>
    </div>
  );
}
