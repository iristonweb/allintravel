import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import EmojiPicker, { type EmojiClickData, Theme } from "emoji-picker-react";
import { ImageIcon, Mic, Music, Paperclip, Reply, Smile, Sticker, X } from "lucide-react";
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
import {
  isAudioFile,
  isImageFile,
  isVideoFile,
  uploadMediaFile,
} from "@/lib/upload-media";
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

const STICKERS = [
  { id: "plane", src: "/stickers/plane.svg", label: "Самолёт" },
  { id: "map", src: "/stickers/map.svg", label: "Карта" },
  { id: "sun", src: "/stickers/sun.svg", label: "Солнце" },
  { id: "camera", src: "/stickers/camera.svg", label: "Фото" },
  { id: "heart", src: "/stickers/heart.svg", label: "Сердце" },
  { id: "wave", src: "/stickers/wave.svg", label: "Привет" },
] as const;

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
  placeholder = "Сообщение…",
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
  const gifSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mentionRef = useRef<MentionAutocompleteHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);
  const voiceStartedRef = useRef<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    if (!replyTo) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [replyTo?.username, replyTo?.preview]);

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
    onSend(mergeTextAndMedia(value, encodeStickerMessage(src)));
    onChange("");
  };

  const sendMusicTrack = (track: UserTrack) => {
    const url = resolveMediaUrl(track.fileUrl) ?? track.fileUrl;
    if (!url) {
      toast({ title: "Трек недоступен", variant: "destructive" });
      return;
    }
    setMusicOpen(false);
    onSend(mergeTextAndMedia(value, encodeAudioMessage(url)));
    onChange("");
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
        toast({ title: "Неподдерживаемый тип файла", variant: "destructive" });
        return;
      }
      onSend(mergeTextAndMedia(value, token));
      onChange("");
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
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";
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
            toast({ title: "Слишком короткая запись", description: "Удерживайте кнопку микрофона дольше.", variant: "destructive" });
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
            onSend(mergeTextAndMedia(value, encodeVoiceMessage(url, durationSec)));
            onChange("");
          } catch (err) {
            toast({
              title: "Не удалось отправить голосовое",
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
      toast({ title: "Нет доступа к микрофону", variant: "destructive" });
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
            <p className="font-medium text-ait-purple truncate">Ответ @{replyTo.username}</p>
            {replyTo.preview && (
              <p className="text-muted-foreground truncate mt-0.5">{replyTo.preview}</p>
            )}
          </div>
          {onCancelReply && (
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onCancelReply}>
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
        className="px-1"
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
        title="Прикрепить файл"
        onClick={() => fileInputRef.current?.click()}
      >
        <Paperclip className="h-5 w-5" />
      </Button>
      <Popover open={musicOpen} onOpenChange={setMusicOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            disabled={composerDisabled}
            title="Музыка из библиотеки"
          >
            <Music className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-2 ait-glass-ios" align="start" side="top">
          <p className="text-xs font-medium px-1 pb-2 text-muted-foreground">Моя музыка</p>
          {musicLoading ? (
            <p className="text-xs text-muted-foreground px-1 py-3">Загрузка…</p>
          ) : musicTracks.length === 0 ? (
            <p className="text-xs text-muted-foreground px-1 py-3">
              Добавьте треки в{" "}
              <Link href="/profile/music" className="text-ait-purple hover:underline">
                Моя музыка
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
                    <span className="text-muted-foreground text-xs block truncate">{track.artist}</span>
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
        title={recording ? "Остановить запись" : "Голосовое сообщение"}
        onClick={() => (recording ? stopVoiceRecording() : void startVoiceRecording())}
      >
        <Mic className="h-5 w-5" />
      </Button>
      <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="shrink-0" disabled={composerDisabled}>
            <Smile className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-0 ait-glass-ios" align="start" side="top">
          <EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.DARK} width={320} height={360} />
        </PopoverContent>
      </Popover>

      <Popover open={stickerOpen} onOpenChange={setStickerOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="shrink-0" disabled={composerDisabled}>
            <Sticker className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3 ait-glass-ios border-white/15" align="start" side="top">
          <p className="text-xs text-muted-foreground mb-2">Стикеры</p>
          <div className="grid grid-cols-3 gap-2">
            {STICKERS.map((s) => (
              <button
                key={s.id}
                type="button"
                className="rounded-lg p-2 hover:bg-muted transition-colors"
                onClick={() => insertSticker(s.src)}
                title={s.label}
              >
                <img src={s.src} alt={s.label} className="h-12 w-12 mx-auto" />
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {giphyEnabled && (
        <Popover open={gifOpen} onOpenChange={handleGifOpenChange}>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="shrink-0" disabled={composerDisabled}>
              <ImageIcon className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3 ait-glass-ios border-white/15" align="start" side="top">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium">GIF</p>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setGifOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Input
              placeholder="Поиск GIF…"
              value={gifQuery}
              onChange={(e) => handleGifSearch(e.target.value)}
              className="mb-2 h-8"
            />
            {gifLoading && displayedGifs.length === 0 && (
              <p className="text-xs text-muted-foreground mb-2">Загрузка…</p>
            )}
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {displayedGifs.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className="rounded-lg bg-transparent p-1 hover:bg-white/8 transition-colors"
                  onClick={() => {
                    setGifOpen(false);
                    onSend(mergeTextAndMedia(value, encodeGifMessage(g.url)));
                    onChange("");
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
          placeholder={uploading ? "Загрузка…" : recording ? "Запись…" : placeholder}
          disabled={composerDisabled}
          className="w-full border-0 bg-transparent shadow-none focus-visible:ring-0"
          onKeyDown={handleInputKeyDown}
        />
      </div>
    </div>
    </div>
  );
}
