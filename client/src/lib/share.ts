import { toast } from "@/hooks/use-toast";

export async function shareUrl(url: string, title?: string, text?: string): Promise<boolean> {
  const shareData = { url, title: title ?? document.title, text };

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share(shareData);
      return true;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return false;
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    toast({ title: "Ссылка скопирована", description: "Можно отправить друзьям" });
    return true;
  } catch {
    toast({ title: "Не удалось поделиться", variant: "destructive" });
    return false;
  }
}
