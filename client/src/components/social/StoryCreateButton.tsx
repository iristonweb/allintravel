import { Link } from "wouter";
import { Plus } from "lucide-react";

type StoryCreateButtonProps = {
  href?: string;
};

export default function StoryCreateButton({
  href = "/social-feed?format=stories&create=1",
}: StoryCreateButtonProps) {
  return (
    <Link href={href}>
      <button type="button" className="flex flex-col items-center gap-2 shrink-0">
        <div className="h-14 w-14 rounded-full border-2 border-dashed border-ait-purple/50 flex items-center justify-center bg-ait-purple/10">
          <Plus className="h-6 w-6 text-ait-purple" />
        </div>
        <span className="text-xs text-muted-foreground">Создать</span>
      </button>
    </Link>
  );
}
