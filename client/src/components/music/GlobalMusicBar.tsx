import { Pause, Play, SkipBack, SkipForward, X, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { cn } from "@/lib/utils";

export default function GlobalMusicBar() {
  const { currentTrack, isPlaying, togglePlay, next, prev, stop, queue } = useMusicPlayer();

  if (!currentTrack) return null;

  return (
    <div
      className={cn(
        "fixed left-0 right-0 z-40 px-3 md:pl-[calc(72px+0.75rem)]",
        "bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:bottom-4",
      )}
    >
      <div className="max-w-3xl mx-auto ait-glass-strong border border-white/10 rounded-2xl shadow-xl px-3 py-2 flex items-center gap-2">
        <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <Music2 className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{currentTrack.title}</p>
          <p className="text-[10px] text-muted-foreground truncate">
            {queue.length > 1 ? `Трек ${queue.findIndex((t) => t.id === currentTrack.id) + 1} из ${queue.length}` : "Моя музыка"}
          </p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={prev}>
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={togglePlay}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={next}>
            <SkipForward className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={stop}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
