import { ShieldCheck, Star, Users } from "lucide-react";

export default function HomeTrustStrip() {
  return (
    <section className="mt-10">
      <div className="ait-surface rounded-[var(--ait-radius-hero)] px-6 py-6 md:px-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-[14px] border border-border bg-card/30 text-[var(--ait-primary)]">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Отзывы и рейтинги</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Оценивайте места и выбирайте увереннее.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-[14px] border border-border bg-card/30 text-[var(--ait-accent)]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Попутчики</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Находите людей под ваш стиль путешествий.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-[14px] border border-border bg-card/30 text-[var(--ait-palm)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Безопасность</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Надёжные сессии и защищённые действия.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

