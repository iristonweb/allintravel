import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Hotel } from "lucide-react";
import GlassCard from "@/components/brand/glass-card";
import { Button } from "@/components/ui/button";
import { apiRequestJson } from "@/lib/queryClient";

type AffiliateHotelWidgetProps = {
  placeName: string;
  city?: string;
};

type AffiliateLinks = {
  ostrovok: string;
  booking: string;
  query: string;
};

export default function AffiliateHotelWidget({ placeName, city }: AffiliateHotelWidgetProps) {
  const { data } = useQuery<AffiliateLinks>({
    queryKey: ["/api/affiliate/hotel-link", placeName, city ?? ""],
    queryFn: () => {
      const params = new URLSearchParams({ name: placeName });
      if (city) params.set("city", city);
      return apiRequestJson("GET", `/api/affiliate/hotel-link?${params}`);
    },
    staleTime: 60_000,
  });

  if (!data) return null;

  return (
    <GlassCard className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Hotel className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Цены и бронирование</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Сравните предложения партнёров для «{data.query}».
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="rounded-xl gap-1.5" asChild>
          <a href={data.ostrovok} target="_blank" rel="noopener noreferrer sponsored">
            Ostrovok
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
        <Button variant="outline" size="sm" className="rounded-xl gap-1.5" asChild>
          <a href={data.booking} target="_blank" rel="noopener noreferrer sponsored">
            Booking.com
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
      </div>
    </GlassCard>
  );
}
