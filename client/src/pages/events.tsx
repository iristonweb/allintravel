import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppLayout from "@/components/app-layout";
import PageHeader from "@/components/page-header";
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
import { Search, Calendar, Globe, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import LocationAutocompleteInput from "@/components/location-autocomplete-input";
import FilterChipRow from "@/components/filters/FilterChipRow";
import { EVENT_TYPE_FILTERS, EVENT_TIME_FILTERS } from "@/lib/filter-config";
import MediaUploadField from "@/components/media/MediaUploadField";
import type { Event } from "@shared/schema";

export function Events() {
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

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", { limit: 50 }],
  });

  const { data: registrations = { eventIds: [] as string[] } } = useQuery<{ eventIds: string[] }>({
    queryKey: ["/api/events/registrations"],
  });

  const registeredSet = new Set(registrations.eventIds);

  const registerMutation = useMutation({
    mutationFn: (eventId: string) => apiRequest("POST", `/api/events/${eventId}/register`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events/registrations"] });
      toast({ title: "Вы зарегистрировались!", description: "Вы записаны на мероприятие." });
    },
    onError: () => {
      toast({ title: "Ошибка регистрации", variant: "destructive" });
    },
  });

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
      toast({ title: "Событие создано" });
    },
    onError: () => {
      toast({ title: "Не удалось создать событие", variant: "destructive" });
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
      <PageHeader
        title="События"
        description="Открывайте фестивали, воркшопы и приключения по всему миру"
        rightSlot={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Создать событие
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Новое событие</DialogTitle>
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
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <LocationAutocompleteInput
                  placeholder="Место проведения"
                  value={newEvent.location}
                  onChange={(v) => setNewEvent({ ...newEvent, location: v })}
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
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={!newEvent.title || !newEvent.startDate || createMutation.isPending}
                  onClick={() => createMutation.mutate()}
                >
                  Опубликовать
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 mt-8">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            <div>
              <p className="font-semibold">{upcoming.length} предстоящих</p>
              <p className="text-sm text-muted-foreground">событий скоро</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-accent/5 border-accent/20 md:col-span-2">
          <CardContent className="p-4 flex items-center gap-3">
            <Globe className="h-8 w-8 text-accent" />
            <div>
              <p className="font-semibold">Разные страны и форматы</p>
              <p className="text-sm text-muted-foreground">фестивали, приключения, воркшопы</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 mt-8 max-w-2xl">
        <div className="relative ait-glass-strong rounded-2xl border border-white/10 px-2 py-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Название, город или описание события…"
            className="pl-10 border-0 bg-transparent shadow-none focus-visible:ring-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="ait-glass-strong rounded-2xl border border-white/10 p-4 mb-6 space-y-4">
        <FilterChipRow
          label="Период"
          options={EVENT_TIME_FILTERS}
          value={timeFilter}
          onChange={setTimeFilter}
        />
        <FilterChipRow
          label="Тип"
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
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-72 animate-pulse bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="События не найдены"
          description="Попробуйте изменить фильтры или создайте своё событие"
        />
      ) : (
        <>
          {showUpcoming && upcoming.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4">
                Предстоящие события
                <Badge variant="secondary" className="ml-2">{upcoming.length}</Badge>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcoming.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isRegistered={registeredSet.has(event.id)}
                    onRegister={(id) => registerMutation.mutate(id)}
                  />
                ))}
              </div>
            </section>
          )}

          {showPast && past.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-muted-foreground">
                Прошедшие события
                <Badge variant="outline" className="ml-2">{past.length}</Badge>
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
    </AppLayout>
  );
}

export default Events;
