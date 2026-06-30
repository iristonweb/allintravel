import { useState, useEffect, useRef } from "react";
import { useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppLayout from "@/components/app-layout";
import PageShell from "@/components/layout/page-shell";
import CatalogPageLayout, { CatalogSearchInput } from "@/components/layout/catalog-page-layout";
import EmptyState from "@/components/empty-state";
import EventCard from "@/components/event-card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar, Globe, Plus, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, apiRequestJson, queryClient } from "@/lib/queryClient";
import LocationAutocompleteInput from "@/components/location-autocomplete-input";
import FilterChipRow from "@/components/filters/FilterChipRow";
import { EVENT_TYPE_FILTERS, EVENT_TIME_FILTERS } from "@/lib/filter-config";
import MediaUploadField from "@/components/media/MediaUploadField";
import { useTranslation } from "react-i18next";
import type { Event } from "@shared/schema";

export function Events() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const [search, setSearch] = useState(urlParams.get("q") ?? "");
  const [activeType, setActiveType] = useState("");
  const [timeFilter, setTimeFilter] = useState("upcoming");

  useEffect(() => {
    setSearch(new URLSearchParams(searchString).get("q") ?? "");
  }, [searchString]);
  const [createOpen, setCreateOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    type: "festival",
    location: "",
    startDate: "",
    endDate: "",
    price: "",
    imageUrl: "",
  });

  const {
    data: events = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Event[]>({
    queryKey: ["/api/events", { limit: 50 }],
  });

  const { data: registrations = { eventIds: [] as string[] } } = useQuery<{ eventIds: string[] }>({
    queryKey: ["/api/events/registrations"],
  });

  const registeredSet = new Set(registrations.eventIds);

  const checkoutMutation = useMutation({
    mutationFn: (eventId: string) =>
      apiRequestJson<{ confirmationUrl: string; status: string }>(
        "POST",
        `/api/events/${eventId}/checkout`,
      ),
    onSuccess: (data) => {
      window.location.href = data.confirmationUrl;
    },
    onError: () => toast({ title: t("events.checkoutFailed"), variant: "destructive" }),
  });

  const registerMutation = useMutation({
    mutationFn: ({ eventId, paid }: { eventId: string; paid?: boolean }) =>
      apiRequestJson("POST", `/api/events/${eventId}/register`, paid ? { paid: true } : {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events/registrations"] });
      toast({ title: t("events.registered"), description: t("events.registeredHint") });
    },
    onError: () => {
      toast({ title: t("events.registerFailed"), variant: "destructive" });
    },
  });

  const paidHandledRef = useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const paidId = params.get("paid");
    const checkout = params.get("checkout");
    if (paidId && checkout && !paidHandledRef.current) {
      paidHandledRef.current = true;
      registerMutation.mutate({ eventId: paidId, paid: true });
      window.history.replaceState({}, "", "/events");
    }
  }, [searchString, registerMutation]);

  const handleRegister = (eventId: string) => {
    const ev = events.find((e) => e.id === eventId);
    if (ev?.price && ev.price > 0) {
      checkoutMutation.mutate(eventId);
      return;
    }
    registerMutation.mutate({ eventId });
  };

  const createMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/events", {
        title: newEvent.title,
        description: newEvent.description,
        type: newEvent.type,
        location: newEvent.location,
        startDate: new Date(newEvent.startDate).toISOString(),
        endDate: newEvent.endDate ? new Date(newEvent.endDate).toISOString() : undefined,
        price: newEvent.price ? Math.round(Number(newEvent.price) * 100) : null,
        imageUrl: newEvent.imageUrl || undefined,
        isActive: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setCreateOpen(false);
      setNewEvent({
        title: "",
        description: "",
        type: "festival",
        location: "",
        startDate: "",
        endDate: "",
        price: "",
        imageUrl: "",
      });
      toast({ title: t("events.created") });
    },
    onError: () => {
      toast({ title: t("events.createFailed"), variant: "destructive" });
    },
  });

  const filtered = events.filter((e) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      e.title.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q);
    const matchesType = !activeType || e.type === activeType;
    const isUpcoming = new Date(e.startDate) > new Date();
    const matchesTime =
      timeFilter === "all" ||
      (timeFilter === "upcoming" && isUpcoming) ||
      (timeFilter === "past" && !isUpcoming);
    return matchesSearch && matchesType && matchesTime;
  });

  const upcoming = filtered.filter((e) => new Date(e.startDate) > new Date());
  const past = filtered.filter((e) => new Date(e.startDate) <= new Date());
  const showUpcoming = timeFilter !== "past";
  const showPast = timeFilter !== "upcoming";

  return (
    <AppLayout>
      <PageShell
        title={t("events.title")}
        description={t("events.description")}
        rightSlot={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="premium">
                <Plus className="mr-2 h-4 w-4" />
                {t("events.create")}
              </Button>
            </DialogTrigger>
            <DialogContent
              className="max-w-md"
              onInteractOutside={(e) => {
                if ((e.target as HTMLElement).closest("[data-geo-autocomplete]")) {
                  e.preventDefault();
                }
              }}
            >
              <DialogHeader>
                <DialogTitle>{t("events.newEvent")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input
                  placeholder="Название"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />
                <Textarea
                  placeholder="Описание"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                />
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background"
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                >
                  {EVENT_TYPE_FILTERS.filter((t) => t.value).map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <LocationAutocompleteInput
                  placeholder="Место проведения"
                  value={newEvent.location}
                  onChange={(v) => setNewEvent({ ...newEvent, location: v })}
                  dropdownPortal
                />
                <Input
                  type="datetime-local"
                  value={newEvent.startDate}
                  onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                />
                <Input
                  type="datetime-local"
                  placeholder="Окончание"
                  value={newEvent.endDate}
                  onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Цена (₽), необязательно"
                  value={newEvent.price}
                  onChange={(e) => setNewEvent({ ...newEvent, price: e.target.value })}
                />
                <MediaUploadField
                  label="Обложка события"
                  accept="image/jpeg,image/png,image/webp,image/gif,.gif"
                  multiple={false}
                  maxFiles={1}
                  value={newEvent.imageUrl ? [newEvent.imageUrl] : []}
                  onChange={(urls) => setNewEvent({ ...newEvent, imageUrl: urls[0] ?? "" })}
                />
                <Button
                  className="w-full"
                  variant="premium"
                  disabled={!newEvent.title || !newEvent.startDate || createMutation.isPending}
                  onClick={() => createMutation.mutate()}
                >
                  {t("events.publish")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      >
      <CatalogPageLayout
        search={
          <CatalogSearchInput
            value={search}
            onChange={setSearch}
            placeholder={t("events.searchPlaceholder")}
          />
        }
        filters={
          <>
            <FilterChipRow
              label={t("events.filterPeriod")}
              options={EVENT_TIME_FILTERS}
              value={timeFilter}
              onChange={setTimeFilter}
            />
            <FilterChipRow
              label={t("events.filterType")}
              options={EVENT_TYPE_FILTERS}
              value={activeType}
              onChange={setActiveType}
              showClear
              onClear={() => {
                setActiveType("");
                setTimeFilter("upcoming");
                setSearch("");
              }}
            />
          </>
        }
        stats={
          <>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 flex items-center gap-3">
                <Calendar className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">{t("events.upcomingCount", { count: upcoming.length })}</p>
                  <p className="text-sm text-muted-foreground">{t("events.upcomingSoon")}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-accent/5 border-accent/20 flex-1 min-w-[240px]">
              <CardContent className="p-4 flex items-center gap-3">
                <Globe className="h-8 w-8 text-accent" />
                <div>
                  <p className="font-semibold">{t("events.formatsTitle")}</p>
                  <p className="text-sm text-muted-foreground">{t("events.formatsHint")}</p>
                </div>
              </CardContent>
            </Card>
          </>
        }
      >
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-72 animate-pulse bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={AlertCircle}
          title={t("events.loadError")}
          description={error instanceof Error ? error.message : t("social.errors.connection")}
          action={
            <Button variant="outline" onClick={() => refetch()}>
              {t("common.retry")}
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={t("events.notFound")}
          description={t("events.notFoundHint")}
        />
      ) : (
        <>
          {showUpcoming && upcoming.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4">
                {t("events.upcomingSection")}
                <Badge variant="secondary" className="ml-2">
                  {upcoming.length}
                </Badge>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcoming.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isRegistered={registeredSet.has(event.id)}
                    onRegister={handleRegister}
                  />
                ))}
              </div>
            </section>
          )}

          {showPast && past.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-muted-foreground">
                {t("events.pastSection")}
                <Badge variant="outline" className="ml-2">
                  {past.length}
                </Badge>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-70">
                {past.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
      </CatalogPageLayout>
      </PageShell>
    </AppLayout>
  );
}

export default Events;
