export async function uploadMediaFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload", {
    method: "POST",
    body: form,
    credentials: "include",
  });
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
  return data.url;
}

export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes("video/");
}
