import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type SmartSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onSelect?: (e: React.SyntheticEvent<HTMLInputElement>) => void;
  autoComplete?: string;
  name?: string;
  id?: string;
  type?: "search" | "text";
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
  size?: "sm" | "md";
  showLeadingIcon?: boolean;
  embedded?: boolean;
  dropdown?: ReactNode;
  dropdownOpen?: boolean;
  dropdownPosition?: "below" | "above";
  dropdownPortal?: boolean;
  dropdownClassName?: string;
};

export type SmartSearchFieldHandle = HTMLInputElement;

const SmartSearchField = forwardRef<SmartSearchFieldHandle, SmartSearchFieldProps>(
  function SmartSearchField(
    {
      value,
      onChange,
      placeholder,
      disabled,
      onKeyDown,
      onFocus,
      onBlur,
      onSelect,
      autoComplete = "off",
      name,
      id,
      type = "text",
      autoFocus,
      className,
      inputClassName,
      size = "md",
      showLeadingIcon = true,
      embedded = false,
      dropdown,
      dropdownOpen = false,
      dropdownPosition = "below",
      dropdownPortal = false,
      dropdownClassName,
    },
    ref,
  ) {
    const inputRef = useRef<HTMLInputElement>(null);
    const anchorRef = useRef<HTMLDivElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<{
      top: number;
      left: number;
      width: number;
    } | null>(null);

    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    useLayoutEffect(() => {
      if (!dropdownPortal || !dropdownOpen || !anchorRef.current) {
        setDropdownStyle(null);
        return;
      }
      const update = () => {
        const el = anchorRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const gap = 6;
        setDropdownStyle({
          top: dropdownPosition === "above" ? rect.top - gap : rect.bottom + gap,
          left: rect.left,
          width: rect.width,
        });
      };
      update();
      window.addEventListener("resize", update);
      window.addEventListener("scroll", update, true);
      return () => {
        window.removeEventListener("resize", update);
        window.removeEventListener("scroll", update, true);
      };
    }, [dropdownPortal, dropdownOpen, dropdownPosition, value]);

    const dropdownContent =
      dropdownOpen && dropdown ? (
        <div
          className={cn(
            "ait-smart-search-dropdown z-[120]",
            dropdownPortal ? "fixed" : "absolute left-0 right-0 z-50",
            !dropdownPortal && dropdownPosition === "below" && "top-[calc(100%+6px)]",
            !dropdownPortal && dropdownPosition === "above" && "bottom-[calc(100%+6px)]",
            dropdownClassName,
          )}
          style={
            dropdownPortal && dropdownStyle
              ? {
                  top: dropdownPosition === "above" ? undefined : dropdownStyle.top,
                  bottom:
                    dropdownPosition === "above"
                      ? `calc(100vh - ${dropdownStyle.top}px + 6px)`
                      : undefined,
                  left: dropdownStyle.left,
                  width: dropdownStyle.width,
                  transform: dropdownPosition === "above" ? "translateY(-100%)" : undefined,
                }
              : undefined
          }
        >
          {dropdown}
        </div>
      ) : null;

    return (
      <div className={cn("relative", className)} ref={anchorRef}>
        <div className="relative">
          {showLeadingIcon && !embedded && (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
          )}
          <input
            ref={inputRef}
            type={type}
            value={value}
            name={name}
            id={id}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete={autoComplete}
            autoFocus={autoFocus}
            className={cn(
              "w-full outline-none disabled:opacity-50 disabled:cursor-not-allowed",
              !embedded && "ait-smart-search",
              embedded && "bg-transparent border-0 shadow-none text-foreground",
              !embedded && (size === "sm" ? "ait-smart-search--sm" : "ait-smart-search--md"),
              embedded && "text-sm h-8 px-0",
              !showLeadingIcon && !embedded && "!pl-3",
              inputClassName,
            )}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            onBlur={onBlur}
            onSelect={onSelect}
          />
        </div>
        {!dropdownPortal && dropdownContent}
        {dropdownPortal && dropdownContent && createPortal(dropdownContent, document.body)}
      </div>
    );
  },
);

export default SmartSearchField;
