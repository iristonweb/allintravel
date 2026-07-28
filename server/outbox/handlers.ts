import { registerOutboxHandler, type OutboxPayload } from "./index";
import { maybePushAitGrant } from "../ait/push-notify";
import type { AitGrantResult } from "../ait/service";

export function registerAitOutboxHandlers(): void {
  registerOutboxHandler("ait.grant_push", async (payload: OutboxPayload) => {
    const userId = String(payload.userId ?? "");
    const grant = payload.grant as AitGrantResult | undefined;
    if (!userId || !grant) return;
    await maybePushAitGrant(userId, grant);
  });
}
