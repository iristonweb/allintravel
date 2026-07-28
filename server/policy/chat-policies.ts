import { registerPolicy } from "./index";
import type { ChatAccessResult } from "../chat-access";

registerPolicy("chat.room.read", (actor, _action, resource) => {
  const access = resource.meta?.access as ChatAccessResult | undefined;
  if (access?.allowed) return { allow: true };
  return {
    allow: false,
    reason: access && !access.allowed ? access.reason : "Chat access denied",
  };
});

/** Bridge resolveChatRoomAccess result into policy decision (behavior unchanged). */
export function chatAccessToDecision(access: ChatAccessResult): {
  allow: boolean;
  reason?: string;
} {
  if (access.allowed) return { allow: true };
  return { allow: false, reason: access.reason };
}
