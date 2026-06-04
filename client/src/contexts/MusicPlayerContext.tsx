import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { resolveMediaUrl } from "@/lib/resolve-media-url";

export type PlayerTrack = {
  id: string;
  title: string;
  fileUrl: string;
};

export type PlayerUiMode = "expanded" | "collapsed" | "hidden";

type MusicPlayerContextValue = {
  queue: PlayerTrack[];
  currentIndex: number;
  currentTrack: PlayerTrack | null;
  isPlaying: boolean;
  volume: number;
  playerUi: PlayerUiMode;
  isPlayerVisible: boolean;
  playTrack: (track: PlayerTrack, queue?: PlayerTrack[]) => void;
  setQueue: (tracks: PlayerTrack[], startIndex?: number) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  stop: () => void;
  setVolume: (value: number) => void;
  collapsePlayer: () => void;
  expandPlayer: () => void;
  dismissPlayer: () => void;
};

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null);

const STORAGE_KEY = "ait-music-player-state";

type PersistedState = {
  trackId: string | null;
  queueIds: string[];
  currentIndex: number;
  volume: number;
  playerUi: PlayerUiMode;
};

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [queue, setQueueState] = useState<PlayerTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.85);
  const [playerUi, setPlayerUi] = useState<PlayerUiMode>("hidden");

  const currentTrack = queue[currentIndex] ?? null;
  const isPlayerVisible = currentTrack != null && playerUi !== "hidden";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PersistedState;
      if (typeof parsed.volume === "number") {
        setVolumeState(Math.min(1, Math.max(0, parsed.volume)));
      }
      if (
        parsed.playerUi === "expanded" ||
        parsed.playerUi === "collapsed" ||
        parsed.playerUi === "hidden"
      ) {
        setPlayerUi(parsed.playerUi);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    const src = resolveMediaUrl(currentTrack.fileUrl);
    if (!src) return;
    audio.src = src;
    audio.load();
    if (isPlaying) {
      void audio.play().catch(() => setIsPlaying(false));
    }
  }, [currentTrack?.id, currentTrack?.fileUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (isPlaying) {
      void audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack?.id]);

  const persist = useCallback(
    (
      nextQueue: PlayerTrack[],
      index: number,
      nextVolume = volume,
      nextPlayerUi: PlayerUiMode = playerUi,
    ) => {
      try {
        const payload: PersistedState = {
          trackId: nextQueue[index]?.id ?? null,
          queueIds: nextQueue.map((t) => t.id),
          currentIndex: index,
          volume: nextVolume,
          playerUi: nextPlayerUi,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch {
        /* ignore */
      }
    },
    [volume, playerUi],
  );

  const playTrack = useCallback(
    (track: PlayerTrack, nextQueue?: PlayerTrack[]) => {
      const q = nextQueue ?? [track];
      const idx = q.findIndex((t) => t.id === track.id);
      const ui: PlayerUiMode = "expanded";
      setQueueState(q);
      setCurrentIndex(idx >= 0 ? idx : 0);
      setIsPlaying(true);
      setPlayerUi(ui);
      persist(q, idx >= 0 ? idx : 0, volume, ui);
    },
    [persist, volume],
  );

  const setQueue = useCallback(
    (tracks: PlayerTrack[], startIndex = 0) => {
      const idx = Math.min(Math.max(0, startIndex), Math.max(0, tracks.length - 1));
      const ui: PlayerUiMode = tracks.length > 0 ? "expanded" : "hidden";
      setQueueState(tracks);
      setCurrentIndex(idx);
      setIsPlaying(tracks.length > 0);
      setPlayerUi(ui);
      persist(tracks, idx, volume, ui);
    },
    [persist, volume],
  );

  const togglePlay = useCallback(() => {
    if (!currentTrack) return;
    setIsPlaying((p) => !p);
  }, [currentTrack]);

  const next = useCallback(() => {
    if (queue.length === 0) return;
    const idx = (currentIndex + 1) % queue.length;
    setCurrentIndex(idx);
    setIsPlaying(true);
    persist(queue, idx);
  }, [queue, currentIndex, persist]);

  const prev = useCallback(() => {
    if (queue.length === 0) return;
    const idx = (currentIndex - 1 + queue.length) % queue.length;
    setCurrentIndex(idx);
    setIsPlaying(true);
    persist(queue, idx);
  }, [queue, currentIndex, persist]);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setQueueState([]);
    setCurrentIndex(0);
    setPlayerUi("hidden");
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
    }
    persist([], 0, volume, "hidden");
  }, [persist, volume]);

  const setVolume = useCallback(
    (value: number) => {
      const v = Math.min(1, Math.max(0, value));
      setVolumeState(v);
      persist(queue, currentIndex, v);
    },
    [queue, currentIndex, persist],
  );

  const collapsePlayer = useCallback(() => {
    if (!currentTrack) return;
    setPlayerUi("collapsed");
    persist(queue, currentIndex, volume, "collapsed");
  }, [currentTrack, queue, currentIndex, persist, volume]);

  const expandPlayer = useCallback(() => {
    if (!currentTrack) return;
    setPlayerUi("expanded");
    persist(queue, currentIndex, volume, "expanded");
  }, [currentTrack, queue, currentIndex, persist, volume]);

  const dismissPlayer = useCallback(() => {
    stop();
  }, [stop]);

  const value = useMemo(
    () => ({
      queue,
      currentIndex,
      currentTrack,
      isPlaying,
      volume,
      playerUi,
      isPlayerVisible,
      playTrack,
      setQueue,
      togglePlay,
      next,
      prev,
      stop,
      setVolume,
      collapsePlayer,
      expandPlayer,
      dismissPlayer,
    }),
    [
      queue,
      currentIndex,
      currentTrack,
      isPlaying,
      volume,
      playerUi,
      isPlayerVisible,
      playTrack,
      setQueue,
      togglePlay,
      next,
      prev,
      stop,
      setVolume,
      collapsePlayer,
      expandPlayer,
      dismissPlayer,
    ],
  );

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        className="hidden"
        onEnded={() => next()}
        preload="metadata"
      />
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) throw new Error("useMusicPlayer must be used within MusicPlayerProvider");
  return ctx;
}
