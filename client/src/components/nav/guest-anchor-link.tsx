import { Link, useLocation } from "wouter";
import { anchorToRoute, scrollToAnchor } from "@/lib/nav-config";
import type { ReactNode } from "react";

type GuestAnchorLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  onNavigate?: () => void;
};

/** On landing: smooth scroll; elsewhere: navigate to /#section */
export function GuestAnchorLink({ href, children, className, onNavigate }: GuestAnchorLinkProps) {
  const [location] = useLocation();
  const onLanding = location === "/";

  if (onLanding) {
    return (
      <button
        type="button"
        onClick={() => {
          scrollToAnchor(href);
          onNavigate?.();
        }}
        className={className}
      >
        {children}
      </button>
    );
  }

  return (
    <Link href={anchorToRoute(href)} className={className} onClick={() => onNavigate?.()}>
      {children}
    </Link>
  );
}
