import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";

type HomeQuickActionsProps = {
  defaultSearch?: string;
};

export default function HomeQuickActions({ defaultSearch = "" }: HomeQuickActionsProps) {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState(defaultSearch);

  const searchHref = useMemo(() => {
    const q = search.trim();
    return q ? `/places?search=${encodeURIComponent(q)}` : "/places";
  }, [search]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Куда хотите поехать? (место, город, тип)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") navigate(searchHref);
              }}
              className="pl-9"
            />
          </div>
          <Button onClick={() => navigate(searchHref)} className="bg-primary hover:bg-primary/90">
            Найти места
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Совет: начните с каталога мест, а затем добавляйте остановки в поездки.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
        <Button variant="outline" onClick={() => navigate("/trips")} className="justify-start">
          <Plus className="mr-2 h-4 w-4" />
          Создать/найти поездку
        </Button>
        <Button variant="outline" onClick={() => navigate("/places")} className="justify-start">
          <MapPin className="mr-2 h-4 w-4" />
          Открыть карту и каталог
        </Button>
      </div>
    </div>
  );
}

