import { useMutation } from "@tanstack/react-query";
import { GitFork, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { apiRequestJson } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useLocation } from "wouter";
import type { Trip } from "@shared/schema";

type TripMarketplaceActionsProps = {
  tripId: string;
  isOwner: boolean;
  isPublic: boolean;
  priceCents?: number | null;
  isForSale?: boolean | null;
};

export default function TripMarketplaceActions({
  tripId,
  isOwner,
  isPublic,
  priceCents,
  isForSale,
}: TripMarketplaceActionsProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [price, setPrice] = useState(String((priceCents ?? 999) / 100));

  const forkMutation = useMutation({
    mutationFn: () => apiRequestJson<Trip>("POST", `/api/trips/${tripId}/fork`),
    onSuccess: (trip) => {
      toast({ title: t("marketplace.forked") });
      navigate(`/trips/${trip.id}`);
    },
  });

  const sellMutation = useMutation({
    mutationFn: () =>
      apiRequestJson("PATCH", `/api/trips/${tripId}/marketplace`, {
        priceCents: Math.round(Number(price) * 100),
        isForSale: true,
      }),
    onSuccess: () => toast({ title: t("common.save") }),
  });

  const buyMutation = useMutation({
    mutationFn: () =>
      apiRequestJson<{ trip: Trip; checkoutUrl?: string }>("POST", `/api/trips/${tripId}/purchase`),
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast({ title: t("marketplace.forked") });
        navigate(`/trips/${data.trip.id}`);
      }
    },
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isPublic && !isOwner && (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl gap-2"
            disabled={forkMutation.isPending}
            onClick={() => forkMutation.mutate()}
          >
            <GitFork className="h-4 w-4" />
            {t("marketplace.fork")}
          </Button>
          {isForSale && (
            <Button
              variant="premium"
              type="button"
              size="sm"
              className="rounded-xl gap-2"
              disabled={buyMutation.isPending}
              onClick={() => buyMutation.mutate()}
            >
              <ShoppingBag className="h-4 w-4" />
              {t("marketplace.buy")} ${((priceCents ?? 0) / 100).toFixed(0)}
            </Button>
          )}
        </>
      )}
      {isOwner && (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            step={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-24 h-9 rounded-xl"
            aria-label={t("marketplace.price")}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-xl gap-2"
            disabled={sellMutation.isPending}
            onClick={() => sellMutation.mutate()}
          >
            {t("marketplace.sell")}
          </Button>
        </div>
      )}
    </div>
  );
}
