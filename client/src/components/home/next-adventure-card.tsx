import GlassCard from "@/components/brand/glass-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import type { Trip } from "@shared/schema";

type NextAdventureCardProps = {
  trip?: Trip | null;
};

const DEMO = {
  title: "Исландия",
  days: 12,
  progress: 60,
  imageUrl: "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=600&q=80",
};

export default function NextAdventureCard({ trip }: NextAdventureCardProps) {
  const title = trip?.title ?? DEMO.title;
  const progress = trip ? 45 : DEMO.progress;
  const href = trip ? `/trips/${trip.id}` : "/trips";

  return (
    <Link href={href}>
      <GlassCard strong className="overflow-hidden hover:scale-[1.01] transition-transform cursor-pointer">
        <div
          className="h-36 bg-cover bg-center"
          style={{
            backgroundImage: `url('${DEMO.imageUrl}')`,
          }}
        />
        <div className="p-5 space-y-3">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Следующее приключение</div>
          <h3 className="text-xl font-bold text-foreground">{title}</h3>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{DEMO.days} дней</span>
            <span>{progress}% запланировано</span>
          </div>
          <Progress value={progress} className="h-2 bg-white/10 [&>div]:bg-ait-gradient-cta" />
          <div className="flex -space-x-2 pt-1">
            {[1, 2, 3].map((i) => (
              <Avatar key={i} className="h-8 w-8 border-2 border-background">
                <AvatarImage src={`https://i.pravatar.cc/80?img=${i + 10}`} />
                <AvatarFallback>U{i}</AvatarFallback>
              </Avatar>
            ))}
            <span className="ml-2 text-xs text-muted-foreground self-center">+3 путешественника</span>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
