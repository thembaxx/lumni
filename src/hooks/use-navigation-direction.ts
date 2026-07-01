"use client";

import { useCallback } from "react";
import { locales } from "@/i18n/locales";
import { useRouter } from "@/i18n/navigation";
import { getNavHierarchy } from "@/lib/navigation/config";

const navHierarchy = getNavHierarchy();
const localeRe = new RegExp(`^/(${locales.join("|")})(/|$)`);

function stripLocale(path: string): string {
  return path.replace(localeRe, "/");
}

function setVtDirection(href: string) {
  const currentPath = stripLocale(window.location.pathname);
  const targetPath = stripLocale(href);

  const currentDepth = navHierarchy[currentPath] ?? 1;
  const targetDepth = navHierarchy[targetPath] ?? 1;

  if (currentDepth !== targetDepth) {
    const direction = targetDepth > currentDepth ? "forward" : "back";
    document.documentElement.dataset.vtDirection = direction;
  } else {
    delete document.documentElement.dataset.vtDirection;
  }
}

export function useNavigationDirection() {
  const router = useRouter();

  const push = useCallback(
    (href: string) => {
      setVtDirection(href);
      router.push(href);
    },
    [router],
  );

  const replace = useCallback(
    (href: string) => {
      setVtDirection(href);
      router.replace(href);
    },
    [router],
  );

  return { push, replace };
}
