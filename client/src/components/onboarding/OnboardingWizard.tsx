import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Compass, Calendar, Wallet, Map, UserPlus, Check } from "lucide-react";
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
import { markOnboardingCompleteServer, saveOnboardingPrefs } from "@/lib/onboarding";
import { saveSearchIntent } from "@/lib/searchIntent";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";

type OnboardingWizardProps = {
  open: boolean;
  onClose: () => void;
};

type TravelStyleId = "budget" | "balanced" | "luxury" | "adventure";

type SuggestedUser = {
  id: string;
  username: string | null;
  displayName: string | null;
  profileImageUrl: string | null;
};

const FOLLOW_GOAL = 3;

export default function OnboardingWizard({ open, onClose }: OnboardingWizardProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [destination, setDestination] = useState("");
  const [geo, setGeo] = useState<GeoAutocompleteItem | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [travelStyle, setTravelStyle] = useState<TravelStyleId>("balanced");
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const destLabel = geo?.label || destination;

  const { data: suggestedUsers = [] } = useQuery<SuggestedUser[]>({
    queryKey: ["/api/users/suggested"],
    enabled: open && step === 3,
  });

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

  const followMutation = useMutation({
    mutationFn: (userId: string) => apiRequestJson("POST", `/api/follow/${userId}`),
    onSuccess: (_data, userId) => {
      setFollowedIds((prev) => new Set(prev).add(userId));
      queryClient.invalidateQueries({ queryKey: [`/api/follow/${userId}/check`] });
    },
    onError: () => toast({ title: t("onboarding.followError"), variant: "destructive" }),
  });

  const createTripMutation = useMutation({
    mutationFn: async (): Promise<{ id: string }> => {
      const dest = destLabel;
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
    onSuccess: async (trip: { id: string }) => {
      await markOnboardingCompleteServer();
      saveOnboardingPrefs({
        destination: destLabel,
        startDate,
        endDate,
        travelStyle,
      });
      saveSearchIntent(`/places?search=${encodeURIComponent(destLabel)}`);
      toast({
        title: t("onboarding.successTitle"),
        description: t("onboarding.successDescription"),
      });
      onClose();
      navigate(`/trips/${trip.id}`);
    },
    onError: () => {
      onClose();
      toast({
        title: t("onboarding.failTitle"),
        description: t("onboarding.failDescription"),
      });
    },
  });

  const canNext =
    step === 0
      ? Boolean(destLabel.trim())
      : step === 1
        ? Boolean(startDate && endDate)
        : step === 2
          ? true
          : followedIds.size >= FOLLOW_GOAL;

  const mapPreviewHref = destLabel
    ? `/map?q=${encodeURIComponent(destLabel)}${geo?.lat != null && geo?.lon != null ? `&lat=${geo.lat}&lon=${geo.lon}` : ""}`
    : "/map";

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

        {step === 3 && (
          <div className="space-y-4">
            <div className="ait-glass rounded-xl p-4 border border-white/10 space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <Map className="h-4 w-4 text-ait-orange" />
                {t("onboarding.exploreMap")}
              </p>
              <p className="text-xs text-muted-foreground">
                {destLabel || t("onboarding.destinationPlaceholder")}
              </p>
              <Button variant="outline" size="sm" className="rounded-xl" asChild>
                <Link href={mapPreviewHref}>{t("onboarding.openMap")}</Link>
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-ait-purple" />
                  {t("onboarding.followTravelers")}
                </span>
                <span className="text-xs text-ait-orange">
                  {followedIds.size}/{FOLLOW_GOAL}
                </span>
              </p>
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {suggestedUsers.map((user) => {
                  const followed = followedIds.has(user.id);
                  return (
                    <li
                      key={user.id}
                      className="flex items-center justify-between gap-2 ait-glass rounded-xl px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.profileImageUrl ?? undefined} />
                          <AvatarFallback>
                            {(user.displayName ?? user.username ?? "?")[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium truncate">
                          @{user.username ?? user.displayName}
                        </span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant={followed ? "outline" : "premium"}
                        className="rounded-xl shrink-0"
                        disabled={followed || followMutation.isPending}
                        onClick={() => followMutation.mutate(user.id)}
                      >
                        {followed ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            {t("onboarding.following")}
                          </>
                        ) : (
                          t("onboarding.follow")
                        )}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
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
          {step < 3 ? (
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
              disabled={!canNext || createTripMutation.isPending}
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
