/** Build /chat URL from legacy /messages query params */
export function buildChatRedirectPath(search: string): string {
  const params = new URLSearchParams(search);
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
    return `/chat?${next.toString()}`;
  }

  const tab = params.get("tab");
  if (tab === "unread") return "/chat?tab=unread";
  if (tab === "groups") return "/chat";
  return "/chat?tab=personal";
}
