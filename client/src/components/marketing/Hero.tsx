import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type HeroProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  below?: ReactNode;
  backgroundImageUrl?: string;
  /**
   * When a photo is used, keep it clean (no dark overlay).
   * Readability is achieved via a subtle glass panel around content.
   */
  withContentPanel?: boolean;
  className?: string;
};

export function Hero({
  title,
  subtitle,
  actions,
  below,
  backgroundImageUrl,
  withContentPanel = true,
  className,
}: HeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden",
        "py-16 sm:py-20 lg:py-24",
        className,
      )}
    >
      {/* Background system (subtle gradients + glows). */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_20%_-10%,rgba(14,165,164,0.16),transparent_60%),radial-gradient(980px_620px_at_95%_20%,rgba(255,106,61,0.16),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_60%)] dark:bg-[radial-gradient(1200px_700px_at_20%_-10%,rgba(14,165,164,0.20),transparent_60%),radial-gradient(980px_620px_at_95%_20%,rgba(255,106,61,0.18),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_60%)]" />
        <div className="absolute -top-24 left-1/2 h-72 w-[44rem] -translate-x-1/2 rounded-[48px] bg-card/20 blur-3xl" />
        <div className="absolute -bottom-40 right-[-10%] h-80 w-80 rounded-full blur-3xl" style={{ backgroundColor: "var(--ait-parallax-sun)" }} />
        <div className="absolute -bottom-48 left-[-10%] h-96 w-96 rounded-full blur-3xl" style={{ backgroundColor: "var(--ait-parallax-ocean)" }} />
      </div>

      {/* Optional hero photo. Keep it clean (no dark overlay). */}
      {backgroundImageUrl ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `url('${backgroundImageUrl}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden
        />
      ) : (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-luminosity"
          style={{
            backgroundImage: "url('/backgrounds/resort-ultrawide-01.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden
        />
      )}

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div
            className={cn(
              backgroundImageUrl && withContentPanel
                ? "rounded-[var(--ait-radius-hero)] px-5 py-8 sm:px-8 sm:py-10 md:px-10 ait-surface"
                : "",
            )}
          >
            <h1 className="text-balance text-5xl font-bold tracking-[-0.02em] text-foreground sm:text-6xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground">
                {subtitle}
              </p>
            ) : null}
            {actions ? (
              <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                {actions}
              </div>
            ) : null}
            {below ? <div className="mt-10">{below}</div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
