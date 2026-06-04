import { toApiUrl } from "@/lib/queryClient";

async function parseUploadResponse(res: Response): Promise<string> {
  const text = await res.text();
  if (!res.ok) {
    let message = "Не удалось загрузить файл";
    try {
      const json = JSON.parse(text) as { message?: string };
      if (json.message) message = json.message;
    } catch {
      if (text) message = text.slice(0, 200);
    }
    throw new Error(message);
  }
  const data = JSON.parse(text) as { url: string };
  if (!data.url) throw new Error("Сервер не вернул URL файла");
  if (data.url.startsWith("data:")) {
    throw new Error(
      "Сервер вернул временный data-URL вместо постоянной ссылки. Подключите Vercel Blob (BLOB_READ_WRITE_TOKEN) в настройках проекта.",
    );
  }
  if (import.meta.env.PROD && data.url.startsWith("/uploads/")) {
    throw new Error(
      "Аватар сохранён во временное хранилище. На production подключите Vercel Blob: Dashboard → Storage → Blob → Connect to Project.",
    );
  }
  return data.url;
}

export async function uploadUserAvatar(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(toApiUrl("/api/users/avatar"), {
    method: "POST",
    body: form,
    credentials: "include",
  });
  return parseUploadResponse(res);
}

export async function uploadMediaFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(toApiUrl("/api/upload"), {
    method: "POST",
    body: form,
    credentials: "include",
  });
  return parseUploadResponse(res);
}

export async function uploadRoomAvatar(roomId: string, file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(toApiUrl(`/api/chat/rooms/${roomId}/avatar`), {
    method: "POST",
    body: form,
    credentials: "include",
  });
  return parseUploadResponse(res);
}

export type CreateChatRoomPayload = {
  title: string;
  description?: string;
  visibility: "public" | "private";
  avatarFile?: File | null;
};

export async function createChatRoom(payload: CreateChatRoomPayload): Promise<{ room: import("@shared/schema").ChatRoom; avatarWarning?: string }> {
  if (payload.avatarFile) {
    const form = new FormData();
    form.append("title", payload.title);
    if (payload.description) form.append("description", payload.description);
    form.append("visibility", payload.visibility);
    form.append("file", payload.avatarFile);
    const res = await fetch(toApiUrl("/api/chat/rooms"), {
      method: "POST",
      body: form,
      credentials: "include",
    });
    const text = await res.text();
    if (!res.ok) {
      let message = "Не удалось создать комнату";
      try {
        const json = JSON.parse(text) as { message?: string };
        if (json.message) message = json.message;
      } catch {
        if (text) message = text.slice(0, 200);
      }
      throw new Error(message);
    }
    const data = JSON.parse(text) as { room?: import("@shared/schema").ChatRoom; avatarWarning?: string } & import("@shared/schema").ChatRoom;
    const room = data.room ?? data;
    return { room, avatarWarning: data.avatarWarning };
  }

  const res = await fetch(toApiUrl("/api/chat/rooms"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: payload.title,
      description: payload.description,
      visibility: payload.visibility,
    }),
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text();
    let message = "Не удалось создать комнату";
    try {
      const json = JSON.parse(text) as { message?: string };
      if (json.message) message = json.message;
    } catch {
      if (text) message = text.slice(0, 200);
    }
    throw new Error(message);
  }
  const room = (await res.json()) as import("@shared/schema").ChatRoom;
  return { room };
}

export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes("video/");
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name);
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(file.name);
}

export function isAudioFile(file: File): boolean {
  return file.type.startsWith("audio/") || /\.(mp3|m4a|ogg|wav|webm)$/i.test(file.name);
}
