import AppLayout from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Privacy() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6 p-4 pb-12">
        <h1 className="text-2xl font-semibold">Конфиденциальность</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Какие данные мы храним</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Аккаунт (email, имя, аватар), профиль, посты, сообщения в чате и личные диалоги,
              поездки, избранные места и сессия входа (cookie на сервере).
            </p>
            <p>Пароли хранятся в виде bcrypt-хеша, не в открытом виде.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ваши права</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              В разделе «Профиль» вы можете скачать копию своих данных (JSON) или удалить аккаунт.
              Удаление необратимо и удаляет связанные записи в базе.
            </p>
            <p>
              По вопросам обработки данных обращайтесь к администратору сервиса через контакты на
              сайте.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cookies</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              Для входа используется httpOnly cookie сессии. Язык интерфейса и настройки UI могут
              сохраняться в localStorage на вашем устройстве.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
