import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Users } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative py-16 px-4 bg-gradient-to-br from-coral-50 to-teal-50 dark:from-coral-950 dark:to-teal-950">
      <div className="container mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-coral-600 to-teal-600 bg-clip-text text-transparent mb-6">
          Откройте мир вместе
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Исследуйте новые места, находите попутчиков и делитесь незабываемыми моментами
          в нашем сообществе путешественников
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-12">
          <Button size="lg" className="bg-coral-500 hover:bg-coral-600">
            <MapPin className="mr-2 h-5 w-5" />
            Найти места
          </Button>
          <Button size="lg" variant="outline">
            <Calendar className="mr-2 h-5 w-5" />
            Планировать поездку
          </Button>
          <Button size="lg" variant="outline">
            <Users className="mr-2 h-5 w-5" />
            Найти попутчиков
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-coral-100 dark:bg-coral-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-coral-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Исследуйте места</h3>
            <p className="text-muted-foreground">Откройте для себя лучшие рестораны, отели и достопримечательности</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-teal-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Найдите компанию</h3>
            <p className="text-muted-foreground">Встречайте единомышленников и планируйте совместные путешествия</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Планируйте поездки</h3>
            <p className="text-muted-foreground">Создавайте детальные маршруты и не упустите важные события</p>
          </div>
        </div>
      </div>
    </section>
  );
}