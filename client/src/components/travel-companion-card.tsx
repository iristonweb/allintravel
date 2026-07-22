import TripCard from "@/components/trips/TripCard";
import type { Trip } from "@shared/schema";

/** @deprecated Use TripCard from @/components/trips/TripCard */
interface TravelCompanionCardProps {
  trip: Trip;
  onJoin?: (tripId: string) => void;
  isJoined?: boolean;
}

export function TravelCompanionCard({ trip, onJoin, isJoined = false }: TravelCompanionCardProps) {
  return <TripCard trip={trip} onJoin={onJoin} isJoined={isJoined} />;
}

export default TravelCompanionCard;
