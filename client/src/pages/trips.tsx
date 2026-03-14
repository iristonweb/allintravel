import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import NavigationHeader from "@/components/navigation-header";
import TravelCompanionCard from "@/components/travel-companion-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus, Search, MapPin, Filter } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertTripSchema, type Trip } from "@shared/schema";

const createTripSchema = insertTripSchema
  .omit({ userId: true })
  .extend({
    title: z.string().min(3, "Минимум 3 символа"),
    destination: z.string().min(2, "Укажите направление"),
    startDate: z.string().min(1, "Укажите дату начала"),
    endDate: z.string().min(1, "Укажите дату окончания"),
    description: z.string().optional(),
    maxParticipants: z.coerce.number().min(2).max(50).default(5),
    budgetMin: z.coerce.number().optional(),
    budgetMax: z.coerce.number().optional(),
  });

type CreateTripForm = z.infer<typeof createTripSchema>;

export function Trips() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [joinedTrips, setJoinedTrips] = useState<Set<string>>(new Set());

  const { data: trips = [], isLoading } = useQuery<Trip[]>({
    queryKey: ["/api/trips", { limit: 20 }],
  });

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

  const createMutation = useMutation({
    mutationFn: async (data: CreateTripForm) => {
      const res = await apiRequest("POST", "/api/trips", {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      setOpen(false);
      form.reset();
      toast({ title: "Поездка создана!", description: "Ваша поездка добавлена в список." });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось создать поездку.", variant: "destructive" });
    },
  });

  const joinMutation = useMutation({
    mutationFn: async (tripId: string) => {
      const res = await apiRequest("POST", `/api/trips/${tripId}/join`);
      return res.json();
    },
    onSuccess: (_, tripId) => {
      setJoinedTrips(prev => new Set([...Array.from(prev), tripId]));
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      toast({ title: "Вы присоединились!", description: "Вы добавлены в список участников поездки." });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось присоединиться к поездке.", variant: "destructive" });
    },
  });

  const onSubmit = (data: CreateTripForm) => {
    createMutation.mutate(data);
  };

  const filtered = trips.filter(t =>
    !search ||
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.destination.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Планирование поездок</h1>
            <p className="text-muted-foreground">
              Найдите попутчиков или создайте свою группу
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Создать поездку
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Новая поездка</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                          <Input placeholder="Страна или город" {...field} />
                        </FormControl>
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

                  <div className="grid grid-cols-3 gap-4">
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

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setOpen(false)}
                    >
                      Отмена
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-primary hover:bg-primary/90"
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? "Создание..." : "Создать поездку"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-3 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по направлению или названию..."
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center gap-3">
              <MapPin className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold">{trips.length} поездок</p>
                <p className="text-sm text-muted-foreground">доступно прямо сейчас</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Filter className="h-8 w-8 text-accent" />
              <div>
                <p className="font-semibold">Найди своих</p>
                <p className="text-sm text-muted-foreground">присоединяйся к группе</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="h-64 animate-pulse bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {search ? "Поездки не найдены" : "Пока нет поездок"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {search
                ? "Попробуйте другой запрос или создайте свою поездку"
                : "Будьте первым — создайте поездку и найдите попутчиков!"}
            </p>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={() => setOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Создать поездку
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground">
                Найдено: {filtered.length}
              </span>
              {search && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearch("")}>
                  {search} ✕
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filtered.map(trip => (
                <TravelCompanionCard
                  key={trip.id}
                  trip={trip}
                  onJoin={id => joinMutation.mutate(id)}
                  isJoined={joinedTrips.has(trip.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Trips;
