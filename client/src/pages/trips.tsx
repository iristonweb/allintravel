import { useState, useEffect } from "react";
import { useSearch, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AppLayout from "@/components/app-layout";
import PageHeader from "@/components/page-header";
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
import { Plus, Search, MapPin, Trash2 } from "lucide-react";
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
import { TRIP_AVAILABILITY_FILTERS } from "@/lib/filter-config";
import { cn } from "@/lib/utils";
import { apiRequest, apiRequestJson, queryClient } from "@/lib/queryClient";
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
  return destinationKeywords(trip.destination).some((kw) =>
    kw.includes(q) || q.includes(kw),
  );
}

const optionalBudgetField = z.preprocess(
  (v) => (v === "" || v === null || v === undefined || Number.isNaN(Number(v)) ? undefined : Number(v)),
  z.number().int().min(0).optional(),
);

const createTripSchema = insertTripSchema
  .omit({ userId: true })
  .extend({
    title: z.string().min(3, "Минимум 3 символа"),
    destination: z.string().min(2, "Укажите направление"),
    startDate: z.string().min(1, "Укажите дату начала"),
    endDate: z.string().min(1, "Укажите дату окончания"),
    description: z.string().optional(),
    maxParticipants: z.coerce.number().min(2).max(50).default(5),
    budgetMin: optionalBudgetField,
    budgetMax: optionalBudgetField,
  })
  .refine((data) => !data.startDate || !data.endDate || data.endDate >= data.startDate, {
    message: "Дата окончания должна быть не раньше даты начала",
    path: ["endDate"],
  });

type CreateTripForm = z.infer<typeof createTripSchema>;

function parseApiError(err: unknown): string {
  if (!(err instanceof Error)) return "Не удалось создать поездку.";
  const raw = err.message.replace(/^\d+:\s*/, "");
  try {
    const json = JSON.parse(raw) as { message?: string };
    return json.message ?? raw;
  } catch {
    return raw || "Не удалось создать поездку.";
  }
}

