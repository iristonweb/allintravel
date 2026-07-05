import { useRef } from "react";
import { useTranslation } from "react-i18next";
import AitSurface from "@/components/ait-ui/AitSurface";
import AitButton from "@/components/ait-ui/AitButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import FormatToolbar from "@/components/rich-text/FormatToolbar";
import LocationAutocompleteInput from "@/components/location-autocomplete-input";
import { ImagePlus, Loader2, Plus, X } from "lucide-react";
import { isVideoUrl } from "@/lib/upload-media";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import type { SocialContentFormat } from "@/hooks/useSocialFeedParams";
import type { User } from "@shared/schema";

export type SocialNewPostDraft = {
  title: string;
  content: string;
  location: string;
  tags: string[];
  tagInput: string;
  isPublic: boolean;
  images: string[];
};

type SocialComposerProps = {
  contentFormat: SocialContentFormat;
  user?: User | null;
  isCreating: boolean;
  onCreatingChange: (open: boolean) => void;
  draft: SocialNewPostDraft;
  onDraftChange: (draft: SocialNewPostDraft) => void;
  onPublish: () => void;
  publishing: boolean;
  uploadingMedia: boolean;
  onMediaSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddTag: () => void;
  placeholder: string;
};

export default function SocialComposer({
  contentFormat,
  user,
  isCreating,
  onCreatingChange,
  draft,
  onDraftChange,
  onPublish,
  publishing,
  uploadingMedia,
  onMediaSelect,
  onAddTag,
  placeholder,
}: SocialComposerProps) {
  const { t } = useTranslation();
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const postContentRef = useRef<HTMLTextAreaElement>(null);

  const setDraft = (patch: Partial<SocialNewPostDraft>) => onDraftChange({ ...draft, ...patch });

  return (
    <AitSurface padding="md" radius="lg" glow className="mb-section mt-2">
      <div className="flex items-start gap-4">
        <Avatar className="h-11 w-11 border-2 border-white/10">
          <AvatarImage src={resolveMediaUrl(user?.profileImageUrl)} />
          <AvatarFallback>{user?.firstName?.[0] || user?.email?.[0] || "?"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          {!isCreating ? (
            <button
              type="button"
              className="w-full text-left rounded-button px-4 py-3 text-muted-foreground ait-input-glass hover:border-ait-purple/30 transition-all duration-300"
              onClick={() => onCreatingChange(true)}
            >
              {placeholder}
            </button>
          ) : (
            <div className="space-y-4">
              {contentFormat !== "stories" && contentFormat !== "reels" && (
                <Input
                  placeholder={
                    contentFormat === "journals"
                      ? t("social.composer.journalTitle")
                      : t("social.composer.postTitle")
                  }
                  value={draft.title}
                  onChange={(e) => setDraft({ title: e.target.value })}
                />
              )}
              {contentFormat !== "stories" && (
                <div className="space-y-2">
                  <FormatToolbar
                    value={draft.content}
                    onChange={(content) => setDraft({ content })}
                    inputRef={postContentRef}
                  />
                  <Textarea
                    ref={postContentRef}
                    placeholder={
                      contentFormat === "journals"
                        ? t("social.composer.journalBody")
                        : contentFormat === "reels"
                          ? t("social.composer.reelCaption")
                          : t("social.composer.feedBody")
                    }
                    value={draft.content}
                    onChange={(e) => setDraft({ content: e.target.value })}
                    rows={contentFormat === "journals" ? 8 : 4}
                    className="ait-input-glass rounded-button min-h-[100px]"
                  />
                </div>
              )}
              {contentFormat === "feed" && (
                <>
                  <LocationAutocompleteInput
                    placeholder={t("social.composer.locationOptional")}
                    value={draft.location}
                    onChange={(v) => setDraft({ location: v })}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder={t("social.composer.addTag")}
                      value={draft.tagInput}
                      onChange={(e) => setDraft({ tagInput: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && onAddTag()}
                    />
                    <AitButton variant="glass" size="sm" onClick={onAddTag}>
                      +
                    </AitButton>
                  </div>
                  {draft.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {draft.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer rounded-full"
                          onClick={() =>
                            setDraft({ tags: draft.tags.filter((item) => item !== tag) })
                          }
                        >
                          #{tag} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </>
              )}
              <input
                ref={mediaInputRef}
                type="file"
                accept={
                  contentFormat === "reels"
                    ? "video/mp4,video/webm,video/quicktime"
                    : "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,.gif"
                }
                multiple={contentFormat !== "reels"}
                className="hidden"
                onChange={onMediaSelect}
              />
              <div className="flex flex-wrap items-center gap-3">
                <AitButton
                  type="button"
                  variant="glass"
                  size="sm"
                  disabled={uploadingMedia}
                  onClick={() => mediaInputRef.current?.click()}
                >
                  {uploadingMedia ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <ImagePlus className="h-4 w-4 mr-1" />
                  )}
                  {contentFormat === "reels"
                    ? t("social.composer.video")
                    : t("social.composer.photoVideo")}
                </AitButton>
                {contentFormat === "feed" && (
                  <div className="flex items-center gap-2 ml-auto">
                    <Switch
                      id="post-public"
                      checked={draft.isPublic}
                      onCheckedChange={(checked) => setDraft({ isPublic: checked })}
                    />
                    <Label htmlFor="post-public" className="text-sm text-muted-foreground">
                      {t("social.publicVisible")}
                    </Label>
                  </div>
                )}
                {contentFormat === "stories" && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {t("social.composer.storyExpires")}
                  </span>
                )}
              </div>
              {draft.images.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {draft.images.map((url) => (
                    <div key={url} className="relative">
                      {isVideoUrl(url) ? (
                        <video src={url} className="h-24 w-32 rounded-card object-cover" muted />
                      ) : (
                        <img src={url} alt="" className="h-24 w-32 rounded-card object-cover" />
                      )}
                      <button
                        type="button"
                        className="absolute -top-1 -right-1 rounded-full bg-destructive text-white p-0.5"
                        onClick={() =>
                          setDraft({ images: draft.images.filter((item) => item !== url) })
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <AitButton onClick={onPublish} disabled={publishing} variant="primary">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("social.composer.publish")}
                </AitButton>
                <AitButton variant="glass" onClick={() => onCreatingChange(false)}>
                  {t("common.cancel")}
                </AitButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </AitSurface>
  );
}
