import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import AppLayout from "@/components/app-layout";
import { Loader2 } from "lucide-react";

/** Redirect-only route: personal DMs live on /chat */
export function Messages() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const withId = params.get("with");
    const from = params.get("from");

    if (withId) {
      const tab =
        from === "unread" || from === "personal" || from === "all" || from === "mine"
          ? from === "unread"
            ? "unread"
            : "personal"
          : "personal";
      const next = new URLSearchParams({ with: withId, tab });
      setLocation(`/chat?${next.toString()}`);
      return;
    }

    const tab = params.get("tab");
    if (tab === "unread") {
      setLocation("/chat?tab=unread");
      return;
    }
    if (tab === "groups") {
      setLocation("/chat");
      return;
    }
    setLocation("/chat?tab=personal");
  }, [searchString, setLocation]);

  return (
    <AppLayout fullWidth immersive chrome="minimal" contentClassName="p-2 md:p-4">
      <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    </AppLayout>
  );
}

export default Messages;
