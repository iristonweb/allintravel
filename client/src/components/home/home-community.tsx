import HomeSectionHeader from "@/components/home/home-section-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users } from "lucide-react";
import { Link } from "wouter";

type HomeCommunityProps = {
  friendsCount: number;
};

export default function HomeCommunity({ friendsCount }: HomeCommunityProps) {
  return (
    <section className="space-y-6">
      <HomeSectionHeader
        title="Сообщество"
        description="Общайтесь и находите людей под ваши планы"
        rightSlot={
          <div className="hidden sm:flex gap-2">
            <Link href="/friends">
              <Button variant="outline" size="sm">
                <Users className="mr-2 h-4 w-4" />
                Друзья
              </Button>
            </Link>
            <Link href="/chat">
              <Button variant="outline" size="sm">
                <MessageCircle className="mr-2 h-4 w-4" />
                Чат
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Ваши друзья</p>
                <p className="text-3xl font-bold mt-1">{friendsCount}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Добавляйте попутчиков, чтобы планировать поездки проще.
                </p>
              </div>
              <Users className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="mt-4">
              <Link href="/friends">
                <Button className="bg-primary hover:bg-primary/90">Найти друзей</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Общий чат</p>
                <p className="text-lg font-semibold mt-1">Советы, маршруты, вопросы</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Быстрый способ получить рекомендацию по месту или поездке.
                </p>
              </div>
              <MessageCircle className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="mt-4">
              <Link href="/chat">
                <Button variant="outline">Открыть чат</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

