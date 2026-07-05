import { useState } from "react";
import { ChevronUp } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import AitSurface from "@/components/ait-ui/AitSurface";
import { slideUpPanel } from "@/lib/ait-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type MobileRightRailSheetProps = {
  children: ReactNode;
  title?: string;
  className?: string;
};

/** Collapsible widget tray for mobile when desktop right rail is hidden */
export default function MobileRightRailSheet({
  children,
  title = "Discover",
  className,
}: MobileRightRailSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("xl:hidden mb-section", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-sm font-medium text-muted-foreground hover:text-white transition-colors mb-3"
        aria-expanded={open}
      >
        {title}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronUp className="h-4 w-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div variants={slideUpPanel} initial="hidden" animate="visible" exit="exit">
            <AitSurface padding="md" radius="lg" className="space-y-4">
              {children}
            </AitSurface>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
