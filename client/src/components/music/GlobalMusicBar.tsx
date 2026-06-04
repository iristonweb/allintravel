import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
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
    playerPosition,
    setPlayerPosition,
  } = useMusicPlayer();

  const panelRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  );
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState(playerPosition);

  useEffect(() => {
    setPos(playerPosition);
  }, [playerPosition]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!panelRef.current) return;
      e.preventDefault();
      const rect = panelRef.current.getBoundingClientRect();
      const originX = pos?.x ?? rect.left;
      const originY = pos?.y ?? rect.top;
      dragState.current = { startX: e.clientX, startY: e.clientY, originX, originY };
      setDragging(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [pos],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.current || !panelRef.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    const w = panelRef.current.offsetWidth;
    const h = panelRef.current.offsetHeight;
    setPos({
      x: Math.min(Math.max(8, dragState.current.originX + dx), window.innerWidth - w - 8),
      y: Math.min(Math.max(8, dragState.current.originY + dy), window.innerHeight - h - 8),
    });
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState.current) return;
      dragState.current = null;
      setDragging(false);
      if (pos) setPlayerPosition(pos);
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    },
    [pos, setPlayerPosition],
  );

  if (!isPlayerVisible || !currentTrack) return null;

  const trackIndex = queue.findIndex((t) => t.id === currentTrack.id);
  const positionLabel =
    queue.length > 1 ? `Трек ${trackIndex + 1} из ${queue.length}` : "Моя музыка";

  const glassClass =
    "ait-glass bg-black/30 backdrop-blur-xl border border-white/10 shadow-2xl";

  const anchored = !pos;

  return (
    <div
      ref={panelRef}
      className={cn(
        "fixed z-[250] pointer-events-auto",
        anchored &&
          "left-3 right-3 md:left-[calc(72px+0.75rem)] md:right-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:bottom-4",
        dragging && "ring-2 ring-ait-orange/50 rounded-2xl",
      )}
      style={
        pos
          ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto", width: playerUi === "collapsed" ? 280 : 420, maxWidth: "calc(100vw - 1rem)" }
          : { maxWidth: playerUi === "collapsed" ? 320 : 640, marginLeft: "auto", marginRight: "auto" }
      }
    >
      <div className={cn(glassClass, playerUi === "collapsed" ? "rounded-full" : "rounded-2xl")}>
        <button
          type="button"
          className="flex w-full items-center justify-center py-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          aria-label="Переместить плеер"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        {playerUi === "collapsed" ? (
          <div className="flex items-center gap-2 px-3 pb-2">
            <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Music2 className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="text-xs font-medium truncate flex-1 min-w-0">{currentTrack.title}</p>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={togglePlay}>
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={expandPlayer}>
              <ChevronUp className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={dismissPlayer}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 pb-3">
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
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={collapsePlayer}>
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={dismissPlayer}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
