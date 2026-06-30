import { useEffect } from "react";
import { Redirect, useRoute } from "wouter";

export function BlogRedirect() {
  useEffect(() => {
    window.history.replaceState({}, "", "/social-feed?format=public");
  }, []);
  return <Redirect to="/social-feed?format=public" />;
}

export function BlogPostRedirect() {
  const [, params] = useRoute("/blog/:id");
  const id = params?.id;
  if (!id) return <Redirect to="/social-feed?format=public" />;
  return <Redirect to={`/post/${id}`} />;
}
