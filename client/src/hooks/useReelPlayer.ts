import { useCallback, useEffect, useRef, useState } from "react";

type UseReelPlayerOptions = {
  isActive: boolean;
  muted: boolean;
  isVideo?: boolean;
};

export function useReelPlayer({ isActive, muted, isVideo = true }: UseReelPlayerOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;
    video.muted = muted;
  }, [muted, isVideo]);

  useEffect(() => {
    if (!isVideo) return;
    const video = videoRef.current;
    if (isActive) {
      if (video) video.currentTime = 0;
      setIsPlaying(true);
      setProgress(0);
    } else {
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
      setIsPlaying(false);
      setProgress(0);
    }
  }, [isActive, isVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;

    if (isActive && isPlaying) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [isActive, isPlaying, isVideo]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress(video.currentTime / video.duration);
  }, []);

  const togglePlay = useCallback(() => {
    if (!isActive) return;
    setIsPlaying((prev) => !prev);
  }, [isActive]);

  const pause = useCallback(() => setIsPlaying(false), []);
  const play = useCallback(() => {
    if (isActive) setIsPlaying(true);
  }, [isActive]);

  return {
    videoRef,
    progress,
    isPlaying,
    togglePlay,
    pause,
    play,
    handleTimeUpdate,
  };
}

type UseReelSnapObserverOptions = {
  itemCount: number;
  resetKey?: string;
};

/** Tracks which reel snap item is most visible inside a scroll container. */
export function useReelSnapObserver({ itemCount, resetKey }: UseReelSnapObserverOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setItemRef = useCallback((index: number, el: HTMLDivElement | null) => {
    const observer = observerRef.current;
    const prev = itemRefs.current[index];
    if (prev && observer) observer.unobserve(prev);
    itemRefs.current[index] = el;
    if (el && observer) observer.observe(el);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
    const container = containerRef.current;
    if (container) container.scrollTop = 0;
  }, [resetKey]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        let bestIndex = -1;
        let bestRatio = 0;
        for (const entry of entries) {
          const index = Number((entry.target as HTMLElement).dataset.reelIndex);
          if (!Number.isFinite(index)) continue;
          if (entry.isIntersecting && entry.intersectionRatio >= bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIndex = index;
          }
        }
        if (bestIndex >= 0 && bestRatio >= 0.35) {
          setActiveIndex(bestIndex);
        }
      },
      {
        root: container,
        threshold: [0.35, 0.5, 0.75, 1],
      },
    );

    for (let i = 0; i < itemCount; i++) {
      const el = itemRefs.current[i];
      if (el) observerRef.current.observe(el);
    }

    return () => observerRef.current?.disconnect();
  }, [itemCount, resetKey]);

  return { containerRef, activeIndex, setItemRef };
}

/** Global mute preference for the reels feed (defaults to muted for autoplay policies). */
const REELS_MUTE_KEY = "ait-reels-muted";

function readMutedPreference(): boolean {
  try {
    const stored = sessionStorage.getItem(REELS_MUTE_KEY);
    if (stored !== null) return stored === "true";
  } catch {
    /* ignore */
  }
  return true;
}

export function useReelsMutePreference() {
  const [muted, setMuted] = useState(readMutedPreference);
  const toggleMute = useCallback(() => {
    setMuted((v) => {
      const next = !v;
      try {
        sessionStorage.setItem(REELS_MUTE_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);
  return { muted, setMuted, toggleMute };
}
