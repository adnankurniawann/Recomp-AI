import {
  BookOpen,
  ChartColumn,
  GraduationCap,
  Mail,
  Settings,
  ShieldCheck,
  Trophy,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
  adminOnly?: boolean;
}

/** The app sidebar from PRD §10.0. */
export const APP_NAV: NavGroup[] = [
  {
    items: [
      { href: "/lomba", label: "Lomba", icon: Trophy },
      { href: "/tim", label: "Tim saya", icon: Users },
      { href: "/undangan", label: "Undangan", icon: Mail },
    ],
  },
  {
    label: "Persiapan",
    items: [
      { href: "/belajar", label: "Belajar", icon: BookOpen },
      { href: "/mentor", label: "Mentor", icon: GraduationCap },
    ],
  },
  {
    label: "Akun",
    items: [
      { href: "/profil", label: "Profil", icon: User },
      { href: "/pengaturan", label: "Pengaturan", icon: Settings },
    ],
  },
  {
    label: "Admin",
    adminOnly: true,
    items: [
      { href: "/admin", label: "Lomba dan mentor", icon: ShieldCheck },
      { href: "/admin/metrik", label: "Metrik uji coba", icon: ChartColumn },
    ],
  },
];

/** The centre links of `PublicNavbar` (PRD §10.1). */
export const PUBLIC_LINKS = [
  { href: "/lomba", label: "Lomba" },
  { href: "/belajar", label: "Belajar" },
  { href: "/mentor", label: "Mentor" },
] as const;

/** True when `pathname` is `href` or a page under it: `/tim/abc` is under `/tim`, `/timnas` isn't. */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The one nav link to highlight: the longest href that `pathname` is on or under, so /admin/metrik
 * lights up "Metrik uji coba" and not also "/admin".
 */
export function activeHref(pathname: string, hrefs: readonly string[]): string | null {
  return hrefs.filter((h) => isActive(pathname, h)).sort((a, b) => b.length - a.length)[0] ?? null;
}
