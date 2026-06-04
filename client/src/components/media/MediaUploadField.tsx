import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadMediaFile, isVideoUrl } from "@/lib/upload-media";
import { useToast } from "@/hooks/use-toast";

type MediaUploadFieldProps = {
  value: string[];
  onChange: (urls: string[]) => void;
  accept?: string;
  multiple?: boolean;
  label?: string;
  maxFiles?: number;
  className?: string;
};

const DEFAULT_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,.gif";

export default function MediaUploadField({
  value,
  onChange,
  accept = DEFAULT_ACCEPT,
  multiple = true,
  label = "Фото / видео",
  maxFiles = 8,
  className,
}: MediaUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    if (value.length + files.length > maxFiles) {
      toast({
        title: "Слишком много файлов",
        description: `Максимум ${maxFiles}`,
        variant: "destructive",
      });
      return;
    }
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        urls.push(await uploadMediaFile(file));
      }
      onChange([...value, ...urls]);
    } catch (err) {
      toast({
        title: "Не удалось загрузить",
        description: err instanceof Error ? err.message : "Проверьте формат и размер файла",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const remove = (url: string) => onChange(value.filter((u) => u !== url));

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleSelect}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading || value.length >= maxFiles}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <ImagePlus className="h-4 w-4 mr-1" />
        )}
        {uploading ? "Загрузка…" : label}
      </Button>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((url) => (
            <div key={url} className="relative h-16 w-16 rounded-lg overflow-hidden border border-white/10">
              {isVideoUrl(url) ? (
                <video src={url} className="h-full w-full object-cover" muted />
              ) : (
                <img src={url} alt="" className="h-full w-full object-cover" />
              )}
              <button
                type="button"
                className="absolute top-0.5 right-0.5 rounded-full bg-black/70 p-0.5 text-white"
                onClick={() => remove(url)}
                aria-label="Удалить"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
