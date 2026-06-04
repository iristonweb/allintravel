import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HeroProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  below?: ReactNode;
  aside?: ReactNode;
  stats?: ReactNode;
  backgroundImageUrl?: string;
  withContentPanel?: boolean;
  className?: string;
  align?: "center" | "left";
};

export function Hero({
  title,
  subtitle,
  actions,
  below,
  aside,
  stats,
  backgroundImageUrl,
  withContentPanel = false,
  className,
  align = "left",
}: HeroProps) {
  return (
    <section className={cn("relative overflow-hidden py-12 sm:py-16 lg:py-20", className)}>
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_20%_-10%,rgba(139,92,246,0.2),transparent_60%),radial-gradient(980px_620px_at_95%_20%,rgba(236,72,153,0.14),transparent_55%)]" />
      </div>

      {backgroundImageUrl ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${backgroundImageUrl}')` }}
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0a0e14]/95 via-[#0a0e14]/75 to-[#0a0e14]/40" />
        </>
      ) : null}

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "grid gap-10 items-center",
            aside ? "lg:grid-cols-[1fr_320px]" : "max-w-3xl",
            align === "center" && !aside && "mx-auto text-center",
          )}
        >
          <div
            className={cn(
              withContentPanel && "rounded-[var(--ait-radius-hero)] px-6 py-8 ait-glass-strong",
              align === "center" && !aside && "text-center",
            )}
          >
            <h1 className="text-balance text-4xl font-bold tracking-[-0.02em] text-foreground sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground max-w-xl">
                {subtitle}
              </p>
            ) : null}
            {actions ? (
              <div
                className={cn(
                  "mt-8 flex flex-col gap-3 sm:flex-row sm:items-center",
                  align === "center" && !aside && "justify-center",
                )}
              >
                {actions}
              </div>
            ) : null}
            {below ? <div className="mt-8 max-w-lg">{below}</div> : null}
          </div>
          {aside ? <div className="relative lg:justify-self-end w-full max-w-sm mx-auto lg:mx-0">{aside}</div> : null}
        </div>
        {stats ? <div className="mt-12 border-t border-white/10 pt-8">{stats}</div> : null}
      </div>
    </section>
  );
}

export default Hero;
