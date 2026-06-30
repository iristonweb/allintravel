import { useState, useEffect, useMemo } from "react";
import { useSearch, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AppLayout from "@/components/app-layout";
import PageShell from "@/components/layout/page-shell";
import CatalogPageLayout, { CatalogSearchInput } from "@/components/layout/catalog-page-layout";
import EmptyState from "@/components/empty-state";
import TravelCompanionCard from "@/components/travel-companion-card";
import TripRouteMatches from "@/components/planner/trip-route-matches";
import LocationAutocompleteInput, {
  type GeoAutocompleteItem,
} from "@/components/location-autocomplete-input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus, MapPin, Trash2, AlertCircle } from "lucide-react";
import {
  addTripStopsFromDrafts,
  geoItemHasCoords,
  geoItemToDraft,
  resolveGeoFromQuery,
  type TripRouteDraft,
} from "@/lib/trip-waypoints";
import MediaUploadField from "@/components/media/MediaUploadField";
import StatPill from "@/components/brand/stat-pill";
import FilterChipRow from "@/components/filters/FilterChipRow";
import { useFilterLabels } from "@/hooks/useFilterLabels";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { apiRequest, apiRequestJson } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertTripSchema, type Trip, type User } from "@shared/schema";
import TripInvitePicker from "@/components/trips/TripInvitePicker";

function destinationKeywords(destination: string): string[] {
  const full = destination.trim().toLowerCase();
  const city = full.split(",")[0]?.trim() ?? full;
  return Array.from(new Set([full, city].filter(Boolean)));
}

function tripMatchesSearch(trip: Trip, query: string): boolean {
  const q = query.toLowerCase();
  if (trip.title.toLowerCase().includes(q)) return true;
  return destinationKeywords(trip.destination).some((kw) => kw.includes(q) || q.includes(kw));
}

const optionalBudgetField = z.preprocess(
  (v) =>
    v === "" || v === null || v === undefined || Number.isNaN(Number(v)) ? undefined : Number(v),
  z.number().int().min(0).optional(),
);

function buildCreateTripSchema(t: (key: string) => string) {
  return insertTripSchema
    .omit({ userId: true })
    .extend({
      title: z.string().min(3, t("tripsPage.validation.titleMin")),
      destination: z.string().min(2, t("tripsPage.validation.destinationMin")),
      startDate: z.string().min(1, t("tripsPage.validation.startDateRequired")),
      endDate: z.string().min(1, t("tripsPage.validation.endDateRequired")),
      description: z.string().optional(),
      maxParticipants: z.coerce.number().min(2).max(50).default(5),
      budgetMin: optionalBudgetField,
      budgetMax: optionalBudgetField,
    })
    .refine((data) => !data.startDate || !data.endDate || data.endDate >= data.startDate, {
      message: t("tripsPage.validation.endBeforeStart"),
      path: ["endDate"],
    });
}

type CreateTripForm = z.infer<ReturnType<typeof buildCreateTripSchema>>;

function parseApiError(err: unknown, t: (key: string) => string): string {
  if (!(err instanceof Error)) return t("tripsPage.toast.createFailed");
  const raw = err.message.replace(/^\d+:\s*/, "");
  try {
    const json = JSON.parse(raw) as { message?: string };
    return json.message ?? raw;
  } catch {
    return raw || t("tripsPage.toast.createFailed");
  }
}

