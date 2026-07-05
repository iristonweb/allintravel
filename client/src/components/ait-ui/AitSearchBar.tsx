import SmartSearchField, { type SmartSearchFieldProps } from "@/components/search/SmartSearchField";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

type AitSearchBarProps = SmartSearchFieldProps & {
  omnibar?: boolean;
  shortcutHint?: string;
};

const AitSearchBar = forwardRef<HTMLInputElement, AitSearchBarProps>(
  ({ className, omnibar, shortcutHint, ...props }, ref) => (
    <div className={cn("relative w-full", omnibar && "ait-omnibar")}>
      <SmartSearchField
        ref={ref}
        className={cn(
          omnibar ? "border-0 bg-transparent shadow-none min-h-[2.75rem] pl-11 pr-20" : "",
          className,
        )}
        size={omnibar ? "md" : props.size}
        {...props}
      />
      {shortcutHint && (
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-6 select-none items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 font-mono text-[10px] font-medium text-muted-foreground">
          {shortcutHint}
        </kbd>
      )}
    </div>
  ),
);
AitSearchBar.displayName = "AitSearchBar";

export default AitSearchBar;
