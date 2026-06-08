import { useEffect } from "react";
import { useTranslation } from "react-i18next";

type PageMetaProps = {
  title?: string;
  description?: string;
  path?: string;
};

export default function PageMeta({ title, description, path }: PageMetaProps) {
  const { i18n, t } = useTranslation();
  const lang = i18n.language?.startsWith("en") ? "en" : "ru";
  const resolvedTitle = title ?? t("seo.homeTitle");
  const resolvedDescription = description ?? t("seo.homeDescription");
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = path && origin ? `${origin}${path}` : undefined;

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = resolvedTitle;

    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", resolvedDescription);
    setMeta("og:title", resolvedTitle, true);
    setMeta("og:description", resolvedDescription, true);
    setMeta("twitter:title", resolvedTitle);
    setMeta("twitter:description", resolvedDescription);
    if (url) setMeta("og:url", url, true);
  }, [lang, resolvedTitle, resolvedDescription, url]);

  return null;
}
