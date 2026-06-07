import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import ChatGroupSearchDialog from "@/components/chat/ChatGroupSearchDialog";

type ChatGroupSearchContextValue = {
  open: (query?: string) => void;
  close: () => void;
};

const ChatGroupSearchContext = createContext<ChatGroupSearchContextValue | null>(null);

export function ChatGroupSearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState("");

  const openDialog = useCallback((query = "") => {
    setInitialQuery(query);
    setOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setOpen(false);
    setInitialQuery("");
  }, []);

  const value = useMemo(
    () => ({ open: openDialog, close: closeDialog }),
    [openDialog, closeDialog],
  );

  return (
    <ChatGroupSearchContext.Provider value={value}>
      {children}
      <ChatGroupSearchDialog
        open={open}
        onOpenChange={(next) => (next ? setOpen(true) : closeDialog())}
        initialQuery={initialQuery}
      />
    </ChatGroupSearchContext.Provider>
  );
}

export function useChatGroupSearchDialog(): ChatGroupSearchContextValue {
  const ctx = useContext(ChatGroupSearchContext);
  if (!ctx) {
    throw new Error("useChatGroupSearchDialog must be used within ChatGroupSearchProvider");
  }
  return ctx;
}
