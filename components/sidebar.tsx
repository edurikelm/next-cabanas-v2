// components/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, BarChart3 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const nav = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/estadisticas", label: "Estadísticas", icon: BarChart3 },
  // { href: "/pruebas", label: "Pruebas", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-screen w-[var(--sidebar-width)] border-r bg-white/70 backdrop-blur sticky top-0 hidden md:flex md:flex-col">
      <div className="px-5 py-4">
        <h1 className="text-xl font-semibold">Arriendos</h1>
        <p className="text-sm text-muted-foreground">Cabañas dashboard</p>
      </div>
      <Separator />
      <nav className="p-2 space-y-1">
        {nav.map((item) => {
          const Icon = item.icon as any;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-muted ${
                active ? "bg-muted font-medium" : ""
              }`}
            >
              <Icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto p-4 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Cabañas</p>
      </div>
    </aside>
  );
}