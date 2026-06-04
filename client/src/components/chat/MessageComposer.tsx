import { useRef, useState } from "react";
import EmojiPicker, { type EmojiClickData, Theme } from "emoji-picker-react";
import { ImageIcon, Smile, Sticker, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { encodeGifMessage, encodeStickerMessage } from "@/lib/chat-message";

const STICKERS = [
  { id: "plane", src: "/stickers/plane.svg", label: "Самолёт" },
  { id: "map", src: "/stickers/map.svg", label: "Карта" },
  { id: "sun", src: "/stickers/sun.svg", label: "Солнце" },
  { id: "camera", src: "/stickers/camera.svg", label: "Фото" },
  { id: "heart", src: "/stickers/heart.svg", label: "Сердце" },
  { id: "wave", src: "/stickers/wave.svg", label: "Привет" },
] as const;

type GiphyGif = { id: string; url: string; preview: string; title: string };

async function searchGiphy(query: string): Promise<GiphyGif[]> {
  const key = import.meta.env.VITE_GIPHY_API_KEY as string | undefined;
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
  return (json.data ?? []).map(
    (item: {
      id: string;
      title: string;
      images: {
        downsized?: { url: string };
        fixed_height: { url: string };
        preview_gif: { url: string };
      };
    }) => ({
      id: item.id,
      title: item.title,
      url: item.images.downsized?.url ?? item.images.fixed_height.url,
      preview: item.images.preview_gif.url,
    }),
  );
}

type MessageComposerProps = {
  value: string;
  onChange: (value: string) => void;
  /** Pass explicit content for GIF/sticker-only sends */
  onSend: (contentOverride?: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export default function MessageComposer({
  value,
  onChange,
  onSend,
  placeholder = "Сообщение…",
  disabled,
  className,
}: MessageComposerProps) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [gifOpen, setGifOpen] = useState(false);
  const [stickerOpen, setStickerOpen] = useState(false);
  const [gifQuery, setGifQuery] = useState("");
  const [gifResults, setGifResults] = useState<GiphyGif[]>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const gifSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const giphyEnabled = Boolean(import.meta.env.VITE_GIPHY_API_KEY);

  const handleGifSearch = (q: string) => {
    setGifQuery(q);
    if (gifSearchRef.current) clearTimeout(gifSearchRef.current);
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
    const next = value ? `${value} ${encodeStickerMessage(src)}` : encodeStickerMessage(src);
    onChange(next.trim());
    setStickerOpen(false);
  };

  const onEmojiClick = (data: EmojiClickData) => {
    onChange(value + data.emoji);
    setEmojiOpen(false);
  };

  return (
    <div className={cn("ait-chat-composer-bar flex items-center gap-1.5", className)}>
      <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="shrink-0" disabled={disabled}>
            <Smile className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-0 ait-glass-ios" align="start" side="top">
          <EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.DARK} width={320} height={360} />
        </PopoverContent>
      </Popover>

      <Popover open={stickerOpen} onOpenChange={setStickerOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="shrink-0" disabled={disabled}>
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
        <Popover open={gifOpen} onOpenChange={setGifOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="shrink-0" disabled={disabled}>
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
            {gifLoading && <p className="text-xs text-muted-foreground">Загрузка…</p>}
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {gifResults.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className="rounded-lg bg-transparent p-1 hover:bg-white/8 transition-colors"
                  onClick={() => {
                    setGifOpen(false);
                    onSend(encodeGifMessage(g.url));
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

      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSend();
          }
        }}
      />
    </div>
  );
}