export function Trips() {
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

  const { data: trips = [], isLoading } = useQuery<Trip[]>({
    queryKey: ["/api/trips", { limit: 20 }],
  });

  const { data: participations = { tripIds: [] as string[] } } = useQuery<{ tripIds: string[] }>({
    queryKey: ["/api/trips/my-participations"],
    enabled: isAuthenticated,
  });

  const primaryTripId =
    trips.find((t) => t.userId === user?.id)?.id ??
    participations.tripIds[0] ??
    trips[0]?.id;

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
            title: "Поездка создана",
            description: "Не все остановки маршрута удалось сохранить. Добавьте их на странице поездки.",
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
        title: "Поездка и чат группы созданы",
        description:
          invitedCount > 0
            ? `Маршрут${stopCount > 0 ? " сохранён" : ""}. В чат приглашено: ${invitedCount}.`
            : stopCount > 0
              ? "Маршрут сохранён. Откройте вкладку «Группа» для чата."
              : "Приватный чат группы уже ждёт вас на странице поездки.",
      });
      if (trip?.id) setLocation(`/trips/${trip.id}`);
    },
    onError: (err) => {
      toast({ title: "Ошибка", description: parseApiError(err), variant: "destructive" });
    },
  });

  const addRouteDraft = async () => {
    const q = routeQuery.trim();
    if (q.length < 2) {
      toast({
        title: "Введите название места",
        description: "Минимум 2 символа.",
        variant: "destructive",
      });
      return;
    }
    let item =
      selectedRouteGeo && geoItemHasCoords(selectedRouteGeo) ? selectedRouteGeo : null;
    if (!item && selectedRouteGeo?.label) {
      item = await resolveGeoFromQuery(selectedRouteGeo.label, { scope: "full" });
    }
    if (!item) item = await resolveGeoFromQuery(q, { scope: "full" });
    const draft = item ? geoItemToDraft(item) : null;
    if (!draft) {
      toast({
        title: "Не удалось определить место",
        description:
          "Выберите город или адрес из подсказок — координаты подставятся автоматически.",
        variant: "destructive",
      });
      return;
    }
    setRouteDrafts((prev) => [...prev, draft]);
    setRouteQuery("");
    setSelectedRouteGeo(null);
    toast({ title: "Точка добавлена в маршрут", description: draft.label });
  };

  const joinMutation = useMutation({
    mutationFn: async (tripId: string) => {
      const res = await apiRequest("POST", `/api/trips/${tripId}/join`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? "Не удалось присоединиться");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips/my-participations"] });
      toast({ title: "Вы присоединились!", description: "Вы добавлены в список участников поездки." });
    },
    onError: (err: Error) => {
      toast({
        title: "Ошибка",
        description: err.message || "Не удалось присоединиться к поездке.",
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
      toast({ title: "Войдите в аккаунт", description: "Чтобы создать поездку, нужна авторизация." });
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
            <DialogTitle>Новая поездка</DialogTitle>
            <DialogDescription>
              Создаётся поездка, приватный чат группы и приглашения по @нику. Остальные попутчики смогут
              присоединиться из каталога.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <MediaUploadField
                label="Обложка поездки"
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
                    <FormLabel>Название поездки</FormLabel>
                    <FormControl>
                      <Input placeholder="Например: Путешествие по Японии" {...field} />
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
                    <FormLabel>Направление</FormLabel>
                    <FormControl>
                      <LocationAutocompleteInput
                        placeholder="Страна или город"
                        value={field.value ?? ""}
                        onChange={(v) => field.onChange(v)}
                        onBlur={field.onBlur}
                        name={field.name}
                        dropdownPortal
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Можно ввести вручную, минимум 2 символа
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
                    <FormLabel>Описание (необязательно)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Расскажите о маршруте, планах, что ищете в попутчиках..."
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
                      <FormLabel>Дата начала</FormLabel>
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
                      <FormLabel>Дата окончания</FormLabel>
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
                      <FormLabel>Макс. участников</FormLabel>
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
                      <FormLabel>Бюджет от (₽)</FormLabel>
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
                      <FormLabel>Бюджет до (₽)</FormLabel>
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
                  <FormLabel>Маршрут (места)</FormLabel>
                  <p className="text-xs text-muted-foreground mt-1">
                    Укажите адреса, улицы и точки по порядку — не только город. Маршрут можно
                    изменить позже на странице поездки.
                  </p>
                </div>
                <LocationAutocompleteInput
                  placeholder="Улица, дом, заведение или город…"
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
                  Добавить в маршрут
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
                  Отмена
                </Button>
                <Button
                  type="submit"
                  variant="premium"
                  className="flex-1"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Создание..." : "Создать поездку"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

    <AppLayout>
      <PageHeader
        title="Поездки"
        description="Поездка = маршрут + чат группы. Приглашайте друзей через @ при создании."
        rightSlot={
          <Button variant="premium" type="button" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Создать поездку
          </Button>
        }
      />

      <div className="mb-6 mt-8 max-w-xl">
          <div className="relative ait-glass-strong rounded-2xl border border-white/10 px-2 py-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по направлению или названию..."
              className="pl-10 border-0 bg-transparent shadow-none focus-visible:ring-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="ait-glass-strong rounded-2xl border border-white/10 p-4 mb-6">
          <FilterChipRow
            label="Группа"
            options={TRIP_AVAILABILITY_FILTERS}
            value={availability}
            onChange={setAvailability}
            showClear
            onClear={() => {
              setAvailability("");
              setSearch("");
            }}
          />
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <StatPill
            value={
              q
                ? `${filtered.length} из ${trips.length}`
                : String(trips.length)
            }
            label={q ? "найдено по запросу" : "поездок доступно"}
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
              Сбросить «{q}»
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="h-64 animate-pulse bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title={q ? "Поездки не найдены" : "Пока нет поездок"}
            description={
              q
                ? `По запросу «${q}» ничего не найдено среди ${trips.length} поездок. Попробуйте другой город или создайте свою поездку.`
                : "Будьте первым — создайте поездку и найдите попутчиков!"
            }
            action={
              <Button variant="premium" type="button" onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Создать поездку
              </Button>
            }
          />
        ) : (
          <>
            {primaryTripId && <TripRouteMatches tripId={primaryTripId} />}
            {q && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-muted-foreground">
                  Найдено: {filtered.length}
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
    </AppLayout>
    </>
  );
}

export default Trips;
