import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { AIT_GRANT_EVENT, formatAitToast, type AitGrantPayload } from "@/lib/ait-toast";
import { playNotificationSound } from "@/lib/notification-sound";
export default function AitGrantListener() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = (e: Event) => {
      const grant = (e as CustomEvent<AitGrantPayload>).detail;
      if (!grant?.granted) return;
      playNotificationSound("ait");
      toast({
        title: formatAitToast(grant),
        description: grant.title,
        duration: 3200,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ait"] });
    };
    window.addEventListener(AIT_GRANT_EVENT, handler);
    return () => window.removeEventListener(AIT_GRANT_EVENT, handler);
  }, [toast, queryClient]);

  return null;
}
