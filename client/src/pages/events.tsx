import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import NavigationHeader from "@/components/navigation-header";
import EventCard from "@/components/event-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Calendar, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import type { Event } from "@shared/schema";

const EVENT_TYPES = [
  { value: "", label: "Все" },
  { value: "festival", label: "Фестивали" },
  { value: "workshop", label: "Воркшопы" },
  { value: "adventure", label: "Приключения" },
  { value: "food", label: "Еда" },
  { value: "music", label: "Музыка" },
  { value: "culture", label: "Культура" },
];

export function Events() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("");
  const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set());

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", { upcoming: true, limit: 50 }],
  });

  const filtered = events.filter(e => {
    const matchesSearch =
      !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.location?.toLowerCase().includes(search.toLowerCase()) ||
      e.description?.toLowerCase().includes(search.toLowerCase());
    const matchesType = !activeType || e.type === activeType;
    return matchesSearch && matchesType;
  });

  const upcoming = filtered.filter(e => new Date(e.startDate) > new Date());
  const past = filtered.filter(e => new Date(e.startDate) <= new Date());

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">События</h1>
          <p className="text-muted-foreground">
            Открывайте фестивали, воркшопы и приключения по всему миру
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск событий..."
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPES.map(type => (
              <Badge
                key={type.value}
                variant={activeType === type.value ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setActiveType(type.value)}
              >
                {type.label}
              </Badge>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="h-72 animate-pulse bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">События не найдены</h3>
            <p className="text-muted-foreground">
              Попробуйте изменить фильтры или поисковый запрос
            </p>
            {(search || activeType) && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => { setSearch(""); setActiveType(""); }}
              >
                Сбросить фильтры
              </Button>
            )}
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section className="mb-10">
                <h2 className="text-xl font-semibold mb-4">
                  Предстоящие события
                  <Badge variant="secondary" className="ml-2">{upcoming.length}</Badge>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcoming.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      isRegistered={registeredEvents.has(event.id)}
                      onRegister={id => {
                        setRegisteredEvents(prev => new Set([...Array.from(prev), id]));
                        toast({ title: "Вы зарегистрировались!", description: "Вы записаны на мероприятие." });
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4 text-muted-foreground">
                  Прошедшие события
                  <Badge variant="outline" className="ml-2">{past.length}</Badge>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-70">
                  {past.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Events;
