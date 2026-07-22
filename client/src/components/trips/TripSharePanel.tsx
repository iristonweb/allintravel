import { useMutation } from "@tanstack/react-query";
import { Copy, Globe, Link2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { apiRequest, apiRequestJson } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { shareUrl } from "@/lib/share";
import type { Trip } from "@shared/schema";
import { useTranslation } from "react-i18next";

type TripSharePanelProps = {
  trip: Trip;
  tripId: string;
  stopCount: number;
  onTripUpdated: () => void;
};

export default function TripSharePanel({
  trip,
  tripId,
  stopCount,
  onTripUpdated,
}: TripSharePanelProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const publicUrl = `${window.location.origin}/trips/${tripId}/public`;

  const togglePublicMutation = useMutation({
    mutationFn: async (isPublic: boolean) => {
      const res = await apiRequest("PUT", `/api/trips/${tripId}`, { isPublic });
      if (!res.ok) throw new Error(t("tripShare.visibilityFailed"));
      return res.json();
    },
    onSuccess: (_data, isPublic) => {
      onTripUpdated();
      toast({
        title: isPublic ? t("tripShare.publishedTitle") : t("tripShare.hiddenTitle"),
        description: isPublic ? t("tripShare.publishedDesc") : t("tripShare.hiddenDesc"),
      });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: () =>
      apiRequestJson<{ inviteUrl: string }>("POST", `/api/trips/${tripId}/invite-link`),
    onSuccess: (data) => {
      void navigator.clipboard.writeText(data.inviteUrl);
      toast({
        title: t("tripShare.inviteCopied"),
        description: t("tripShare.inviteCopiedDesc"),
      });
    },
    onError: () => toast({ title: t("tripShare.inviteFailed"), variant: "destructive" }),
  });

  const copyMutation = useMutation({
    mutationFn: () => apiRequestJson<Trip>("POST", `/api/trips/${tripId}/copy`),
    onSuccess: (copy) => {
      toast({
        title: t("tripShare.routeCopied"),
        description: t("tripShare.routeCopiedDesc", { title: copy.title }),
      });
      window.location.href = `/trips/${copy.id}`;
    },
    onError: () => toast({ title: t("tripShare.copyFailed"), variant: "destructive" }),
  });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 ait-glass rounded-2xl px-3 py-2">
        <Switch
          id="trip-public"
          checked={Boolean(trip.isPublic)}
          disabled={togglePublicMutation.isPending}
          onCheckedChange={(v) => togglePublicMutation.mutate(v)}
        />
        <Label htmlFor="trip-public" className="text-sm flex items-center gap-1.5 cursor-pointer">
          <Globe className="h-3.5 w-3.5" />
          {t("tripShare.publicRoute")}
        </Label>
      </div>

      <Button
        type="button"
        variant="outline"
        className="gap-2 rounded-2xl"
        onClick={() => {
          const url = trip.isPublic ? publicUrl : `${window.location.origin}/trips/${tripId}`;
          void navigator.clipboard.writeText(url);
          toast({ title: t("tripShare.linkCopied") });
        }}
      >
        <Link2 className="h-4 w-4" />
        {t("tripShare.link")}
      </Button>

      <Button
        type="button"
        variant="outline"
        className="gap-2 rounded-2xl"
        onClick={() => inviteMutation.mutate()}
        disabled={inviteMutation.isPending}
      >
        <Users className="h-4 w-4" />
        {t("tripShare.invite")}
      </Button>

      <Button
        type="button"
        variant="outline"
        className="gap-2 rounded-2xl"
        onClick={() =>
          shareUrl(
            trip.isPublic ? publicUrl : `${window.location.origin}/trips/${tripId}`,
            trip.title,
            t("tripShare.shareStops", { count: stopCount, destination: trip.destination }),
          )
        }
      >
        {t("tripShare.share")}
      </Button>

      <Button
        type="button"
        variant="outline"
        className="gap-2 rounded-2xl"
        onClick={() => copyMutation.mutate()}
        disabled={copyMutation.isPending}
      >
        <Copy className="h-4 w-4" />
        {t("tripShare.copyRoute")}
      </Button>
    </div>
  );
}
