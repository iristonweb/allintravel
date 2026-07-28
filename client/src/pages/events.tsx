import { useState, useEffect, useRef, useId } from "react";
import { useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppLayout from "@/components/app-layout";
import ReelsPageLayout from "@/components/feed/ReelsPageLayout";
import CatalogPageLayout, { CatalogSearchInput } from "@/components/layout/catalog-page-layout";
import EmptyState from "@/components/empty-state";
import EventCard from "@/components/events/EventCard";
import EventCardSkeleton from "@/components/events/EventCardSkeleton";
import StatPill from "@/components/brand/stat-pill";
import AitSectionHeader from "@/components/ait-ui/AitSectionHeader";
import AitButton from "@/components/ait-ui/AitButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar, Plus, AlertCircle, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, apiRequestJson, queryClient } from "@/lib/queryClient";
import LocationAutocompleteInput from "@/components/location-autocomplete-input";
import CatalogFilterPanel from "@/components/filters/CatalogFilterPanel";
import { useFilterLabels } from "@/hooks/useFilterLabels";
import MediaUploadField from "@/components/media/MediaUploadField";
import { useTranslation } from "react-i18next";
import type { Event } from "@shared/schema";

export function Events() {
  const { t } = useTranslation();
  const filters = useFilterLabels();
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
  const [registeringEventId, setRegisteringEventId] = useState<string | null>(null);
  const upcomingSectionId = useId();
  const pastSectionId = useId();
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
    mutationFn: (eventId: string) => {
      setRegisteringEventId(eventId);
      return apiRequestJson<{ confirmationUrl: string; status: string }>(
        "POST",
        `/api/events/${eventId}/checkout`,
      );
    },
    onSuccess: (data) => {
      window.location.href = data.confirmationUrl;
    },
    onError: () => toast({ title: t("events.checkoutFailed"), variant: "destructive" }),
    onSettled: () => setRegisteringEventId(null),
  });

  const registerMutation = useMutation({
    mutationFn: ({ eventId, paid }: { eventId: string; paid?: boolean }) => {
      setRegisteringEventId(eventId);
      return apiRequestJson("POST", `/api/events/${eventId}/register`, paid ? { paid: true } : {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events/registrations"] });
      toast({ title: t("events.registered"), description: t("events.registeredHint") });
    },
    onError: () => {
      toast({ title: t("events.registerFailed"), variant: "destructive" });
    },
    onSettled: () => setRegisteringEventId(null),
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

  const clearEventFilters = () => {
    setActiveType("");
    setTimeFilter("upcoming");
    setSearch("");
  };
  const hasActiveEventFilters =
    Boolean(search.trim()) || Boolean(activeType) || timeFilter !== "upcoming";

  const createEventDialog = (
    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
      <DialogTrigger asChild>
        <AitButton variant="primary" className="gap-2">
          <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          {t("events.create")}
        </AitButton>
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
            placeholder={t("events.form.title")}
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
          />
          <Textarea
            placeholder={t("events.form.description")}
            value={newEvent.description}
            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
          />
          <select
            className="w-full rounded-md border px-3 py-2 text-sm bg-background"
            value={newEvent.type}
            onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
          >
            {filters.eventType
              .filter((opt) => opt.value)
              .map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
          </select>
          <LocationAutocompleteInput
            placeholder={t("events.form.location")}
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
            placeholder={t("events.form.endDate")}
            value={newEvent.endDate}
            onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
          />
          <Input
            type="number"
            placeholder={t("events.form.priceOptional")}
            value={newEvent.price}
            onChange={(e) => setNewEvent({ ...newEvent, price: e.target.value })}
          />
          <MediaUploadField
            label={t("events.form.coverLabel")}
            accept="image/jpeg,image/png,image/webp,image/gif,.gif"
            multiple={false}
            maxFiles={1}
            value={newEvent.imageUrl ? [newEvent.imageUrl] : []}
            onChange={(urls) => setNewEvent({ ...newEvent, imageUrl: urls[0] ?? "" })}
          />
          <AitButton
            className="w-full"
            variant="primary"
            disabled={!newEvent.title || !newEvent.startDate || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {t("events.publish")}
          </AitButton>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <AppLayout>
      <ReelsPageLayout
        header={
          <AitSectionHeader
            title={t("events.title")}
            description={t("events.description")}
            actions={createEventDialog}
          />
        }
        feed={
          <CatalogPageLayout
            search={
              <CatalogSearchInput
                value={search}
                onChange={setSearch}
                placeholder={t("events.searchPlaceholder")}
              />
            }
            filters={
              <CatalogFilterPanel
                onClear={clearEventFilters}
                showClear={hasActiveEventFilters}
                rows={[
                  {
                    label: t("events.filterPeriod"),
                    options: filters.eventTime,
                    value: timeFilter,
                    onChange: setTimeFilter,
                    icon: Calendar,
                  },
                  {
                    label: t("events.filterType"),
                    options: filters.eventType,
                    value: activeType,
                    onChange: setActiveType,
                    icon: Sparkles,
                  },
                ]}
              />
            }
            stats={
              <>
                <StatPill value={String(upcoming.length)} label={t("events.upcomingSoon")} />
                <StatPill
                  value={`${Math.max(filters.eventType.length - 1, 1)}+`}
                  label={t("events.formatsHint")}
                />
              </>
            }
          >
            {isLoading ? (
              <div
                className="grid grid-cols-1 min-[280px]:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6"
                aria-busy="true"
                aria-label={t("events.loading")}
              >
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <EventCardSkeleton key={i} />
                ))}
              </div>
            ) : isError ? (
              <EmptyState
                variant="glass"
                icon={AlertCircle}
                title={t("events.loadError")}
                description={error instanceof Error ? error.message : t("social.errors.connection")}
                action={
                  <AitButton variant="glass" size="sm" onClick={() => refetch()}>
                    {t("common.retry")}
                  </AitButton>
                }
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                variant="glass"
                icon={Calendar}
                title={t("events.notFound")}
                description={t("events.notFoundHint")}
                action={
                  hasActiveEventFilters ? (
                    <AitButton variant="glass" size="sm" onClick={clearEventFilters}>
                      {t("places.resetFilters")}
                    </AitButton>
                  ) : (
                    <AitButton variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" strokeWidth={1.5} aria-hidden />
                      {t("events.create")}
                    </AitButton>
                  )
                }
              />
            ) : (
              <>
                {showUpcoming && upcoming.length > 0 && (
                  <section className="mb-10" aria-labelledby={upcomingSectionId}>
                    <h2 id={upcomingSectionId} className="text-xl font-semibold mb-4">
                      {t("events.upcomingSection")}
                      <Badge variant="secondary" className="ml-2 rounded-full border-border/50">
                        {upcoming.length}
                      </Badge>
                    </h2>
                    <div className="grid grid-cols-1 min-[280px]:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
                      {upcoming.map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          isRegistered={registeredSet.has(event.id)}
                          onRegister={handleRegister}
                          registerPending={registeringEventId === event.id}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {showPast && past.length > 0 && (
                  <section aria-labelledby={pastSectionId}>
                    <h2
                      id={pastSectionId}
                      className="text-xl font-semibold mb-4 text-muted-foreground"
                    >
                      {t("events.pastSection")}
                      <Badge variant="outline" className="ml-2 rounded-full border-border/50">
                        {past.length}
                      </Badge>
                    </h2>
                    <div className="grid grid-cols-1 min-[280px]:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
                      {past.map((event) => (
                        <EventCard key={event.id} event={event} dimmed />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </CatalogPageLayout>
        }
      />
    </AppLayout>
  );
}

export default Events;
