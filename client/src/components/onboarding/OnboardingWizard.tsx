import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Compass, Calendar, Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LocationAutocompleteInput, {
  type GeoAutocompleteItem,
} from "@/components/location-autocomplete-input";
import { apiRequestJson } from "@/lib/queryClient";
import { markOnboardingDone, saveOnboardingPrefs } from "@/lib/onboarding";
import { saveSearchIntent } from "@/lib/searchIntent";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

type OnboardingWizardProps = {
  open: boolean;
  onClose: () => void;
};

type TravelStyleId = "budget" | "balanced" | "luxury" | "adventure";

export default function OnboardingWizard({ open, onClose }: OnboardingWizardProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [destination, setDestination] = useState("");
  const [geo, setGeo] = useState<GeoAutocompleteItem | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [travelStyle, setTravelStyle] = useState<TravelStyleId>("balanced");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const styles = useMemo(
    () =>
      [
        { id: "budget" as const, label: t("onboarding.styles.budget"), icon: Wallet },
        { id: "balanced" as const, label: t("onboarding.styles.balanced"), icon: Compass },
        { id: "luxury" as const, label: t("onboarding.styles.luxury"), icon: Compass },
        { id: "adventure" as const, label: t("onboarding.styles.adventure"), icon: Compass },
      ] satisfies { id: TravelStyleId; label: string; icon: typeof Wallet }[],
    [t],
  );

  const createTripMutation = useMutation({
    mutationFn: async (): Promise<{ id: string }> => {
      const dest = geo?.label || destination;
      const destShort = dest.split(",")[0]?.trim() || dest;
      const title = t("onboarding.tripTitle", { destination: destShort });
      const tags =
        travelStyle === "budget"
          ? [t("onboarding.tags.budget")]
          : travelStyle === "luxury"
            ? [t("onboarding.tags.luxury")]
            : travelStyle === "adventure"
              ? [t("onboarding.tags.adventure")]
              : [];
      return apiRequestJson<{ id: string }>("POST", "/api/trips", {
        title,
        destination: dest,
        startDate: startDate || new Date().toISOString().slice(0, 10),
        endDate: endDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        description: t("onboarding.styleDescription", {
          style: t(`onboarding.styles.${travelStyle}`),
        }),
        tags,
        maxParticipants: 5,
      });
    },
    onSuccess: (trip: { id: string }) => {
      markOnboardingDone();
      saveOnboardingPrefs({
        destination: geo?.label || destination,
        startDate,
        endDate,
        travelStyle,
      });
      saveSearchIntent(`/places?search=${encodeURIComponent(geo?.label || destination)}`);
      toast({
        title: t("onboarding.successTitle"),
        description: t("onboarding.successDescription"),
      });
      onClose();
      navigate(`/trips/${trip.id}`);
    },
    onError: () => {
      markOnboardingDone();
      onClose();
      toast({
        title: t("onboarding.failTitle"),
        description: t("onboarding.failDescription"),
      });
    },
  });

  const canNext =
    step === 0
      ? Boolean(geo?.label || destination.trim())
      : step === 1
        ? Boolean(startDate && endDate)
        : true;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="ait-glass border-white/10 max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("onboarding.title")}</DialogTitle>
          <DialogDescription>{t("onboarding.description")}</DialogDescription>
        </DialogHeader>

        {step === 0 && (
          <div className="space-y-3">
            <LocationAutocompleteInput
              value={destination}
              onChange={setDestination}
              onSelectItem={(item) => {
                setGeo(item);
                setDestination(item.label);
              }}
              placeholder={t("onboarding.destinationPlaceholder")}
            />
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <Calendar className="h-3 w-3" /> {t("onboarding.startDate")}
              </label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <Calendar className="h-3 w-3" /> {t("onboarding.endDate")}
              </label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-2">
            {styles.map((s) => (
              <Button
                key={s.id}
                type="button"
                variant={travelStyle === s.id ? "premium" : "outline"}
                className="rounded-xl"
                onClick={() => setTravelStyle(s.id)}
              >
                {s.label}
              </Button>
            ))}
          </div>
        )}

        <div className="flex justify-between pt-2">
          <Button
            type="button"
            variant="ghost"
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
          >
            {t("onboarding.back")}
          </Button>
          {step < 2 ? (
            <Button
              type="button"
              variant="premium"
              disabled={!canNext}
              onClick={() => setStep((s) => s + 1)}
            >
              {t("onboarding.next")}
            </Button>
          ) : (
            <Button
              type="button"
              variant="premium"
              disabled={createTripMutation.isPending}
              onClick={() => createTripMutation.mutate()}
            >
              {createTripMutation.isPending ? t("onboarding.creating") : t("onboarding.createTrip")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
