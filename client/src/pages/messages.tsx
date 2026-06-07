import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { buildChatRedirectPath } from "@/lib/chat-redirect";

/** Legacy route — instant redirect to /chat */
export function Messages() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();

  useEffect(() => {
    setLocation(buildChatRedirectPath(searchString));
  }, [searchString, setLocation]);

  return null;
}

export default Messages;
