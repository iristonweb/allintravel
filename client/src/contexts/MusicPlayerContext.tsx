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

export type PlayerAnchorPosition = {
  x: number;
  y: number;
};

type MusicPlayerContextValue = {
  queue: PlayerTrack[];
  currentIndex: number;
  currentTrack: PlayerTrack | null;
  isPlaying: boolean;
  volume: number;
  playerUi: PlayerUiMode;
  isPlayerVisible: boolean;
  playerPosition: PlayerAnchorPosition | null;
  setPlayerPosition: (pos: PlayerAnchorPosition | null) => void;
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
  queue: PlayerTrack[];
  currentIndex: number;
  volume: number;
  playerUi: PlayerUiMode;
  isPlaying: boolean;
  currentTime: number;
  playerPosition: PlayerAnchorPosition | null;
};

function readPersisted(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (!Array.isArray(parsed.queue)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastTrackIdRef = useRef<string | null>(null);
  const pendingTimeRef = useRef(0);
  const restoredRef = useRef(false);

  const initial = readPersisted();

  const [queue, setQueueState] = useState<PlayerTrack[]>(initial?.queue ?? []);
  const [currentIndex, setCurrentIndex] = useState(initial?.currentIndex ?? 0);
  const [isPlaying, setIsPlaying] = useState(initial?.isPlaying ?? false);
  const [volume, setVolumeState] = useState(
    typeof initial?.volume === "number" ? Math.min(1, Math.max(0, initial.volume)) : 0.85,
  );
  const [playerUi, setPlayerUi] = useState<PlayerUiMode>(
    initial?.queue?.length && initial.playerUi !== "hidden"
      ? (initial.playerUi ?? "expanded")
      : "hidden",
  );
  const [playerPosition, setPlayerPositionState] = useState<PlayerAnchorPosition | null>(
    initial?.playerPosition ?? null,
  );

  if (!restoredRef.current && initial?.currentTime) {
    pendingTimeRef.current = initial.currentTime;
    restoredRef.current = true;
  }

  const currentTrack = queue[currentIndex] ?? null;
  const isPlayerVisible = currentTrack != null && playerUi !== "hidden";

  const persist = useCallback(
    (
      nextQueue: PlayerTrack[],
      index: number,
      opts?: {
        volume?: number;
        playerUi?: PlayerUiMode;
        isPlaying?: boolean;
        currentTime?: number;
        playerPosition?: PlayerAnchorPosition | null;
      },
    ) => {
      try {
        const audio = audioRef.current;
        const payload: PersistedState = {
          queue: nextQueue,
          currentIndex: index,
          volume: opts?.volume ?? volume,
          playerUi: opts?.playerUi ?? playerUi,
          isPlaying: opts?.isPlaying ?? isPlaying,
          currentTime: opts?.currentTime ?? audio?.currentTime ?? 0,
          playerPosition: opts?.playerPosition !== undefined ? opts.playerPosition : playerPosition,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch {
        /* ignore */
      }
    },
    [volume, playerUi, isPlaying, playerPosition],
  );

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

    if (lastTrackIdRef.current !== currentTrack.id) {
      lastTrackIdRef.current = currentTrack.id;
      audio.src = src;
      const resumeAt = pendingTimeRef.current;
      pendingTimeRef.current = 0;
      const onMeta = () => {
        if (resumeAt > 0) audio.currentTime = resumeAt;
        audio.removeEventListener("loadedmetadata", onMeta);
        if (isPlaying) void audio.play().catch(() => setIsPlaying(false));
      };
      audio.addEventListener("loadedmetadata", onMeta);
      audio.load();
    } else if (isPlaying) {
      void audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [currentTrack, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    const id = window.setInterval(() => {
      if (!audio.paused && audio.currentTime > 0) {
        persist(queue, currentIndex, { currentTime: audio.currentTime });
      }
    }, 2000);
    return () => clearInterval(id);
  }, [queue, currentIndex, currentTrack, persist]);

  const setPlayerPosition = useCallback(
    (pos: PlayerAnchorPosition | null) => {
      setPlayerPositionState(pos);
      persist(queue, currentIndex, { playerPosition: pos });
    },
    [queue, currentIndex, persist],
  );

  const playTrack = useCallback(
    (track: PlayerTrack, nextQueue?: PlayerTrack[]) => {
      const q = nextQueue ?? [track];
      const idx = q.findIndex((t) => t.id === track.id);
      const ui: PlayerUiMode = "expanded";
      lastTrackIdRef.current = null;
      pendingTimeRef.current = 0;
      setQueueState(q);
      setCurrentIndex(idx >= 0 ? idx : 0);
      setIsPlaying(true);
      setPlayerUi(ui);
      persist(q, idx >= 0 ? idx : 0, { volume, playerUi: ui, isPlaying: true, currentTime: 0 });
    },
    [persist, volume],
  );

  const setQueue = useCallback(
    (tracks: PlayerTrack[], startIndex = 0) => {
      const idx = Math.min(Math.max(0, startIndex), Math.max(0, tracks.length - 1));
      const ui: PlayerUiMode = tracks.length > 0 ? "expanded" : "hidden";
      lastTrackIdRef.current = null;
      setQueueState(tracks);
      setCurrentIndex(idx);
      setIsPlaying(tracks.length > 0);
      setPlayerUi(ui);
      persist(tracks, idx, { volume, playerUi: ui, isPlaying: tracks.length > 0 });
    },
    [persist, volume],
  );

  const togglePlay = useCallback(() => {
    if (!currentTrack) return;
    const next = !isPlaying;
    setIsPlaying(next);
    persist(queue, currentIndex, { isPlaying: next });
  }, [currentTrack, isPlaying, queue, currentIndex, persist]);

  const next = useCallback(() => {
    if (queue.length === 0) return;
    const idx = (currentIndex + 1) % queue.length;
    lastTrackIdRef.current = null;
    pendingTimeRef.current = 0;
    setCurrentIndex(idx);
    setIsPlaying(true);
    persist(queue, idx, { isPlaying: true, currentTime: 0 });
  }, [queue, currentIndex, persist]);

  const prev = useCallback(() => {
    if (queue.length === 0) return;
    const idx = (currentIndex - 1 + queue.length) % queue.length;
    lastTrackIdRef.current = null;
    pendingTimeRef.current = 0;
    setCurrentIndex(idx);
    setIsPlaying(true);
    persist(queue, idx, { isPlaying: true, currentTime: 0 });
  }, [queue, currentIndex, persist]);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setQueueState([]);
    setCurrentIndex(0);
    setPlayerUi("hidden");
    lastTrackIdRef.current = null;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
    }
    persist([], 0, { playerUi: "hidden", isPlaying: false, currentTime: 0 });
  }, [persist]);

  const setVolume = useCallback(
    (value: number) => {
      const v = Math.min(1, Math.max(0, value));
      setVolumeState(v);
      persist(queue, currentIndex, { volume: v });
    },
    [queue, currentIndex, persist],
  );

  const collapsePlayer = useCallback(() => {
    if (!currentTrack) return;
    setPlayerUi("collapsed");
    persist(queue, currentIndex, { playerUi: "collapsed" });
  }, [currentTrack, queue, currentIndex, persist]);

  const expandPlayer = useCallback(() => {
    if (!currentTrack) return;
    setPlayerUi("expanded");
    persist(queue, currentIndex, { playerUi: "expanded" });
  }, [currentTrack, queue, currentIndex, persist]);

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
      playerPosition,
      setPlayerPosition,
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
      playerPosition,
      setPlayerPosition,
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
      <audio ref={audioRef} className="hidden" onEnded={() => next()} preload="auto" />
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) throw new Error("useMusicPlayer must be used within MusicPlayerProvider");
  return ctx;
}
