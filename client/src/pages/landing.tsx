import PublicLayout from "@/components/public-layout";
import Hero from "@/components/marketing/Hero";
import FeatureCard from "@/components/marketing/FeatureCard";
import NextAdventureCard from "@/components/home/next-adventure-card";
import HeroStats from "@/components/home/hero-stats";
import GradientButton from "@/components/brand/gradient-button";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Calendar,
  Globe,
  MapPin,
  MessageSquare,
  Star,
  Users,
} from "lucide-react";
import { useLocation, Link } from "wouter";

export function Landing() {
  const [, navigate] = useLocation();

  return (
    <PublicLayout>
      <Hero
        title={
          <>
            Путешествуй. Исследуй.{" "}
            <span className="ait-gradient-text">Делись.</span>
          </>
        }
        subtitle="Интерактивный гид для путешественников: карта, маршруты, сообщество и планирование в одном премиальном интерфейсе."
        actions={
          <>
            <GradientButton onClick={() => navigate("/login")}>
              Планировать путешествие
              <ArrowRight className="ml-2 h-5 w-5" />
            </GradientButton>
            <Link href="/login">
              <GradientButton outline>Исследовать</GradientButton>
            </Link>
          </>
        }
        aside={<NextAdventureCard />}
        stats={<HeroStats />}
        backgroundImageUrl="https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=2400&q=70"
      />

      {/* Features Section */}
      <section id="features" className="scroll-offset relative py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-[-0.02em] text-foreground sm:text-4xl">
              Чёткая система для поездок любого масштаба
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Минимализм, глубина и сильный CTA. Всё важное — на поверхности, детали — на расстоянии одного клика.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            <FeatureCard
              icon={<MapPin className="h-5 w-5" />}
              title="Исследуйте"
              description="Подбирайте рестораны, отели и места на карте — быстро, чисто, без лишних кликов."
            />
            <FeatureCard
              icon={<Users className="h-5 w-5" />}
              title="Найдите"
              description="Ищите попутчиков, обсуждайте идеи и собирайте команду под стиль вашей поездки."
            />
            <FeatureCard
              icon={<Calendar className="h-5 w-5" />}
              title="Планируйте"
              description="Собирайте маршруты, события и заметки так, чтобы поездка была под контролем."
            />
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                title: "Отзывы и рейтинги",
                icon: <Star className="h-4 w-4" />,
                text: "Решайте увереннее, опираясь на опыт других путешественников.",
              },
              {
                title: "Чат сообщества",
                icon: <MessageSquare className="h-4 w-4" />,
                text: "Задавайте вопросы по городам и получайте советы от местных.",
              },
              {
                title: "Глобальный охват",
                icon: <Globe className="h-4 w-4" />,
                text: "Сообщество и контент из десятков стран — всегда актуально.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="ait-surface rounded-[var(--ait-radius-card)] px-5 py-4"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-[12px] border border-border bg-card/30 text-[var(--ait-accent)]">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {item.title}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {item.text}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="ait-surface rounded-[var(--ait-radius-hero)] px-6 py-10 md:px-10">
            <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
              <div>
                <div className="text-3xl font-bold tracking-[-0.02em] text-foreground md:text-4xl">
                  2 500+
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  мест с отзывами
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold tracking-[-0.02em] text-foreground md:text-4xl">
                  15K+
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  путешественников
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold tracking-[-0.02em] text-foreground md:text-4xl">
                  127
                </div>
                <div className="mt-2 text-sm text-muted-foreground">стран</div>
              </div>
              <div>
                <div className="text-3xl font-bold tracking-[-0.02em] text-foreground md:text-4xl">
                  8K+
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  поездок вместе
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-offset py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-[-0.02em] text-foreground sm:text-4xl">
              Как это работает
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Три шага — и вы уже планируете поездку без хаоса и лишних таблиц.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Выберите направление",
                text: "Откройте карту и сохраните места, которые хотите посетить.",
              },
              {
                step: "02",
                title: "Соберите маршрут",
                text: "Добавьте поездку, события и заметки — всё в одной структуре.",
              },
              {
                step: "03",
                title: "Делитесь и общайтесь",
                text: "Подключайте друзей или находите попутчиков по интересам.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="ait-surface rounded-[var(--ait-radius-card)] p-6"
              >
                <div className="text-xs font-semibold tracking-[0.18em] text-muted-foreground">
                  {item.step}
                </div>
                <div className="mt-3 text-base font-semibold text-foreground">
                  {item.title}
                </div>
                <div className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="scroll-offset py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-[-0.02em] text-foreground sm:text-4xl">
              Отзывы
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Коротко, по делу — почему люди возвращаются планировать поездки здесь.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                quote:
                  "Собрали маршрут на неделю за вечер. Карта и сохранённые места — это магия.",
                name: "Алина",
                meta: "Барселона → Валенсия",
              },
              {
                quote:
                  "Наконец-то все поездки и идеи в одном месте. Никаких заметок в 5 приложениях.",
                name: "Дмитрий",
                meta: "Прага, 4 дня",
              },
              {
                quote:
                  "Нашли попутчиков и сразу собрали план. Интерфейс очень спокойный и понятный.",
                name: "София",
                meta: "Бали, 2 недели",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="ait-surface rounded-[var(--ait-radius-card)] p-6"
              >
                <div className="flex items-center gap-2 text-[var(--ait-primary)]">
                  <Star className="h-4 w-4" />
                  <Star className="h-4 w-4" />
                  <Star className="h-4 w-4" />
                  <Star className="h-4 w-4" />
                  <Star className="h-4 w-4" />
                </div>
                <p className="mt-4 text-sm leading-relaxed text-foreground/90">
                  “{t.quote}”
                </p>
                <div className="mt-5 text-sm font-semibold text-foreground">
                  {t.name}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {t.meta}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[var(--ait-radius-hero)] border border-border bg-[radial-gradient(900px_300px_at_30%_0%,rgba(14,165,164,0.14),transparent_60%),radial-gradient(800px_340px_at_90%_20%,rgba(255,106,61,0.14),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-8 text-center backdrop-blur-[var(--ait-blur)] md:p-12">
            <h2 className="text-3xl font-bold tracking-[-0.02em] text-foreground sm:text-4xl">
              Готовы отправиться в путь?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Начните с первого места, которое хочется увидеть. Дальше система соберёт всё вокруг вашей поездки.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Button
                variant="premium"
                size="cta"
                onClick={() => navigate("/login")}
                className="w-full sm:w-auto"
              >
                Начать путешествие
                <ArrowRight className="ml-1" />
              </Button>
              <Button
                variant="glass"
                size="cta"
                onClick={() => navigate("/places")}
                className="w-full sm:w-auto"
              >
                Посмотреть места
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <Globe className="text-[var(--ait-primary)] text-2xl mr-2" />
                <span className="text-xl font-bold text-foreground">All In Travel</span>
              </div>
              <p className="text-muted-foreground mb-4">
                Ваш помощник в поиске мест, общении с попутчиками и создании незабываемых путешествий по всему миру.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Исследовать</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Популярные направления</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Рестораны</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Отели</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Путеводители</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Поддержка</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Центр помощи</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Связаться с нами</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Конфиденциальность</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Условия использования</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-muted-foreground text-sm">© 2024 All In Travel. Все права защищены.</p>
            </div>
          </div>
        </div>
      </footer>
    </PublicLayout>
  );
}

export default Landing;
