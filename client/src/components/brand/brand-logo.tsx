import { Link } from "wouter";
import { cn } from "@/lib/utils";
import {
  BRAND_NAV_MARK_SRC,
  BRAND_WORDMARK_SRC,
  SITE_NAME,
  SITE_TAGLINE,
} from "@/lib/site-meta";

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
  const useMark = variant === "icon" || variant === "nav";
  const src = useMark ? BRAND_NAV_MARK_SRC : BRAND_WORDMARK_SRC;

  const imgClass = useMark
    ? "h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 object-contain object-center shrink-0"
    : "h-11 sm:h-12 w-auto max-w-[min(100%,240px)] sm:max-w-[280px] object-contain object-left shrink-0";

  const content = (
    <span className={cn("flex items-center gap-2.5 sm:gap-3 shrink-0 group min-w-0", className)}>
      <img
        src={src}
        alt={SITE_NAME}
        className={cn(imgClass, "transition-opacity group-hover:opacity-90")}
        width={useMark ? 48 : 280}
        height={useMark ? 48 : 72}
        decoding="async"
      />
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
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ait-purple focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-lg max-w-[min(100%,420px)]"
      >
        {content}
      </Link>
    );
  }

  return content;
}
