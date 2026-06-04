import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { BRAND_ICON_SRC, BRAND_LOGO_SRC, SITE_NAME, SITE_TAGLINE } from "@/lib/site-meta";

type BrandLogoProps = {
  className?: string;
  variant?: "full" | "icon" | "nav";
  showText?: boolean;
  href?: string | null;
};

export default function BrandLogo({
  className,
  variant = "full",
  showText = false,
  href = "/",
}: BrandLogoProps) {
  const src = variant === "icon" ? BRAND_ICON_SRC : BRAND_LOGO_SRC;

  const imgClass =
    variant === "icon"
      ? "h-9 w-9 object-contain object-center"
      : variant === "nav"
        ? "h-12 md:h-14 w-auto max-w-[240px] md:max-w-[320px] object-contain object-left"
        : "h-11 sm:h-12 w-auto max-w-[220px] sm:max-w-[260px] object-contain object-left";

  const content = (
    <span className={cn("flex items-center gap-2.5 sm:gap-3 shrink-0 group min-w-0", className)}>
      <span
        className={cn(
          "inline-flex items-center shrink-0",
          variant === "nav" &&
            "rounded-2xl px-2.5 py-1.5 sm:px-3 sm:py-2 bg-white/[0.06] border border-white/10 backdrop-blur-sm",
          variant === "icon" && "rounded-xl p-1 bg-white/[0.04]",
        )}
      >
        <img
          src={src}
          alt={SITE_NAME}
          className={cn(imgClass, "transition-opacity group-hover:opacity-90")}
          width={variant === "icon" ? 36 : variant === "nav" ? 320 : 260}
          height={variant === "nav" ? 56 : 48}
          decoding="async"
        />
      </span>
      {showText && (
        <span className="hidden md:block min-w-0">
          <span className="text-base lg:text-lg font-bold text-white tracking-tight block leading-tight truncate">
            {SITE_NAME}
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground truncate block">
            {SITE_TAGLINE}
          </span>
        </span>
      )}
    </span>
  );

  if (href != null) {
    return (
      <Link
        href={href}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ait-purple rounded-lg max-w-[min(100%,420px)]"
      >
        {content}
      </Link>
    );
  }

  return content;
}
