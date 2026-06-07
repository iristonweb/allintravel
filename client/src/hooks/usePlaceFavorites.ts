import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { UserFavoriteWithPlace } from "@shared/schema";

export function usePlaceFavorites() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: favorites = [] } = useQuery<UserFavoriteWithPlace[]>({
    queryKey: ["/api/favorites"],
    enabled: isAuthenticated,
  });

  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.placeId)), [favorites]);

  const toggleMutation = useMutation({
    mutationFn: async ({ placeId, isFavorite }: { placeId: string; isFavorite: boolean }) => {
      if (isFavorite) {
        await apiRequest("DELETE", `/api/favorites/${placeId}`);
      } else {
        await apiRequest("POST", `/api/favorites/${placeId}`);
      }
    },
    onSuccess: (_, { isFavorite }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: isFavorite ? "Удалено из избранного" : "Добавлено в избранное",
      });
    },
    onError: () => {
      toast({ title: "Не удалось обновить избранное", variant: "destructive" });
    },
  });

  const toggleFavorite = useCallback(
    (placeId: string) => {
      if (!isAuthenticated) return;
      toggleMutation.mutate({ placeId, isFavorite: favoriteIds.has(placeId) });
    },
    [isAuthenticated, favoriteIds, toggleMutation],
  );

  const isFavorite = useCallback((placeId: string) => favoriteIds.has(placeId), [favoriteIds]);

  return {
    favoriteIds,
    isFavorite,
    toggleFavorite,
    favorites,
    isPending: toggleMutation.isPending,
  };
}
