import { toApiUrl } from "@/lib/queryClient";
import { ApiError, parseErrorResponse } from "@/lib/api-error";
export { isVideoUrl } from "@shared/post-formats";

/** Safe max for Vercel serverless direct POST (platform limit ~4.5 MB). */
export const SERVER_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;

type UploadCapabilities = {
  blob: boolean;
  access: "public" | "private";
  serverMaxBytes: number;
};

let capabilitiesCache: UploadCapabilities | null = null;

async function getUploadCapabilities(): Promise<UploadCapabilities> {
  if (capabilitiesCache) return capabilitiesCache;
  try {
    const res = await fetch(toApiUrl("/api/upload/capabilities"), { credentials: "include" });
    if (res.ok) {
      capabilitiesCache = (await res.json()) as UploadCapabilities;
      return capabilitiesCache;
    }
  } catch {
    /* offline / unauthenticated */
  }
  return { blob: false, access: "public", serverMaxBytes: SERVER_UPLOAD_MAX_BYTES };
}

function normalizeClientBlobUrl(
  result: { url: string; pathname: string },
  access: "public" | "private",
): string {
  if (access === "private") {
    return `/api/media/blob?pathname=${encodeURIComponent(result.pathname)}`;
  }
  if (result.url.startsWith("/api/media/blob")) return result.url;
  if (result.url.startsWith("http://") || result.url.startsWith("https://")) return result.url;
  return `/api/media/blob?pathname=${encodeURIComponent(result.pathname)}`;
}

async function parseUploadResponse(res: Response): Promise<string> {
  if (!res.ok) {
    throw await parseErrorResponse(res);
  }
  const data = (await res.json()) as { url: string };
  if (!data.url) throw new Error("Сервер не вернул URL файла");
  if (data.url.startsWith("data:")) {
    throw new Error(
      "Сервер вернул временный data-URL вместо постоянной ссылки. Подключите Vercel Blob (BLOB_READ_WRITE_TOKEN) в настройках проекта.",
    );
  }
  if (import.meta.env.PROD && data.url.startsWith("/uploads/")) {
    throw new Error(
      "Файл сохранён во временное хранилище. На production подключите Vercel Blob: Dashboard → Storage → Blob → Connect to Project.",
    );
  }
  return data.url;
}

function guessFileExtension(file: File): string {
  const fromName = file.name.match(/\.[a-z0-9]+$/i)?.[0];
  if (fromName) return fromName.toLowerCase();
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
  };
  return map[file.type] ?? ".bin";
}

function shouldUseClientBlobUpload(file: File): boolean {
  return import.meta.env.PROD && file.size > SERVER_UPLOAD_MAX_BYTES;
}

async function uploadMediaFileViaClient(file: File): Promise<string> {
  const { upload } = await import("@vercel/blob/client");
  const ext = guessFileExtension(file);
  const pathname = `media/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const { access } = await getUploadCapabilities();

  const result = await upload(pathname, file, {
    access,
    handleUploadUrl: toApiUrl("/api/upload/client"),
    multipart: file.size > 5 * 1024 * 1024,
    contentType: file.type || undefined,
  });

  return normalizeClientBlobUrl(result, access);
}

async function uploadViaServer(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(toApiUrl("/api/upload"), {
    method: "POST",
    body: form,
    credentials: "include",
  });
  return parseUploadResponse(res);
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
  if (shouldUseClientBlobUpload(file)) {
    try {
      return await uploadMediaFileViaClient(file);
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        throw new Error(err.message);
      }
      throw err;
    }
  }
  return uploadViaServer(file);
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

export async function createChatRoom(
  payload: CreateChatRoomPayload,
): Promise<{ room: import("@shared/schema").ChatRoom; avatarWarning?: string }> {
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
    if (!res.ok) {
      throw await parseErrorResponse(res);
    }
    const data = (await res.json()) as {
      room?: import("@shared/schema").ChatRoom;
      avatarWarning?: string;
    } & import("@shared/schema").ChatRoom;
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
    throw await parseErrorResponse(res);
  }
  const room = (await res.json()) as import("@shared/schema").ChatRoom;
  return { room };
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name);
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/i.test(file.name);
}

export function isAudioFile(file: File): boolean {
  return file.type.startsWith("audio/") || /\.(mp3|m4a|ogg|wav|webm)$/i.test(file.name);
}
