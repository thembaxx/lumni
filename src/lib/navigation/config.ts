import Bookmark02Icon from "@hugeicons/core-free-icons/Bookmark02Icon";
import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import Calendar01Icon from "@hugeicons/core-free-icons/Calendar01Icon";
import Chat01Icon from "@hugeicons/core-free-icons/Chat01Icon";
import CompassIcon from "@hugeicons/core-free-icons/CompassIcon";
import DatabaseIcon from "@hugeicons/core-free-icons/DatabaseIcon";
import File01Icon from "@hugeicons/core-free-icons/File01Icon";
import FlashIcon from "@hugeicons/core-free-icons/FlashIcon";
import Mic01Icon from "@hugeicons/core-free-icons/Mic01Icon";
import Mortarboard01Icon from "@hugeicons/core-free-icons/Mortarboard01Icon";
import Quiz01Icon from "@hugeicons/core-free-icons/Quiz01Icon";
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon";
import Settings01Icon from "@hugeicons/core-free-icons/Settings01Icon";
import Target01Icon from "@hugeicons/core-free-icons/Target01Icon";
import Upload01Icon from "@hugeicons/core-free-icons/Upload01Icon";
import UserIcon from "@hugeicons/core-free-icons/UserIcon";
import type { IconSvgElement } from "@hugeicons/react";
export interface NavItem {
  id: string;
  label: string;
  icon: IconSvgElement;
  route: string;
  primary?: boolean;
}

export interface NavCategory {
  label: string;
  items: NavItem[];
  role?: "teacher" | "parent" | "admin";
}

export const navConfig: NavCategory[] = [
  {
    label: "Learn",
    items: [
      {
        id: "quiz",
        label: "Quiz",
        icon: Quiz01Icon,
        route: "/quiz",
        primary: true,
      },
      {
        id: "flashcards",
        label: "Flashcards",
        icon: FlashIcon,
        route: "/flashcards",
      },
      {
        id: "problems",
        label: "Problems",
        icon: BookOpen01Icon,
        route: "/problems",
        primary: true,
      },
      {
        id: "stories",
        label: "Stories",
        icon: BookOpen01Icon,
        route: "/stories",
      },
      {
        id: "pronunciation",
        label: "Pronunciation",
        icon: Mic01Icon,
        route: "/pronunciation",
      },
    ],
  },
  {
    label: "Practice",
    items: [
      {
        id: "exams",
        label: "Exams",
        icon: File01Icon,
        route: "/exam",
      },
      {
        id: "past-papers",
        label: "Past Papers",
        icon: File01Icon,
        route: "/past-papers",
      },
      {
        id: "review",
        label: "Review Mistakes",
        icon: Target01Icon,
        route: "/review",
      },
    ],
  },
  {
    label: "Tools",
    items: [
      {
        id: "chat",
        label: "Chat",
        icon: Chat01Icon,
        route: "/chat",
        primary: true,
      },
      {
        id: "solve",
        label: "Solve",
        icon: CompassIcon,
        route: "/solve",
      },
      {
        id: "study-guide",
        label: "Study Guide",
        icon: BookOpen01Icon,
        route: "/study-guide",
      },
      {
        id: "dictionary",
        label: "Dictionary",
        icon: Search01Icon,
        route: "/dictionary",
      },
      {
        id: "search",
        label: "Search",
        icon: Search01Icon,
        route: "/search",
      },
      {
        id: "upload",
        label: "Upload",
        icon: Upload01Icon,
        route: "/upload",
      },
    ],
  },
  {
    label: "Progress",
    items: [
      {
        id: "study-plan",
        label: "Study Plan",
        icon: Calendar01Icon,
        route: "/study-plan",
      },
      {
        id: "bookmarks",
        label: "Bookmarks",
        icon: Bookmark02Icon,
        route: "/bookmarks",
      },
      {
        id: "settings",
        label: "Settings",
        icon: Settings01Icon,
        route: "/settings",
      },
    ],
  },
  {
    label: "Teacher",
    role: "teacher",
    items: [
      {
        id: "teacher",
        label: "Teacher Dashboard",
        icon: Mortarboard01Icon,
        route: "/teacher",
      },
    ],
  },
  {
    label: "Parent",
    role: "parent",
    items: [
      {
        id: "parent",
        label: "Parent Dashboard",
        icon: UserIcon,
        route: "/parent",
      },
    ],
  },
  {
    label: "Admin",
    role: "admin",
    items: [
      {
        id: "admin",
        label: "Admin Panel",
        icon: DatabaseIcon,
        route: "/admin",
      },
    ],
  },
];

export function getPrimaryItems(): NavItem[] {
  const allItems = navConfig.flatMap((cat) => cat.items);
  const primary: NavItem[] = [];
  for (const item of allItems) {
    if (item.primary) primary.push(item);
  }
  return primary;
}

export function getRouteLabel(route: string): string | undefined {
  const itemByRoute = new Map<string, NavItem>();
  for (const cat of navConfig) {
    for (const item of cat.items) {
      if (!itemByRoute.has(item.route)) {
        itemByRoute.set(item.route, item);
      }
    }
  }
  for (const [itemRoute, item] of itemByRoute) {
    if (route.startsWith(itemRoute)) return item.label;
  }
  return undefined;
}

export function getNavHierarchy(): Record<string, number> {
  return {
    "/": 0,
    "/dashboard": 0,
  };
}
