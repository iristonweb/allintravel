import {
  ChevronDown,
  ChevronUp,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  X,
  Music2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { cn } from "@/lib/utils";

export default function GlobalMusicBar() {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    next,
    prev,
    dismissPlayer,
    queue,
    playerUi,
    isPlayerVisible,
    collapsePlayer,
    expandPlayer,
  } = useMusicPlayer();

  if (!isPlayerVisible || !currentTrack) return null;

  const trackIndex = queue.findIndex((t) => t.id === currentTrack.id);
  const positionLabel =
    queue.length > 1 ? `Трек ${trackIndex + 1} из ${queue.length}` : "Моя музыка";

  const positionClass = cn(
    "fixed left-0 right-0 z-50 px-3 md:pl-[calc(72px+0.75rem)] pointer-events-none",
    "bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:bottom-4",
  );

  const glassClass =
    "ait-glass bg-black/25 backdrop-blur-xl border border-white/10 shadow-xl pointer-events-auto";

  if (playerUi === "collapsed") {
    return (
      <div className={positionClass}>
        <div
          className={cn(
            "max-w-md mx-auto md:ml-auto md:mr-4 rounded-full px-3 py-1.5 flex items-center gap-2",
            glassClass,
          )}
        >
          <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Music2 className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-xs font-medium truncate flex-1 min-w-0 max-w-[140px] sm:max-w-[200px]">
            {currentTrack.title}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={togglePlay}
            title={isPlaying ? "Пауза" : "Воспроизведение"}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={expandPlayer}
            title="Развернуть плеер"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={dismissPlayer}
            title="Закрыть"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={positionClass}>
      <div
        className={cn(
          "max-w-3xl mx-auto rounded-2xl px-3 py-2 flex items-center gap-2",
          glassClass,
        )}
      >
        <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <Music2 className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{currentTrack.title}</p>
          <p className="text-[10px] text-muted-foreground truncate">{positionLabel}</p>
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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={collapsePlayer}
            title="Свернуть"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={dismissPlayer}
            title="Закрыть"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
