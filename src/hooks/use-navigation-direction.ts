"use client";

import { useCallback } from "react";
import { locales } from "@/i18n/locales";
import { useRouter } from "@/i18n/navigation";
import { getNavHierarchy } from "@/lib/navigation/config";
import { startViewTransition } from "@/lib/utils/view-transition";

const navHierarchy = getNavHierarchy();
const localeRe = new RegExp(`^/(${locales.join("|")})(/|$)`);

function stripLocale(path: string): string {
  return path.replace(localeRe, "/");
}

function navigateWithVt(router: ReturnType<typeof useRouter>, href: string, isReplace: boolean) {
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

  const doNav = () => {
    if (isReplace) {
      router.replace(href);
    } else {
      router.push(href);
    }
  };

  const vt = startViewTransition(doNav);
  if (!vt) {
    doNav();
    return;
  }

  vt.finished.catch(doNav);
}

export function useNavigationDirection() {
  const router = useRouter();

  const push = useCallback(
    (href: string) => {
      navigateWithVt(router, href, false);
    },
    [router],
  );

  const replace = useCallback(
    (href: string) => {
      navigateWithVt(router, href, true);
    },
    [router],
  );

  return { push, replace };
}
