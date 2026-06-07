import type { NotificationFilter } from "@shared/notification-types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import NotificationList from "@/components/notifications/NotificationList";

type NotificationCenterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filter: NotificationFilter;
  onFilterChange: (filter: NotificationFilter) => void;
};

export default function NotificationCenterSheet({
  open,
  onOpenChange,
  filter,
  onFilterChange,
}: NotificationCenterSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md border-white/10 ait-glass-strong p-0 flex flex-col gap-0 bg-[#050816]/95"
      >
        <SheetHeader className="px-5 pt-6 pb-2 border-b border-white/10 space-y-2">
          <SheetTitle className="text-xl font-bold">Уведомления</SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Лайки, комментарии, реакции и сообщения
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 min-h-0 px-3 py-3">
          <NotificationList
            filter={filter}
            onFilterChange={onFilterChange}
            enabled={open}
            queryKeySuffix="sheet"
            onItemActivate={() => onOpenChange(false)}
            listClassName="pr-1"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
