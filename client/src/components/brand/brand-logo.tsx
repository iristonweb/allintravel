import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { BRAND_LOGO_SRC, SITE_NAME, SITE_TAGLINE } from "@/lib/site-meta";

type BrandLogoProps = {
  className?: string;
  /** Full image with wordmark (default) or compact icon crop */
  variant?: "full" | "icon";
  showText?: boolean;
  /** Set to null for a non-clickable logo (e.g. login card) */
  href?: string | null;
};

export default function BrandLogo({
  className,
  variant = "full",
  showText = false,
  href = "/",
}: BrandLogoProps) {
  const imgClass =
    variant === "icon"
      ? "h-10 w-10 object-contain object-center"
      : "h-10 sm:h-11 w-auto max-w-[200px] sm:max-w-[220px] object-contain object-left";

  const content = (
    <span className={cn("flex items-center gap-3 shrink-0 group", className)}>
      <img
        src={BRAND_LOGO_SRC}
        alt={SITE_NAME}
        className={cn(imgClass, "transition-opacity group-hover:opacity-90")}
        width={variant === "icon" ? 40 : 220}
        height={44}
        decoding="async"
      />
      {showText && (
        <span className="hidden lg:block">
          <span className="text-lg font-bold text-white tracking-tight block leading-tight">
            {SITE_NAME}
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {SITE_TAGLINE}
          </span>
        </span>
      )}
    </span>
  );

  if (href != null) {
    return (
      <Link href={href} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ait-purple rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}
