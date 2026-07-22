import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Hotel } from "lucide-react";
import AitSurface from "@/components/ait-ui/AitSurface";
import AitButton from "@/components/ait-ui/AitButton";
import { apiRequestJson } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
    <AitSurface padding="sm" className="space-y-3">
      <div className="flex items-center gap-2">
        <Hotel className="h-4 w-4 text-primary" aria-hidden />
        <h3 className="font-semibold text-sm">{t("affiliateHotel.title")}</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        {t("affiliateHotel.compare", { query: data.query })}
      </p>
      <div className="flex flex-wrap gap-2">
        <AitButton variant="secondary" size="sm" className="gap-1.5" asChild>
          <a href={data.ostrovok} target="_blank" rel="noopener noreferrer sponsored">
            Ostrovok
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        </AitButton>
        <AitButton variant="secondary" size="sm" className="gap-1.5" asChild>
          <a href={data.booking} target="_blank" rel="noopener noreferrer sponsored">
            Booking.com
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        </AitButton>
      </div>
    </AitSurface>
  );
}
