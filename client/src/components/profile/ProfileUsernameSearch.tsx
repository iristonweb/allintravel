import { Link } from "wouter";
import AitButton from "@/components/ait-ui/AitButton";
import AitSurface from "@/components/ait-ui/AitSurface";
import SmartSearchField from "@/components/search/SmartSearchField";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { getUserDisplayLabel, getUserInitial } from "@shared/user-display";
import type { User } from "@shared/schema";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

type ProfileUsernameSearchProps = {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  results: User[];
};

export default function ProfileUsernameSearch({
  value,
  onChange,
  onSearch,
  results,
}: ProfileUsernameSearchProps) {
  const { t } = useTranslation();

  return (
    <AitSurface padding="sm" className="mb-6">
      <p className="text-sm font-medium mb-2 flex items-center gap-2">
        <Search className="h-4 w-4" strokeWidth={1.5} aria-hidden />
        {t("profile.findByUsername")}
      </p>
      <div className="flex gap-2">
        <SmartSearchField
          className="flex-1"
          placeholder={t("profile.usernamePlaceholder")}
          value={value}
          onChange={onChange}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
        />
        <AitButton type="button" variant="primary" size="sm" onClick={onSearch}>
          {t("profile.find")}
        </AitButton>
      </div>
      {results.length > 0 && value.length >= 3 && (
        <ul className="mt-3 space-y-2" role="list">
          {results.map((u) => (
            <li key={u.id}>
              <Link
                href={u.username ? `/u/${u.username}` : `/chat?with=${u.id}&tab=personal`}
                className="flex items-center gap-2 p-2 rounded-card-lg hover:bg-card/60 transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={resolveMediaUrl(u.profileImageUrl)} alt="" />
                  <AvatarFallback>{getUserInitial(u)}</AvatarFallback>
                </Avatar>
                <span>{getUserDisplayLabel(u)}</span>
                {u.username && <span className="text-muted-foreground text-sm">@{u.username}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AitSurface>
  );
}
