import {
  BookOpenIcon,
  Building2Icon,
  ImagesIcon,
  LayoutDashboardIcon,
  QrCodeIcon,
  ReceiptIcon,
  SettingsIcon,
  UserRoundIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

import { routes } from "@/lib/routes";

export type NavItem = {
  title: string;
  icon: LucideIcon;
  /** No href means the feature isn't built yet; it's shown as "Soon". */
  href?: string;
};

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Property",
    items: [
      { title: "Overview", href: routes.dashboard, icon: LayoutDashboardIcon },
      { title: "Property details", href: routes.property, icon: Building2Icon },
      { title: "Media library", href: routes.media, icon: ImagesIcon },
    ],
  },
  {
    label: "Menu",
    items: [
      { title: "Menus", href: routes.menus, icon: BookOpenIcon },
      { title: "QR codes", href: routes.qrCodes, icon: QrCodeIcon },
      { title: "Orders", icon: ReceiptIcon },
    ],
  },
  {
    label: "Manage",
    items: [
      { title: "Team", href: routes.team, icon: UsersIcon },
      { title: "Account", href: routes.account, icon: UserRoundIcon },
      { title: "Settings", href: routes.settings, icon: SettingsIcon },
    ],
  },
];

/** Titles for the header breadcrumb. */
export const PAGE_TITLES: Record<string, string> = {
  [routes.dashboard]: "Overview",
  [routes.property]: "Property details",
  [routes.media]: "Media library",
  [routes.menus]: "Menus",
  [routes.qrCodes]: "QR codes",
  [routes.team]: "Team",
  [routes.account]: "Account",
  [routes.settings]: "Settings",
};

/** The title for a page, falling back to its section (e.g. a single menu → "Menus"). */
export function pageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const section = Object.keys(PAGE_TITLES)
    .filter((href) => href !== routes.dashboard && pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];
  return section ? PAGE_TITLES[section] : "Dashboard";
}

export function isActivePath(pathname: string, href: string): boolean {
  return href === routes.dashboard ? pathname === href : pathname.startsWith(href);
}
