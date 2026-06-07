import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

type VoiceMessagePlayerProps = {
  src: string;
  durationSec?: number;
  variant?: "own" | "other";
  className?: string;
};

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

let activeVoiceAudio: HTMLAudioElement | null = null;

function registerVoicePlayback(audio: HTMLAudioElement) {
  if (activeVoiceAudio && activeVoiceAudio !== audio) {
    activeVoiceAudio.pause();
  }
  activeVoiceAudio = audio;
}

export default function VoiceMessagePlayer({
  src,
  durationSec = 0,
  variant = "other",
  className,
}: VoiceMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSec);

  useEffect(() => {
    setDuration(durationSec);
    setCurrentTime(0);
    setPlaying(false);
  }, [src, durationSec]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      registerVoicePlayback(audio);
      void audio.play();
    } else {
      audio.pause();
    }
  }, []);

  const onSeek = useCallback((value: number[]) => {
    const audio = audioRef.current;
    if (!audio || value.length === 0) return;
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  }, []);

  const totalDuration =
    duration > 0 ? duration : durationSec > 0 ? durationSec : Math.max(currentTime, 0.1);

  return (
    <div
      className={cn(
        "ait-chat-voice flex items-center gap-2 min-w-[200px] max-w-[min(280px,85vw)] px-2.5 py-2",
        variant === "own" ? "ait-chat-voice--own" : "ait-chat-voice--other",
        className,
      )}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        className="hidden"
        onPlay={() => {
          if (audioRef.current) registerVoicePlayback(audioRef.current);
          setPlaying(true);
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrentTime(0);
        }}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => {
          const d = audioRef.current?.duration;
          if (d && Number.isFinite(d)) setDuration(d);
        }}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 shrink-0 rounded-full",
          variant === "own"
            ? "bg-white/20 hover:bg-white/30 text-white"
            : "bg-ait-purple/20 hover:bg-ait-purple/30 text-ait-purple",
        )}
        onClick={togglePlay}
        aria-label={playing ? "Пауза" : "Воспроизвести"}
      >
        {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
      </Button>

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <Mic
            className={cn(
              "h-3 w-3 shrink-0",
              variant === "own" ? "text-white/70" : "text-ait-purple/70",
            )}
            aria-hidden
          />
          <Slider
            value={[currentTime]}
            max={totalDuration > 0 ? totalDuration : 100}
            step={0.1}
            onValueChange={onSeek}
            className={cn(
              "flex-1 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:border-0",
              variant === "own"
                ? "[&_.bg-primary]:bg-white/80 [&_[role=slider]]:bg-white"
                : "[&_.bg-primary]:bg-ait-purple [&_[role=slider]]:bg-ait-purple",
            )}
            aria-label="Прогресс воспроизведения"
          />
        </div>
        <div
          className={cn(
            "flex justify-between text-[10px] tabular-nums",
            variant === "own" ? "text-white/70" : "text-muted-foreground",
          )}
        >
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>
    </div>
  );
}
