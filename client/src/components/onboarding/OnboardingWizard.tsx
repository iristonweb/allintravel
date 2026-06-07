import { useState } from "react";
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

type OnboardingWizardProps = {
  open: boolean;
  onClose: () => void;
};

const STYLES = [
  { id: "budget" as const, label: "Бюджетно", icon: Wallet },
  { id: "balanced" as const, label: "Баланс", icon: Compass },
  { id: "luxury" as const, label: "Люкс", icon: Compass },
  { id: "adventure" as const, label: "Приключения", icon: Compass },
];

export default function OnboardingWizard({ open, onClose }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [destination, setDestination] = useState("");
  const [geo, setGeo] = useState<GeoAutocompleteItem | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [travelStyle, setTravelStyle] = useState<(typeof STYLES)[number]["id"]>("balanced");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const createTripMutation = useMutation({
    mutationFn: async (): Promise<{ id: string }> => {
      const dest = geo?.label || destination;
      const title = `Поездка в ${dest.split(",")[0]?.trim() || dest}`;
      const tags =
        travelStyle === "budget"
          ? ["бюджет"]
          : travelStyle === "luxury"
            ? ["люкс"]
            : travelStyle === "adventure"
              ? ["приключения"]
              : [];
      return apiRequestJson<{ id: string }>("POST", "/api/trips", {
        title,
        destination: dest,
        startDate: startDate || new Date().toISOString().slice(0, 10),
        endDate:
          endDate ||
          new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        description: `Стиль: ${travelStyle}`,
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
      toast({ title: "Поездка создана", description: "Добро пожаловать в All In Travel!" });
      onClose();
      navigate(`/trips/${trip.id}`);
    },
    onError: () => {
      markOnboardingDone();
      onClose();
      toast({ title: "Поездка не создана", description: "Можно создать позже в разделе Поездки." });
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
          <DialogTitle>Куда отправимся?</DialogTitle>
          <DialogDescription>
            Три шага — и у вас будет персональная поездка на главной.
          </DialogDescription>
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
              placeholder="Город или страна"
            />
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <Calendar className="h-3 w-3" /> Начало
              </label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <Calendar className="h-3 w-3" /> Конец
              </label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-2">
            {STYLES.map((s) => (
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
            Назад
          </Button>
          {step < 2 ? (
            <Button type="button" variant="premium" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
              Далее
            </Button>
          ) : (
            <Button
              type="button"
              variant="premium"
              disabled={createTripMutation.isPending}
              onClick={() => createTripMutation.mutate()}
            >
              {createTripMutation.isPending ? "Создаём…" : "Создать поездку"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
