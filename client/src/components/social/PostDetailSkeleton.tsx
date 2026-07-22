import { Skeleton } from "@/components/ui/skeleton";
import AitSurface from "@/components/ait-ui/AitSurface";
import { useTranslation } from "react-i18next";

export default function PostDetailSkeleton() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6" aria-busy="true" aria-label={t("social.loadingArticle")}>
      <Skeleton className="h-8 w-3/4 max-w-lg" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <AitSurface padding="md" className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-20 w-full" />
      </AitSurface>
    </div>
  );
}