export function Trips() {
  const { t } = useTranslation();
  const filters = useFilterLabels();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const [search, setSearch] = useState(() => new URLSearchParams(searchString).get("search") ?? "");
  const [availability, setAvailability] = useState("");
  const [open, setOpen] = useState(false);
  const [tripCoverUrl, setTripCoverUrl] = useState("");
  const [routeDrafts, setRouteDrafts] = useState<TripRouteDraft[]>([]);
  const [routeQuery, setRouteQuery] = useState("");
  const [selectedRouteGeo, setSelectedRouteGeo] = useState<GeoAutocompleteItem | null>(null);
  const [inviteUsers, setInviteUsers] = useState<User[]>([]);

  useEffect(() => {
    setSearch(new URLSearchParams(searchString).get("search") ?? "");
  }, [searchString]);

  const {
    data: trips = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Trip[]>({
    queryKey: ["/api/trips", { limit: 20 }],
  });

  const { data: participations = { tripIds: [] as string[] } } = useQuery<{ tripIds: string[] }>({
    queryKey: ["/api/trips/my-participations"],
    enabled: isAuthenticated,
  });

  const primaryTripId =
    trips.find((t) => t.userId === user?.id)?.id ?? participations.tripIds[0] ?? trips[0]?.id;

  const createTripSchema = useMemo(() => buildCreateTripSchema(t), [t]);

  const form = useForm<CreateTripForm>({
    resolver: zodResolver(createTripSchema),
    defaultValues: {
      title: "",
      destination: "",
      startDate: "",
      endDate: "",
      description: "",
      maxParticipants: 5,
    },
  });

  const resetCreateDialog = () => {
    setTripCoverUrl("");
    setRouteDrafts([]);
    setRouteQuery("");
    setSelectedRouteGeo(null);
    setInviteUsers([]);
    form.reset();
  };

  const createMutation = useMutation({
    mutationFn: async (data: CreateTripForm) => {
      const payload: Record<string, unknown> = {
        title: data.title,
        destination: data.destination,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        description: data.description || undefined,
        maxParticipants: data.maxParticipants,
        imageUrl: tripCoverUrl || undefined,
      };
      if (data.budgetMin != null) payload.budgetMin = data.budgetMin;
      if (data.budgetMax != null) payload.budgetMax = data.budgetMax;
      if (inviteUsers.length > 0) {
        payload.inviteUserIds = inviteUsers.map((u) => u.id);
      }
      const trip = (await apiRequestJson("POST", "/api/trips", payload)) as Trip & {
        invites?: { invited: string[]; skipped: string[] };
        chatSlug?: string | null;
      };
      if (routeDrafts.length > 0 && trip.id) {
        try {
          await addTripStopsFromDrafts(trip.id, routeDrafts);
        } catch {
          toast({
            title: t("tripsPage.toast.createdPartialTitle"),
            description: t("tripsPage.toast.createdPartialRoute"),
            variant: "destructive",
          });
        }
      }
      return trip;
    },
    onSuccess: (trip) => {
      const stopCount = routeDrafts.length;
      const invitedCount = trip.invites?.invited?.length ?? 0;
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips/my-participations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
      setOpen(false);
      resetCreateDialog();
      toast({
        title: t("tripsPage.toast.createdTitle"),
        description:
          invitedCount > 0
            ? t("tripsPage.toast.createdWithInvites", {
                routeSaved: stopCount > 0 ? t("tripsPage.toast.routeSavedSuffix") : "",
                count: invitedCount,
              })
            : stopCount > 0
              ? t("tripsPage.toast.createdWithRoute")
              : t("tripsPage.toast.createdDefault"),
      });
      if (trip?.id) setLocation(`/trips/${trip.id}`);
    },
    onError: (err) => {
      toast({
        title: t("common.error"),
        description: parseApiError(err, t),
        variant: "destructive",
      });
    },
  });

  const addRouteDraft = async () => {
    const q = routeQuery.trim();
    if (q.length < 2) {
      toast({
        title: t("tripsPage.toast.routeStopTooShort"),
        description: t("tripsPage.toast.routeStopTooShortHint"),
        variant: "destructive",
      });
      return;
    }
    let item = selectedRouteGeo && geoItemHasCoords(selectedRouteGeo) ? selectedRouteGeo : null;
    if (!item && selectedRouteGeo?.label) {
      item = await resolveGeoFromQuery(selectedRouteGeo.label, { scope: "full" });
    }
    if (!item) item = await resolveGeoFromQuery(q, { scope: "full" });
    const draft = item ? geoItemToDraft(item) : null;
    if (!draft) {
      toast({
        title: t("tripsPage.toast.routeGeoFailed"),
        description: t("tripsPage.toast.routeGeoFailedHint"),
        variant: "destructive",
      });
      return;
    }
    setRouteDrafts((prev) => [...prev, draft]);
    setRouteQuery("");
    setSelectedRouteGeo(null);
    toast({ title: t("tripsPage.toast.routeStopAdded"), description: draft.label });
  };

  const joinMutation = useMutation({
    mutationFn: async (tripId: string) => {
      const res = await apiRequest("POST", `/api/trips/${tripId}/join`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? t("tripsPage.toast.joinFailed"));
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips/my-participations"] });
      toast({
        title: t("tripsPage.toast.joinSuccess"),
        description: t("tripsPage.toast.joinSuccessHint"),
      });
    },
    onError: (err: Error) => {
      toast({
        title: t("common.error"),
        description: err.message || t("tripsPage.toast.joinFailed"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateTripForm) => {
    createMutation.mutate(data);
  };

  const q = search.trim();
  const filtered = trips.filter((t) => {
    if (q && !tripMatchesSearch(t, q)) return false;
    const count = t.currentParticipants ?? 0;
    const max = t.maxParticipants ?? 0;
    if (availability === "open" && count >= max) return false;
    if (availability === "full" && count < max) return false;
    return true;
  });

  const openCreateDialog = () => {
    if (!isAuthenticated) {
      toast({
        title: t("tripsPage.toast.signInRequired"),
        description: t("tripsPage.toast.signInRequiredHint"),
      });
      setLocation("/login");
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) resetCreateDialog();
        }}
      >
        <DialogContent
          className="ait-glass-strong ait-gradient-border border-white/10 text-foreground sm:max-w-xl"
          onInteractOutside={(e) => {
            if ((e.target as HTMLElement).closest("[data-geo-autocomplete]")) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("tripsPage.create.title")}</DialogTitle>
            <DialogDescription>{t("tripsPage.create.description")}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <MediaUploadField
                label={t("tripsPage.create.coverLabel")}
                multiple={false}
                maxFiles={1}
                accept="image/jpeg,image/png,image/webp,image/gif"
                value={tripCoverUrl ? [tripCoverUrl] : []}
                onChange={(urls) => setTripCoverUrl(urls[0] ?? "")}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tripsPage.create.tripTitle")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("tripsPage.create.tripTitlePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tripsPage.create.destination")}</FormLabel>
                    <FormControl>
                      <LocationAutocompleteInput
                        placeholder={t("tripsPage.create.destinationPlaceholder")}
                        value={field.value ?? ""}
                        onChange={(v) => field.onChange(v)}
                        onBlur={field.onBlur}
                        name={field.name}
                        dropdownPortal
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      {t("tripsPage.create.destinationHint")}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tripsPage.create.descriptionLabel")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("tripsPage.create.descriptionPlaceholder")}
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("tripsPage.create.startDate")}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("tripsPage.create.endDate")}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="maxParticipants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("tripsPage.create.maxParticipants")}</FormLabel>
                      <FormControl>
                        <Input type="number" min={2} max={50} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="budgetMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("tripsPage.create.budgetMin")}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="budgetMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("tripsPage.create.budgetMax")}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="∞" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <TripInvitePicker
                value={inviteUsers}
                onChange={setInviteUsers}
                max={Math.max(1, (form.watch("maxParticipants") ?? 5) - 1)}
                currentUserId={user?.id}
              />

              <div className="space-y-3 pt-2 border-t border-white/10">
                <div>
                  <FormLabel>{t("tripsPage.create.routeLabel")}</FormLabel>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("tripsPage.create.routeHint")}
                  </p>
                </div>
                <LocationAutocompleteInput
                  placeholder={t("tripsPage.create.routePlaceholder")}
                  value={routeQuery}
                  onChange={(v) => {
                    setRouteQuery(v);
                    setSelectedRouteGeo(null);
                  }}
                  onSelectItem={(item) => {
                    setRouteQuery(item.label);
                    setSelectedRouteGeo(item);
                  }}
                  scope="full"
                  limit={12}
                  debounceMs={280}
                  dropdownPortal
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  disabled={routeQuery.trim().length < 2 || createMutation.isPending}
                  onClick={() => void addRouteDraft()}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {t("tripsPage.create.addRouteStop")}
                </Button>
                {routeDrafts.length > 0 && (
                  <ol className="space-y-2 list-none">
                    {routeDrafts.map((stop, index) => (
                      <li
                        key={`${stop.label}-${index}`}
                        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                      >
                        <span className="shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-semibold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="flex-1 min-w-0 truncate">{stop.label}</span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0"
                          aria-label={t("tripsPage.create.removeRouteStop")}
                          onClick={() =>
                            setRouteDrafts((prev) => prev.filter((_, i) => i !== index))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div className="flex gap-3 pt-2 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setOpen(false);
                    resetCreateDialog();
                  }}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  variant="premium"
                  className="flex-1"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending
                    ? t("tripsPage.create.creating")
                    : t("tripsPage.create.submit")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AppLayout>
        <PageShell
          title={t("tripsPage.title")}
          description={t("tripsPage.description")}
          rightSlot={
            <Button variant="premium" type="button" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              {t("tripsPage.createTrip")}
            </Button>
          }
        >
          <CatalogPageLayout
            search={
              <CatalogSearchInput
                value={search}
                onChange={setSearch}
                placeholder={t("tripsPage.searchPlaceholder")}
              />
            }
            filters={
              <FilterChipRow
                label={t("tripsPage.filterGroup")}
                options={filters.tripAvailability}
                value={availability}
                onChange={setAvailability}
                showClear
                onClear={() => {
                  setAvailability("");
                  setSearch("");
                }}
              />
            }
            stats={
              <>
                <StatPill
                  value={
                    q
                      ? t("tripsPage.statsOf", { found: filtered.length, total: trips.length })
                      : String(trips.length)
                  }
                  label={q ? t("tripsPage.statsFound") : t("tripsPage.statsAvailable")}
                />
                {q && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-2xl ait-glass border border-white/10",
                      "px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors",
                    )}
                  >
                    {t("tripsPage.resetQuery", { q })}
                  </button>
                )}
              </>
            }
          >
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="h-64 animate-pulse bg-muted" />
                ))}
              </div>
            ) : isError ? (
              <EmptyState
                icon={AlertCircle}
                title={t("tripsPage.loadError")}
                description={error instanceof Error ? error.message : t("social.errors.connection")}
                action={
                  <Button variant="outline" onClick={() => refetch()}>
                    {t("common.retry")}
                  </Button>
                }
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title={q ? t("tripsPage.notFound") : t("tripsPage.empty")}
                description={
                  q
                    ? t("tripsPage.notFoundHint", { q, total: trips.length })
                    : t("tripsPage.emptyHint")
                }
                action={
                  q ? (
                    <Button variant="outline" type="button" onClick={() => setSearch("")}>
                      {t("tripsPage.resetSearch")}
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <>
                {primaryTripId && <TripRouteMatches tripId={primaryTripId} />}
                {q && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-muted-foreground">
                      {t("tripsPage.found", { count: filtered.length })}
                    </span>
                    <Badge
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => setSearch("")}
                    >
                      {q} ✕
                    </Badge>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filtered.map((trip) => (
                    <TravelCompanionCard
                      key={trip.id}
                      trip={trip}
                      onJoin={(id) => joinMutation.mutate(id)}
                      isJoined={participations.tripIds.includes(trip.id)}
                    />
                  ))}
                </div>
              </>
            )}
          </CatalogPageLayout>
        </PageShell>
      </AppLayout>
    </>
  );
}

export default Trips;
