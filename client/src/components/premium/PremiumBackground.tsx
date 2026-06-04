import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type PremiumBackgroundProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  imageSrc?: string;
  videoWebmSrc?: string;
  videoMp4Src?: string;
  enableVideo?: boolean;
  enableInteractive?: boolean;
};

type ParallaxPoint = { x: number; y: number };

function PremiumBackdrop({
  imageSrc,
  videoWebmSrc,
  videoMp4Src,
  enableVideo,
  reduceMotion,
  videoFailed,
  onVideoError,
}: {
  imageSrc: string;
  videoWebmSrc: string;
  videoMp4Src: string;
  enableVideo: boolean;
  reduceMotion: boolean;
  videoFailed: boolean;
  onVideoError: () => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
      <div
        className="absolute inset-0 bg-cover bg-center ait-backdrop-photo"
        style={{ backgroundImage: `url('${imageSrc}')` }}
      />

      {enableVideo && !reduceMotion && !videoFailed ? (
        <video
          className="absolute inset-0 h-full w-full object-cover ait-backdrop-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onError={onVideoError}
        >
          <source src={videoWebmSrc} type="video/webm" />
          <source src={videoMp4Src} type="video/mp4" />
        </video>
      ) : null}

      <div className="absolute inset-0 ait-backdrop-overlay" />
      <div className="absolute inset-0 ait-noise ait-backdrop-noise" />
    </div>
  );
}

function PremiumParallaxScene({
  enabled,
  reduceMotion,
  p1,
  p2,
  p3,
  p4,
  p5,
}: {
  enabled: boolean;
  reduceMotion: boolean;
  p1: ParallaxPoint;
  p2: ParallaxPoint;
  p3: ParallaxPoint;
  p4: ParallaxPoint;
  p5: ParallaxPoint;
}) {
  if (!enabled || reduceMotion) return null;

  return (
    <>
      <motion.div
        className="pointer-events-none absolute -top-52 left-[-18%] h-[36rem] w-[36rem] rounded-full blur-3xl"
        style={{ backgroundColor: "var(--ait-parallax-ocean)" }}
        animate={{ x: p1.x, y: p1.y }}
        transition={{ type: "spring", stiffness: 80, damping: 28, mass: 0.6 }}
      />
      <motion.div
        className="pointer-events-none absolute -top-64 right-[-20%] h-[40rem] w-[40rem] rounded-full blur-3xl"
        style={{ backgroundColor: "var(--ait-parallax-sun)" }}
        animate={{ x: p2.x, y: p2.y }}
        transition={{ type: "spring", stiffness: 72, damping: 30, mass: 0.7 }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-72 left-[14%] h-[44rem] w-[44rem] rounded-full blur-3xl"
        style={{ backgroundColor: "var(--ait-parallax-sand)" }}
        animate={{ x: p3.x, y: p3.y }}
        transition={{ type: "spring", stiffness: 64, damping: 32, mass: 0.8 }}
      />

      {/* Subtle “ocean band” near bottom */}
      <motion.div
        className="pointer-events-none absolute -bottom-24 left-[-10%] right-[-10%] h-56 rounded-[999px] blur-2xl"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.06) 20%, rgba(139,92,246,0.10) 55%, rgba(236,72,153,0.08) 80%, transparent 100%)",
        }}
        animate={{ x: p4.x, y: p4.y }}
        transition={{ type: "spring", stiffness: 60, damping: 34, mass: 1.0 }}
      />

      {/* Floating bokeh */}
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage:
            "radial-gradient(10px 10px at 18% 22%, rgba(255,255,255,0.24), transparent 60%), radial-gradient(12px 12px at 62% 18%, rgba(255,255,255,0.18), transparent 60%), radial-gradient(14px 14px at 86% 34%, rgba(255,255,255,0.16), transparent 60%), radial-gradient(10px 10px at 30% 74%, rgba(255,255,255,0.14), transparent 60%), radial-gradient(16px 16px at 72% 82%, rgba(255,255,255,0.12), transparent 62%)",
        }}
        animate={{ x: p5.x, y: p5.y }}
        transition={{ type: "spring", stiffness: 55, damping: 36, mass: 1.1 }}
      />
    </>
  );
}

export default function PremiumBackground({
  children,
  className,
  contentClassName,
  imageSrc = "/backgrounds/resort-ultrawide-01.jpg",
  videoWebmSrc = "/media/resort-loop.webm",
  videoMp4Src = "/media/resort-loop.mp4",
  enableVideo = true,
  enableInteractive = true,
}: PremiumBackgroundProps) {
  const reduceMotion = useReducedMotion();
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.25 });
  const [videoFailed, setVideoFailed] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enableInteractive || reduceMotion) return;

    const onMove = (e: PointerEvent) => {
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        const x = Math.min(1, Math.max(0, e.clientX / window.innerWidth));
        const y = Math.min(1, Math.max(0, e.clientY / window.innerHeight));
        setPointer({ x, y });
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [enableInteractive, reduceMotion]);

  const parallax = useMemo(() => {
    const dx = (pointer.x - 0.5) * 2; // -1..1
    const dy = (pointer.y - 0.5) * 2; // -1..1
    return {
      p1: { x: dx * 16, y: dy * 10 },
      p2: { x: dx * -22, y: dy * 14 },
      p3: { x: dx * 12, y: dy * -10 },
      p4: { x: dx * -10, y: dy * 8 },
      p5: { x: dx * 8, y: dy * 6 },
    };
  }, [pointer.x, pointer.y]);

  return (
    <div className={cn("relative min-h-screen", className)}>
      <PremiumBackdrop
        imageSrc={imageSrc}
        videoWebmSrc={videoWebmSrc}
        videoMp4Src={videoMp4Src}
        enableVideo={enableVideo}
        reduceMotion={!!reduceMotion}
        videoFailed={videoFailed}
        onVideoError={() => setVideoFailed(true)}
      />

      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <PremiumParallaxScene
          enabled={enableInteractive}
          reduceMotion={!!reduceMotion}
          p1={parallax.p1}
          p2={parallax.p2}
          p3={parallax.p3}
          p4={parallax.p4}
          p5={parallax.p5}
        />
      </div>

      <div className={cn("relative z-0", contentClassName)}>{children}</div>
    </div>
  );
}

